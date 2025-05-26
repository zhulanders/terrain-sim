# WebGL Terrain-Simulator

This project is a WebGL-based terrain visualization and exploration tool built from scratch using the WebGL2 API. It procedurally generates 3D terrain using the **fault formation algorithm** and allows the user to explore it in real time using **flight-style camera controls**.

## Features

- 🌄 Procedural terrain generation via faulting
- 🎮 Flight-style camera movement using keyboard inputs
- 💡 Per-fragment lighting with dynamically computed normals
- 🌫️ Toggleable fog effect with adjustable intensity
- 📐 Responsive viewport and perspective projection

## Controls

| Key         | Action                        |
|-------------|-------------------------------|
| `W`         | Move forward                  |
| `S`         | Move backward                 |
| `A`         | Strafe left                   |
| `D`         | Strafe right                  |
| `ArrowUp`   | Pitch up                      |
| `ArrowDown` | Pitch down                    |
| `ArrowLeft` | Turn left (yaw)               |
| `ArrowRight`| Turn right (yaw)              |
| `F`         | Toggle fog                    |
| `G`         | Decrease fog intensity        |
| `H`         | Increase fog intensity        |