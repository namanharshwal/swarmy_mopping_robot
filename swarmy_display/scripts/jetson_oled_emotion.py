#!/usr/bin/env python3
import time
import rospy
from std_msgs.msg import String
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
        self.blink = False
        self.last_blink = time.time()

        serial = i2c(port=self.port, address=self.addr)
        if self.driver == "sh1106":
            self.device = sh1106(serial)
        else:
            self.device = ssd1306(serial)

        rospy.Subscriber("/robot_emotion", String, self.cb, queue_size=10)

    def cb(self, msg):
        self.emotion = msg.data.strip().upper()

    def draw_eyes(self, draw, blink=False):
        if blink:
            draw.rectangle((24, 20, 48, 24), outline="white", fill="white")
            draw.rectangle((80, 20, 104, 24), outline="white", fill="white")
        else:
            draw.rounded_rectangle((24, 12, 48, 30), radius=4, outline="white", fill="white")
            draw.rounded_rectangle((80, 12, 104, 30), radius=4, outline="white", fill="white")

    def render(self):
        if time.time() - self.last_blink > 2.5:
            self.blink = not self.blink
            self.last_blink = time.time()

        with canvas(self.device) as draw:
            if self.emotion == "HAPPY":
                self.draw_eyes(draw, self.blink)
                draw.arc((42, 28, 86, 56), start=20, end=160, fill="white")
            elif self.emotion == "IDLE":
                self.draw_eyes(draw, self.blink)
                draw.line((48, 46, 80, 46), fill="white")
            elif self.emotion == "WARN":
                draw.polygon([(64, 8), (42, 50), (86, 50)], outline="white", fill=None)
                draw.text((60, 18), "!", fill="white")
            elif self.emotion == "CONFUSED":
                self.draw_eyes(draw, False)
                draw.line((46, 50, 82, 42), fill="white")
            elif self.emotion == "ALERT":
                self.draw_eyes(draw, False)
                draw.ellipse((56, 38, 72, 54), outline="white", fill=None)
            else:
                draw.text((42, 24), "BOOT", fill="white")

    def run(self):
        rate = rospy.Rate(15)
        while not rospy.is_shutdown():
            self.render()
            rate.sleep()

if __name__ == "__main__":
    OLEDEmotion().run()
