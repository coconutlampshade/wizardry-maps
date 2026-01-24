/**
 * Wizardry Map Maker - Main Application
 */

const mapData = new MapData();

// Current tool state
let currentTool = 'wall';
let currentDoorType = 'normal';
let currentContent = 'stairs-up';
let viewRotation = 0; // 0, 90, 180, 270 degrees

// Content type definitions
const contentTypes = {
  'stairs-up': { icon: '↑', label: 'Stairs Up' },
  'stairs-down': { icon: '↓', label: 'Stairs Down' },
  'teleporter': { icon: '◎', label: 'Teleporter' },
  'spinner': { icon: '⟳', label: 'Spinner' },
  'pit': { icon: '○', label: 'Pit' },
  'chute': { icon: '⇓', label: 'Chute' },
  'elevator': { icon: '⬍', label: 'Elevator' },
  'darkness': { icon: '▪', label: 'Darkness' },
  'antimagic': { icon: '✕', label: 'Anti-magic' },
  'encounter': { icon: '!', label: 'Encounter' }
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
  renderGrid();
});

function initFloorSelector() {
  const selector = document.getElementById('floor-select');
  selector.value = mapData.data.currentFloor;

  selector.addEventListener('change', (e) => {
    mapData.setCurrentFloor(parseInt(e.target.value));
    renderGrid();
  });
}

function initToolbar() {
  // Tool buttons
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;

      // Handle sub-tool selection
      if (btn.dataset.doorType) {
        currentDoorType = btn.dataset.doorType;
      }
      if (btn.dataset.content) {
        currentContent = btn.dataset.content;
      }
    });
  });

  // Set initial active tool
  document.querySelector('.tool-btn[data-tool="wall"]').classList.add('active');

  // Export button
  document.getElementById('export-btn').addEventListener('click', exportMap);

  // Import button
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-modal').classList.add('active');
  });

  // Clear floor button
  document.getElementById('clear-floor-btn').addEventListener('click', () => {
    if (confirm(`Clear all data on Floor ${mapData.data.currentFloor}?`)) {
      mapData.clearFloor(mapData.data.currentFloor);
      renderGrid();
    }
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

  if (currentTool === 'wall') {
    // Toggle wall
    mapData.setWall(floor, x, y, edge, !cell.walls[edge]);
  } else if (currentTool === 'door') {
    // Place or cycle door type
    if (cell.door && cell.door.edge === edge) {
      // Cycle door type or remove
      const types = ['normal', 'locked', 'secret', 'one-way', null];
      const currentIndex = types.indexOf(cell.door.type);
      const nextType = types[(currentIndex + 1) % types.length];
      mapData.setDoor(floor, x, y, edge, nextType);
    } else {
      mapData.setDoor(floor, x, y, edge, currentDoorType);
    }
  } else if (currentTool === 'erase') {
    mapData.setWall(floor, x, y, edge, false);
  }

  renderGrid();
}

function handleCenterClick(e, x, y) {
  e.stopPropagation();
  const floor = mapData.data.currentFloor;
  const cell = mapData.getCell(floor, x, y);

  if (currentTool === 'player') {
    // Place or rotate player
    const pos = mapData.data.playerPosition;
    if (pos.x === x && pos.y === y) {
      // Rotate facing
      const dirs = ['N', 'E', 'S', 'W'];
      const nextDir = dirs[(dirs.indexOf(pos.facing) + 1) % 4];
      mapData.setPlayerPosition(x, y, nextDir);
    } else {
      mapData.setPlayerPosition(x, y, 'N');
    }
  } else if (currentTool === 'note') {
    showNoteModal(x, y);
  } else if (currentTool === 'erase') {
    mapData.setContent(floor, x, y, null);
    mapData.setNote(floor, x, y, '');
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

    // Check if cell has any walls or content (explored)
    const hasWalls = Object.values(cell.walls).some(v => v);
    if (hasWalls || cell.content || cell.note) {
      cellEl.classList.add('explored');
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
      player.textContent = facingArrows[pos.facing];
      cellEl.appendChild(player);
    }
  });

  updateMapInfo();
}

function updateMapInfo() {
  const pos = mapData.data.playerPosition;
  const info = document.getElementById('map-info');
  info.textContent = `Floor ${mapData.data.currentFloor} | Player: (${pos.x}, ${pos.y}) facing ${pos.facing}`;
}

function applyViewRotation() {
  const mapWithCoords = document.querySelector('.map-with-coords');
  mapWithCoords.style.transform = `rotate(${viewRotation}deg)`;

  // Update compass
  const compassDirections = ['N', 'W', 'S', 'E']; // What's "up" at each rotation
  const compassIndex = viewRotation / 90;
  document.getElementById('compass-direction').textContent = compassDirections[compassIndex];
  document.getElementById('compass').style.transform = `rotate(-${viewRotation}deg)`;
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
      document.getElementById('floor-select').value = mapData.data.currentFloor;
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

      const direction = directionMap[viewRotation][e.key];

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

    // W/A/S/D: toggle walls relative to player position (adjusted for view rotation)
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      // Map WASD to edges based on view rotation
      const edgeMap = {
        0:   { 'w': 'n', 'd': 'e', 's': 's', 'a': 'w' },
        90:  { 'w': 'w', 'd': 'n', 's': 'e', 'a': 's' },
        180: { 'w': 's', 'd': 'w', 's': 'n', 'a': 'e' },
        270: { 'w': 'e', 'd': 's', 's': 'w', 'a': 'n' }
      };
      const edge = edgeMap[viewRotation][e.key.toLowerCase()];
      const cell = mapData.getCell(floor, pos.x, pos.y);
      mapData.setWall(floor, pos.x, pos.y, edge, !cell.walls[edge]);
      renderGrid();
    }

    // Number keys 1-9, 0: switch floors
    if (e.key >= '0' && e.key <= '9') {
      const floorNum = e.key === '0' ? 10 : parseInt(e.key);
      mapData.setCurrentFloor(floorNum);
      document.getElementById('floor-select').value = floorNum;
      renderGrid();
    }

    // E: toggle erase mode
    if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
      const eraseBtn = document.querySelector('.tool-btn[data-tool="erase"]');
      if (eraseBtn) {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        eraseBtn.classList.add('active');
        currentTool = 'erase';
      }
    }

    // R: rotate player facing clockwise
    // Shift+R: rotate map view 90 degrees clockwise
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
      if (e.shiftKey) {
        viewRotation = (viewRotation + 90) % 360;
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
          document.getElementById('floor-select').value = mapData.data.currentFloor;
          renderGrid();
        }
      } else {
        if (mapData.undo()) {
          document.getElementById('floor-select').value = mapData.data.currentFloor;
          renderGrid();
        }
      }
    }

    // Escape: back to wall tool
    if (e.key === 'Escape') {
      const wallBtn = document.querySelector('.tool-btn[data-tool="wall"]');
      if (wallBtn) {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        wallBtn.classList.add('active');
        currentTool = 'wall';
      }
    }
  });
}
