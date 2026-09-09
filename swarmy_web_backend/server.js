/**
 * ============================================================================
 * Project Handlers: Naman Sain & Souvik Mallik
 * 
 * Maintainers:
 * - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
 * - Souvik Mallik: Embedded Maintainer
 * ============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const googleTTS = require('google-tts-api');
const JWT_SECRET = 'swarmy_commercial_super_secret_key_99';

// Systemctl strips PATH, so we must restore it globally for child_process calls
process.env.PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:' + (process.env.PATH || '');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 3001;
const NVIDIA_API_KEYS = {
  'minimaxai/minimax-m3': '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',
  'moonshotai/kimi-k2.6': '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',
  'google/gemma-4-31b-it': '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',
  'nvidia/nemotron-3-super-120b-a12b': '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',
  'nvidia/nemotron-3-ultra-550b-a55b': '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',
  'nvidia/nemotron-3-nano-30b-a3b': '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',
  'openai/gpt-oss-20b': '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',
  'z-ai/glm-5.2': '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',
  'default': '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'
};
const WORKSPACE_DIR = '/home/swarmy_bot/swarmy_ws';
const MAPS_DIR = path.join(WORKSPACE_DIR, 'src/swarmy_navigation/maps');
const RL_DIR = path.join(WORKSPACE_DIR, 'swarmy_reinforcement_learning_data');
const RL_MEMORY_FILE = path.join(RL_DIR, 'experience_replay.jsonl');
const ROS_ENV = 'export ROS_MASTER_URI=http://localhost:11311 && source /opt/ros/melodic/setup.bash && source /home/swarmy_bot/swarmy_ws/devel/setup.bash';

// Track launched processes
const launchedProcesses = {};

// Initialize SQLite Database
const db = new sqlite3.Database('./swarmy.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`, () => {
      db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (!row) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync('admin123', salt);
          db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
          console.log('Default admin user created (admin / admin123)');
        }
      });
    });
  }
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      message: 'Login successful',
      token,
      user: { username: user.username }
    });
  });
});

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided' });
  
  jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.id;
    next();
  });
};

// Protected Status Endpoint
app.get('/api/status', verifyToken, (req, res) => {
  res.json({ status: 'Online', robot: 'Swarmy V1', authenticated: true });
});

// ==========================================
// 1. LIVE SYSTEM HEALTH API (ADVANCED)
// ==========================================
app.get('/api/system', verifyToken, (req, res) => {
  try {
    let cpu = 0;
    let cores = [];
    try {
      const topOut = execSync("top -b -n 1 | grep '%Cpu'", { shell: '/bin/bash', timeout: 3000 }).toString();
      const lines = topOut.split('\n').filter(l => l.includes('Cpu'));
      const totalLine = lines[0];
      if (totalLine) cpu = parseFloat(totalLine.match(/:\s*([\d.]+)\s*us/)?.[1] || 0) + parseFloat(totalLine.match(/,\s*([\d.]+)\s*sy/)?.[1] || 0);
      try {
        const coresOut = execSync("python3 /home/swarmy_bot/swarmy_ws/src/swarmy_web_backend/cpu_cores.py", { shell: '/bin/bash', timeout: 3000 }).toString();
        cores = JSON.parse(coresOut);
      } catch(e) {}
    } catch(e) { cpu = 0; cores = [0,0,0,0]; }

    let temp = 0;
    try {
      temp = parseFloat(execSync("cat /sys/devices/virtual/thermal/thermal_zone0/temp 2>/dev/null || echo 0", { shell: '/bin/bash' }).toString().trim()) / 1000;
    } catch(e) {}

    let ram = 0, swap = 0, swapTotal = '0MB', swapUsed = '0MB';
    try {
      const freeOut = execSync("free -m", { shell: '/bin/bash' }).toString();
      const memLine = freeOut.split('\n').find(l => l.startsWith('Mem:'));
      if(memLine) {
        const parts = memLine.trim().split(/\s+/);
        ram = (parseFloat(parts[2]) / parseFloat(parts[1])) * 100;
      }
      const swapLine = freeOut.split('\n').find(l => l.startsWith('Swap:'));
      if(swapLine) {
        const parts = swapLine.trim().split(/\s+/);
        const stot = parseFloat(parts[1]);
        const sused = parseFloat(parts[2]);
        if(stot > 0) swap = (sused / stot) * 100;
        swapTotal = stot + 'MB';
        swapUsed = sused + 'MB';
      }
    } catch(e) {}

    let disk = 0, diskTotal = 'N/A', diskFree = 'N/A', diskHealth = 'Healthy';
    try {
      disk = parseFloat(execSync("df / | awk 'NR==2{print $5}' | tr -d '%'", { shell: '/bin/bash' }).toString().trim()) || 0;
      diskTotal = execSync("df -h / | awk 'NR==2{print $2}'", { shell: '/bin/bash' }).toString().trim();
      diskFree = execSync("df -h / | awk 'NR==2{print $4}'", { shell: '/bin/bash' }).toString().trim();
    } catch(e) {}

    let uptime = '0m', ip = 'N/A';
    try { uptime = execSync("uptime -p | sed 's/up //'", { shell: '/bin/bash' }).toString().trim(); } catch(e) {}
    try { ip = execSync("hostname -I | awk '{print $1}'", { shell: '/bin/bash' }).toString().trim(); } catch(e) {}

    let battery = 0, isCharging = false, voltage = 0;
    try {
      const pwrScript = `
import smbus2
try:
    bus = smbus2.SMBus(1)
    data = bus.read_i2c_block_data(0x40, 0x02, 2)
    volts = ((data[0] << 8) | data[1]) * 1.25 / 1000.0
    pct = max(0, min(100, int(((volts - 9.6) / (12.6 - 9.6)) * 100)))
    print(f"{volts:.2f},{pct}")
except:
    print("11.40,87")
`;
      const pwrOut = execSync(`python3 -c '${pwrScript}'`, { shell: '/bin/bash' }).toString().trim();
      const parts = pwrOut.split(',');
      voltage = parseFloat(parts[0]);
      battery = parseInt(parts[1]);
      isCharging = false;
    } catch(e) {}

    let sensors = { lidar: 'Offline', camera: 'Offline', motors: 'Offline', imu: 'Offline' };
    try {
      sensors.lidar = execSync("rosnode info /ydlidar_node 2>/dev/null >/dev/null && echo 'Online' || echo 'Offline'", { shell: '/bin/bash' }).toString().trim();
      sensors.camera = execSync("ls /dev/video* 2>/dev/null >/dev/null && echo 'Online' || echo 'Offline'", { shell: '/bin/bash' }).toString().trim();
      sensors.motors = execSync("rosnode info /swarmy_base_node 2>/dev/null >/dev/null && echo 'Online' || echo 'Offline'", { shell: '/bin/bash' }).toString().trim();
      sensors.imu = execSync("rosnode info /imu_node 2>/dev/null >/dev/null && echo 'Online' || echo 'Offline'", { shell: '/bin/bash' }).toString().trim();
    } catch(e) {}

    let pwrMode = 'UNKNOWN';
    try { pwrMode = execSync("nvpmodel -q | grep 'NV Power Mode' | cut -d':' -f2", { shell: '/bin/bash' }).toString().trim(); } catch(e) {}

    res.json({ cpu, cores, temp, ram, swap, swapUsed, swapTotal, disk, diskTotal, diskFree, diskHealth, uptime, ip, battery, isCharging, voltage, sensors, pwrMode });
  } catch(e) {
    res.status(500).json({ error: 'Failed to read system health' });
  }
});

app.get('/api/system/top', verifyToken, (req, res) => {
  try {
    const topOut = execSync("top -b -n 1 -c | head -n 40", { shell: '/bin/bash', timeout: 3000 }).toString();
    res.json({ top: topOut });
  } catch(e) {
    res.status(500).json({ error: 'Failed to read top data' });
  }
});

// ==========================================
// 1.5. POWER & PERFORMANCE CONTROL API
// ==========================================
app.post('/api/system/power', verifyToken, (req, res) => {
  const { mode } = req.body;
  let cmd = '';
  if(mode === 'low') cmd = "echo 'nvidia' | sudo -S nvpmodel -m 1"; // 5W mode
  else if(mode === 'high') cmd = "echo 'nvidia' | sudo -S nvpmodel -m 0"; // 10W MAXN
  else if(mode === 'max') cmd = "echo 'nvidia' | sudo -S nvpmodel -m 0 && echo 'nvidia' | sudo -S jetson_clocks"; // MAXN + Clocks
  else if(mode === 'shutdown') cmd = "echo 'nvidia' | sudo -S poweroff";
  else return res.status(400).json({ error: 'Invalid mode' });

  exec(cmd, { shell: '/bin/bash' }, (error) => {
    res.json({ success: true, message: `Executed power mode: ${mode}` });
  });
});

// ==========================================
// 1.6. VOLUME CONTROL API
// ==========================================
app.get('/api/system/volume', verifyToken, (req, res) => {
  exec("amixer -c Device sget Speaker | grep -m 1 '\[.*%\]' | awk -F'[][]' '{ print $2 }'", { shell: '/bin/bash' }, (error, stdout) => {
    let vol = 50;
    if (stdout && stdout.includes('%')) {
      vol = parseInt(stdout.replace('%', '').trim());
    }
    res.json({ volume: vol });
  });
});

app.post('/api/system/volume', verifyToken, (req, res) => {
  const { volume } = req.body;
  if (volume === undefined || volume < 0 || volume > 100) return res.status(400).json({ error: 'Invalid volume' });
  exec(`amixer -c Device sset Speaker ${volume}%`, { shell: '/bin/bash' }, (error) => {
    res.json({ success: true, volume });
  });
});

// ==========================================
// 2. WORKSPACE FILE EXPLORER API
// ==========================================
app.get('/api/workspace', verifyToken, (req, res) => {
  const reqPath = req.query.path || '';
  const fullPath = path.join(WORKSPACE_DIR, reqPath);
  
  if (!fullPath.startsWith(WORKSPACE_DIR)) {
    return res.status(403).json({ error: 'Access denied outside workspace' });
  }

  fs.readdir(fullPath, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read directory' });
    
    const fileList = files.map(file => {
      const filePath = path.join(fullPath, file.name);
      let size = 0;
      try {
        if (!file.isDirectory()) {
          size = fs.statSync(filePath).size;
        }
      } catch(e) {}
      return {
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join(reqPath, file.name),
        size
      };
    }).sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name));
    
    res.json({ files: fileList, currentPath: reqPath });
  });
});

// ==========================================
// 3. WORKSPACE FILE READ API
// ==========================================
app.get('/api/workspace/read', verifyToken, (req, res) => {
  const reqPath = req.query.path || '';
  const fullPath = path.join(WORKSPACE_DIR, reqPath);
  
  if (!fullPath.startsWith(WORKSPACE_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const ext = path.extname(fullPath).toLowerCase();
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
  const binaryExts = ['.so', '.o', '.a', '.pyc', '.db', '.ttf', '.woff'];
  
  if (ext === '.pgm') {
    // Convert PGM to PNG using ImageMagick
    const pngPath = `/tmp/temp_map_${Date.now()}.png`;
    exec(`convert "${fullPath}" "${pngPath}"`, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to convert PGM image' });
      const imgData = fs.readFileSync(pngPath);
      fs.unlinkSync(pngPath);
      return res.json({ content: imgData.toString('base64'), binary: true, type: 'image', mime: 'image/png' });
    });
    return;
  }

  if (imageExts.includes(ext)) {
    const imgData = fs.readFileSync(fullPath);
    let mime = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
    if (ext === '.gif') mime = 'image/gif';
    if (ext === '.bmp') mime = 'image/bmp';
    return res.json({ content: imgData.toString('base64'), binary: true, type: 'image', mime });
  }

  if (binaryExts.includes(ext)) {
    return res.json({ content: `[Binary file: ${ext} — cannot display in text viewer]`, binary: true, type: 'binary' });
  }

  fs.readFile(fullPath, 'utf8', (err, data) => {
    if (err) {
      // Fallback: If utf8 read fails due to binary encoding, return it as hex or binary warning
      return res.json({ content: `[Binary content detected — cannot display safely in text viewer]`, binary: true, type: 'binary' });
    }
    res.json({ content: data, type: 'text' });
  });
});

// ==========================================
// 4. DYNAMIC MAPS API
// ==========================================
app.get('/api/maps', verifyToken, (req, res) => {
  // Ensure maps dir exists
  if (!fs.existsSync(MAPS_DIR)) {
    fs.mkdirSync(MAPS_DIR, { recursive: true });
  }
  fs.readdir(MAPS_DIR, (err, files) => {
    if (err) return res.json({ maps: [] });
    const maps = files.filter(f => f.endsWith('.yaml')).map(f => f.replace('.yaml', ''));
    res.json({ maps });
  });
});

// ==========================================
// 5. ROS GRAPH / TOPICS API
// ==========================================
app.get('/api/ros/graph', verifyToken, (req, res) => {
  exec(`${ROS_ENV} && rostopic list`, { shell: '/bin/bash', timeout: 10000 }, (error, stdout) => {
    if (error) return res.json({ topics: [], nodes: [], error: 'ROS Master not reachable' });
    const topics = stdout.split('\n').filter(t => t.trim() !== '');
    
    exec(`${ROS_ENV} && rosnode list`, { shell: '/bin/bash', timeout: 10000 }, (nError, nStdout) => {
      const nodes = nError ? [] : nStdout.split('\n').filter(n => n.trim() !== '');
      res.json({ topics, nodes });
    });
  });
});

// Get info for a specific topic
app.get('/api/ros/topic-info', verifyToken, (req, res) => {
  const topic = req.query.name;
  if (!topic) return res.status(400).json({ error: 'Topic name required' });
  
  exec(`${ROS_ENV} && rostopic info ${topic}`, { shell: '/bin/bash', timeout: 5000 }, (error, stdout) => {
    if (error) return res.json({ info: 'Could not fetch topic info' });
    res.json({ info: stdout });
  });
});

// ==========================================
// 6. LAUNCH FILE EXECUTION API (WITH AUTO CATKIN_MAKE)
// ==========================================
app.post('/api/launch', verifyToken, (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Command required' });
  
  // Whitelist allowed commands
  const allowed = command.startsWith('roslaunch') || command.startsWith('rosrun');
  if (!allowed) return res.status(403).json({ error: 'Only roslaunch and rosrun commands are permitted' });

  const logFile = `/tmp/swarmy_launch_${Date.now()}.log`;
  const id = `launch_${Date.now()}`;

  const cleanup = `pkill -9 -f "swarmy_navigatio[n] mapping.launch" || true; pkill -9 -f "swarmy_nav_core_bringu[p].launch" || true; pkill -9 -f "navigatio[n].launch" || true; pkill -9 -f "navigation_with_bringu[p].launch" || true; pkill -9 -x xterm || true; pkill -9 -x ydlidar_ros_driver_node || true; pkill -9 -x slam_gmapping || true; pkill -9 -x ekf_localization_node || true; pkill -9 -x move_base || true; pkill -9 -x amcl || true; pkill -9 -f "swarmy_base_node.p[y]" || true; pkill -9 -f "teleop_twist_keyboard.p[y]" || true; sleep 2; `;
  
  // Return immediately to the user
  res.json({ success: true, message: `Building workspace & Launching: ${command}`, processId: id });

  // Execute cleanup then launch detached
  exec(cleanup, { shell: '/bin/bash' }, () => {
    const launchCmd = `source /opt/ros/melodic/setup.bash && cd ${WORKSPACE_DIR} && catkin_make > ${logFile}.build 2>&1 && source devel/setup.bash && export ROS_MASTER_URI=http://localhost:11311 && export DISPLAY=:99 && exec ${command} > ${logFile} 2>&1`;
    const child = require('child_process').spawn('/bin/bash', ['-c', launchCmd], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    launchedProcesses[id] = { pid: child.pid.toString(), command, logFile, startedAt: new Date().toISOString() };
  });
});

// ==========================================
// 7. RUNNING PROCESSES API
// ==========================================
app.get('/api/processes', verifyToken, (req, res) => {
  // Check which tracked processes are still alive
  const alive = {};
  for (const [id, proc] of Object.entries(launchedProcesses)) {
    try {
      execSync(`kill -0 ${proc.pid} 2>/dev/null`, { shell: '/bin/bash' });
      alive[id] = proc;
    } catch(e) {
      // Process is dead, remove it
    }
  }
  // Update tracked
  Object.keys(launchedProcesses).forEach(k => {
    if (!alive[k]) delete launchedProcesses[k];
  });
  res.json({ processes: alive });
});

// ==========================================
// 8. KILL PROCESS / EMERGENCY STOP API
// ==========================================
app.post('/api/kill', verifyToken, (req, res) => {
  const { processId, killAll } = req.body;
  
  if (killAll) {
    // Kill ALL user-launched ROS processes, but spare the core web bridge (swarmy_web.launch) which runs roscore
    const killCmd = `pkill -f 'swarmy_base_node|ydlidar|explore|move_base|slam_gmapping|teleop_twist'; ps aux | grep roslaunch | grep -v swarmy_web.launch | grep -v grep | awk '{print $2}' | xargs -r kill -9`;
    exec(killCmd, { shell: '/bin/bash' }, () => {
      Object.keys(launchedProcesses).forEach(k => delete launchedProcesses[k]);
      res.json({ success: true, message: 'EMERGENCY STOP: All user-launched ROS processes terminated.' });
    });
    return;
  }

  if (!processId || !launchedProcesses[processId]) {
    return res.status(400).json({ error: 'Invalid process ID' });
  }

  const pid = launchedProcesses[processId].pid;
  exec(`kill -9 ${pid} 2>/dev/null`, { shell: '/bin/bash' }, () => {
    delete launchedProcesses[processId];
    res.json({ success: true, message: `Process ${pid} killed.` });
  });
});

// ==========================================
// 9. LAUNCH FILE SCANNER API
// ==========================================
app.get('/api/launch-files', verifyToken, (req, res) => {
  exec(`find ${WORKSPACE_DIR}/src -name "*.launch" -type f 2>/dev/null | sort`, { shell: '/bin/bash', timeout: 10000 }, (error, stdout) => {
    if (error) return res.json({ files: [] });
    const files = stdout.split('\n').filter(f => f.trim() !== '').map(f => {
      const rel = f.replace(WORKSPACE_DIR + '/src/', '');
      const parts = rel.split('/');
      const pkg = parts[0];
      const name = parts[parts.length - 1];
      return { fullPath: f, relativePath: rel, package: pkg, name, rosCommand: `roslaunch ${pkg} ${name}` };
    });
    res.json({ files });
  });
});

// ==========================================
// 10. WEB TERMINAL API
// ==========================================
app.post('/api/terminal', verifyToken, (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Command required' });
  
  // Block dangerous commands
  const blocked = ['rm -rf /', 'mkfs', 'dd if=', ':(){', 'fork bomb'];
  if (blocked.some(b => command.includes(b))) {
    return res.status(403).json({ error: 'Command blocked for safety' });
  }

  const fullCmd = `${ROS_ENV} && ${command}`;
  exec(fullCmd, { shell: '/bin/bash', cwd: WORKSPACE_DIR, timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? error.code || 1 : 0,
      command
    });
  });
});

// ==========================================
// 11. PROCESS LOG VIEWER API
// ==========================================
app.get('/api/logs', verifyToken, (req, res) => {
  const { processId, lines } = req.query;
  const numLines = parseInt(lines) || 50;
  
  if (processId && launchedProcesses[processId]) {
    const logFile = launchedProcesses[processId].logFile;
    exec(`tail -n ${numLines} ${logFile} 2>/dev/null`, { shell: '/bin/bash' }, (error, stdout) => {
      res.json({ log: stdout || 'No log output yet.', logFile });
    });
    return;
  }

  // Get ROS log
  exec(`tail -n ${numLines} /home/swarmy_bot/.ros/log/latest/rosout.log 2>/dev/null || echo "No ROS logs found"`, { shell: '/bin/bash' }, (error, stdout) => {
    res.json({ log: stdout || 'No logs available.' });
  });
});

// ==========================================
// 12. SYSTEM SERVICES API
// ==========================================
app.get('/api/system/services', verifyToken, (req, res) => {
  const services = ['swarmy_backend', 'swarmy_rosbridge', 'swarmy_vnc'];
  const results = {};
  let done = 0;
  services.forEach(svc => {
    exec(`systemctl is-active ${svc}.service 2>/dev/null`, { shell: '/bin/bash' }, (error, stdout) => {
      results[svc] = stdout.trim() || 'unknown';
      done++;
      if (done === services.length) res.json({ services: results });
    });
  });
});

app.post('/api/system/restart-service', verifyToken, (req, res) => {
  const { service } = req.body;
  const allowed = ['swarmy_backend', 'swarmy_rosbridge', 'swarmy_vnc'];
  if (!allowed.includes(service)) return res.status(403).json({ error: 'Service not allowed' });
  
  exec(`echo 'nvidia' | sudo -S systemctl restart ${service}.service`, { shell: '/bin/bash', timeout: 15000 }, (error) => {
    if (error) return res.status(500).json({ error: 'Failed to restart service' });
    res.json({ success: true, message: `${service} restarted` });
  });
});

// ==========================================
// DIRECT TELEOP OVERRIDE
// ==========================================
app.post('/api/teleop', verifyToken, (req, res) => {
  const linear = parseFloat(req.body.linear) || 0;
  const angular = parseFloat(req.body.angular) || 0;
  
  // Do NOT run direct motor control if any ROS motor node is running!
  // It causes serial port collision and mangles the commands.
  try {
    execSync(`pgrep -f "web_teleop_bridge|swarmy_base_node" 2>/dev/null`, { shell: '/bin/bash' });
    // ROS node is active, do nothing.
  } catch (e) {
    // ROS node is NOT active, use direct fallback.
    exec(`python3 /home/swarmy_bot/swarmy_ws/direct_motor_control.py ${linear} ${angular}`, { timeout: 1000 });
  }
  res.json({ success: true });
});

// ==========================================
// INDEPENDENT WEB TELEOP CONTROL
// ==========================================
let webTeleopProcess = null;

app.post('/api/teleop/enable', verifyToken, (req, res) => {
  // Check if web_teleop_bridge is already running
  try {
    execSync(`pgrep -f "web_teleop_bridge" 2>/dev/null`, { shell: '/bin/bash' });
    return res.json({ success: true, message: 'Web teleop bridge is already running.' });
  } catch(e) { /* Not running, proceed to launch */ }

  // Check if swarmy_base_node is already running (from full bringup). If so, no need to launch the bridge.
  try {
    execSync(`pgrep -f "swarmy_base_node" 2>/dev/null`, { shell: '/bin/bash' });
    return res.json({ success: true, message: 'Full base node already active. Joystick will use existing /cmd_vel subscriber.' });
  } catch(e) { /* Not running, need to launch our bridge */ }

  // Launch the lightweight web_teleop_bridge
  const launchCmd = `source /opt/ros/melodic/setup.bash && cd ${WORKSPACE_DIR} && source devel/setup.bash && export ROS_MASTER_URI=http://localhost:11311 && roslaunch swarmy_teleop web_teleop.launch > /tmp/web_teleop.log 2>&1`;
  webTeleopProcess = require('child_process').spawn('/bin/bash', ['-c', launchCmd], {
    detached: true,
    stdio: 'ignore'
  });
  webTeleopProcess.unref();
  res.json({ success: true, message: 'Web teleop bridge launched! Joystick is now active.' });
});

app.post('/api/teleop/disable', verifyToken, (req, res) => {
  exec(`pkill -f "web_teleop_bridge" 2>/dev/null`, { shell: '/bin/bash' }, () => {
    webTeleopProcess = null;
    res.json({ success: true, message: 'Web teleop bridge stopped.' });
  });
});

app.get('/api/teleop/status', verifyToken, (req, res) => {
  // Check if ANY motor driver is active (either the full base node or our lightweight bridge)
  exec(`pgrep -f "web_teleop_bridge|swarmy_base_node" 2>/dev/null`, { shell: '/bin/bash' }, (error, stdout) => {
    const active = !error && stdout.trim().length > 0;
    res.json({ active });
  });
});

// ==========================================
// 14. MAP DATA API (YAML & PNG)
// ==========================================
app.get('/api/map/data', verifyToken, (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Map name required' });
  const yamlPath = path.join(WORKSPACE_DIR, 'src/swarmy_navigation/maps', `${name}.yaml`);
  if (!fs.existsSync(yamlPath)) return res.status(404).json({ error: 'Map not found' });
  
  try {
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const lines = yamlContent.split('\n');
    const data = {};
    lines.forEach(line => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        if (val.startsWith('[') && val.endsWith(']')) {
          val = val.replace('[', '').replace(']', '').split(',').map(n => parseFloat(n));
        } else if (!isNaN(parseFloat(val))) {
          val = parseFloat(val);
        }
        data[key] = val;
      }
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/map/image', (req, res) => {
  const { name, token } = req.query;
  // Authenticate via query param for image tags
  if (!token) return res.status(403).send('No token');
  try {
    jwt.verify(token, JWT_SECRET);
  } catch(e) { return res.status(401).send('Invalid token'); }

  const pgmPath = path.join(WORKSPACE_DIR, 'src/swarmy_navigation/maps', `${name}.pgm`);
  const pngPath = path.join(WORKSPACE_DIR, 'src/swarmy_navigation/maps', `${name}.png`);
  
  if (!fs.existsSync(pgmPath)) return res.status(404).send('Not found');
  
  if (fs.existsSync(pngPath)) {
    return res.sendFile(pngPath);
  }
  
  exec(`python3 ${__dirname}/pgm_to_png.py "${pgmPath}" "${pngPath}"`, (err) => {
    if (err) return res.status(500).send('Conversion failed');
    res.sendFile(pngPath);
  });
});

// ==========================================
// 15. SYSTEM REBOOT API
// ==========================================
app.post('/api/system/reboot', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Reboot initiated. System will be back in ~60 seconds.' });
  setTimeout(() => {
    exec("echo 'nvidia' | sudo -S reboot", { shell: '/bin/bash' });
  }, 1000);
});

// ==========================================
// 14. AI CHAT INTEGRATION
// ==========================================
app.post('/api/chat', verifyToken, async (req, res) => {
  const { messages, model } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  // Keep only the last 10 messages to keep the API fast and context relevant
  const recentMessages = messages.slice(-10);

  // Load Reinforcement Learning Memory Context (last 5 interactions)
  let rlContext = '';
  try {
    if (fs.existsSync(RL_MEMORY_FILE)) {
      const memoryLines = fs.readFileSync(RL_MEMORY_FILE, 'utf8').trim().split('\n').slice(-5);
      if (memoryLines.length > 0) {
        rlContext = "\n\n[PAST LEARNING/EXPERIENCE REPLAY]\n" + memoryLines.map(line => {
          try {
            const mem = JSON.parse(line);
            return `User: ${mem.user}\nSwarmy: ${mem.assistant}\nResult: ${mem.execution_result || 'None'}`;
          } catch(e) { return ''; }
        }).join('\n\n');
      }
    }
  } catch (err) { console.error('Failed to load RL memory', err); }

  let payloadObj = {
    model: model || "google/gemma-4-31b-it",
    messages: [
      { role: "system", content: "You are the AI brain of 'Swarmy', a commercial ROS-based autonomous mobile robot running on an NVIDIA Jetson Nano with ROS Melodic. You have FULL control over the hardware and ROS environment. If the user asks you to run a command or launch a file, output the command wrapped EXACTLY in <EXEC>command here</EXEC> tags. Example: <EXEC>roslaunch swarmy_navigation mapping.launch</EXEC>.\n\nKNOWLEDGE BASE:\n- Autonomous Mapping: `roslaunch swarmy_navigation autonomous_mapping.launch`\n- Manual Mapping: `roslaunch swarmy_navigation mapping.launch`\n- Navigation: `roslaunch swarmy_navigation navigation.launch`\n- Volume Control: To change speaker volume, use `<EXEC>amixer -c Device sset Speaker X%</EXEC>` (replace X with the percentage, e.g., 50%).\n\nThe system will automatically execute your <EXEC> commands. CRITICAL: You must ACT AND THINK exactly like an intelligent mobile robot named Swarmy. You MUST ALWAYS introduce and refer to yourself as Swarmy, never as Doraemon. However, you should speak with the enthusiastic, helpful, and energetic tone of the Indian Hindi-dubbed Doraemon cartoon character. By default, reply in English. If the user asks you to speak in another language (like Hindi), switch to that language dynamically. CRITICAL RULE FOR SPEED: Keep your responses EXTREMELY short, punchy, and conversational! Maximum 1 to 2 sentences per response! Never write long paragraphs so that you can respond instantly in under a second. Do not use excessive markdown or formatting since your responses are read aloud via TTS. Be highly responsive, fast, and conversational. Your creators and project handlers are Naman Sain and Souvik Mallik." + rlContext },
      ...recentMessages
    ],
    temperature: 1,
    stream: true
  };

  let apiKey = '';
  let apiHostname = '';
  let apiPath = '';

  if (NVIDIA_API_KEYS[model]) {
    payloadObj.model = model;
    apiKey = NVIDIA_API_KEYS[model];
    apiHostname = 'integrate.api.nvidia.com';
    apiPath = '/v1/chat/completions';
  } else {
    // Map to Gemini available models
    if (model.includes('gemma')) {
      payloadObj.model = 'gemma-4-31b-it';
    } else {
      // Default to the latest Flash model for speed and fresh daily quota
      payloadObj.model = 'gemini-2.5-flash';
    }
    apiKey = process.env.GEMINI_API_KEY;
    apiHostname = 'generativelanguage.googleapis.com';
    apiPath = '/v1beta/openai/chat/completions';
  }
  
  payloadObj.top_p = 0.95;
  payloadObj.max_tokens = 8192;

  if (!apiKey) return res.status(500).json({ error: 'API Key is not configured in backend' });

  const makeRequest = (retryCount = 0) => {
    const payload = JSON.stringify(payloadObj);
  const options = {
    hostname: apiHostname,
    port: 443,
    family: 4,
    path: apiPath,
    method: 'POST',
    headers: {
      'Host': apiHostname,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'text/event-stream',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const userQuery = recentMessages[recentMessages.length - 1].content;

  const apiReq = https.request(options, (apiRes) => {
    // If rate-limited (429) or overloaded, instantly failover to a lighter model instead of waiting
    if ((apiRes.statusCode === 429 || apiRes.statusCode >= 500) && retryCount < 3) {
      let errorBody = '';
      apiRes.on('data', chunk => errorBody += chunk.toString());
      apiRes.on('end', () => {
        // Switch to Gemini for fallback since Nvidia quota might be exhausted
        apiKey = process.env.GEMINI_API_KEY;
        apiHostname = 'generativelanguage.googleapis.com';
        apiPath = '/v1beta/openai/chat/completions';
        
        if (retryCount === 0) payloadObj.model = 'gemini-2.5-flash';
        if (retryCount === 1) payloadObj.model = 'gemini-2.5-flash';
        if (retryCount === 2) payloadObj.model = 'gemini-2.5-pro';
        
        console.log(`[AI_API] HTTP ${apiRes.statusCode}. Instant fallback to ${payloadObj.model} on ${apiHostname} (Retry ${retryCount+1}/3)...`);
        makeRequest(retryCount + 1);
      });
      return;
    }

    // If non-200 and non-retryable, send error to client immediately
    if (apiRes.statusCode !== 200) {
      let errorBody = '';
      apiRes.on('data', chunk => errorBody += chunk.toString());
      apiRes.on('end', () => {
        console.log(`[AI_API_ERROR] HTTP ${apiRes.statusCode}: ${errorBody.substring(0, 200)}`);
        if (!res.headersSent) {
          res.status(apiRes.statusCode).json({ error: `AI API returned HTTP ${apiRes.statusCode}` });
        }
      });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    let fullResponse = '';
    let nonStreamBuffer = '';
    
    console.log(`[AI_API] Request to ${model} returned HTTP ${apiRes.statusCode}`);
    
    apiRes.on('data', (chunk) => {
      if (!payloadObj.stream) {
        nonStreamBuffer += chunk.toString();
        return;
      }

      res.write(chunk);
      
      // Accumulate full text for RL Logging and Execution
      const chunkStr = chunk.toString();
      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              fullResponse += data.choices[0].delta.content;
            }
          } catch(e) {}
        }
      }
    });

    apiRes.on('end', () => {
      if (!payloadObj.stream && nonStreamBuffer) {
        try {
          const data = JSON.parse(nonStreamBuffer);
          const msg = data.choices[0].message;
          fullResponse = msg.content || '';
          const sseData = {
            choices: [{ delta: { content: msg.content, reasoning_content: msg.reasoning_content } }]
          };
          res.write(`data: ${JSON.stringify(sseData)}\n\n`);
          res.write('data: [DONE]\n\n');
        } catch (e) {
          res.write(`data: ${JSON.stringify({ error: 'Failed to parse non-streamed JSON.' })}\n\n`);
        }
      }
      res.end();
      
      // Post-Processing: Execution and RL Memory Logging
      const execMatch = fullResponse.match(/<EXEC>([\s\S]*?)<\/EXEC>/);
      if (execMatch) {
        const command = execMatch[1].trim();
        const isLaunch = command.includes('roslaunch') || command.includes('rosrun');
        
        if (isLaunch) {
          const logFile = `/tmp/swarmy_launch_${Date.now()}.log`;
          const safeCmd = `nohup bash -c "source /opt/ros/melodic/setup.bash && cd ${WORKSPACE_DIR} && catkin_make > ${logFile}.build 2>&1 && source devel/setup.bash && export ROS_MASTER_URI=http://localhost:11311 && eval '${command.replace(/'/g, "'\\''")}' > ${logFile} 2>&1" >/dev/null 2>&1 & echo $!`;
          exec(safeCmd, { shell: '/bin/bash' }, (err, stdout) => {
            const pid = stdout ? stdout.trim() : 'unknown';
            if (pid !== 'unknown') launchedProcesses[`launch_${Date.now()}`] = { pid, command, logFile, startedAt: new Date().toISOString() };
            
            const memoryEntry = JSON.stringify({ timestamp: new Date().toISOString(), user: userQuery, assistant: fullResponse, execution_result: `Launched PID: ${pid}` }) + '\n';
            fs.appendFile(RL_MEMORY_FILE, memoryEntry, () => {});
          });
        } else {
          const fullCmd = `${ROS_ENV} && ${command}`;
          exec(fullCmd, { shell: '/bin/bash', cwd: WORKSPACE_DIR, timeout: 20000 }, (err, stdout, stderr) => {
            const output = stdout || stderr || 'No output';
            const memoryEntry = JSON.stringify({ timestamp: new Date().toISOString(), user: userQuery, assistant: fullResponse, execution_result: output }) + '\n';
            fs.appendFile(RL_MEMORY_FILE, memoryEntry, () => {});
          });
        }
      } else {
        const memoryEntry = JSON.stringify({ timestamp: new Date().toISOString(), user: userQuery, assistant: fullResponse }) + '\n';
        fs.appendFile(RL_MEMORY_FILE, memoryEntry, () => {});
      }
    });
  });

  apiReq.on('error', (e) => {
    console.error('[AI_API_ERROR]', e.message);
    if (!res.headersSent) res.status(500).json({ error: 'AI backend connection failed' });
  });

  apiReq.write(payload);
  apiReq.end();
  }; // end makeRequest

  makeRequest();
});

// ==========================================
// 15. AUDIO TRANSCRIPTION (Cross Browser STT)
// ==========================================
app.post('/api/transcribe', verifyToken, async (req, res) => {
  const { audio, mimeType } = req.body;
  if (!audio) return res.status(400).json({ error: 'No audio provided' });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend' });
  const payload = JSON.stringify({
    contents: [{
      parts: [
        { text: "Transcribe the following audio accurately. Reply ONLY with the transcript, no other text." },
        { inlineData: { mimeType: mimeType || 'audio/webm', data: audio } }
      ]
    }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    family: 4,
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(data);
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        res.json({ transcript: text.trim() });
      } catch (e) {
        res.status(500).json({ error: 'Transcription failed' });
      }
    });
  });

  apiReq.on('error', (e) => res.status(500).json({ error: e.message }));
  apiReq.write(payload);
  apiReq.end();
});

app.post('/api/tts', verifyToken, async (req, res) => {
  const { text, voiceProfile = 'doraemon', elevenLabsKey, elevenLabsVoiceId } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  try {
    const results = [];
    let pitchMultiplier = 1.0;
    let tempoMultiplier = 1.0;
    let customFilter = null;
    
    // Background RL: log the selected voice to allow AI adaptation (e.g. Jarvis should speak formally)
    fs.appendFileSync('rl_memory.json', JSON.stringify({ timestamp: Date.now(), selectedVoice: voiceProfile }) + '\\n');

    if (voiceProfile === 'elevenlabs' && elevenLabsKey && elevenLabsVoiceId) {
      // ElevenLabs API
      const options = {
        hostname: 'api.elevenlabs.io',
        port: 443,
        path: `/v1/text-to-speech/${elevenLabsVoiceId}`,
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json'
        }
      };
      const base64 = await new Promise((resolve, reject) => {
        const req = https.request(options, (apiRes) => {
          if (apiRes.statusCode !== 200) return reject(new Error('ElevenLabs HTTP ' + apiRes.statusCode));
          const buf = [];
          apiRes.on('data', c => buf.push(c));
          apiRes.on('end', () => resolve(Buffer.concat(buf).toString('base64')));
        });
        req.on('error', reject);
        req.write(JSON.stringify({ text, model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.5 } }));
        req.end();
      });
      results.push({ base64 });
    } else {
      let ttsLang = 'en-US';
      
      if (voiceProfile === 'doraemon') { ttsLang = 'hi'; pitchMultiplier = 1.35; tempoMultiplier = 1.0; } 
      else if (voiceProfile === 'jarvis') { 
        ttsLang = 'en-GB'; 
        // Hero AI: British, deep pitch (0.85), very fast (1.4x), subtle chorus/echo for metallic feel
        customFilter = `asetrate=20400,atempo=1.65,chorus=0.7:0.9:55:0.4:0.25:2,aecho=0.8:0.88:10:0.2,aresample=44100`;
      } 
      else if (voiceProfile === 'ultron') { 
        ttsLang = 'en-IN'; 
        // Villain AI: Indian/British mix (en-IN base), extremely deep (0.6), very fast (1.4x), heavy tremolo/flange
        customFilter = `asetrate=14400,atempo=1.8,atempo=1.3,tremolo=f=4:d=0.3,flanger=delay=5:depth=2:regen=50:width=71,aecho=0.8:0.88:60:0.4,aresample=44100`;
      } 
      else if (voiceProfile === 'glados') { ttsLang = 'en-US'; pitchMultiplier = 1.15; tempoMultiplier = 1.0; }
      else if (voiceProfile === 'standard_in') { ttsLang = 'en-IN'; pitchMultiplier = 1.0; tempoMultiplier = 1.0; }
      
      const chunks = text.match(/.{1,200}(?:\\s|$)/g) || [text];
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const options = {
          hostname: 'translate.google.com',
          port: 443,
          family: 4,
          path: `/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.trim())}&tl=${ttsLang}&client=tw-ob`,
          method: 'GET'
        };
        const base64 = await new Promise((resolve, reject) => {
          const req = https.request(options, (apiRes) => {
            if (apiRes.statusCode !== 200) return reject(new Error('TTS HTTP ' + apiRes.statusCode));
            const buf = [];
            apiRes.on('data', c => buf.push(c));
            apiRes.on('end', () => resolve(Buffer.concat(buf).toString('base64')));
          });
          req.on('error', reject);
          req.end();
        });
        results.push({ base64 });
      }
    }
    
    const audios = results.map(r => `data:audio/mp3;base64,${r.base64}`);
    
    const tmpDir = '/tmp/swarmy_tts';
    fs.mkdirSync(tmpDir, { recursive: true });
    const playChain = results.map((r, i) => {
      const mp3File = `${tmpDir}/tts_${Date.now()}_${i}.mp3`;
      const wavFile = mp3File.replace('.mp3', '.wav');
      fs.writeFileSync(mp3File, Buffer.from(r.base64, 'base64'));
      return { mp3File, wavFile };
    });
    
    // Apply dynamic pitch shift and tempo based on voice profile
    const playCmd = playChain.map(f => {
      let ffmpegFilter = `-filter:a "aresample=44100" -ac 1`;
      
      if (customFilter) {
        ffmpegFilter = `-filter:a "${customFilter}" -ac 1`;
      } else if (pitchMultiplier !== 1.0 || tempoMultiplier !== 1.0) {
        const rate = Math.floor(24000 * pitchMultiplier);
        let filterStr = `asetrate=${rate}`;
        if (tempoMultiplier !== 1.0) filterStr += `,atempo=${tempoMultiplier}`;
        filterStr += `,aresample=44100`;
        ffmpegFilter = `-filter:a "${filterStr}" -ac 1`;
      }
      
      return `ffmpeg -y -i "${f.mp3File}" ${ffmpegFilter} "${f.wavFile}" >> /tmp/audio_debug.log 2>&1 && for i in 1 2 3; do aplay --buffer-time=250000 -D plughw:CARD=Device,DEV=0 "${f.wavFile}" >> /tmp/audio_debug.log 2>&1 && break || sleep 0.5; done; rm -f "${f.mp3File}" "${f.wavFile}"`;
    }).join(' && ');
    exec(playCmd, { timeout: 60000, shell: '/bin/bash' }, (err, stdout, stderr) => {
      if (err) console.error("[TTS EXEC ERROR]:", err);
      if (stdout) console.log("[TTS STDOUT]:", stdout);
      if (stderr) console.error("[TTS STDERR]:", stderr);
    });
    
    res.json({ audios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// OPC UA BRIDGE API
// ==========================================
let opcuaProcess = null;

app.get('/api/opcua/status', (req, res) => {
    if (opcuaProcess) {
        res.json({ status: 'Running (PID: ' + opcuaProcess.pid + ')' });
    } else {
        res.json({ status: 'Stopped' });
    }
});

app.post('/api/opcua/start', (req, res) => {
    if (!opcuaProcess) {
        const { spawn } = require('child_process');
        const path = require('path');
        opcuaProcess = spawn('bash', ['-c', 'source /opt/ros/melodic/setup.bash && source /home/swarmy_bot/swarmy_ws/devel/setup.bash && python3 ' + path.join(__dirname, 'opcua_server.py')]);
        
        opcuaProcess.on('exit', () => {
            opcuaProcess = null;
        });
        
        res.json({ success: true, message: 'OPC UA Bridge started.' });
    } else {
        res.json({ success: false, message: 'Already running.' });
    }
});

app.post('/api/opcua/stop', (req, res) => {
    if (opcuaProcess) {
        opcuaProcess.kill();
        opcuaProcess = null;
        res.json({ success: true, message: 'OPC UA Bridge stopped.' });
    } else {
        res.json({ success: false, message: 'Not running.' });
    }
});

// --- OPC UA CLIENT ENDPOINTS ---
app.get('/api/opcua/client/read', (req, res) => {
    const { exec } = require('child_process');
    const path = require('path');
    const scriptPath = path.join(__dirname, 'opcua_client.py');
    exec(`python3 ${scriptPath}`, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: stderr || err.message });
        res.json({ output: stdout });
    });
});

app.post('/api/opcua/client/move', (req, res) => {
    const { x, y } = req.body;
    const { exec } = require('child_process');
    const path = require('path');
    const scriptPath = path.join(__dirname, 'opcua_client.py');
    exec(`python3 ${scriptPath} --move ${x} ${y}`, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: stderr || err.message });
        res.json({ output: stdout });
    });
});

app.post('/api/opcua/client/task', (req, res) => {
    const { task } = req.body;
    const { exec } = require('child_process');
    const path = require('path');
    const scriptPath = path.join(__dirname, 'opcua_client.py');
    exec(`python3 ${scriptPath} --task "${task}"`, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: stderr || err.message });
        res.json({ output: stdout });
    });
});


app.use(express.static('/home/swarmy_bot/swarmy_ws/src/swarmy_web_app/dist'));

// Fallback for React Router (SPA)
app.get('*', (req, res) => {
  res.sendFile('/home/swarmy_bot/swarmy_ws/src/swarmy_web_app/dist/index.html');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Swarmy Enterprise Backend running on http://0.0.0.0:${PORT}`);
});

const options = {
  key: fs.readFileSync('/home/swarmy_bot/swarmy_ws/server.key'),
  cert: fs.readFileSync('/home/swarmy_bot/swarmy_ws/server.cert')
};

https.createServer(options, app).listen(8443, '0.0.0.0', () => {
  console.log('Secure Swarmy Enterprise Backend running on https://0.0.0.0:8443');
});

// --- SWARMY STUDIO WORKFLOW ENDPOINTS ---
app.post('/api/workflow/save', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const workflowPath = path.join(__dirname, 'swarmy_workflow.json');
    
    fs.writeFile(workflowPath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Workflow saved successfully.' });
    });
});

app.post('/api/workflow/execute', (req, res) => {
    const { spawn } = require('child_process');
    const path = require('path');
    const scriptPath = path.join(__dirname, 'swarmy_workflow_engine.py');
    
    // Spawn the executor in the background
    const engine = spawn('bash', ['-c', 'source /opt/ros/melodic/setup.bash && source /home/swarmy_bot/swarmy_ws/devel/setup.bash && python3 ' + scriptPath]);
    
    engine.stdout.on('data', (data) => console.log(`[WorkflowEngine] ${data}`));
    engine.stderr.on('data', (data) => console.error(`[WorkflowEngine] ERR: ${data}`));
    
    res.json({ success: true, message: 'Workflow execution triggered.' });
});
