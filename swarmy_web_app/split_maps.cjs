const fs = require('fs');
const path = require('path');

const appJsxPath = path.join(__dirname, 'src/App.jsx');
let content = fs.readFileSync(appJsxPath, 'utf8');

// 1. Update Battery UI to show voltage
content = content.replace(
  /<div className="data-row"><span>Battery Level<\/span><strong style=\{\{color: health\.battery < 20 \? '#ff003c' : '#10b981'\}\}>\{health\.battery \|\| 100\}% \{health\.isCharging \? '🔌' : '🔋'\}<\/strong><\/div>/,
  '<div className="data-row"><span>Battery Level</span><strong style={{color: health.battery < 20 ? \'#ff003c\' : \'#10b981\'}}>{health.battery || 100}% ({health.voltage || \'12.0\'}V) {health.isCharging ? \'🔌\' : \'🔋\'}</strong></div>'
);

// 2. Update Sidebar to have two separate links
content = content.replace(
  /<Link to="\/map" className=\{`nav-link \$\{isActive\('\/map'\)\}`\}><Navigation size=\{20\} \/> Mapping & Navigation<\/Link>/,
  `<Link to="/mapping" className={\`nav-link \${isActive('/mapping')}\`}><Map size={20} /> 2D Mapping (SLAM)</Link>
        <Link to="/navigation" className={\`nav-link \${isActive('/navigation')}\`}><Navigation size={20} /> Auto Navigation</Link>`
);

// 3. Update Routes
content = content.replace(
  /<Route path="\/map" element=\{<MapView connected=\{connected\} \/>\} \/>/,
  `<Route path="/mapping" element={<MappingView connected={connected} />} />
              <Route path="/navigation" element={<NavigationView connected={connected} />} />`
);

// 4. Extract MapView and create MappingView and NavigationView
const mapRegex = /function MapView\(\{\s*connected\s*\}\)\s*\{[\s\S]*?\/\/\s*={44}\s*\n\/\/\s*PAGE:\s*WEB TERMINAL/m;
const match = content.match(mapRegex);

if (match) {
  let mapViewCode = match[0].replace(/\/\/\s*={44}\s*\n\/\/\s*PAGE:\s*WEB TERMINAL/, '');
  
  let mappingView = mapViewCode.replace(/function MapView/g, 'function MappingView');
  mappingView = mappingView.replace(/SLAM & SIMULATION STREAM/g, '2D SLAM MAPPING DASHBOARD');
  
  let navView = mapViewCode.replace(/function MapView/g, 'function NavigationView');
  navView = navView.replace(/SLAM & SIMULATION STREAM/g, 'AUTONOMOUS NAVIGATION DASHBOARD');
  navView = navView.replace(/roslaunch swarmy_navigation mapping\.launch/g, 'roslaunch swarmy_navigation navigation.launch');
  navView = navView.replace(/> Restart Mapping/g, '> Start Navigation');
  navView = navView.replace(/SLAM Drive/g, 'Navigation Teleop Override');
  
  content = content.replace(mapViewCode, mappingView + '\n\n// ============================================\n// PAGE: WEB TERMINAL\n');
  content = content.replace(/function WebTerminal\(\) \{/, navView + '\nfunction WebTerminal() {');
}

fs.writeFileSync(appJsxPath, content);
console.log('Split Mapping and Navigation correctly!');
