import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./Constants";
export let gl;
export let canvas;
export const setupCanvas = function () {
  canvas = document.getElementById("myCanvas");
  if (!canvas) {
    alert("Canvas not found");
    return;
  }
  gl = canvas.getContext("webgl2");
  if (!gl) {
    console.log("WebGL2 not supported");
    gl = canvas.getContext("webgl");
  }
  // gl = canvas.getContext("webgl");
  
  if (!gl) {
    console.log("WebGL not supported, falling back to experimental-webgl");
    gl = canvas.getContext("experimental-webgl");
  }
  console.log("WebGL version is",gl.getParameter(gl.VERSION));
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.focus();
  gl.clearColor(1.0, 0.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  return { gl, canvas };
};


