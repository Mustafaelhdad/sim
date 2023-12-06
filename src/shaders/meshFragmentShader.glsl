#version 300 es
precision mediump float;
in vec3 fragColor;
out vec3 fragColor;

void main() {
    fragOutput = vec4(fragColor, 1.0);
}