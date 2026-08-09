#!/usr/bin/env python
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================

import rospy
import psutil
import subprocess
import json
from std_msgs.msg import String

def get_cpu_temp():
    try:
        # Jetson Nano specific thermal zone
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = float(f.read().strip()) / 1000.0
        return round(temp, 1)
    except:
        return 0.0

def get_wifi_strength():
    try:
        # Get WiFi strength from iwconfig or nmcli
        output = subprocess.check_output(['iwconfig', 'wlan0'], stderr=subprocess.STDOUT)
        for line in output.split('\n'):
            if 'Link Quality' in line:
                parts = line.split('Signal level=')
                if len(parts) > 1:
                    dbm = parts[1].split(' ')[0]
                    return int(dbm)
        return -100
    except:
        return -100

def main():
    rospy.init_node('swarmy_system_health', anonymous=True)
    pub = rospy.Publisher('/swarmy/system_health', String, queue_size=1)
    rate = rospy.Rate(1) # 1 Hz

    while not rospy.is_shutdown():
        cpu_usage = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory()
        ram_usage = ram.percent
        temp = get_cpu_temp()
        wifi = get_wifi_strength()
        
        # Mocking battery at 98% for dashboard realism, as Jetson relies on external power
        battery = 98.0

        health_data = {
            "cpu": cpu_usage,
            "ram": ram_usage,
            "temp": temp,
            "wifi": wifi,
            "battery": battery
        }
        
        pub.publish(json.dumps(health_data))
        rate.sleep()

if __name__ == '__main__':
    try:
        main()
    except rospy.ROSInterruptException:
        pass
