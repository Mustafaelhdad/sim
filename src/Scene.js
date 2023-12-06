import { cellHeight, cellWidth, EARTH_GRAVITY } from "./Constants.js";
import FluidSimulator from "./FluidSimulator.js";
import { draw } from "./rendering.js";

class Scene {
  constructor() {
    this.gravity = EARTH_GRAVITY;
    this.dt = 1.0 / 120.0;
    this.flipRatio = 0.9;
    this.numPressureIters = 100;
    this.numParticleIters = 2;
    this.frameNr = 0;
    this.overRelaxation = 1.9;
    this.compensateDrift = true;
    this.separateParticles = true;
    this.obstacleX = 0.0;
    this.obstacleY = 0.0;
    this.obstacleRadius = 0.15;
    this.paused = true;
    this.showObstacle = true;
    this.obstacleVelX = 0.0;
    this.obstacleVelY = 0.0;
    this.showParticles = true;
    this.showGrid = false;
    this.fluid = null;
    this.setupScene = this.setupScene.bind(this);
    this.setObstacle = this.setObstacle.bind(this);
    this.update = this.update.bind(this);
    this.simulate = this.simulate.bind(this);
  }

  setupScene() {
    this.obstacleRadius = 0.15;
    this.overRelaxation = 1.9;

    this.dt = 1.0 / 60.0;
    this.numPressureIters = 50;
    this.numParticleIters = 2;

    var res = 100;

    var tankHeight = 1.0 * cellHeight;
    var tankWidth = 1.0 * cellWidth;
    var h = tankHeight / res;
    var density = 1000.0;

    var relWaterHeight = 0.8;
    var relWaterWidth = 0.6;

    // dam break

    // compute number of particles

    var r = 0.3 * h; // particle radius w.r.t. cell size
    var dx = 2.0 * r;
    var dy = (Math.sqrt(3.0) / 2.0) * dx;

    var numX = Math.floor((relWaterWidth * tankWidth - 2.0 * h - 2.0 * r) / dx);
    var numY = Math.floor(
      (relWaterHeight * tankHeight - 2.0 * h - 2.0 * r) / dy
    );
    var maxParticles = numX * numY;

    // create fluid

    var f = (this.fluid = new FluidSimulator(
      density,
      tankWidth,
      tankHeight,
      h,
      r,
      maxParticles
    ));

    // create particles

    f.numParticles = numX * numY;
    var p = 0;
    for (var i = 0; i < numX; i++) {
      for (var j = 0; j < numY; j++) {
        f.particlePos[p++] = h + r + dx * i + (j % 2 == 0 ? 0.0 : r);
        f.particlePos[p++] = h + r + dy * j;
      }
    }

    // setup grid cells for tank

    var n = f.fNumY;

    for (var i = 0; i < f.fNumX; i++) {
      for (var j = 0; j < f.fNumY; j++) {
        var s = 1.0; // fluid
        if (i == 0 || i == f.fNumX - 1 || j == 0) s = 0.0; // solid
        f.s[i * n + j] = s;
      }
    }
    this.setObstacle(3.0, 2.0, true);
  }

  setObstacle(x, y, reset) {
    var vx = 0.0;
    var vy = 0.0;

    if (!reset) {
      vx = (x - this.obstacleX) / this.dt;
      vy = (y - this.obstacleY) / this.dt;
    }

    this.obstacleX = x;
    this.obstacleY = y;
    var r = this.obstacleRadius;
    var f = this.fluid;
    var n = f.numY;
    var cd = Math.sqrt(2) * f.h;

    for (var i = 1; i < f.numX - 2; i++) {
      for (var j = 1; j < f.numY - 2; j++) {
        f.s[i * n + j] = 1.0;

        var dx = (i + 0.5) * f.h - x;
        var dy = (j + 0.5) * f.h - y;

        if (dx * dx + dy * dy < r * r) {
          f.s[i * n + j] = 0.0;
          f.u[i * n + j] = vx;
          f.u[(i + 1) * n + j] = vx;
          f.v[i * n + j] = vy;
          f.v[i * n + j + 1] = vy;
        }
      }
    }

    this.showObstacle = true;
    this.obstacleVelX = vx;
    this.obstacleVelY = vy;
  }

  simulate() {
    if (!this.paused)
      this.fluid.simulate(
        this.dt,
        this.gravity,
        this.flipRatio,
        this.numPressureIters,
        this.numParticleIters,
        this.overRelaxation,
        this.compensateDrift,
        this.separateParticles,
        this.obstacleX,
        this.obstacleY,
        this.obstacleRadius,
        this.colorFieldNr
      );
    this.frameNr++;
  }
  update() {
    this.simulate();
    draw();
    requestAnimationFrame(this.update);
  }
}

export const scene = new Scene();
