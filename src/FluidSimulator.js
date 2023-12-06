import { clamp } from './utils.js';
import { scene } from './Scene.js';
import  {FLUID_CELL, AIR_CELL, SOLID_CELL } from './Constants.js';


export class FluidSimulator {
    constructor(density, width, height, spacing, particleRadius, maxParticles) {

        // fluid
        this.density = density;
        //number of cells in x and y direction
        this.fNumX = Math.floor(width / spacing) + 1;
        this.fNumY = Math.floor(height / spacing) + 1;
        this.h = Math.max(width / this.fNumX, height / this.fNumY);
        this.fInvSpacing = 1.0 / this.h;
        this.fNumCells = this.fNumX * this.fNumY;
        this.u = new Float32Array(this.fNumCells);
        this.v = new Float32Array(this.fNumCells);
        this.du = new Float32Array(this.fNumCells);
        this.dv = new Float32Array(this.fNumCells);
        this.prevU = new Float32Array(this.fNumCells);
        this.prevV = new Float32Array(this.fNumCells);
        this.p = new Float32Array(this.fNumCells);
        this.s = new Float32Array(this.fNumCells);
        this.cellType = new Int32Array(this.fNumCells);
        this.cellColor = new Float32Array(3 * this.fNumCells);

        // particles

        this.maxParticles = maxParticles;

        this.particlePos = new Float32Array(2 * this.maxParticles);
        this.particleColor = new Float32Array(3 * this.maxParticles);

        //set all the particles to blue
        for (var i = 0; i < this.maxParticles; i++)
            this.particleColor[3 * i + 2] = 1.0;

        //particleVel velocity of the particles
        this.particleVel = new Float32Array(2 * this.maxParticles);
        this.particleDensity = new Float32Array(this.fNumCells);
        this.particleRestDensity = 0.0;

        //pNumX and pNumY are the number of cells in the particle grid
        //fNumx and fNumY are the number of cells in the fluid grid?
        this.particleRadius = particleRadius;
        //pInvSpacing is the inverse of the spacing between the particles
        this.pInvSpacing = 1.0 / (2.2 * particleRadius);
        this.pNumX = Math.floor(width * this.pInvSpacing) + 1;
        this.pNumY = Math.floor(height * this.pInvSpacing) + 1;
        this.pNumCells = this.pNumX * this.pNumY;

        this.numCellParticles = new Int32Array(this.pNumCells);
        this.firstCellParticle = new Int32Array(this.pNumCells + 1);
        this.cellParticleIds = new Int32Array(maxParticles);

        this.numParticles = 0;
    }

    integrateParticles(dt, gravity) 
    {
        for (var i = 0; i < this.numParticles; i++) {
            //gravity works on the y axis
            this.particleVel[2 * i + 1] += dt * gravity;
            //next position of a particle x = x + v * dt   y= y + v * dt
            this.particlePos[2 * i] += this.particleVel[2 * i] * dt;
            this.particlePos[2 * i + 1] += this.particleVel[2 * i + 1] * dt;
        }
    }

    pushParticlesApart(numIters) 
    {
        var colorDiffusionCoeff = 0.001;

        // count particles per cell
        
        this.numCellParticles.fill(0);

        for (var i = 0; i < this.numParticles; i++) {
            var x = this.particlePos[2 * i];
            var y = this.particlePos[2 * i + 1];

            // x and y is in range of 0 to pNumX and pNumY
            var xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
            var yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
        
            var cellNr = xi * this.pNumY + yi;
            this.numCellParticles[cellNr]++;
        }

        // partial sums
        //firstCellParticle is the first particle in each cell
        var first = 0;
      
        
        for (var i = 0; i < this.pNumCells; i++) {
            first += this.numCellParticles[i];
            this.firstCellParticle[i] = first;
        }
        //set the first particle in the last cell to the total number of particles?
        this.firstCellParticle[this.pNumCells] = first;		// guard

        // fill particles into cells

        for (var i = 0; i < this.numParticles; i++) {
            var x = this.particlePos[2 * i];
            var y = this.particlePos[2 * i + 1];

            var xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1);
            var yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1);
            //cellNr is the index in the list of cells
            var cellNr = xi * this.pNumY + yi;
            this.firstCellParticle[cellNr]--;
            this.cellParticleIds[this.firstCellParticle[cellNr]] = i;
        }

        // push particles apart to avoid clustering

        var minDist = 2.0 * this.particleRadius;
        var minDist2 = minDist * minDist;
        //numIters is the number of iterations to push the particles apart
        for (var iter = 0; iter < numIters; iter++) {
            //iterate through all the particles and push them apart
            for (var i = 0; i < this.numParticles; i++) {
                var px = this.particlePos[2 * i];
                var py = this.particlePos[2 * i + 1];

                var pxi = Math.floor(px * this.pInvSpacing);
                var pyi = Math.floor(py * this.pInvSpacing);
                //x0 and y0 are the coordinates of the cell to the left and below the particle
                var x0 = Math.max(pxi - 1, 0);
                var y0 = Math.max(pyi - 1, 0);
                //x1 and y1 are the coordinates of the cell to the right and above the particle?

                var x1 = Math.min(pxi + 1, this.pNumX - 1);
                var y1 = Math.min(pyi + 1, this.pNumY - 1);
            //iterate through all the cells around the particle
            //the particle is in the center of the cells
                for (var xi = x0; xi <= x1; xi++) {
                    for (var yi = y0; yi <= y1; yi++) {
                        var cellNr = xi * this.pNumY + yi;
                        var first = this.firstCellParticle[cellNr];
                        var last = this.firstCellParticle[cellNr + 1];
                        for (var j = first; j < last; j++) {
                            var id = this.cellParticleIds[j];
                            //if the particle is the same as the particle we are looking at
                            if (id === i)
                                continue;
                            var qx = this.particlePos[2 * id];
                            var qy = this.particlePos[2 * id + 1];

                            var dx = qx - px;
                            var dy = qy - py;
                            var d2 = dx * dx + dy * dy;
                            //if the distance between the particles is greater than the minimum distance
                            if (d2 > minDist2 || d2 === 0.0) 
                                continue;
                            //d is the Euclidean distance between the particles 
                            var d = Math.sqrt(d2);
                            //s is the amount to push the particles apart
                            
                            var s = 0.5 * (minDist - d) / d;
                            dx *= s;
                            dy *= s;
                            //i and id new positions
                            this.particlePos[2 * i] -= dx;
                            this.particlePos[2 * i + 1] -= dy;
                            this.particlePos[2 * id] += dx;
                            this.particlePos[2 * id + 1] += dy;

                            // diffuse colors

                            for (var k = 0; k < 3; k++) {
                                var color0 = this.particleColor[3 * i + k];
                                var color1 = this.particleColor[3 * id + k];
                                var color = (color0 + color1) * 0.5;
                                this.particleColor[3 * i + k] = color0 + (color - color0) * colorDiffusionCoeff;
                                this.particleColor[3 * id + k] = color1 + (color - color1) * colorDiffusionCoeff;
                            }
                        }
                    }
                }
            }
        }
    }

    handleParticleCollisions(obstacleX, obstacleY, obstacleRadius) 
    {
        var h = 1.0 / this.fInvSpacing;
        var r = this.particleRadius;
        var or = obstacleRadius;
        var or2 = or * or;
        var minDist = obstacleRadius + r;
        var minDist2 = minDist * minDist;

        var minX = h + r;
        var maxX = (this.fNumX - 1) * h - r;
        var minY = h + r;
        var maxY = (this.fNumY - 1) * h - r;


        for (var i = 0; i < this.numParticles; i++) {
            var x = this.particlePos[2 * i];
            var y = this.particlePos[2 * i + 1];

            var dx = x - obstacleX;
            var dy = y - obstacleY;
            var d2 = dx * dx + dy * dy;

            // obstacle collision

            if (d2 < minDist2) {

                // var d = Math.sqrt(d2);
                // var s = (minDist - d) / d;
                // x += dx * s;
                // y += dy * s;
                
                //x is obstcale x position???
                //y is obstacle y position???
                this.particleVel[2 * i] = scene.obstacleVelX;
                this.particleVel[2 * i + 1] = scene.obstacleVelY;
            }

            // wall collisions
            //if the particle is outside the walls then move it back inside the walls
            //if the particle is outside the walls then set the velocity to 0
            if (x < minX) {
                x = minX;
                this.particleVel[2 * i] = 0.0;

            }
            if (x > maxX) {
                x = maxX;
                this.particleVel[2 * i] = 0.0;
            }
            if (y < minY) {
                y = minY;
                this.particleVel[2 * i + 1] = 0.0;
            }
            if (y > maxY) {
                y = maxY;
                this.particleVel[2 * i + 1] = 0.0;
            }
            this.particlePos[2 * i] = x;
            this.particlePos[2 * i + 1] = y;
        }
    }

    updateParticleDensity()
    {
        var n = this.fNumY;
        var h = this.h;
        var h1 = this.fInvSpacing;
        var h2 = 0.5 * h;

        var d = this.particleDensity;

        d.fill(0.0);

        for (var i = 0; i < this.numParticles; i++) {
            var x = this.particlePos[2 * i];
            var y = this.particlePos[2 * i + 1];

            x = clamp(x, h, (this.fNumX - 1) * h);
            y = clamp(y, h, (this.fNumY - 1) * h);

            var x0 = Math.floor((x - h2) * h1);
            var tx = ((x - h2) - x0 * h) * h1;
            var x1 = Math.min(x0 + 1, this.fNumX-2);
            
            var y0 = Math.floor((y-h2)*h1);
            var ty = ((y - h2) - y0*h) * h1;
            var y1 = Math.min(y0 + 1, this.fNumY-2);

            var sx = 1.0 - tx;
            var sy = 1.0 - ty;

            if (x0 < this.fNumX && y0 < this.fNumY) d[x0 * n + y0] += sx * sy;
            if (x1 < this.fNumX && y0 < this.fNumY) d[x1 * n + y0] += tx * sy;
            if (x1 < this.fNumX && y1 < this.fNumY) d[x1 * n + y1] += tx * ty;
            if (x0 < this.fNumX && y1 < this.fNumY) d[x0 * n + y1] += sx * ty;
        }

        if (this.particleRestDensity === 0.0) {
            var sum = 0.0;
            var numFluidCells = 0;

            for (var i = 0; i < this.fNumCells; i++) {
                if (this.cellType[i] === FLUID_CELL) {
                    sum += d[i];
                    numFluidCells++;
                }
            }

            if (numFluidCells > 0)
                this.particleRestDensity = sum / numFluidCells;
        }

// 			for (var xi = 1; xi < this.fNumX; xi++) {
// 				for (var yi = 1; yi < this.fNumY; yi++) {
// 					var cellNr = xi * n + yi;
// 					if (this.cellType[cellNr] !== FLUID_CELL)
// 						continue;
// 					var hx = this.h;
// 					var hy = this.h;

// 					if (this.cellType[(xi - 1) * n + yi] == SOLID_CELL || this.cellType[(xi + 1) * n + yi] == SOLID_CELL)
// 						hx -= this.particleRadius;
// 					if (this.cellType[xi * n + yi - 1] == SOLID_CELL || this.cellType[xi * n + yi + 1] == SOLID_CELL)
// 						hy -= this.particleRadius;

// 					var scale = this.h * this.h / (hx * hy)
// 					d[cellNr] *= scale;
// 				}
// 			}
    }

    transferVelocities(toGrid, flipRatio)
    {
        var n = this.fNumY;
        var h = this.h;
        var h1 = this.fInvSpacing;
        var h2 = 0.5 * h;

        if (toGrid) {

            this.prevU.set(this.u);
            this.prevV.set(this.v);

            this.du.fill(0.0);
            this.dv.fill(0.0);
            this.u.fill(0.0);
            this.v.fill(0.0);

            for (var i = 0; i < this.fNumCells; i++) 
                this.cellType[i] = this.s[i] === 0.0 ? SOLID_CELL : AIR_CELL;

            for (var i = 0; i < this.numParticles; i++) {
                var x = this.particlePos[2 * i];
                var y = this.particlePos[2 * i + 1];
                var xi = clamp(Math.floor(x * h1), 0, this.fNumX - 1);
                var yi = clamp(Math.floor(y * h1), 0, this.fNumY - 1);
                var cellNr = xi * n + yi;
                if (this.cellType[cellNr] === AIR_CELL)
                    this.cellType[cellNr] = FLUID_CELL;
            }
        }
        for (var component = 0; component < 2; component++) {

            var dx = component === 0 ? 0.0 : h2;
            var dy = component === 0 ? h2 : 0.0;

            var f = component === 0 ? this.u : this.v;
            var prevF = component === 0 ? this.prevU : this.prevV;
            var d = component === 0 ? this.du : this.dv;

            for (var i = 0; i < this.numParticles; i++) {
                var x = this.particlePos[2 * i];
                var y = this.particlePos[2 * i + 1];

                x = clamp(x, h, (this.fNumX - 1) * h);
                y = clamp(y, h, (this.fNumY - 1) * h);

                var x0 = Math.min(Math.floor((x - dx) * h1), this.fNumX - 2);
                var tx = ((x - dx) - x0 * h) * h1;
                var x1 = Math.min(x0 + 1, this.fNumX-2);
                
                var y0 = Math.min(Math.floor((y-dy)*h1), this.fNumY-2);
                var ty = ((y - dy) - y0*h) * h1;
                var y1 = Math.min(y0 + 1, this.fNumY-2);

                var sx = 1.0 - tx;
                var sy = 1.0 - ty;

                var d0 = sx*sy;
                var d1 = tx*sy;
                var d2 = tx*ty;
                var d3 = sx*ty;

                var nr0 = x0*n + y0;
                var nr1 = x1*n + y0;
                var nr2 = x1*n + y1;
                var nr3 = x0*n + y1;

                if (toGrid) {
                    var pv = this.particleVel[2 * i + component];
                    f[nr0] += pv * d0;  d[nr0] += d0;
                    f[nr1] += pv * d1;  d[nr1] += d1;
                    f[nr2] += pv * d2;  d[nr2] += d2;
                    f[nr3] += pv * d3;  d[nr3] += d3;
                }
                else {
                    var offset = component === 0 ? n : 1;
                    var valid0 = this.cellType[nr0] !== AIR_CELL || this.cellType[nr0 - offset] !== AIR_CELL ? 1.0 : 0.0;
                    var valid1 = this.cellType[nr1] !== AIR_CELL || this.cellType[nr1 - offset] !== AIR_CELL ? 1.0 : 0.0;
                    var valid2 = this.cellType[nr2] !== AIR_CELL || this.cellType[nr2 - offset] !== AIR_CELL ? 1.0 : 0.0;
                    var valid3 = this.cellType[nr3] !== AIR_CELL || this.cellType[nr3 - offset] !== AIR_CELL ? 1.0 : 0.0;

                    var v = this.particleVel[2 * i + component];
                    var d = valid0 * d0 + valid1 * d1 + valid2 * d2 + valid3 * d3;

                    if (d > 0.0) {

                        var picV = (valid0 * d0 * f[nr0] + valid1 * d1 * f[nr1] + valid2 * d2 * f[nr2] + valid3 * d3 * f[nr3]) / d;
                        var corr = (valid0 * d0 * (f[nr0] - prevF[nr0]) + valid1 * d1 * (f[nr1] - prevF[nr1])
                            + valid2 * d2 * (f[nr2] - prevF[nr2]) + valid3 * d3 * (f[nr3] - prevF[nr3])) / d;
                        var flipV = v + corr;

                        this.particleVel[2 * i + component] = (1.0 - flipRatio) * picV + flipRatio * flipV;
                    }
                }
            }

            if (toGrid) {
                for (var i = 0; i < f.length; i++) {
                    if (d[i] > 0.0)
                        f[i] /= d[i];
                }

                // restore solid cells

                for (var i = 0; i < this.fNumX; i++) {
                    for (var j = 0; j < this.fNumY; j++) {
                        var solid = this.cellType[i * n + j] === SOLID_CELL;
                        if (solid || (i > 0 && this.cellType[(i - 1) * n + j] === SOLID_CELL))
                            this.u[i * n + j] = this.prevU[i * n + j];
                        if (solid || (j > 0 && this.cellType[i * n + j - 1] === SOLID_CELL))
                            this.v[i * n + j] = this.prevV[i * n + j];
                    }
                }
            }
        }
    }

    solveIncompressibility(numIters, dt, overRelaxation, compensateDrift = true) {

        this.p.fill(0.0);
        this.prevU.set(this.u);
        this.prevV.set(this.v);

        var n = this.fNumY;
        var cp = this.density * this.h / dt;

        for (var i = 0; i < this.fNumCells; i++) {
            var u = this.u[i];
            var v = this.v[i];
        }

        for (var iter = 0; iter < numIters; iter++) {

            for (var i = 1; i < this.fNumX-1; i++) {
                for (var j = 1; j < this.fNumY-1; j++) {

                    if (this.cellType[i*n + j] !== FLUID_CELL)
                        continue;

                    var center = i * n + j;
                    var left = (i - 1) * n + j;
                    var right = (i + 1) * n + j;
                    var bottom = i * n + j - 1;
                    var top = i * n + j + 1;

                    var s = this.s[center];
                    var sx0 = this.s[left];
                    var sx1 = this.s[right];
                    var sy0 = this.s[bottom];
                    var sy1 = this.s[top];
                    var s = sx0 + sx1 + sy0 + sy1;
                    if (s === 0.0)
                        continue;

                    var div = this.u[right] - this.u[center] + 
                        this.v[top] - this.v[center];

                    if (this.particleRestDensity > 0.0 && compensateDrift) {
                        var k = 1.0;
                        var compression = this.particleDensity[i*n + j] - this.particleRestDensity;
                        if (compression > 0.0)
                            div = div - k * compression;
                    }

                    var p = -div / s;
                    p *= overRelaxation;
                    this.p[center] += cp * p;

                    this.u[center] -= sx0 * p;
                    this.u[right] += sx1 * p;
                    this.v[center] -= sy0 * p;
                    this.v[top] += sy1 * p;
                }
            }
        }
    }

    updateParticleColors() 
    {
        // for (var i = 0; i < this.numParticles; i++) {
        // 	this.particleColor[3 * i] *= 0.99; 
        // 	this.particleColor[3 * i + 1] *= 0.99
        // 	this.particleColor[3 * i + 2] = 
        // 		clamp(this.particleColor[3 * i + 2] + 0.001, 0.0, 1.0)
        // }

        // return;

        var h1 = this.fInvSpacing;

        for (var i = 0; i < this.numParticles; i++) {

            var s = 0.01;

            this.particleColor[3 * i] = clamp(this.particleColor[3 * i] - s, 0.0, 1.0);
            this.particleColor[3 * i + 1] = clamp(this.particleColor[3 * i + 1] - s, 0.0, 1.0);
            this.particleColor[3 * i + 2] = clamp(this.particleColor[3 * i + 2] + s, 0.0, 1.0);

            var x = this.particlePos[2 * i];
            var y = this.particlePos[2 * i + 1];
            var xi = clamp(Math.floor(x * h1), 1, this.fNumX - 1);
            var yi = clamp(Math.floor(y * h1), 1, this.fNumY - 1);
            var cellNr = xi * this.fNumY + yi;

            var d0 = this.particleRestDensity;

            if (d0 > 0.0) {
                var relDensity = this.particleDensity[cellNr] / d0;
                if (relDensity < 0.7) {
                    var s = 0.8;
                    this.particleColor[3 * i] = s;
                    this.particleColor[3 * i + 1] = s;
                    this.particleColor[3 * i + 2] = 1.0;
                }
            }
        }
    }

    setSciColor(cellNr, val, minVal, maxVal) 
    {
        val = Math.min(Math.max(val, minVal), maxVal- 0.0001);
        var d = maxVal - minVal;
        val = d === 0.0 ? 0.5 : (val - minVal) / d;
        var m = 0.25;
        var num = Math.floor(val / m);
        var s = (val - num * m) / m;
        var r, g, b;

        switch (num) {
            case 0 : r = 0.0; g = s; b = 1.0; break;
            case 1 : r = 0.0; g = 1.0; b = 1.0-s; break;
            case 2 : r = s; g = 1.0; b = 0.0; break;
            case 3 : r = 1.0; g = 1.0 - s; b = 0.0; break;
            default: break;
        }

        this.cellColor[3 * cellNr] = r;
        this.cellColor[3 * cellNr + 1] = g;
        this.cellColor[3 * cellNr + 2] = b;
    }

    updateCellColors() 
    {
        this.cellColor.fill(0.0);

        for (var i = 0; i < this.fNumCells; i++) {

            if (this.cellType[i] === SOLID_CELL) {
                this.cellColor[3*i] = 0.5;
                this.cellColor[3*i + 1] = 0.5;
                this.cellColor[3*i + 2] = 0.5;
            }
            else if (this.cellType[i] === FLUID_CELL) {
                var d = this.particleDensity[i];
                if (this.particleRestDensity > 0.0)
                    d /= this.particleRestDensity;
                this.setSciColor(i, d, 0.0, 2.0);
            }
        }
    }

    simulate(dt, gravity, flipRatio, numPressureIters, numParticleIters, overRelaxation, compensateDrift, separateParticles, obstacleX, abstacleY, obstacleRadius) 
    {
        var numSubSteps = 1;
        var sdt = dt / numSubSteps;

        for (var step = 0; step < numSubSteps; step++) {
            this.integrateParticles(sdt, gravity);
            if (separateParticles)
                this.pushParticlesApart(numParticleIters); 
            this.handleParticleCollisions(obstacleX, abstacleY, obstacleRadius)
            this.transferVelocities(true);
            this.updateParticleDensity();
            this.solveIncompressibility(numPressureIters, sdt, overRelaxation, compensateDrift);
            this.transferVelocities(false, flipRatio);
        }

        this.updateParticleColors();
        this.updateCellColors();

    }
}
export default FluidSimulator;