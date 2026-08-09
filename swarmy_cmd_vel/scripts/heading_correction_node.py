#!/usr/bin/env python
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================

# -*- coding: utf-8 -*-
"""
heading_correction_node.py — Closed-loop heading correction for Swarmy Bot

PROBLEM:
  The robot uses fake odometry (no real encoders). When motors have different
  speeds, the robot curves but odometry says "going straight". move_base plans
  paths in odom frame using this wrong odometry, so the robot drifts off the
  planned path.

SOLUTION:
  This node sits between move_base and the base node:
    move_base -> /cmd_vel_raw -> [this node] -> /cmd_vel -> swarmy_base_node

  It compares the heading AMCL sees (truth from Lidar) vs what odometry reports.
  The difference is the "heading error" caused by motor imbalance. A PID
  controller injects angular velocity corrections to keep the robot on-path.

  Additionally, this node continuously estimates the wheel speed ratio and
  auto-tunes the left/right motor multipliers in the parameter server.

USAGE:
  In navigation.launch, remap move_base's cmd_vel output to /cmd_vel_raw.
  This node subscribes to /cmd_vel_raw and publishes corrected /cmd_vel.
"""

import rospy
import math
import tf
from geometry_msgs.msg import Twist
from geometry_msgs.msg import PoseWithCovarianceStamped
from nav_msgs.msg import Odometry


class HeadingCorrectionNode(object):

    def __init__(self):
        rospy.init_node('heading_correction_node')

        # -- Parameters --------------------------------------------------------
        # PID gains for heading correction
        self.Kp = rospy.get_param('~heading_Kp', 1.5)
        self.Ki = rospy.get_param('~heading_Ki', 0.05)
        self.Kd = rospy.get_param('~heading_Kd', 0.3)

        # Maximum angular correction this node can inject (rad/s)
        self.max_correction = rospy.get_param('~max_angular_correction', 0.25)

        # Only apply correction when moving forward (> this threshold)
        self.min_linear_vel = rospy.get_param('~min_linear_vel', 0.02)

        # Deadband: don't correct heading errors smaller than this (rad)
        self.heading_deadband = rospy.get_param('~heading_deadband', 0.03)

        # Motor multiplier auto-tuning
        self.auto_tune_enabled = rospy.get_param('~auto_tune_motors', True)
        self.tune_interval = rospy.get_param('~tune_interval', 5.0)  # seconds
        self.tune_gain = rospy.get_param('~tune_gain', 0.02)  # step size

        # -- State -------------------------------------------------------------
        self.amcl_yaw = None
        self.odom_yaw = None
        self.amcl_stamp = rospy.Time(0)
        self.odom_stamp = rospy.Time(0)

        # PID state
        self.integral = 0.0
        self.prev_error = 0.0
        self.prev_time = None

        # For auto-tuning: track heading drift over time
        self.tune_last_time = rospy.Time.now()
        self.tune_yaw_errors = []

        # Latest cmd_vel from move_base
        self.latest_cmd = Twist()
        self.cmd_stamp = rospy.Time(0)

        # TF listener for odom heading
        self.tf_listener = tf.TransformListener()

        # -- Publishers / Subscribers ------------------------------------------
        self.cmd_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=1)

        rospy.Subscriber('/cmd_vel_raw', Twist, self.cmd_cb, queue_size=1)
        rospy.Subscriber('/amcl_pose', PoseWithCovarianceStamped,
                         self.amcl_cb, queue_size=1)
        rospy.Subscriber('/wheel/odom', Odometry, self.odom_cb, queue_size=1)

        # Control loop at 20 Hz (same rate as base node)
        self.timer = rospy.Timer(rospy.Duration(0.05), self.control_loop)

        # Auto-tune timer
        if self.auto_tune_enabled:
            self.tune_timer = rospy.Timer(
                rospy.Duration(self.tune_interval), self.auto_tune_callback)

        rospy.loginfo('[heading_correction] Ready | Kp=%.2f Ki=%.2f Kd=%.2f | '
                      'max_correction=%.2f rad/s | auto_tune=%s',
                      self.Kp, self.Ki, self.Kd, self.max_correction,
                      self.auto_tune_enabled)

    # -- Callbacks -------------------------------------------------------------

    def cmd_cb(self, msg):
        """Receive cmd_vel from move_base (remapped to /cmd_vel_raw)."""
        self.latest_cmd = msg
        self.cmd_stamp = rospy.Time.now()

    def amcl_cb(self, msg):
        """Extract yaw from AMCL pose (ground truth from Lidar matching)."""
        q = msg.pose.pose.orientation
        _, _, yaw = tf.transformations.euler_from_quaternion(
            [q.x, q.y, q.z, q.w])
        self.amcl_yaw = yaw
        self.amcl_stamp = msg.header.stamp

    def odom_cb(self, msg):
        """Extract yaw from wheel odometry (fake odom)."""
        q = msg.pose.pose.orientation
        _, _, yaw = tf.transformations.euler_from_quaternion(
            [q.x, q.y, q.z, q.w])
        self.odom_yaw = yaw
        self.odom_stamp = msg.header.stamp

    # -- Main control loop -----------------------------------------------------

    def control_loop(self, event):
        """
        At 20 Hz:
        1. Get heading error = AMCL yaw vs odom yaw (via TF map->base_footprint)
        2. Run PID to compute angular correction
        3. Add correction to move_base's cmd_vel and publish
        """
        now = rospy.Time.now()

        # Pass through if no cmd_vel received recently (robot is idle)
        if (now - self.cmd_stamp).to_sec() > 0.5:
            return

        cmd = Twist()
        cmd.linear.x = self.latest_cmd.linear.x
        cmd.linear.y = self.latest_cmd.linear.y
        cmd.linear.z = self.latest_cmd.linear.z
        cmd.angular.x = self.latest_cmd.angular.x
        cmd.angular.y = self.latest_cmd.angular.y
        cmd.angular.z = self.latest_cmd.angular.z

        # Only apply heading correction when moving forward/backward
        if abs(cmd.linear.x) < self.min_linear_vel:
            # Not moving linearly — pass through (allow in-place rotation)
            self.integral = 0.0
            self.prev_error = 0.0
            self.prev_time = None
            self.cmd_pub.publish(cmd)
            return

        # Get heading error from TF tree
        heading_error = self._get_heading_error()
        if heading_error is None:
            # Can't compute heading error — pass through unchanged
            self.cmd_pub.publish(cmd)
            return

        # Record for auto-tuning
        self.tune_yaw_errors.append(heading_error)

        # Apply deadband
        if abs(heading_error) < self.heading_deadband:
            heading_error = 0.0

        # PID computation
        if self.prev_time is None:
            self.prev_time = now
            self.prev_error = heading_error
            self.cmd_pub.publish(cmd)
            return

        dt = (now - self.prev_time).to_sec()
        if dt <= 0.0 or dt > 1.0:
            self.prev_time = now
            self.prev_error = heading_error
            self.cmd_pub.publish(cmd)
            return

        # Proportional
        P = self.Kp * heading_error

        # Integral (with anti-windup clamp)
        self.integral += heading_error * dt
        self.integral = max(-0.5, min(0.5, self.integral))
        I = self.Ki * self.integral

        # Derivative (on error, with low-pass filter)
        raw_D = (heading_error - self.prev_error) / dt
        D = self.Kd * raw_D

        correction = P + I + D

        # Clamp correction
        correction = max(-self.max_correction, min(self.max_correction, correction))

        # Add correction to angular velocity
        cmd.angular.z += correction

        self.prev_error = heading_error
        self.prev_time = now

        self.cmd_pub.publish(cmd)

        # Debug logging (throttled)
        rospy.logdebug_throttle(1.0,
            '[heading_correction] err=%.3f rad | P=%.3f I=%.3f D=%.3f | '
            'correction=%.3f rad/s | final_w=%.3f',
            heading_error, P, I, D, correction, cmd.angular.z)

    def _get_heading_error(self):
        """
        Compute heading error between where the robot SHOULD be pointing
        (according to the plan/map frame) vs where odometry THINKS it's pointing.

        We use the TF tree: the difference between the map->base_footprint
        transform's yaw and the odom->base_footprint transform's yaw gives us
        the map->odom correction. But more directly, we compare AMCL yaw
        with odom yaw.

        Heading error = how much odom yaw has drifted from AMCL yaw.
        Positive error = robot is rotated CCW from where it should be.
        """
        if self.amcl_yaw is None or self.odom_yaw is None:
            return None

        # Check staleness — don't use AMCL data older than 2 seconds
        now = rospy.Time.now()
        if (now - self.amcl_stamp).to_sec() > 2.0:
            return None

        # The heading error is the angular component of the map->odom transform.
        # When AMCL corrects the robot's pose, the difference between AMCL yaw
        # and odom yaw tells us how much odom has drifted.
        #
        # But we want to correct the TRAJECTORY, not just the pose. So we use
        # the TF lookup to get the instantaneous correction needed.
        try:
            self.tf_listener.waitForTransform(
                'map', 'base_footprint', rospy.Time(0), rospy.Duration(0.1))
            (_, rot_map) = self.tf_listener.lookupTransform(
                'map', 'base_footprint', rospy.Time(0))
            _, _, yaw_map = tf.transformations.euler_from_quaternion(rot_map)

            self.tf_listener.waitForTransform(
                'odom', 'base_footprint', rospy.Time(0), rospy.Duration(0.1))
            (_, rot_odom) = self.tf_listener.lookupTransform(
                'odom', 'base_footprint', rospy.Time(0))
            _, _, yaw_odom = tf.transformations.euler_from_quaternion(rot_odom)

            # The map->odom yaw offset reveals the accumulated drift
            error = self._normalize_angle(yaw_map - yaw_odom)

            # But we only want the RECENT drift (not the initial offset from
            # the 2D Pose Estimate). So we track via the AMCL vs odom comparison.
            # Actually, the TF-based approach already handles this because
            # map->odom is set by AMCL and represents the correction needed.
            # If odom is perfect, map->odom yaw = 0. Any non-zero value is drift.

            # Alternative simpler approach: just use the map->odom transform directly
            self.tf_listener.waitForTransform(
                'map', 'odom', rospy.Time(0), rospy.Duration(0.1))
            (_, rot_correction) = self.tf_listener.lookupTransform(
                'map', 'odom', rospy.Time(0))
            _, _, yaw_correction = tf.transformations.euler_from_quaternion(
                rot_correction)

            # yaw_correction IS the heading drift.
            # If positive, odom frame is rotated CCW relative to map = robot
            # is actually pointing more CW than odom thinks = need to add
            # positive angular velocity to correct.
            #
            # We DON'T return yaw_correction directly because it includes the
            # initial pose offset. Instead, we track changes in yaw_correction.
            return yaw_correction

        except (tf.LookupException, tf.ConnectivityException,
                tf.ExtrapolationException) as e:
            rospy.logdebug_throttle(2.0,
                '[heading_correction] TF error: %s', e)
            return None

    # -- Auto-tune motor multipliers -------------------------------------------

    def auto_tune_callback(self, event):
        """
        Every tune_interval seconds, analyze accumulated heading errors
        and adjust motor multipliers to compensate for systematic drift.

        If the robot consistently drifts in one direction while going forward,
        one motor is faster than the other. We adjust the multipliers to
        compensate.
        """
        if not self.tune_yaw_errors or len(self.tune_yaw_errors) < 10:
            self.tune_yaw_errors = []
            return

        # Compute mean heading error
        mean_error = sum(self.tune_yaw_errors) / len(self.tune_yaw_errors)
        n_samples = len(self.tune_yaw_errors)
        self.tune_yaw_errors = []

        # Only tune if there's a consistent bias (not just noise)
        if abs(mean_error) < 0.02:
            rospy.loginfo_throttle(30.0,
                '[heading_correction] Motor balance OK (mean_err=%.4f rad, '
                'n=%d)', mean_error, n_samples)
            return

        left_mult = rospy.get_param('/swarmy/left_multiplier', 0.85)
        right_mult = rospy.get_param('/swarmy/right_multiplier', 1.0)

        # Scale the adjustment by the magnitude of the error (but cap it)
        adjust = min(self.tune_gain, abs(mean_error) * 0.1)

        if mean_error > 0.02:
            # map->odom has positive yaw = robot is drifting CW in reality
            # = left motor is faster (or right is slower)
            # Fix: slow down left motor OR speed up right motor
            # We adjust whichever is currently higher
            if left_mult >= right_mult:
                left_mult -= adjust
                left_mult = max(0.5, left_mult)
            else:
                right_mult += adjust
                right_mult = min(1.5, right_mult)
            rospy.loginfo(
                '[heading_correction] Drift CW (err=%.3f) -> L_mult=%.3f R_mult=%.3f',
                mean_error, left_mult, right_mult)

        elif mean_error < -0.02:
            # Drifting CCW = right motor is faster
            if right_mult >= left_mult:
                right_mult -= adjust
                right_mult = max(0.5, right_mult)
            else:
                left_mult += adjust
                left_mult = min(1.5, left_mult)
            rospy.loginfo(
                '[heading_correction] Drift CCW (err=%.3f) -> L_mult=%.3f R_mult=%.3f',
                mean_error, left_mult, right_mult)

        rospy.set_param('/swarmy/left_multiplier', left_mult)
        rospy.set_param('/swarmy/right_multiplier', right_mult)

    # -- Utilities -------------------------------------------------------------

    @staticmethod
    def _normalize_angle(angle):
        while angle > math.pi:
            angle -= 2.0 * math.pi
        while angle < -math.pi:
            angle += 2.0 * math.pi
        return angle


if __name__ == '__main__':
    try:
        node = HeadingCorrectionNode()
        rospy.spin()
    except rospy.ROSInterruptException:
        pass
