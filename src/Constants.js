// Description: This file contains all the constants used in the simulation.
const cellHeight = 3.0;	
const CANVAS_HEIGHT = window.innerHeight - 100;
const CANVAS_WIDTH = window.innerWidth - 100;
const cScale = CANVAS_HEIGHT / cellHeight;
const cellWidth = CANVAS_WIDTH / cScale;
console.log("canvasHeight",CANVAS_HEIGHT);
console.log("canvasWidth",CANVAS_WIDTH);
console.log("cScale",cScale);
console.log("cell Size",cellWidth," x ",cellHeight);

const U_FIELD = 0;
const V_FIELD = 1;
const FLUID_CELL = 0;
const AIR_CELL = 1;
const SOLID_CELL = 2;
const cnt = 0;

const EARTH_GRAVITY = -9.807;
const SUN_GRAVITY = -274;
const MARS_GRAVITY = -3.711;
const MOON_GRAVITY = -1.62;
export { cellHeight,CANVAS_HEIGHT, CANVAS_WIDTH, cScale, cellWidth, U_FIELD, V_FIELD, FLUID_CELL, AIR_CELL, SOLID_CELL, cnt, EARTH_GRAVITY, SUN_GRAVITY, MARS_GRAVITY, MOON_GRAVITY };



