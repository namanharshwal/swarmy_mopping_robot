#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
motor_calibrate.py — Automatic motor balance calibration using AMCL

This script finds the correct left/right motor multipliers by:
1. Driving the robot forward in short bursts
2. Measuring the ACTUAL heading drift via AMCL (Lidar-based ground truth)
3. Auto-detecting which motor is faster regardless of serial wiring
4. Iteratively adjusting the faster motor's multiplier until drift < threshold
5. Saving the final calibrated values to base_params.yaml

PREREQUISITES:
  - Navigation must be running (AMCL needs to be active and localized)
  - Robot must have ~1m of clear space ahead
  - Set the 2D Pose Estimate in RViz before running

USAGE:
  # With navigation running in another terminal:
  rosrun swarmy_cmd_vel motor_calibrate.py
"""

import rospy
import math
import time
import yaml
import os
import tf
from geometry_msgs.msg import Twist, PoseWithCovarianceStamped


class MotorCalibrator(object):

    def __init__(self):
        rospy.init_node('motor_calibrate', anonymous=True)

        # -- Config --
        self.test_speed = 0.08          # m/s forward speed during test
        self.test_duration = 3.0        # seconds per test run
        self.return_duration = 3.0      # seconds to drive back
        self.settle_time = 1.5          # seconds to wait after stopping
        self.drift_threshold = 0.03     # rad — success if drift < this
        self.max_iterations = 12        # max calibration attempts
        self.step_size = 0.03           # multiplier adjustment per step
        self.min_multiplier = 0.60      # floor for multipliers
        self.save_path = os.path.expanduser(
            '~/swarmy_ws/src/swarmy_cmd_vel/config/base_params.yaml')

        # -- State --
        self.amcl_yaw = None
        self.amcl_stamp = rospy.Time(0)
        self.tf_listener = tf.TransformListener()

        # -- Publishers / Subscribers --
        self.cmd_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=1)
        rospy.Subscriber('/amcl_pose', PoseWithCovarianceStamped,
                         self.amcl_cb, queue_size=1)

        rospy.on_shutdown(self.stop_robot)

    def amcl_cb(self, msg):
        q = msg.pose.pose.orientation
        _, _, yaw = tf.transformations.euler_from_quaternion(
            [q.x, q.y, q.z, q.w])
        self.amcl_yaw = yaw
        self.amcl_stamp = msg.header.stamp

    def stop_robot(self):
        cmd = Twist()
        self.cmd_pub.publish(cmd)

    def wait_for_amcl(self, timeout=10.0):
        """Wait for AMCL to be publishing."""
        rospy.loginfo('[calibrate] Waiting for AMCL pose ...')
        start = time.time()
        while self.amcl_yaw is None and not rospy.is_shutdown():
            if time.time() - start > timeout:
                rospy.logerr('[calibrate] Timeout waiting for /amcl_pose. '
                             'Is navigation running? Did you set 2D Pose Estimate?')
                return False
            time.sleep(0.2)
        rospy.loginfo('[calibrate] AMCL OK (yaw=%.3f)', self.amcl_yaw)
        return True

    def get_amcl_yaw(self):
        """Get current heading from AMCL via TF (more up-to-date than topic)."""
        try:
            self.tf_listener.waitForTransform(
                'map', 'base_footprint', rospy.Time(0), rospy.Duration(0.5))
            (_, rot) = self.tf_listener.lookupTransform(
                'map', 'base_footprint', rospy.Time(0))
            _, _, yaw = tf.transformations.euler_from_quaternion(rot)
            return yaw
        except (tf.LookupException, tf.ConnectivityException,
                tf.ExtrapolationException):
            return self.amcl_yaw

    def drive_forward(self, duration, speed):
        """Drive forward for a specified duration."""
        cmd = Twist()
        cmd.linear.x = speed
        rate = rospy.Rate(20)
        start = time.time()
        while time.time() - start < duration and not rospy.is_shutdown():
            self.cmd_pub.publish(cmd)
            rate.sleep()
        self.stop_robot()

    def measure_drift(self):
        """
        Drive forward and measure heading drift.
        Returns drift in radians (positive = drifted left, negative = drifted right).
        """
        # Record starting heading
        time.sleep(0.3)  # brief settle
        yaw_start = self.get_amcl_yaw()
        if yaw_start is None:
            return None

        # Drive forward
        self.drive_forward(self.test_duration, self.test_speed)

        # Wait for AMCL to update after stopping
        time.sleep(self.settle_time)

        # Record ending heading
        yaw_end = self.get_amcl_yaw()
        if yaw_end is None:
            return None

        # Compute drift
        drift = yaw_end - yaw_start
        # Normalize to [-pi, pi]
        while drift > math.pi:
            drift -= 2.0 * math.pi
        while drift < -math.pi:
            drift += 2.0 * math.pi

        return drift

    def drive_back(self):
        """Drive backward to roughly return to start position."""
        self.drive_forward(self.return_duration, -self.test_speed)
        time.sleep(self.settle_time)

    def save_params(self, left_mult, right_mult):
        """Save calibrated multipliers to base_params.yaml."""
        params = {
            'swarmy': {
                'left_multiplier': round(float(left_mult), 3),
                'right_multiplier': round(float(right_mult), 3),
                'fake_odom_linear_multiplier': 1.0,
                'fake_odom_angular_multiplier': 1.0,
            }
        }
        try:
            with open(self.save_path, 'w') as f:
                yaml.dump(params, f, default_flow_style=False)
            rospy.loginfo('[calibrate] Saved to %s', self.save_path)
        except Exception as e:
            rospy.logerr('[calibrate] Failed to save: %s', e)

    def run(self):
        if not self.wait_for_amcl():
            return

        # Start with current multipliers (should be 1.0/1.0 after reset)
        left_mult = rospy.get_param('/swarmy/left_multiplier', 1.0)
        right_mult = rospy.get_param('/swarmy/right_multiplier', 1.0)

        rospy.loginfo('=' * 60)
        rospy.loginfo('[calibrate] MOTOR BALANCE CALIBRATION')
        rospy.loginfo('[calibrate] Starting: L=%.3f  R=%.3f', left_mult, right_mult)
        rospy.loginfo('[calibrate] Robot will drive forward in short bursts.')
        rospy.loginfo('[calibrate] Make sure there is ~1m of clear space ahead!')
        rospy.loginfo('=' * 60)
        time.sleep(3.0)

        # Phase 1: Detect natural drift direction with neutral multipliers
        rospy.loginfo('[calibrate] --- Test 1: measuring natural drift ---')
        drift = self.measure_drift()
        if drift is None:
            rospy.logerr('[calibrate] Could not measure drift. Aborting.')
            return

        rospy.loginfo('[calibrate] Natural drift: %.4f rad (%.1f deg) | %s',
                      drift, math.degrees(drift),
                      'LEFT' if drift > 0 else 'RIGHT')

        if abs(drift) < self.drift_threshold:
            rospy.loginfo('[calibrate] Already balanced! No adjustment needed.')
            self.save_params(left_mult, right_mult)
            return

        # Phase 2: Determine which multiplier to adjust.
        # We try reducing one multiplier and see if drift improves.
        # This auto-detects the serial motor mapping.
        rospy.loginfo('[calibrate] --- Test 2: probing motor mapping ---')

        # Hypothesis: if drifting RIGHT (drift < 0), left wheel is faster.
        # Try reducing left_mult. If drift improves → left_mult is correct.
        # If drift worsens → serial mapping is swapped, use right_mult instead.
        if drift < 0:
            # Drifting right — probe by reducing left_mult
            probe_param = '/swarmy/left_multiplier'
            probe_alt = '/swarmy/right_multiplier'
            probe_label = 'left'
            alt_label = 'right'
        else:
            # Drifting left — probe by reducing right_mult
            probe_param = '/swarmy/right_multiplier'
            probe_alt = '/swarmy/left_multiplier'
            probe_label = 'right'
            alt_label = 'left'

        # Apply probe adjustment
        probe_value = 1.0 - self.step_size * 2  # noticeable probe step
        rospy.set_param(probe_param, probe_value)
        rospy.loginfo('[calibrate] Probing: set %s_mult = %.3f',
                      probe_label, probe_value)

        self.drive_back()
        drift2 = self.measure_drift()
        if drift2 is None:
            rospy.logerr('[calibrate] Could not measure drift. Aborting.')
            return

        rospy.loginfo('[calibrate] Drift after probe: %.4f rad (was %.4f)',
                      drift2, drift)

        # Decide which multiplier actually controls the faster motor
        drift_improved = abs(drift2) < abs(drift)

        if drift_improved:
            # Our guess was correct
            target_param = probe_param
            target_label = probe_label
            current_value = probe_value
            rospy.loginfo('[calibrate] Confirmed: %s_multiplier controls the '
                          'faster motor.', probe_label)
        else:
            # Guess was wrong — serial mapping is swapped, use the other one
            rospy.set_param(probe_param, 1.0)  # undo probe
            target_param = probe_alt
            target_label = alt_label
            current_value = 1.0 - self.step_size * 2
            rospy.set_param(target_param, current_value)
            rospy.loginfo('[calibrate] Motor mapping swapped! Using '
                          '%s_multiplier instead.', alt_label)

        # Phase 3: Iterative fine-tuning
        rospy.loginfo('[calibrate] --- Phase 3: fine-tuning ---')

        best_drift = min(abs(drift), abs(drift2))
        best_value = current_value

        for i in range(self.max_iterations):
            self.drive_back()
            drift_i = self.measure_drift()
            if drift_i is None:
                continue

            rospy.loginfo('[calibrate] Iter %d: %s_mult=%.3f  drift=%.4f rad '
                          '(%.1f deg) %s',
                          i + 1, target_label, current_value,
                          drift_i, math.degrees(drift_i),
                          'LEFT' if drift_i > 0 else 'RIGHT')

            if abs(drift_i) < self.drift_threshold:
                rospy.loginfo('[calibrate] CONVERGED! Drift within threshold.')
                best_value = current_value
                break

            if abs(drift_i) < best_drift:
                best_drift = abs(drift_i)
                best_value = current_value

            # Adjust: reduce the multiplier if still drifting in the
            # original direction, increase if we've overcorrected
            if (drift < 0 and drift_i < -self.drift_threshold) or \
               (drift > 0 and drift_i > self.drift_threshold):
                # Still drifting in original direction — reduce more
                current_value -= self.step_size
            elif (drift < 0 and drift_i > self.drift_threshold) or \
                 (drift > 0 and drift_i < -self.drift_threshold):
                # Overcorrected — increase slightly
                current_value += self.step_size * 0.5
                self.step_size *= 0.5  # smaller steps as we converge

            current_value = max(self.min_multiplier, min(1.15, current_value))
            rospy.set_param(target_param, current_value)

        # Use best value found
        rospy.set_param(target_param, best_value)

        # Read final values
        final_left = rospy.get_param('/swarmy/left_multiplier', 1.0)
        final_right = rospy.get_param('/swarmy/right_multiplier', 1.0)

        rospy.loginfo('=' * 60)
        rospy.loginfo('[calibrate] CALIBRATION COMPLETE')
        rospy.loginfo('[calibrate] Final: L=%.3f  R=%.3f', final_left, final_right)
        rospy.loginfo('[calibrate] Best drift: %.4f rad (%.1f deg)',
                      best_drift, math.degrees(best_drift))
        rospy.loginfo('=' * 60)

        # Save to file
        self.save_params(final_left, final_right)

        # Stop robot
        self.stop_robot()


if __name__ == '__main__':
    try:
        cal = MotorCalibrator()
        cal.run()
    except rospy.ROSInterruptException:
        pass
