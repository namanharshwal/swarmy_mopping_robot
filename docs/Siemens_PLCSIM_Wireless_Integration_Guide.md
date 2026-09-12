# Wireless Integration Guide: Siemens PLCSIM Advanced to ROS-based AMR

This document details the complete process for securely connecting a simulated Siemens PLC to a ROS-based Autonomous Mobile Robot (Swarmy) over a wireless network using KEPServerEX.

## 1. Network Architecture & IP Addressing
* **Simulated PLC (TIA Portal / PLCSIM Advanced):** `192.168.0.1`
* **Windows PC Virtual Ethernet (Siemens PLCSIM Adapter):** `192.168.0.100`
* **Windows PC Wi-Fi Adapter (Wireless LAN):** `192.168.137.155`
* **Jetson AMR (Wi-Fi):** Must be connected to the same wireless network (the `192.168.137.x` subnet).

**Data Flow:**
`PLCSIM Advanced (192.168.0.1)` <--> `KEPServerEX (Siemens TCP/IP Driver)` <--> `KEPServerEX OPC UA Server (192.168.137.155)` <--> `Wi-Fi` <--> `Jetson AMR (Python OPC UA Client)`

---

## 2. Windows PC & KEPServerEX Setup

### A. Connecting Kepware to PLCSIM
1. Open the main **KEPServerEX Configuration** window.
2. Create a **Siemens TCP/IP Ethernet** channel.
3. Create a Device and set its Device ID to the PLC IP: `192.168.0.1`.
4. Create your tags mapping to DB1:
   * `StartNAV` (Boolean)
   * `StartPoint` (Integer)

### B. Configuring the OPC UA Server for Wireless Access
1. Right-click the KEPServerEX icon in the Windows system tray and select **OPC UA Configuration**.
2. Go to the **Server Endpoints** tab.
3. Find the endpoint associated with your Wi-Fi adapter: `opc.tcp://192.168.137.155:49320` and ensure the checkbox next to it is enabled.
4. Select it and click **Edit**.
5. Under **Security Policies**, check **Basic256Sha256** (industry standard encryption) and uncheck **None**.
6. Click **OK** and close the manager.

### C. Setting up Authentication (Username/Password)
1. In the main KEPServerEX Configuration window, right-click **Project** (top left) -> **Properties** -> **OPC UA**.
2. Set **Allow anonymous login** to **No**.
3. In the top menu, click **Settings** -> **User Manager**.
4. Add a new user (e.g., Username: `robot_user`, Password: `securepassword123`) and assign them to the Default Users or Administrators group.
5. Click **Runtime** -> **Reinitialize** to apply all security settings.

---

## 3. Jetson AMR Setup (ROS Node)

### A. Generate Security Certificates
On the Jetson AMR, open a terminal in your ROS workspace and generate a security certificate for the client:
```bash
openssl req -x509 -newkey rsa:2048 -keyout client_key.pem -out client_cert.der -outform der -nodes -days 3650 -subj "/O=Swarmy/CN=SwarmyROSClient"
```
*(This generates `client_key.pem` and `client_cert.der` in your current folder)*

### B. Install Python Dependencies
```bash
pip3 install asyncua
```

### C. Run the ROS Python Node
The client script (`kepware_bridge.py`) is already implemented in `swarmy_navigation/scripts/kepware_bridge.py`. Make sure it's executable:
```bash
chmod +x ~/swarmy_ws/src/swarmy_navigation/scripts/kepware_bridge.py
```

---

## 4. The Certificate Trust Handshake (First Run Only)
Because the robot is using a new security certificate, Kepware will reject the connection the very first time. You must tell Windows to trust the robot.

1. Run the Python script on the Jetson: `rosrun swarmy_navigation kepware_bridge.py`
2. It will crash with a security/certificate error. **This is expected.**
3. On the Windows PC, open the **OPC UA Configuration Manager** from the system tray.
4. Go to the **Trusted Clients** tab.
5. You will see `SwarmyROSClient` with a red "X" next to it. Click it, then click the **Trust** button at the bottom of the window to turn it into a green checkmark.
6. In the main KEPServerEX window, click **Runtime** -> **Reinitialize**.

## 5. Final Operation
Everything is now fully configured!
Run the Python script on the Jetson again. It will connect wirelessly to `192.168.137.155:49320`, authenticate using your password, encrypt the traffic using the certificates, and continuously monitor the PLC DB1 tags to trigger ROS navigation.
