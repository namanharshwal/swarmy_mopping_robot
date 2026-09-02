#!/usr/bin/env python3
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================

import time
import rospy
from std_msgs.msg import String
from sensor_msgs.msg import BatteryState
from luma.core.interface.serial import i2c
from luma.core.render import canvas
from luma.oled.device import ssd1306, sh1106

class OLEDEmotion:
    def __init__(self):
        rospy.init_node("jetson_oled_emotion")
        self.port = rospy.get_param("~i2c_port", 1)
        self.addr = int(str(rospy.get_param("~i2c_addr", "0x3C")), 16)
        self.driver = rospy.get_param("~driver", "ssd1306")
        self.emotion = "BOOT"
        self.battery_pct = 0.0
        self.battery_volts = 0.0
        self.blink = False
        self.last_blink = time.time()

        serial = i2c(port=self.port, address=self.addr)
        if self.driver == "sh1106":
            self.device = sh1106(serial)
        else:
            self.device = ssd1306(serial)

        rospy.Subscriber("/robot_emotion", String, self.cb, queue_size=10)
        rospy.Subscriber("/battery_state", BatteryState, self.batt_cb, queue_size=10)

    def cb(self, msg):
        self.emotion = msg.data.strip().upper()

    def batt_cb(self, msg):
        self.battery_pct = msg.percentage * 100.0
        self.battery_volts = msg.voltage

    def draw_eyes(self, draw, blink=False, offset_y=12):
        if blink:
            draw.rectangle((24, 20 + offset_y, 48, 24 + offset_y), outline="white", fill="white")
            draw.rectangle((80, 20 + offset_y, 104, 24 + offset_y), outline="white", fill="white")
        else:
            draw.rounded_rectangle((24, 12 + offset_y, 48, 30 + offset_y), radius=4, outline="white", fill="white")
            draw.rounded_rectangle((80, 12 + offset_y, 104, 30 + offset_y), radius=4, outline="white", fill="white")

    def render(self):
        if time.time() - self.last_blink > 2.5:
            self.blink = not self.blink
            self.last_blink = time.time()

        with canvas(self.device) as draw:
            # --- Draw Top Bar ---
            draw.line((0, 10, 128, 10), fill="white")
            
            # Battery Icon
            draw.rectangle((2, 2, 12, 8), outline="white", fill=None)
            draw.rectangle((12, 4, 14, 6), outline="white", fill="white")
            width = int(8 * (self.battery_pct / 100.0))
            if width > 0:
                draw.rectangle((3, 3, 3 + width, 7), outline="white", fill="white")
            
            # Text
            draw.text((18, 0), f"{int(self.battery_pct)}%", fill="white")
            draw.line((45, 0, 45, 10), fill="white")
            draw.text((50, 0), f"{self.battery_volts:.1f}V", fill="white")
            
            # --- Draw Emotion (Shifted Down) ---
            offset_y = 10
            
            if self.emotion == "HAPPY":
                self.draw_eyes(draw, self.blink, offset_y)
                draw.arc((42, 28 + offset_y, 86, 56 + offset_y), start=20, end=160, fill="white")
            elif self.emotion == "IDLE":
                self.draw_eyes(draw, self.blink, offset_y)
                draw.line((48, 46 + offset_y, 80, 46 + offset_y), fill="white")
            elif self.emotion == "WARN":
                draw.polygon([(64, 8 + offset_y), (42, 50 + offset_y), (86, 50 + offset_y)], outline="white", fill=None)
                draw.text((60, 18 + offset_y), "!", fill="white")
            elif self.emotion == "CONFUSED":
                self.draw_eyes(draw, False, offset_y)
                draw.line((46, 50 + offset_y, 82, 42 + offset_y), fill="white")
            elif self.emotion == "ALERT":
                self.draw_eyes(draw, False, offset_y)
                draw.ellipse((56, 38 + offset_y, 72, 54 + offset_y), outline="white", fill=None)
            else:
                draw.text((42, 24 + offset_y), "BOOT", fill="white")

    def run(self):
        rate = rospy.Rate(15)
        while not rospy.is_shutdown():
            self.render()
            rate.sleep()

if __name__ == "__main__":
    OLEDEmotion().run()
