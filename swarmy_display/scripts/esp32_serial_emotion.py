#!/usr/bin/env python3
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================

import time
import serial
import threading
from pathlib import Path
import rospy
from std_msgs.msg import String

EMOTION_FILE = Path('/tmp/robot_emotion.txt')
PORT = '/dev/ttyUSB0'
BAUD = 115200

class ESP32EmotionSender:
    def __init__(self):
        self.emotion = "BOOT"
        self.last_update = time.time()
        self.ser = None
        
        # Connect to ESP32
        while True:
            try:
                self.ser = serial.Serial(PORT, BAUD, timeout=1)
                print(f"Connected to ESP32 on {PORT}")
                break
            except Exception as e:
                print(f"Waiting for ESP32 on {PORT}... {e}")
                time.sleep(2)
                
        # Try to connect to ROS if available
        try:
            rospy.init_node('esp32_emotion_sender', disable_signals=True)
            rospy.Subscriber('/robot_emotion', String, self.ros_cb, queue_size=10)
        except Exception:
            pass

    def ros_cb(self, msg):
        val = (msg.data or '').strip().upper()
        if val and val != self.emotion:
            self.emotion = val
            self.last_update = time.time()
            self.send_to_esp32(val)
            try:
                EMOTION_FILE.write_text(val)
            except:
                pass

    def send_to_esp32(self, em):
        if self.ser and self.ser.is_open:
            try:
                self.ser.write((em + '\n').encode('ascii'))
            except:
                pass

    def run(self):
        self.send_to_esp32(self.emotion)
        while True:
            try:
                if EMOTION_FILE.exists() and time.time() - self.last_update > 0.5:
                    val = EMOTION_FILE.read_text().strip().upper()
                    if val and val != self.emotion:
                        self.emotion = val
                        self.last_update = time.time()
                        self.send_to_esp32(val)
            except Exception:
                pass
            time.sleep(0.5)

if __name__ == '__main__':
    ESP32EmotionSender().run()
