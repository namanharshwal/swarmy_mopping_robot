#!/bin/bash
# Swarmy Bot Complete Jetson Setup Script
# Run this script on a fresh Jetson to install EVERYTHING

echo "========================================="
echo "   Swarmy Bot - Full System Setup"
echo "========================================="

# 1. System Dependencies
echo "[1/4] Installing System Dependencies (APT)..."
sudo apt-get update
sudo apt-get install -y \
    ffmpeg \
    alsa-utils \
    i2c-tools \
    python3-smbus \
    python3-pip \
    curl \
    git \
    nodejs \
    npm

# 2. ROS Melodic Base & Packages (Assuming JetPack 4.6 / Ubuntu 18.04)
echo "[2/4] Installing ROS Melodic & Navigation Packages..."
sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'
curl -s https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y \
    ros-melodic-desktop-full \
    ros-melodic-navigation \
    ros-melodic-slam-gmapping \
    ros-melodic-map-server \
    ros-melodic-rosbridge-server \
    ros-melodic-teleop-twist-keyboard \
    ros-melodic-rosserial \
    ros-melodic-rosserial-arduino \
    python-rosdep \
    python-rosinstall \
    python-rosinstall-generator \
    python-wstool \
    build-essential

# 3. Python Requirements
echo "[3/4] Installing Python Dependencies..."
pip3 install -r requirements.txt

# 4. Web Dashboard (Node & React)
echo "[4/4] Installing Node.js Dependencies for Dashboard..."
# Backend
cd src/swarmy_web_backend
npm install
cd ../..
# Frontend
cd src/swarmy_web_app
npm install
npm run build
cd ../..

echo "========================================="
echo " SETUP COMPLETE!"
echo " Don't forget to run 'catkin_make' in swarmy_ws!"
echo "========================================="
