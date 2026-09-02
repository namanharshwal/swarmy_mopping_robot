# Swarmy Robot - Complete Jetson Rebuild Guide

This guide explains how to completely rebuild the Swarmy Robot's software stack from scratch on a brand new NVIDIA Jetson Nano mounted on the **Tanna TechBiz Eagle-101 Carrier Board**. Because we have automated the installation process, you do **not** need a 16GB disk image backup.

## Phase 1: Flashing the Jetson OS (Tanna TechBiz Eagle-101 Method)

*Source: [Tanna TechBiz Official Guide](https://tannatechbiz.com/blog/post/how-to-flash-jetpack-bsp-on-tanna-techbiz-eagle-101-for-nvidia-jetson-nano)*

**Prerequisites:**
* Linux Host Computer running Ubuntu 18.04 OS (No virtual machines!).
* USB Type-B to USB Type-A data cable.

### Part A: Enter Force Recovery Mode
1. Ensure the Tanna TechBiz Eagle-101 is completely powered off.
2. Use a jumper to connect the **FC REC (pin 3)** and the **GND (pin 4)** on the Button Header.
3. Power up the Eagle-101 via the Type-B cable connected to your Linux Host PC.
4. On your Host PC, open a terminal and run `lsusb`. You should see `ID 0955:7f21 NVidia Corp.` verifying it is in recovery mode.

### Part B: Download JetPack 4.6.5 (L4T 32.7.5) Packages
Download these four files on your Host PC into a new folder:
1. `Jetson-210_Linux_R32.7.5_aarch64.tbz2` (Driver Package BSP)
2. `Tegra_Linux_Sample-Root-Filesystem_R32.7.5_aarch64.tbz2` (Root Filesystem)
3. `overlay_32.7.5_PCN211181.tbz2` (Tanna TechBiz Overlay)
4. `tegra210-p3448-0002-p3449-0000-b00.dtb` (Tanna TechBiz Device Tree)

### Part C: Unzip, Assemble, and Flash
Open a terminal inside the folder where you downloaded the four files on your Host PC and run:

```bash
# Extract base package
tar xf Jetson-210_Linux_R32.7.5_aarch64.tbz2

# Extract RootFS
cd Linux_for_Tegra/rootfs
sudo tar xpf ../../Tegra_Linux_Sample-Root-Filesystem_R32.7.5_aarch64.tbz2

# Apply Binaries
cd ../
sudo ./apply_binaries.sh

# Apply Tanna TechBiz Overlays
cd ../
tar xpf overlay_32.7.5_PCN211181.tbz2
cp tegra210-p3448-0002-p3449-0000-b00.dtb Linux_for_Tegra/kernel/dtb/

# Flash the Board
cd Linux_for_Tegra/
sudo ./flash.sh jetson-nano-devkit-emmc mmcblk0p1
```
*Wait ~10 minutes for flashing to finish. Once done, unplug the jumper from pins 3 and 4, connect your mouse/keyboard/monitor, and power on the Eagle-101 normally to complete the Ubuntu GUI setup.*

---

## Phase 2: Downloading the Swarmy Codebase

Once the Jetson is booted into the Ubuntu desktop, connect it to Wi-Fi, open a Terminal (`Ctrl + Alt + T`), and run:

```bash
# 1. Update the base package manager
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Git
sudo apt-get install git -y

# 3. Create the ROS Workspace structure
mkdir -p ~/swarmy_ws/src
cd ~/swarmy_ws/src

# 4. Clone your GitHub Repository
# Note: You will be prompted for your GitHub Username and Personal Access Token
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
* **ROS Layer:** Installs `ros-melodic-desktop-full`, Navigation, Gmapping, Map Server, and ROSBridge.
* **Python Layer:** Installs all I2C/Serial hardware libraries (`smbus2`, `pyserial`, `Jetson.GPIO`) and the OLED display libraries (`luma.oled`) for both Python 2 and Python 3.
* **Web Dashboard:** Installs all `npm` dependencies for the Backend and compiles the React Frontend.

## Phase 4: Final Compilation

Once the setup script finishes, compile the ROS workspace to build all the custom Swarmy nodes.

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
