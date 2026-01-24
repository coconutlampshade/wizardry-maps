# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web app for creating dungeon maps for Wizardry: Proving Grounds of the Mad Overlord. Players map the 10 dungeon floors square-by-square as they explore.

### Game Constraints
- 10 dungeon floors
- Each floor is a 20x20 grid
- Cell coordinates are 0-19 on each axis
- Player can face N, E, S, or W

### Reference Materials
- `WizardryIMaps.pdf` - Reference dungeon maps
- Visual reference: https://strategywiki.org/wiki/Wizardry:_Proving_Grounds_of_the_Mad_Overlord/Floor_1

## Map Elements to Support

Based on Wizardry dungeon features:
- Walls (on any cell edge: N, E, S, W)
- Doors (regular, locked, one-way)
- Secret doors
- Stairs (up/down)
- Darkness zones
- Anti-magic zones
- Teleporters
- Spinners (change player facing)
- Pits
- Chutes
- Elevators
- Special encounters/events
- Notes/annotations

## Development

This project has not yet been initialized. When building:
- Create a browser-based app (no server required for core functionality)
- Use localStorage for saving map data
- Make the UI touch-friendly for potential tablet use while playing
- Support keyboard shortcuts for efficient mapping during gameplay
