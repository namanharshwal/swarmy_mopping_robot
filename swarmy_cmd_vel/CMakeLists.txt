cmake_minimum_required(VERSION 3.0.2)
project(swarmy_cmd_vel)

find_package(catkin REQUIRED COMPONENTS
  geometry_msgs
  nav_msgs
  rospy
  sensor_msgs
  std_msgs
)

catkin_package()

include_directories(${catkin_INCLUDE_DIRS})

catkin_install_python(PROGRAMS
  scripts/cmd_vel_listener.py
  scripts/swarmy_base_node.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)
