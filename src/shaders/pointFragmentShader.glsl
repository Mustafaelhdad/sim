#version 300 es
precision mediump float;
in vec3 fragColor;
in float fragDrawDisk;
out vec4 fragColorOut;

void main() {
    if(fragDrawDisk == 1.0) {
        float rx = 0.5 - gl_PointCoord.x;
        float ry = 0.5 - gl_PointCoord.y;
        float r2 = rx * rx + ry * ry;
        if(r2 > 0.25)
            discard;
    }
    fragOutput = vec4(fragColor, 1.0);
}