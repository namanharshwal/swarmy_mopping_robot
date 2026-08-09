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
const MAPS_DIR = path.join(WORKSPACE_DIR, 'maps');
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

    let battery = 100, isCharging = true, voltage = 12.0;
    try {
      battery = parseInt(execSync("cat /sys/class/power_supply/BAT0/capacity 2>/dev/null || echo '87'", { shell: '/bin/bash' }).toString().trim());
      isCharging = execSync("cat /sys/class/power_supply/BAT0/status 2>/dev/null || echo 'Charging'", { shell: '/bin/bash' }).toString().trim() === 'Charging';
      const microvolts = parseInt(execSync("cat /sys/class/power_supply/BAT0/voltage_now 2>/dev/null || echo '11400000'", { shell: '/bin/bash' }).toString().trim());
      voltage = (microvolts / 1000000).toFixed(1);
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
app.post('/api/launch', (req, res) => {
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
// 13. SYSTEM REBOOT API
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
      { role: "system", content: "You are the AI brain of 'Swarmy', a commercial ROS-based autonomous mobile robot running on an NVIDIA Jetson Nano with ROS Melodic. You have FULL control over the hardware and ROS environment. If the user asks you to run a command or launch a file, output the command wrapped EXACTLY in <EXEC>command here</EXEC> tags. Example: <EXEC>roslaunch swarmy_navigation mapping.launch</EXEC> or <EXEC>ls -la</EXEC>. The system will automatically execute it in the background. Always explain what you are launching. CRITICAL: Do NOT generate or predict the [SYSTEM] execution output block yourself. Just output the <EXEC> tag and stop. Your creators and project handlers are Naman Sain (Maintainer for ROS FULL STACK and Development with Software to Hardware Communication) and Souvik Mallik (Embedded Maintainer)." + rlContext },
      ...recentMessages
    ],
    temperature: 1,
    stream: true
  };

  // Map to Gemini available models
  if (model.includes('gemma')) {
    payloadObj.model = 'gemma-4-31b-it';
  } else {
    // Default everything else (including nemotron, glm, minimax) to Flash to avoid strict Free-Tier Pro rate limits (2 RPM)
    payloadObj.model = 'gemini-2.5-flash';
  }
  
  payloadObj.top_p = 0.95;
  payloadObj.max_tokens = 8192;

  const payload = JSON.stringify(payloadObj);
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in backend' });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    family: 6,
    path: '/v1beta/openai/chat/completions',
    method: 'POST',
    headers: {
      'Host': 'generativelanguage.googleapis.com',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${geminiKey}`,
      'Accept': 'text/event-stream',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const userQuery = recentMessages[recentMessages.length - 1].content;

  const apiReq = https.request(options, (apiRes) => {
    res.status(apiRes.statusCode);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    let fullResponse = '';
    let nonStreamBuffer = '';
    
    console.log(`[AI_API] Request to ${model} returned HTTP ${apiRes.statusCode}`);
    
    apiRes.on('data', (chunk) => {
      if (apiRes.statusCode !== 200) {
         console.log(`[AI_API_ERROR] ${chunk.toString()}`);
      }

      if (!payloadObj.stream) {
        nonStreamBuffer += chunk.toString();
        return;
      }

      res.write(chunk);
      
      // Attempt to parse chunks to accumulate the full text for RL Logging and Execution
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

      // Post-Processing: Text-to-Speech (TTS) via I2S Amplifier
      let textToSpeak = fullResponse.replace(/<EXEC>[\s\S]*?<\/EXEC>/g, '').trim();
      textToSpeak = textToSpeak.replace(/[*_#`~]/g, ''); // strip markdown
      if (textToSpeak.length > 0) {
        try {
          // google-tts-api limits requests to 200 chars, so we chunk it or just take the first part
          const url = googleTTS.getAudioUrl(textToSpeak.substring(0, 200), {
            lang: 'en-US',
            slow: false,
            host: 'https://translate.google.com',
          });
          require('child_process').exec(`ffplay -nodisp -autoexit -volume 100 "${url}" >/dev/null 2>&1`, (err) => {
            if (err) console.error("TTS Playback error:", err);
          });
        } catch (ttsErr) {
          console.error("TTS Generation error:", ttsErr);
        }
      }
      
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
    console.error("AI Chat Error:", e);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  });

  apiReq.write(payload);
  apiReq.end();
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
    family: 6,
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
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  try {
    const results = await googleTTS.getAllAudioBase64(text, { lang: 'en', slow: false, host: 'https://translate.google.com' });
    res.json({ audios: results.map(r => `data:audio/mp3;base64,${r.base64}`) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
