#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec3 normal;
uniform mat4 mv;
uniform mat4 p;
out vec3 normalv;
out vec3 positionv;
void main() {
    gl_Position = p * mv * position;
    positionv = vec3(mv * position);
    normalv = normal;
}