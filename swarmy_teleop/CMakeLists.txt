cmake_minimum_required(VERSION 3.0.2)
project(swarmy_teleop)
find_package(catkin REQUIRED COMPONENTS rospy std_msgs geometry_msgs)
catkin_package()
catkin_install_python(PROGRAMS
  scripts/swarmy_system_health.py
  scripts/publish_point_to_goal.py
  scripts/web_teleop_bridge.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)
