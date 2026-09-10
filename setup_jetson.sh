#!/bin/bash
# Swarmy Bot Complete Jetson Setup Script
# Run this script on a fresh Jetson to install EVERYTHING

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WS_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "   Swarmy Bot - Full System Setup"
echo "   Workspace: $WS_DIR"
echo "========================================="

# 1. System Dependencies
echo "[1/6] Installing System Dependencies (APT)..."
sudo apt-get update
sudo apt-get install -y \
    ffmpeg \
    alsa-utils \
    i2c-tools \
    python3-smbus \
    python3-pip \
    curl \
    git \
    build-essential \
    cmake \
    pkg-config \
    swig

# 2. ROS Melodic Base & Packages (Assuming JetPack 4.6 / Ubuntu 18.04)
echo "[2/6] Installing ROS Melodic & Navigation Packages..."
if [ ! -f /etc/apt/sources.list.d/ros-latest.list ]; then
    sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'
    curl -s https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | sudo apt-key add -
    sudo apt-get update
fi
sudo apt-get install -y \
    ros-melodic-desktop-full \
    ros-melodic-navigation \
    ros-melodic-slam-gmapping \
    ros-melodic-map-server \
    ros-melodic-rosbridge-server \
    ros-melodic-teleop-twist-keyboard \
    ros-melodic-rosserial \
    ros-melodic-rosserial-arduino \
    ros-melodic-range-sensor-layer \
    python-rosdep \
    python-rosinstall \
    python-rosinstall-generator \
    python-wstool \
    build-essential

# Initialize rosdep if not done
if [ ! -d /etc/ros/rosdep ]; then
    sudo rosdep init || true
    rosdep update || true
fi

# 3. Python Requirements (Python 3 & 2)
echo "[3/6] Installing Python Dependencies..."
sudo apt-get install -y python-pip
pip install pyserial
pip3 install -r "$SCRIPT_DIR/requirements.txt"

# 4. Install Node.js 14.x (Ubuntu 18.04's default nodejs is too old and broken)
echo "[4/6] Installing Node.js 14.x LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "   Node.js: $(node --version)"
echo "   npm:     $(npm --version)"

# 5. Build the YDLidar SDK (required by ydlidar_ros_driver)
echo "[5/6] Building YDLidar SDK..."
if [ ! -d /tmp/YDLidar-SDK ]; then
    cd /tmp
    git clone https://github.com/YDLIDAR/YDLidar-SDK.git
    cd YDLidar-SDK
    mkdir -p build && cd build
    cmake ..
    make -j$(nproc)
    sudo make install
    echo "   YDLidar SDK installed successfully."
else
    echo "   YDLidar SDK already cloned, rebuilding..."
    cd /tmp/YDLidar-SDK/build
    cmake ..
    make -j$(nproc)
    sudo make install
fi

# 6. Web Dashboard (Node & React)
echo "[6/6] Installing Node.js Dependencies for Dashboard..."

# Backend
if [ -d "$SCRIPT_DIR/swarmy_web_backend" ]; then
    cd "$SCRIPT_DIR/swarmy_web_backend"
    npm install
    echo "   Backend dependencies installed."
else
    echo "   WARNING: swarmy_web_backend not found at $SCRIPT_DIR/swarmy_web_backend"
fi

# Frontend
if [ -d "$SCRIPT_DIR/swarmy_web_app" ]; then
    cd "$SCRIPT_DIR/swarmy_web_app"
    npm install
    npm run build
    echo "   Frontend built successfully."
else
    echo "   WARNING: swarmy_web_app not found at $SCRIPT_DIR/swarmy_web_app"
fi

# Generate self-signed SSL certs if missing
if [ ! -f "$WS_DIR/server.key" ]; then
    echo "   Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$WS_DIR/server.key" \
        -out "$WS_DIR/server.cert" \
        -subj "/CN=swarmy-robot/O=Swarmy/C=IN"
fi

echo ""
echo "========================================="
echo " SETUP COMPLETE!"
echo ""
echo " Next steps:"
echo "   1. cd $WS_DIR"
echo "   2. source /opt/ros/melodic/setup.bash"
echo "   3. catkin_make"
echo "   4. source devel/setup.bash"
echo "   5. echo 'source $WS_DIR/devel/setup.bash' >> ~/.bashrc"
echo "========================================="
