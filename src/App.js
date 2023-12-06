import React, { useState, useEffect, useCallback } from "react";
import ParticleControls from "./particleControls";
import { scene } from "./Scene";
import { EARTH_GRAVITY } from "./Constants";
import { canvas, setupCanvas } from "./Canvas";
import { cScale } from "./Constants";

export default function App() {
  const [showParticles, setShowParticles] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [compensateDrift, setCompensateDrift] = useState(true);
  const [separateParticles, setSeparateParticles] = useState(true);
  const [paused, setPaused] = useState(false);
  const [gravity, setGravity] = useState(EARTH_GRAVITY);
  const [flipRatio, setFlipRatio] = useState(0.9);
  const [mouseDown, setMouseDown] = useState(false);
  const [density, setDensity] = useState(1.0);

  // Control handlers
  const handlePausedChange = () => {
    setPaused(!paused);
  };

  const handleShowParticlesChange = () => {
    setShowParticles(!showParticles);
  };

  const handleShowGridChange = () => {
    setShowGrid(!showGrid);
  };

  const handleCompensateDriftChange = () => {
    setCompensateDrift(!compensateDrift);
  };

  const handleSeparateParticlesChange = () => {
    setSeparateParticles(!separateParticles);
  };

  const handleSliderChange = (event) => {
    const newFlipRatio = 0.1 * event.target.value;
    setFlipRatio(newFlipRatio);
  };

  const handleGravityChange = (event) => {
    const newGravity = event.target.value;
    setGravity(newGravity);
  };

  const handleDensityChange = (event) => {
    const newDensity = event.target.value;
    setDensity(newDensity);
  };

  // Define event handler functions with useCallback
  const startDrag = useCallback((x, y) => {
    let bounds = canvas.getBoundingClientRect();
    let mx = x - bounds.left - canvas.clientLeft;
    let my = y - bounds.top - canvas.clientTop;
    setMouseDown(true);

    x = mx / cScale;
    y = (canvas.height - my) / cScale;

    scene.setObstacle(x, y, true);
    setPaused(false);
  }, []);

  const drag = useCallback(
    (x, y) => {
      if (mouseDown) {
        let bounds = canvas.getBoundingClientRect();
        let mx = x - bounds.left - canvas.clientLeft;
        let my = y - bounds.top - canvas.clientTop;
        x = mx / cScale;
        y = (canvas.height - my) / cScale;
        scene.setObstacle(x, y, false);
      }
    },
    [mouseDown]
  );

  const endDrag = useCallback(() => {
    setMouseDown(false);
    scene.obstacleVelX = 0.0;
    scene.obstacleVelY = 0.0;
  }, []);

  const handleMouseDown = useCallback(
    (event) => {
      startDrag(event.clientX, event.clientY);
    },
    [startDrag]
  );

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleMouseMove = useCallback(
    (event) => {
      drag(event.clientX, event.clientY);
    },
    [drag]
  );

  const handleTouchStart = useCallback(
    (event) => {
      startDrag(event.touches[0].clientX, event.touches[0].clientY);
    },
    [startDrag]
  );

  const handleTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleTouchMove = useCallback(
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      drag(event.touches[0].clientX, event.touches[0].clientY);
    },
    [drag]
  );

  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case "p":
        setPaused(true);
        break;
      case "s":
        setPaused(false);
        break;
      default:
        break;
    }
  }, []);

  // useEffect for setting up canvas and scene run once on mount
  useEffect(() => {
    setupCanvas();
    scene.setupScene();
  }, []);

  // useEffect for updating scene on state changes
  useEffect(() => {
    scene.gravity = gravity;
    scene.flipRatio = flipRatio;
    scene.showParticles = showParticles;
    scene.showGrid = showGrid;
    scene.compensateDrift = compensateDrift;
    scene.separateParticles = separateParticles;
    scene.paused = paused;
    scene.update();
  }, [
    showParticles,
    showGrid,
    compensateDrift,
    separateParticles,
    paused,
    flipRatio,
    gravity,
  ]);

  // useEffect for setting up and cleaning up event listeners
  useEffect(() => {
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleKeyDown,
  ]);

  return (
    <div className="App" style={{ boxSizing: "content-box" }}>
      <header className="App-header">
        <h3>Fluid Simulator</h3>
      </header>
      <body className="App-body" style={{ overflow: "hidden" }}>
        <ParticleControls
          showParticles={showParticles}
          showGrid={showGrid}
          compensateDrift={compensateDrift}
          separateParticles={separateParticles}
          paused={paused}
          gravity={gravity}
          flipRatio={flipRatio}
          density={density}
          onPausedChange={handlePausedChange}
          onShowParticlesChange={handleShowParticlesChange}
          onShowGridChange={handleShowGridChange}
          onCompensateDriftChange={handleCompensateDriftChange}
          onSeparateParticlesChange={handleSeparateParticlesChange}
          onSliderChange={handleSliderChange}
          onGravityChange={handleGravityChange}
          onDensityChange={handleDensityChange}
        />
        <canvas id="myCanvas" />
      </body>
    </div>
  );
}
