# Swarmy Robot - Complete Jetson Rebuild Guide

This guide explains how to completely rebuild the Swarmy Robot's software stack from scratch on a brand new NVIDIA Jetson Nano. Because we have automated the installation process, you do **not** need a 16GB disk image backup.

## Phase 1: Flashing the Jetson OS

1. **Download the OS Image:** Download **NVIDIA JetPack 4.6.1 (Ubuntu 18.04)** from the official NVIDIA developer website. (Do not use Ubuntu 20.04, as Swarmy relies on ROS Melodic).
2. **Flash the SD Card:** Use a tool like [BalenaEtcher](https://balena.io/etcher) or Rufus to flash the downloaded `.img.zip` file onto a fresh 32GB+ microSD card.
3. **First Boot:** Insert the SD card into the Jetson Nano, connect a monitor, keyboard, and mouse, and power it on.
4. **Initial Setup:** Follow the on-screen Ubuntu setup prompts. Make sure to connect the Jetson to your Wi-Fi network.

## Phase 2: Downloading the Swarmy Codebase

Once the Jetson is booted into the Ubuntu desktop, open a Terminal (`Ctrl + Alt + T`) and run the following commands:

```bash
# 1. Update the base package manager
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Git
sudo apt-get install git -y

# 3. Create the ROS Workspace structure
mkdir -p ~/swarmy_ws/src
cd ~/swarmy_ws/src

# 4. Clone your GitHub Repository
# Note: You will be prompted for your GitHub Username and Personal Access Token (Password)
git clone https://github.com/namanharshwal/swarmy_mopping_robot.git .
```

## Phase 3: Automated Installation

Instead of manually installing ROS, Python libraries, and Node.js servers, you can run the master setup script we created.

```bash
# 1. Make the setup script executable
chmod +x setup_jetson.sh

# 2. Run the script (this will take 15-30 minutes depending on internet speed)
./setup_jetson.sh
```

**What this script does automatically:**
* **System Layer:** Installs `ffmpeg`, `alsa-utils`, `i2c-tools`, and Node.js.
* **ROS Layer:** Installs `ros-melodic-desktop-full`, the ROS Navigation Stack, Gmapping, Map Server, and ROSBridge.
* **Python Layer:** Installs all I2C/Serial hardware libraries (`smbus2`, `pyserial`, `Jetson.GPIO`) and the OLED display libraries (`luma.oled`, `opencv-python`) via `requirements.txt`.
* **Web Dashboard:** Installs all `npm` dependencies for the Backend server and compiles the React Frontend.

## Phase 4: Final Compilation

Once the setup script finishes, you need to compile the ROS workspace to build all the custom Swarmy nodes.

```bash
# 1. Navigate to the root of the workspace
cd ~/swarmy_ws

# 2. Source the ROS environment
source /opt/ros/melodic/setup.bash

# 3. Compile the workspace
catkin_make

# 4. Source the new workspace (add this to ~/.bashrc for future ease)
source devel/setup.bash
echo "source ~/swarmy_ws/devel/setup.bash" >> ~/.bashrc
```

## Phase 5: Running the Robot

Your Jetson is now fully restored! To start the robot, launch the main web server backend:

```bash
cd ~/swarmy_ws/src/swarmy_web_backend
node server.js
```
*The web server will automatically host the React dashboard on port `8080` and handle the TTS Voice Engine, Battery Monitoring, and ROS Bridge connections.*

---
### System Architecture Overview (For Reference)
* **Frontend:** React + Vite (Served via Express from `swarmy_web_backend/server.js`)
* **Backend:** Node.js (Handles AI Chat APIs, ElevenLabs, Google TTS, System Volume, Map Saving)
* **Audio Engine:** `ffmpeg` with custom `atempo`, `asetrate`, and `flanger` filters for Jarvis/Ultron voices.
* **Display Engine:** `luma.oled` running on I2C (Jetson GPIO pins).
* **Hardware:** `rosserial` communicating with Arduino motor controllers via USB (`pyserial`).
