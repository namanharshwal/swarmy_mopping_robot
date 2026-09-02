#!/usr/bin/env python3
import rospy
import smbus2
import time
from sensor_msgs.msg import BatteryState

# INA260 I2C Address
INA260_ADDRESS = 0x40

# INA260 Registers
REG_CONFIG = 0x00
REG_CURRENT = 0x01
REG_BUS_VOLTAGE = 0x02
REG_POWER = 0x03

# LiPo 3S Settings
CELLS = 3
MAX_VOLTAGE = 4.2 * CELLS
MIN_VOLTAGE = 3.3 * CELLS

def read_16bit_register(bus, reg):
    try:
        data = bus.read_i2c_block_data(INA260_ADDRESS, reg, 2)
        # MSB first
        value = (data[0] << 8) | data[1]
        # Two's complement for signed values
        if value >= 32768:
            value -= 65536
        return value
    except Exception as e:
        rospy.logwarn("INA260 read error: %s", str(e))
        return None

def main():
    rospy.init_node('battery_monitor_node')
    pub = rospy.Publisher('/battery_state', BatteryState, queue_size=1)
    rate = rospy.Rate(1.0) # 1 Hz

    try:
        bus = smbus2.SMBus(1)
    except Exception as e:
        rospy.logerr("Could not open I2C bus: %s", str(e))
        return

    # Reset INA260
    try:
        bus.write_i2c_block_data(INA260_ADDRESS, REG_CONFIG, [0x80, 0x00])
        time.sleep(0.1)
        # Configure INA260 (default is continuous conversion)
        bus.write_i2c_block_data(INA260_ADDRESS, REG_CONFIG, [0x61, 0x27])
    except Exception as e:
        rospy.logerr("Could not configure INA260: %s", str(e))

    rospy.loginfo("Battery monitor started.")

    while not rospy.is_shutdown():
        raw_voltage = read_16bit_register(bus, REG_BUS_VOLTAGE)
        raw_current = read_16bit_register(bus, REG_CURRENT)

        if raw_voltage is not None and raw_current is not None:
            # INA260 scale factors: Voltage is 1.25 mV/LSB, Current is 1.25 mA/LSB
            voltage = raw_voltage * 1.25 / 1000.0
            current = raw_current * 1.25 / 1000.0

            # Estimate percentage based on 3S LiPo curve (linear approx for simplicity)
            percentage = (voltage - MIN_VOLTAGE) / (MAX_VOLTAGE - MIN_VOLTAGE)
            percentage = max(0.0, min(1.0, percentage))

            msg = BatteryState()
            msg.header.stamp = rospy.Time.now()
            msg.voltage = voltage
            msg.current = current
            msg.percentage = percentage
            msg.power_supply_status = BatteryState.POWER_SUPPLY_STATUS_DISCHARGING
            msg.power_supply_health = BatteryState.POWER_SUPPLY_HEALTH_GOOD
            msg.power_supply_technology = BatteryState.POWER_SUPPLY_TECHNOLOGY_LIPO
            msg.present = True
            
            pub.publish(msg)

        rate.sleep()

if __name__ == '__main__':
    main()
