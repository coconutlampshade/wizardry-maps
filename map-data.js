/**
 * MapData - Data model and persistence for Wizardry Map Maker
 */
class MapData {
  constructor() {
    this.data = this.createEmptyData();
    this.history = [];
    this.redoStack = [];
    this.maxHistory = 100;
    this.load();
  }

  saveToHistory() {
    // Save current state to history before making changes
    this.history.push(JSON.stringify(this.data));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    // Clear redo stack when new action is taken
    this.redoStack = [];
  }

  undo() {
    if (this.history.length === 0) return false;

    // Save current state to redo stack
    this.redoStack.push(JSON.stringify(this.data));

    // Restore previous state
    this.data = JSON.parse(this.history.pop());
    this.save();
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;

    // Save current state to history
    this.history.push(JSON.stringify(this.data));

    // Restore redo state
    this.data = JSON.parse(this.redoStack.pop());
    this.save();
    return true;
  }

  createEmptyData() {
    const data = {
      currentFloor: 1,
      playerPosition: { x: 0, y: 0, facing: 'N' },
      floors: {}
    };

    // Initialize 10 floors
    for (let floor = 1; floor <= 10; floor++) {
      data.floors[floor] = { cells: {} };
    }

    return data;
  }

  getCellKey(x, y) {
    return `${x},${y}`;
  }

  getCell(floor, x, y) {
    const key = this.getCellKey(x, y);
    const floorData = this.data.floors[floor];

    if (!floorData.cells[key]) {
      floorData.cells[key] = {
        walls: { n: false, e: false, s: false, w: false },
        door: null,
        content: null,
        note: '',
        teleporterId: null,
        passthroughId: null
      };
    }

    return floorData.cells[key];
  }

  setWall(floor, x, y, edge, value) {
    this.saveToHistory();
    const cell = this.getCell(floor, x, y);
    cell.walls[edge] = value;

    // Update adjacent cell's corresponding wall
    const adjacent = this.getAdjacentCoords(x, y, edge);
    if (adjacent && this.isValidCoord(adjacent.x, adjacent.y)) {
      const adjCell = this.getCell(floor, adjacent.x, adjacent.y);
      adjCell.walls[this.getOppositeEdge(edge)] = value;
    }

    // If removing wall, also remove any door on that edge
    if (!value) {
      if (cell.door && cell.door.edge === edge) {
        cell.door = null;
      }
      if (adjacent && this.isValidCoord(adjacent.x, adjacent.y)) {
        const adjCell = this.getCell(floor, adjacent.x, adjacent.y);
        const oppEdge = this.getOppositeEdge(edge);
        if (adjCell.door && adjCell.door.edge === oppEdge) {
          adjCell.door = null;
        }
      }
    }

    this.save();
  }

  setDoor(floor, x, y, edge, type) {
    this.saveToHistory();
    const cell = this.getCell(floor, x, y);

    if (type === null) {
      cell.door = null;
    } else {
      // Ensure wall exists when placing door
      if (!cell.walls[edge]) {
        this.setWall(floor, x, y, edge, true);
      }
      cell.door = { edge, type };
    }

    this.save();
  }

  setContent(floor, x, y, content) {
    this.saveToHistory();
    const cell = this.getCell(floor, x, y);
    cell.content = content;
    this.save();
  }

  setNote(floor, x, y, note) {
    this.saveToHistory();
    const cell = this.getCell(floor, x, y);
    cell.note = note;
    this.save();
  }

  setTeleporterId(floor, x, y, teleporterId) {
    const cell = this.getCell(floor, x, y);
    cell.teleporterId = teleporterId;
    this.save();
  }

  setPassthroughId(floor, x, y, passthroughId) {
    const cell = this.getCell(floor, x, y);
    cell.passthroughId = passthroughId;
    this.save();
  }

  setPlayerPosition(x, y, facing) {
    this.data.playerPosition = { x, y, facing };
    this.save();
  }

  setCurrentFloor(floor) {
    this.data.currentFloor = floor;
    this.save();
  }

  getAdjacentCoords(x, y, edge) {
    // Y increases going north (up), decreases going south (down)
    switch (edge) {
      case 'n': return { x, y: y + 1 };
      case 's': return { x, y: y - 1 };
      case 'e': return { x: x + 1, y };
      case 'w': return { x: x - 1, y };
    }
    return null;
  }

  getOppositeEdge(edge) {
    const opposites = { n: 's', s: 'n', e: 'w', w: 'e' };
    return opposites[edge];
  }

  isValidCoord(x, y) {
    return x >= 0 && x < 20 && y >= 0 && y < 20;
  }

  save() {
    try {
      localStorage.setItem('wizardry-maps', JSON.stringify(this.data));
      this.showSaveIndicator();
    } catch (e) {
      console.error('Failed to save map data:', e);
    }
  }

  showSaveIndicator() {
    const indicator = document.getElementById('save-indicator');
    if (indicator) {
      indicator.classList.add('visible');
      clearTimeout(this.saveIndicatorTimeout);
      this.saveIndicatorTimeout = setTimeout(() => {
        indicator.classList.remove('visible');
      }, 1500);
    }
  }

  load() {
    try {
      const saved = localStorage.getItem('wizardry-maps');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with empty data to ensure all floors exist
        this.data = { ...this.createEmptyData(), ...parsed };
        // Ensure all 10 floors exist
        for (let floor = 1; floor <= 10; floor++) {
          if (!this.data.floors[floor]) {
            this.data.floors[floor] = { cells: {} };
          }
        }
      }
    } catch (e) {
      console.error('Failed to load map data:', e);
      this.data = this.createEmptyData();
    }
  }

  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.floors && parsed.currentFloor) {
        this.data = parsed;
        this.save();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import map data:', e);
      return false;
    }
  }

  clearFloor(floor) {
    this.saveToHistory();
    this.data.floors[floor] = { cells: {} };
    this.save();
  }

  clearAll() {
    this.saveToHistory();
    this.data = this.createEmptyData();
    this.save();
  }

  rotateFloor90(floor) {
    this.saveToHistory();

    const oldCells = this.data.floors[floor].cells;
    const newCells = {};

    // Clockwise rotation: (x, y) -> (19 - y, x)
    // Walls rotate: n->e, e->s, s->w, w->n
    const wallRotation = { n: 'e', e: 's', s: 'w', w: 'n' };

    for (const [key, cell] of Object.entries(oldCells)) {
      const [oldX, oldY] = key.split(',').map(Number);

      // Calculate new position
      const newX = 19 - oldY;
      const newY = oldX;
      const newKey = `${newX},${newY}`;

      // Rotate walls
      const newWalls = {
        n: cell.walls.w,
        e: cell.walls.n,
        s: cell.walls.e,
        w: cell.walls.s
      };

      // Rotate door edge if present
      let newDoor = null;
      if (cell.door) {
        newDoor = {
          edge: wallRotation[cell.door.edge],
          type: cell.door.type
        };
      }

      newCells[newKey] = {
        walls: newWalls,
        door: newDoor,
        content: cell.content,
        note: cell.note,
        teleporterId: cell.teleporterId,
        passthroughId: cell.passthroughId
      };
    }

    this.data.floors[floor].cells = newCells;

    // Rotate player position if on this floor
    const pos = this.data.playerPosition;
    if (this.data.currentFloor === floor) {
      const newX = 19 - pos.y;
      const newY = pos.x;
      const facingRotation = { N: 'E', E: 'S', S: 'W', W: 'N' };
      this.data.playerPosition = {
        x: newX,
        y: newY,
        facing: facingRotation[pos.facing]
      };
    }

    this.save();
  }
}
