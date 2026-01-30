# Wizardry Map Maker

A browser-based dungeon mapping tool for **Wizardry: Proving Grounds of the Mad Overlord**. Create and track your exploration of all 10 dungeon floors as you play.

---

## Quick Start (No Technical Knowledge Required)

### How to Download

1. Click the green **Code** button at the top of this page
2. Select **Download ZIP**
3. Find the downloaded file (usually in your Downloads folder) and unzip it
4. Open the unzipped folder

### How to Use

1. Double-click on **index.html** - it will open in your web browser
2. Start mapping your dungeon exploration
3. Your maps save automatically - just bookmark the page to return later

That's it! No installation, no technical setup needed.

---

## Controls

### Navigation

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move player |
| R | Rotate player facing clockwise |
| Shift+R | Rotate entire map view 90° |
| 1-9, 0 | Switch to floors 1-10 |
| Click cell | Move player to that location |

### Drawing

| Action | How |
|--------|-----|
| Add wall | Select Wall tool, click cell edge |
| Add door | Select door type, click cell edge |
| Cycle door type | Click existing door |
| Quick wall toggle | Shift+WASD on current cell |
| Place feature | Select feature, click cell center |
| Add note | Select Note tool, click cell |
| Delete wall/door | Shift+click edge |
| Clear cell | Shift+click center |

### Exploration Marking

| Key | Action |
|-----|--------|
| G | Mark hovered cell as explored (green) |
| Shift+G | Flood-fill explored area (bounded by walls) |

### Pathfinding

| Action | How |
|--------|-----|
| Set start | Cmd+Option+Click (Mac) or Ctrl+Alt+Click |
| Set end & show path | Cmd+Option+Click second cell |
| Clear path | Click anywhere on the highlighted path |

Path directions: **F**=Forward, **L**=Left, **R**=Right, **B**=Back (suffix **o** = open door)

### Other

| Key | Action |
|-----|--------|
| Z | Undo |
| Shift+Z | Redo |

## Map Features

| Icon | Feature | Description |
|------|---------|-------------|
| **U** | Stairs Up | Ascend to previous floor |
| **D** | Stairs Down | Descend to next floor |
| **@** | Spinner | Randomly changes your facing direction |
| **O** | Pit | Causes fall damage |
| **V** | Chute | Drops you to a lower floor |
| **E** | Elevator | Transport between multiple floors |
| **?** | Darkness | Light spells don't work |
| **X** | Anti-Magic | All spells fail |

### Door Types

- **Door** (red) - Normal door
- **Locked Door** (yellow/gold) - Requires key or spell
- **Secret Door** (gray) - Hidden, must search to find
- **One-Way** (red with arrow) - Can only pass in arrow direction
- **Secret One-Way** (gray with arrow) - Hidden one-way door

### Special Cells

- **Teleporter** (orange square with number) - Instant transport to another location. Use number for source (e.g., "1") and number with apostrophe for destination (e.g., "1'")
- **Pass-Through** (red square with letter) - Marks perimeter passages. Use letter for source (e.g., "A") and letter with apostrophe for destination (e.g., "A'")

## Save & Export

- **Save** - Downloads a timestamped backup JSON file
- **Export** - Downloads map data as JSON
- **Import** - Load previously exported map data
- Maps auto-save to browser localStorage as you edit

## Tips

- Use the compass indicator (top right of map) to track map orientation after rotating
- The player marker (green arrow) shows your current position and facing
- Yellow dots indicate cells with notes - hover to see the note text
- Explored cells are shown in green to track where you've been
- Mark inaccessible areas (solid rock) to distinguish from unexplored areas

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires JavaScript enabled.
