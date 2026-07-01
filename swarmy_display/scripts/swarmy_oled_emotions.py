#!/usr/bin/env python3
import math
import time
from pathlib import Path

import rospy
from std_msgs.msg import String
from luma.core.interface.serial import i2c
from luma.core.render import canvas
from luma.oled.device import ssd1306, sh1106

EMOTION_FILE = Path('/tmp/robot_emotion.txt')
W, H = 128, 64


class SwarmyEmotionDisplay:
    def __init__(self):
        self.port = int(rospy.get_param('~i2c_port', 1))
        self.address = int(str(rospy.get_param('~i2c_address', '0x3C')), 0)
        self.driver_name = str(rospy.get_param('~driver', 'ssd1306')).lower()
        self.fps = float(rospy.get_param('~fps', 15.0))
        self.default_emotion = str(rospy.get_param('~default_emotion', 'IDLE')).upper()
        self.emotion_timeout = float(rospy.get_param('~emotion_timeout', 8.0))
        self.topic = str(rospy.get_param('~emotion_topic', '/robot_emotion'))

        serial = i2c(port=self.port, address=self.address)
        self.device = sh1106(serial, width=W, height=H) if self.driver_name == 'sh1106' else ssd1306(serial, width=W, height=H)

        self.emotion = self.default_emotion
        self.last_update = time.time()
        self.frame = 0
        self.last_blink = time.time()
        self.is_blinking = False
        self.blink_start = 0.0
        self.boot_start = time.time()

        self.sub = rospy.Subscriber(self.topic, String, self.emotion_cb, queue_size=10)
        rospy.loginfo('swarmy_oled_emotions started on I2C port=%s addr=%s driver=%s', self.port, hex(self.address), self.driver_name)

    def emotion_cb(self, msg):
        value = (msg.data or '').strip().upper()
        if value:
            self.emotion = value
            self.last_update = time.time()
            self.frame = 0
            try:
                EMOTION_FILE.write_text(value)
            except Exception:
                pass

    def tick(self):
        if time.time() - self.last_update > self.emotion_timeout:
            self.emotion = self.default_emotion

        if self.is_blinking:
            if time.time() - self.blink_start > 0.12:
                self.is_blinking = False
        else:
            interval = 3.4 if self.emotion == 'SLEEP' else 2.6
            if time.time() - self.last_blink > interval:
                self.is_blinking = True
                self.blink_start = time.time()
                self.last_blink = time.time()

        self.frame += 1

    def draw_round_eyes(self, draw, lx, ly, rx, ry, w=22, h=18, blink=False):
        if blink:
            draw.line((lx, ly + h // 2, lx + w, ly + h // 2), fill='white', width=3)
            draw.line((rx, ry + h // 2, rx + w, ry + h // 2), fill='white', width=3)
            return
        draw.ellipse((lx, ly, lx + w, ly + h), outline='white', fill='white')
        draw.ellipse((rx, ry, rx + w, ry + h), outline='white', fill='white')
        draw.ellipse((lx + 6, ly + 4, lx + 14, ly + 12), fill='black')
        draw.ellipse((rx + 6, ry + 4, rx + 14, ry + 12), fill='black')
        draw.ellipse((lx + 4, ly + 3, lx + 7, ly + 6), fill='white')
        draw.ellipse((rx + 4, ry + 3, rx + 7, ry + 6), fill='white')

    def draw_happy_eyes(self, draw, lx, ly, rx, ry, w=22, h=18):
        draw.arc((lx, ly, lx + w, ly + h), start=200, end=340, fill='white', width=3)
        draw.arc((rx, ry, rx + w, ry + h), start=200, end=340, fill='white', width=3)

    def draw_sleep_eyes(self, draw, lx, ly, rx, ry, w=22, h=16):
        draw.arc((lx, ly, lx + w, ly + h), start=180, end=360, fill='white', width=2)
        draw.arc((rx, ry, rx + w, ry + h), start=180, end=360, fill='white', width=2)
        draw.line((lx + 2, ly + 8, lx + w - 2, ly + 8), fill='white', width=2)
        draw.line((rx + 2, ry + 8, rx + w - 2, ry + 8), fill='white', width=2)

    def draw_angry_eyes(self, draw, lx, ly, rx, ry, w=22, h=18):
        draw.line((lx, ly - 5, lx + w, ly - 1), fill='white', width=3)
        draw.line((rx, ry - 1, rx + w, ry - 5), fill='white', width=3)
        self.draw_round_eyes(draw, lx, ly, rx, ry, w=w, h=h, blink=False)

    def draw_sad_eyes(self, draw, lx, ly, rx, ry, w=22, h=18, blink=False):
        self.draw_round_eyes(draw, lx, ly, rx, ry, w=w, h=h, blink=blink)
        draw.line((lx + 2, ly - 4, lx + 10, ly - 2), fill='white', width=2)
        draw.line((rx + 12, ry - 4, rx + 20, ry - 2), fill='white', width=2)

    def draw_heart(self, draw, cx, cy, scale=1):
        pts = [
            (cx, cy + 4 * scale), (cx - 6 * scale, cy - 1 * scale), (cx - 9 * scale, cy + 2 * scale),
            (cx - 5 * scale, cy + 7 * scale), (cx, cy + 11 * scale),
            (cx + 5 * scale, cy + 7 * scale), (cx + 9 * scale, cy + 2 * scale), (cx + 6 * scale, cy - 1 * scale),
        ]
        draw.polygon(pts, fill='white')

    def mouth_flat(self, draw):
        draw.line((44, 52, 84, 52), fill='white', width=2)

    def mouth_big_smile(self, draw):
        draw.arc((32, 36, 96, 60), start=5, end=175, fill='white', width=3)
        draw.arc((38, 40, 90, 58), start=5, end=175, fill='black', width=4)

    def mouth_sad(self, draw):
        draw.arc((40, 46, 88, 62), start=190, end=350, fill='white', width=3)

    def mouth_open(self, draw):
        draw.ellipse((54, 41, 74, 57), outline='white', fill='black')

    def mouth_confused(self, draw):
        pts = [(40, 52), (48, 48), (56, 52), (64, 48), (72, 52), (80, 48), (88, 52)]
        for i in range(len(pts) - 1):
            draw.line((pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]), fill='white', width=2)

    def render(self):
        self.tick()
        em = self.emotion
        bob = int(2 * math.sin(self.frame / 8.0))

        with canvas(self.device) as draw:
            if em == 'BOOT':
                phase = int((time.time() - self.boot_start) * 4) % 4
                draw.text((36, 12), 'SWARMY', fill='white')
                draw.text((44, 34), 'BOOT' + '.' * (phase + 1), fill='white')

            elif em == 'IDLE':
                self.draw_round_eyes(draw, 24, 14 + bob, 82, 14 + bob, blink=self.is_blinking)
                self.mouth_flat(draw)

            elif em == 'HAPPY':
                self.draw_happy_eyes(draw, 18, 14 + bob, 88, 14 + bob)
                self.mouth_big_smile(draw)
                for x in range(22, 34, 3):
                    draw.point((x, 40), fill='white')
                for x in range(96, 108, 3):
                    draw.point((x, 40), fill='white')

            elif em == 'SAD':
                self.draw_sad_eyes(draw, 24, 18, 82, 18, blink=self.is_blinking)
                self.mouth_sad(draw)
                draw.polygon([(30, 36), (27, 43), (33, 43)], fill='white')

            elif em == 'ANGRY':
                self.draw_angry_eyes(draw, 22, 16, 84, 16)
                draw.arc((36, 48, 92, 66), start=195, end=345, fill='white', width=3)

            elif em == 'CONFUSED':
                self.draw_round_eyes(draw, 24, 14, 82, 14, blink=False)
                draw.line((24, 8, 46, 12), fill='white', width=2)
                draw.line((82, 12, 104, 8), fill='white', width=2)
                self.mouth_confused(draw)
                draw.text((110, 4), '?', fill='white')

            elif em == 'ALERT':
                draw.ellipse((20, 10, 48, 34), outline='white', fill='white')
                draw.ellipse((80, 10, 108, 34), outline='white', fill='white')
                draw.ellipse((28, 15, 40, 27), fill='black')
                draw.ellipse((88, 15, 100, 27), fill='black')
                draw.ellipse((26, 13, 29, 16), fill='white')
                draw.ellipse((86, 13, 89, 16), fill='white')
                self.mouth_open(draw)
                draw.text((59, 2), '!', fill='white')

            elif em == 'WARN':
                draw.polygon([(64, 4), (20, 56), (108, 56)], outline='white', fill=None)
                draw.line((64, 18, 64, 38), fill='white', width=3)
                draw.ellipse((60, 43, 68, 51), fill='white')

            elif em == 'LOVE':
                self.draw_heart(draw, 30, 18, 1)
                self.draw_heart(draw, 96, 18, 1)
                self.draw_heart(draw, 64, 47, 1)
                fy = int(3 * math.sin(self.frame / 5.0))
                self.draw_heart(draw, 12, 28 + fy, 0.6)
                self.draw_heart(draw, 116, 22 - fy, 0.6)

            elif em == 'SLEEP':
                self.draw_sleep_eyes(draw, 24, 18, 82, 18)
                self.mouth_flat(draw)
                z_phase = self.frame % 30
                if z_phase > 4:
                    draw.text((78, 8), 'z', fill='white')
                if z_phase > 12:
                    draw.text((90, 2), 'z', fill='white')
                if z_phase > 20:
                    draw.text((102, -2), 'Z', fill='white')

            else:
                self.draw_round_eyes(draw, 24, 14, 82, 14, blink=self.is_blinking)
                self.mouth_flat(draw)

    def run(self):
        rate = rospy.Rate(self.fps)
        while not rospy.is_shutdown():
            self.render()
            rate.sleep()


if __name__ == '__main__':
    rospy.init_node('swarmy_oled_emotions')
    SwarmyEmotionDisplay().run()
