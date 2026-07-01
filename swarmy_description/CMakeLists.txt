cmake_minimum_required(VERSION 3.0.2)
project(swarmy_description)
find_package(catkin REQUIRED)
catkin_package()
install(DIRECTORY urdf launch rviz config
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}
)
