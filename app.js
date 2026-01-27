/**
 * Wizardry Map Maker - Main Application
 */

const mapData = new MapData();

// Current tool state
let currentTool = 'wall';
let currentDoorType = 'normal';
let currentContent = 'stairs-up';
let viewRotation = 0; // Cumulative rotation in degrees (keeps increasing)

// Path drawing state
let pathStart = null;
let currentPath = null;
let pathDirections = null;

// Content type definitions
const contentTypes = {
  'stairs-up': { icon: 'U', label: 'Stairs Up' },
  'stairs-down': { icon: 'D', label: 'Stairs Down' },
  'spinner': { icon: '@', label: 'Spinner' },
  'pit': { icon: 'O', label: 'Pit' },
  'chute': { icon: 'V', label: 'Chute' },
  'elevator': { icon: 'E', label: 'Elevator' },
  'darkness': { icon: '?', label: 'Darkness' },
  'antimagic': { icon: 'X', label: 'Anti-magic' },
  'inaccessible': { icon: '', label: 'Inaccessible' },
  'explored': { icon: '', label: 'Explored' }
};

// Player facing arrows
const facingArrows = {
  'N': '▲',
  'E': '▶',
  'S': '▼',
  'W': '◀'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initFloorSelector();
  initToolbar();
  initGrid();
  initModals();
  initKeyboardShortcuts();
  initThemeToggle();
  initGuideToggle();
  renderGrid();
});

function initThemeToggle() {
  const btn = document.getElementById('theme-btn');
  const savedTheme = localStorage.getItem('wizardry-maps-theme');

  const sunIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`;

  const moonIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;

  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    btn.innerHTML = moonIcon;
    btn.title = 'Switch to dark mode';
  }

  btn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    btn.innerHTML = isLight ? moonIcon : sunIcon;
    btn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    localStorage.setItem('wizardry-maps-theme', isLight ? 'light' : 'dark');
  });
}

function initGuideToggle() {
  const btn = document.getElementById('guide-btn');
  const guide = document.getElementById('user-guide');
  const overlay = document.getElementById('guide-overlay');
  const closeBtn = document.getElementById('guide-close');

  function openGuide() {
    guide.classList.add('visible');
    overlay.classList.add('visible');
  }

  function closeGuide() {
    guide.classList.remove('visible');
    overlay.classList.remove('visible');
  }

  btn.addEventListener('click', () => {
    if (guide.classList.contains('visible')) {
      closeGuide();
    } else {
      openGuide();
    }
  });

  closeBtn.addEventListener('click', closeGuide);
  overlay.addEventListener('click', closeGuide);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && guide.classList.contains('visible')) {
      closeGuide();
    }
  });
}

function initFloorSelector() {
  const tabs = document.querySelectorAll('.floor-tab');

  // Set initial active tab
  updateFloorTabs();

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const floor = parseInt(tab.dataset.floor);
      mapData.setCurrentFloor(floor);
      updateFloorTabs();
      renderGrid();
    });
  });
}

function updateFloorTabs() {
  const currentFloor = mapData.data.currentFloor;
  const tabs = document.querySelectorAll('.floor-tab');

  tabs.forEach(tab => {
    const floor = parseInt(tab.dataset.floor);
    tab.classList.toggle('active', floor === currentFloor);

    // Check if floor has content
    const hasContent = floorHasContent(floor);
    tab.classList.toggle('has-content', hasContent && floor !== currentFloor);
  });
}

function floorHasContent(floor) {
  const floorData = mapData.data.floors[floor];
  if (!floorData) return false;

  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      const cell = floorData[y]?.[x];
      if (cell) {
        if (cell.walls?.n || cell.walls?.s || cell.walls?.e || cell.walls?.w) return true;
        if (cell.door) return true;
        if (cell.content) return true;
        if (cell.note) return true;
      }
    }
  }
  return false;
}

function initToolbar() {
  // Tool buttons
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wasActive = btn.classList.contains('active');
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));

      // Toggle off if clicking same button, otherwise activate
      if (wasActive) {
        // Return to wall tool as default
        currentTool = 'wall';
        document.querySelector('.tool-btn[data-tool="wall"]').classList.add('active');
      } else {
        btn.classList.add('active');
        currentTool = btn.dataset.tool;

        // Handle sub-tool selection
        if (btn.dataset.doorType) {
          currentDoorType = btn.dataset.doorType;
        }
        if (btn.dataset.content) {
          currentContent = btn.dataset.content;
        }
      }
    });
  });

  // Set initial active tool
  document.querySelector('.tool-btn[data-tool="wall"]').classList.add('active');

  // Save button - downloads file
  document.getElementById('save-btn').addEventListener('click', () => {
    downloadBackup();
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', exportMap);

  // Import button
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-modal').classList.add('active');
  });

}

function initGrid() {
  const grid = document.getElementById('map-grid');
  grid.innerHTML = '';

  // Render from y=19 (top of screen) down to y=0 (bottom of screen)
  // so that 0,0 is at bottom-left corner
  for (let y = 19; y >= 0; y--) {
    for (let x = 0; x < 20; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;

      // Edge click zones
      ['n', 'e', 's', 'w'].forEach(edge => {
        const edgeZone = document.createElement('div');
        edgeZone.className = `edge-zone edge-${edge}`;
        edgeZone.dataset.edge = edge;
        edgeZone.addEventListener('click', (e) => handleEdgeClick(e, x, y, edge));
        cell.appendChild(edgeZone);
      });

      // Center click zone
      const centerZone = document.createElement('div');
      centerZone.className = 'center-zone';
      centerZone.addEventListener('click', (e) => handleCenterClick(e, x, y));
      cell.appendChild(centerZone);

      grid.appendChild(cell);
    }
  }
}

function handleEdgeClick(e, x, y, edge) {
  e.stopPropagation();
  const floor = mapData.data.currentFloor;
  const cell = mapData.getCell(floor, x, y);

  // Shift+click to delete wall and door
  if (e.shiftKey) {
    mapData.setWall(floor, x, y, edge, false);
    renderGrid();
    return;
  }

  if (currentTool === 'wall') {
    // Toggle wall
    mapData.setWall(floor, x, y, edge, !cell.walls[edge]);
  } else if (currentTool === 'door') {
    // Place or cycle door type
    if (cell.door && cell.door.edge === edge) {
      // Cycle door type or remove
      const types = ['normal', 'locked', 'secret', 'one-way', 'secret-one-way', 'teleporter', null];
      const currentIndex = types.indexOf(cell.door.type);
      const nextType = types[(currentIndex + 1) % types.length];
      mapData.setDoor(floor, x, y, edge, nextType);
    } else {
      mapData.setDoor(floor, x, y, edge, currentDoorType);
    }
  }

  renderGrid();
}

function handleCenterClick(e, x, y) {
  e.stopPropagation();
  const floor = mapData.data.currentFloor;
  const cell = mapData.getCell(floor, x, y);
  const pos = mapData.data.playerPosition;

  // Cmd+Option(Alt)+click for path drawing
  if (e.metaKey && e.altKey) {
    handlePathClick(x, y);
    return;
  }

  // Shift+click to delete content and note
  if (e.shiftKey) {
    mapData.setContent(floor, x, y, null);
    mapData.setNote(floor, x, y, '');
    renderGrid();
    return;
  }

  // Always move player to clicked cell
  if (pos.x !== x || pos.y !== y) {
    mapData.setPlayerPosition(x, y, pos.facing);
  }

  // Additional actions based on tool
  if (currentTool === 'player') {
    // Rotate facing if clicking same cell
    if (pos.x === x && pos.y === y) {
      const dirs = ['N', 'E', 'S', 'W'];
      const nextDir = dirs[(dirs.indexOf(pos.facing) + 1) % 4];
      mapData.setPlayerPosition(x, y, nextDir);
    }
  } else if (currentTool === 'note') {
    showNoteModal(x, y);
  } else if (currentTool === 'content') {
    // Cycle through content or set specific content
    if (cell.content === currentContent) {
      mapData.setContent(floor, x, y, null);
    } else {
      mapData.setContent(floor, x, y, currentContent);
    }
  }

  renderGrid();
}

function renderGrid() {
  const floor = mapData.data.currentFloor;
  const cells = document.querySelectorAll('.cell');

  cells.forEach(cellEl => {
    const x = parseInt(cellEl.dataset.x);
    const y = parseInt(cellEl.dataset.y);
    const cell = mapData.getCell(floor, x, y);

    // Clear previous state
    cellEl.className = 'cell';

    // Remove old dynamic elements
    cellEl.querySelectorAll('.wall, .door, .cell-content, .player-marker, .note-indicator').forEach(el => el.remove());

    // Add content class for background
    if (cell.content) {
      cellEl.classList.add(cell.content);
    }


    // Render walls
    Object.entries(cell.walls).forEach(([edge, hasWall]) => {
      if (hasWall) {
        const wall = document.createElement('div');
        wall.className = `wall wall-${edge}`;
        cellEl.appendChild(wall);
      }
    });

    // Render door
    if (cell.door) {
      const door = document.createElement('div');
      door.className = `door door-${cell.door.edge} ${cell.door.type}`;
      if (cell.door.type === 'one-way' || cell.door.type === 'secret-one-way') {
        door.dataset.edge = cell.door.edge;
      }
      cellEl.appendChild(door);
    }

    // Render content icon
    if (cell.content && contentTypes[cell.content]) {
      const icon = document.createElement('div');
      icon.className = 'cell-content';
      icon.textContent = contentTypes[cell.content].icon;
      cellEl.appendChild(icon);
    }

    // Render note indicator
    if (cell.note) {
      const indicator = document.createElement('div');
      indicator.className = 'note-indicator';
      indicator.title = cell.note;
      cellEl.appendChild(indicator);
    }

    // Render player
    const pos = mapData.data.playerPosition;
    if (pos.x === x && pos.y === y) {
      const player = document.createElement('div');
      player.className = 'player-marker';
      player.dataset.facing = pos.facing;
      cellEl.appendChild(player);
    }

    // Render path start marker
    if (pathStart && pathStart.x === x && pathStart.y === y && !currentPath) {
      cellEl.classList.add('path-start');
    }

    // Render path
    if (currentPath) {
      const pathIndex = currentPath.findIndex(p => p.x === x && p.y === y);
      if (pathIndex !== -1) {
        cellEl.classList.add('path-cell');
        if (pathIndex === 0) {
          cellEl.classList.add('path-start');
        } else if (pathIndex === currentPath.length - 1) {
          cellEl.classList.add('path-end');
        }
      }
    }
  });

  updateMapInfo();
  updatePathDisplay();
  updateFloorTabs();
}

function updateMapInfo() {
  const pos = mapData.data.playerPosition;
  const info = document.getElementById('map-info');
  info.textContent = `Floor ${mapData.data.currentFloor} | Player: (${pos.x}, ${pos.y}) facing ${pos.facing}`;
}

function applyViewRotation() {
  const mapWithCoords = document.querySelector('.map-with-coords');
  mapWithCoords.style.transform = `rotate(${viewRotation}deg)`;

  // Update compass - use modulo to get the correct direction
  // Clockwise: 0°=N, 90°=W, 180°=S, 270°=E
  const compassDirections = ['N', 'W', 'S', 'E'];
  const normalizedRotation = ((viewRotation % 360) + 360) % 360;
  const compassIndex = (normalizedRotation / 90) % 4;
  document.getElementById('compass-direction').textContent = compassDirections[compassIndex];

  // Counter-rotate text labels so they stay readable
  const counterRotation = -viewRotation;
  document.querySelectorAll('.coord-labels-x span, .coord-labels-y span').forEach(span => {
    span.style.transform = `rotate(${counterRotation}deg)`;
  });
}

function initModals() {
  // Import modal
  const importModal = document.getElementById('import-modal');
  const importTextarea = document.getElementById('import-data');

  document.getElementById('import-cancel').addEventListener('click', () => {
    importModal.classList.remove('active');
    importTextarea.value = '';
  });

  document.getElementById('import-confirm').addEventListener('click', () => {
    const data = importTextarea.value.trim();
    if (data && mapData.importJSON(data)) {
      importModal.classList.remove('active');
      importTextarea.value = '';
      updateFloorTabs();
      renderGrid();
    } else {
      alert('Invalid map data format');
    }
  });

  // Note modal
  const noteModal = document.getElementById('note-modal');
  const noteInput = document.getElementById('note-input');

  document.getElementById('note-cancel').addEventListener('click', () => {
    noteModal.classList.remove('active');
  });

  document.getElementById('note-save').addEventListener('click', () => {
    const x = parseInt(noteModal.dataset.x);
    const y = parseInt(noteModal.dataset.y);
    mapData.setNote(mapData.data.currentFloor, x, y, noteInput.value);
    noteModal.classList.remove('active');
    renderGrid();
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

function showNoteModal(x, y) {
  const modal = document.getElementById('note-modal');
  const input = document.getElementById('note-input');
  const cell = mapData.getCell(mapData.data.currentFloor, x, y);

  modal.dataset.x = x;
  modal.dataset.y = y;
  input.value = cell.note || '';
  modal.classList.add('active');
  input.focus();
}

function exportMap() {
  const data = mapData.exportJSON();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `wizardry-map-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

function downloadBackup(isAuto = false) {
  const data = mapData.exportJSON();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wizardry-backup-${timestamp}.json`;
  a.click();

  URL.revokeObjectURL(url);

  // Show indicator
  const indicator = document.getElementById('save-indicator');
  indicator.textContent = isAuto ? 'Auto-saved' : 'Saved';
  indicator.classList.add('visible');
  setTimeout(() => indicator.classList.remove('visible'), 2000);
}

function handlePathClick(x, y) {
  // If path exists, clear it
  if (currentPath) {
    pathStart = null;
    currentPath = null;
    pathDirections = null;
    renderGrid();
    updatePathDisplay();
    return;
  }

  // If no start point, set it
  if (!pathStart) {
    pathStart = { x, y };
    renderGrid();
    return;
  }

  // We have a start, now find path to this end point
  const floor = mapData.data.currentFloor;
  const path = findPath(floor, pathStart.x, pathStart.y, x, y);

  if (path && path.length > 1) {
    currentPath = path;
    // Calculate directions based on player's current facing
    pathDirections = pathToDirections(path, mapData.data.playerPosition.facing);
  } else {
    // No path found, reset
    pathStart = null;
  }

  renderGrid();
  updatePathDisplay();
}

function findPath(floor, startX, startY, endX, endY) {
  const queue = [[startX, startY, [{ x: startX, y: startY }]]];
  const visited = new Set();
  visited.add(`${startX},${startY}`);

  const oppositeEdge = { n: 's', s: 'n', e: 'w', w: 'e' };

  while (queue.length > 0) {
    const [x, y, path] = queue.shift();

    if (x === endX && y === endY) {
      return path;
    }

    const cell = mapData.getCell(floor, x, y);

    // Check each direction
    const moves = [
      { dir: 'n', dx: 0, dy: 1, wall: 'n' },
      { dir: 's', dx: 0, dy: -1, wall: 's' },
      { dir: 'e', dx: 1, dy: 0, wall: 'e' },
      { dir: 'w', dx: -1, dy: 0, wall: 'w' }
    ];

    for (const move of moves) {
      const nx = x + move.dx;
      const ny = y + move.dy;
      const key = `${nx},${ny}`;

      if (nx < 0 || nx > 19 || ny < 0 || ny > 19) continue;
      if (visited.has(key)) continue;

      const neighborCell = mapData.getCell(floor, nx, ny);
      const oppEdge = oppositeEdge[move.wall];

      // Check for doors on either side - doors allow passage
      const doorHere = cell.door && cell.door.edge === move.wall;
      const doorThere = neighborCell.door && neighborCell.door.edge === oppEdge;
      const hasDoor = doorHere || doorThere;

      // Check for walls on either side
      const wallHere = cell.walls[move.wall];
      const wallThere = neighborCell.walls[oppEdge];
      const hasWall = wallHere || wallThere;

      // Blocked only if there's a wall and no door
      if (hasWall && !hasDoor) continue;

      visited.add(key);
      queue.push([nx, ny, [...path, { x: nx, y: ny }]]);
    }
  }

  return null; // No path found
}

function pathToDirections(path, startFacing) {
  if (path.length < 2) return '';

  const floor = mapData.data.currentFloor;
  const directions = [];
  let facing = startFacing;

  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i];
    const next = path[i + 1];

    // Determine which direction we need to move
    let targetDir, edge;
    if (next.y > curr.y) { targetDir = 'N'; edge = 'n'; }
    else if (next.y < curr.y) { targetDir = 'S'; edge = 's'; }
    else if (next.x > curr.x) { targetDir = 'E'; edge = 'e'; }
    else { targetDir = 'W'; edge = 'w'; }

    // Calculate turn needed
    const facingOrder = ['N', 'E', 'S', 'W'];
    const currentIdx = facingOrder.indexOf(facing);
    const targetIdx = facingOrder.indexOf(targetDir);
    const diff = (targetIdx - currentIdx + 4) % 4;

    if (diff === 1) {
      directions.push('R');
    } else if (diff === 2) {
      directions.push('R');
      directions.push('R');
    } else if (diff === 3) {
      directions.push('L');
    }

    // Check if there's a door to open
    const cell = mapData.getCell(floor, curr.x, curr.y);
    if (cell.door && cell.door.edge === edge) {
      directions.push('O');
    }

    // Move forward
    directions.push('F');
    facing = targetDir;
  }

  // Compress directions (e.g., F F F -> 3F)
  return compressDirections(directions);
}

function compressDirections(dirs) {
  if (dirs.length === 0) return '';

  const result = [];
  let current = dirs[0];
  let count = 1;

  for (let i = 1; i < dirs.length; i++) {
    if (dirs[i] === current) {
      count++;
    } else {
      result.push(count > 1 ? `${count}${current}` : current);
      current = dirs[i];
      count = 1;
    }
  }
  result.push(count > 1 ? `${count}${current}` : current);

  return result.join(' ');
}

function updatePathDisplay() {
  const info = document.getElementById('map-info');
  const pos = mapData.data.playerPosition;

  if (pathDirections) {
    info.textContent = `Path: ${pathDirections}`;
  } else {
    info.textContent = `Floor ${mapData.data.currentFloor} | Player: (${pos.x}, ${pos.y}) facing ${pos.facing}`;
  }
}

function floodFillExplored(floor, startX, startY) {
  const visited = new Set();
  const queue = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x > 19 || y < 0 || y > 19) continue;

    visited.add(key);

    const cell = mapData.getCell(floor, x, y);

    // Darkness acts as a wall - don't fill into or past it
    if (cell.content === 'darkness') continue;

    // Mark as explored (only if empty or already explored)
    if (!cell.content || cell.content === 'explored') {
      mapData.setContent(floor, x, y, 'explored');
    }

    // Check each direction - only spread if no wall
    if (!cell.walls.n && y < 19) queue.push([x, y + 1]);
    if (!cell.walls.s && y > 0) queue.push([x, y - 1]);
    if (!cell.walls.e && x < 19) queue.push([x + 1, y]);
    if (!cell.walls.w && x > 0) queue.push([x - 1, y]);
  }
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't handle shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const pos = mapData.data.playerPosition;
    const floor = mapData.data.currentFloor;

    // Arrow keys: move player (adjusted for view rotation)
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      let newX = pos.x, newY = pos.y, newFacing = pos.facing;

      // Map arrow keys to directions based on view rotation
      // At 0°: up=N, right=E, down=S, left=W
      // At 90°: up=W, right=N, down=E, left=S
      // At 180°: up=S, right=W, down=N, left=E
      // At 270°: up=E, right=S, down=W, left=N
      const directionMap = {
        0:   { ArrowUp: 'N', ArrowRight: 'E', ArrowDown: 'S', ArrowLeft: 'W' },
        90:  { ArrowUp: 'W', ArrowRight: 'N', ArrowDown: 'E', ArrowLeft: 'S' },
        180: { ArrowUp: 'S', ArrowRight: 'W', ArrowDown: 'N', ArrowLeft: 'E' },
        270: { ArrowUp: 'E', ArrowRight: 'S', ArrowDown: 'W', ArrowLeft: 'N' }
      };

      const normalizedRotation = ((viewRotation % 360) + 360) % 360;
      const direction = directionMap[normalizedRotation][e.key];

      switch (direction) {
        case 'N':
          if (pos.y < 19) newY++;
          break;
        case 'S':
          if (pos.y > 0) newY--;
          break;
        case 'W':
          if (pos.x > 0) newX--;
          break;
        case 'E':
          if (pos.x < 19) newX++;
          break;
      }
      newFacing = direction;

      mapData.setPlayerPosition(newX, newY, newFacing);
      renderGrid();
    }

    // W/A/S/D: move player, Shift+W/A/S/D: toggle walls (adjusted for view rotation)
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const normalizedRotation = ((viewRotation % 360) + 360) % 360;

      // Map WASD to directions based on view rotation
      const directionMap = {
        0:   { 'w': 'N', 'd': 'E', 's': 'S', 'a': 'W' },
        90:  { 'w': 'W', 'd': 'N', 's': 'E', 'a': 'S' },
        180: { 'w': 'S', 'd': 'W', 's': 'N', 'a': 'E' },
        270: { 'w': 'E', 'd': 'S', 's': 'W', 'a': 'N' }
      };
      const direction = directionMap[normalizedRotation][e.key.toLowerCase()];

      if (e.shiftKey) {
        // Shift+WASD: toggle walls
        const edgeMap = { 'N': 'n', 'S': 's', 'E': 'e', 'W': 'w' };
        const edge = edgeMap[direction];
        const cell = mapData.getCell(floor, pos.x, pos.y);
        mapData.setWall(floor, pos.x, pos.y, edge, !cell.walls[edge]);
      } else {
        // WASD: move player
        let newX = pos.x, newY = pos.y;
        switch (direction) {
          case 'N': if (pos.y < 19) newY++; break;
          case 'S': if (pos.y > 0) newY--; break;
          case 'W': if (pos.x > 0) newX--; break;
          case 'E': if (pos.x < 19) newX++; break;
        }
        mapData.setPlayerPosition(newX, newY, direction);
      }
      renderGrid();
    }

    // Number keys 1-9, 0: switch floors
    if (e.key >= '0' && e.key <= '9') {
      const floorNum = e.key === '0' ? 10 : parseInt(e.key);
      mapData.setCurrentFloor(floorNum);
      updateFloorTabs();
      renderGrid();
    }


    // R: rotate player facing clockwise
    // Shift+R: rotate map view 90 degrees clockwise
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      if (e.shiftKey) {
        viewRotation = viewRotation + 90;
        applyViewRotation();
      } else {
        const dirs = ['N', 'E', 'S', 'W'];
        const nextDir = dirs[(dirs.indexOf(pos.facing) + 1) % 4];
        mapData.setPlayerPosition(pos.x, pos.y, nextDir);
        renderGrid();
      }
    }

    // Z: undo, Shift+Z: redo
    if (e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (e.shiftKey) {
        if (mapData.redo()) {
          updateFloorTabs();
          renderGrid();
        }
      } else {
        if (mapData.undo()) {
          updateFloorTabs();
          renderGrid();
        }
      }
    }

    // G: toggle explored/gray cell at player position
    // Shift+G: flood-fill explored within walled perimeter
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey) {
      if (e.shiftKey) {
        // Flood-fill from player position, bounded by walls
        floodFillExplored(floor, pos.x, pos.y);
      } else {
        const cell = mapData.getCell(floor, pos.x, pos.y);
        mapData.setContent(floor, pos.x, pos.y, cell.content === 'explored' ? null : 'explored');
      }
      renderGrid();
    }

  });
}
