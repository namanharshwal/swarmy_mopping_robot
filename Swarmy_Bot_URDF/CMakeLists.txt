cmake_minimum_required(VERSION 3.0.2)
project(Swarmy_Bot_URDF)

find_package(catkin REQUIRED)

catkin_package()

install(DIRECTORY launch urdf meshes config rviz worlds
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}
)
