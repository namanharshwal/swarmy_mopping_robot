#!/bin/bash
# Swarmy Bot - Yocto Build Environment Bootstrap Script (For Host PC)
# WARNING: Run this on a powerful Ubuntu Host PC (not the Jetson itself)
# Requires: Ubuntu 20.04, 100GB+ Disk Space, 16GB+ RAM

set -e

echo "=================================================="
echo " Swarmy Bot - Yocto Commercial Grade Setup"
echo " Host PC Bootstrap Script"
echo "=================================================="

# 1. Install Host Dependencies required by Yocto Project
echo "[1/4] Installing Yocto Host Dependencies..."
sudo apt-get update
sudo apt-get install -y gawk wget git diffstat unzip texinfo gcc build-essential \
    chrpath socat cpio python3 python3-pip python3-pexpect xz-utils debianutils \
    iputils-ping python3-git python3-jinja2 libegl1-mesa libsdl1.2-dev \
    pylint3 xterm curl

# 2. Install 'repo' tool for managing Yocto layers
echo "[2/4] Installing Google Repo tool..."
mkdir -p ~/.bin
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/.bin/repo
chmod a+rx ~/.bin/repo
export PATH="~/.bin:$PATH"

# 3. Initialize Yocto Workspace (Using OE4T - OpenEmbedded for Tegra)
# JetPack 4.6 (L4T 32.7.x) aligns with Yocto 'dunfell' branch
YOCTO_DIR="$HOME/swarmy_yocto_bsp"
echo "[3/4] Initializing Yocto Workspace at $YOCTO_DIR..."
mkdir -p "$YOCTO_DIR"
cd "$YOCTO_DIR"

if [ ! -d ".repo" ]; then
    repo init -u https://github.com/OE4T/tegra-demo-distro.git -b dunfell -m default.xml
fi
repo sync

# 4. Clone meta-ros for ROS Melodic
echo "[4/4] Adding meta-ros (ROS Melodic) layer..."
cd "$YOCTO_DIR/layers"
if [ ! -d "meta-ros" ]; then
    git clone -b dunfell https://github.com/ros/meta-ros.git
fi

echo "=================================================="
echo " Bootstrap Complete!"
echo ""
echo " Next Steps:"
echo " 1. Navigate to: cd $YOCTO_DIR"
echo " 2. Setup environment: source setup-env"
echo " 3. Add meta-ros to your bblayers.conf"
echo " 4. Build image: bitbake demo-image-full"
echo "=================================================="
