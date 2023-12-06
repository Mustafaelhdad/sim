# Fluid Simulation Project

## Group 3

## Overview

This project is a computer graphics implementation of a fluid simulation. It uses WebGL for rendering and simulation, providing a visually appealing representation of fluid dynamics.

## Features

- Real-time fluid simulation with particle-based representation
- Visualization of fluid grid and particles
- Interactive controls for adjusting simulation parameters
- Obstacle handling for dynamic interactions
- Mesh rendering for obstacles and fluid boundaries

## Technologies Used

- WebGL for real-time rendering
- JavaScript for simulation and interaction logic
- React component and CSS for the user interface

## Setup

1. Clone the repository:

    ```bash
    git repo clone https://github.com/JuneWprog/ComputerGraphics-Fluid
    cd ComputerGraphics-Fluid
    npm install
    npm start
    ```

2. Open `index.html` in a modern web browser (ensure WebGL support).

3. Interact with the simulation using the provided controls.

## Controls

- Use the mouse to interact with the fluid simulation:
  - **Mouse** drag the obstacle to manipulate fluid
 
- Keyboard shortcuts:
  - **P:** Pause simulation
  - **S:** Start simulation

## Simulation Parameters

Adjust the following parameters in the user interface:

- **Show Particles:** Toggle visibility of fluid particles.
- **Show Grid:** Toggle visibility of fluid grid.
- **Compensate Drift:** Compensate for numerical drift in the simulation.
- **Separate Particles:** Control the separation of fluid particles.
- **Gravity:** Adjust the strength of gravity affecting the fluid.
- **Flip Ratio:** Control the ratio of FLIP (Fluid-Implicit-Particle) to PIC (Particle-In-Cell) method.

## Contributing

Feel free to contribute to the project by opening issues or submitting pull requests. For major changes, please open an issue first to discuss the proposed changes.

## Acknowledgments
