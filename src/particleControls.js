import React from "react";
import { Input } from "reactstrap";

export default function ParticleControls({
  showParticles,
  showGrid,
  compensateDrift,
  separateParticles,
  paused,
  gravity,
  flipRatio,
  onPausedChange,
  onShowParticlesChange,
  onShowGridChange,
  onCompensateDriftChange,
  onSeparateParticlesChange,
  onSliderChange,
  onGravityChange,
  density,
  onDensityChange,
}) {
  const buttonStyle = (value) => {
    return {
      backgroundColor: value ? "green" : "grey",
    };
  };

  return (
    <div>
      <button
        type="button"
        onClick={onPausedChange}
        value={paused}
        style={buttonStyle(paused)}
        title={paused ? "Resume simulation" : "Pause simulation"}
      >
        {paused ? "Start" : "Pause"}
      </button>
      <button
        type="button"
        onClick={onShowParticlesChange}
        value={showParticles}
        style={buttonStyle(showParticles)}
        title="Toggle visibility of fluid particles."
      >
        Particles
      </button>

      <button
        type="button"
        onClick={onShowGridChange}
        value={showGrid}
        style={buttonStyle(showGrid)}
        title="Toggle visibility of fluid grid."
      >
        Grid
      </button>

      <button
        type="button"
        onClick={onCompensateDriftChange}
        value={compensateDrift}
        style={buttonStyle(compensateDrift)}
        title="Compensate for numerical drift in the simulation."
      >
        Compensate Drift
      </button>

      <button
        type="button"
        onClick={onSeparateParticlesChange}
        value={separateParticles}
        style={buttonStyle(separateParticles)}
        title="Control the separation of fluid particles."
      >
        Separate Particles
      </button>
      <label title="Control the ratio of FLIP (Fluid-Implicit-Particle) to PIC (Particle-In-Cell) method.">
        PIC
      </label>
      <input
        type="range"
        id="flipRatioSlider"
        min="0"
        max="10"
        value={flipRatio * 10}
        className="slider"
        onChange={onSliderChange}
      />
      <label title="Control the ratio of FLIP (Fluid-Implicit-Particle) to PIC (Particle-In-Cell) method.">
        FLIP
      </label>

      <label title="Adjust the strength of gravity affecting the fluid.">
        Gravity
      </label>
      <input
        type="range"
        id="gravitySlider"
        min="-20"
        max="0"
        value={gravity}
        className="slider"
        onChange={onGravityChange}
      />
      <label> {gravity}</label>

      <label>Density</label>
      <Input
        type="number"
        id="densitySlider"
        value={density}
        className="slider"
        onChange={onDensityChange}
        style={{ width: "8px", margin: "0" }}
        min="0"
      />
      <label> {density}</label>
    </div>
  );
}
