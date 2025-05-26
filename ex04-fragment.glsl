#version 300 es
precision highp float;
uniform vec3 color;
uniform vec3 light;
uniform vec3 eye;
out vec4 fragColor;
in vec3 normalv;
in vec3 positionv;
void main() {
    vec3 n = normalize(normalv);
    float diffuse = max(0.0, dot(normalize(n), light));
    vec3 e = normalize(eye);
    vec3 h = normalize(light + e);
    float blinn = pow((max(0.0, dot(h, n))),150.0);
    vec3 lightColor = vec3(1,1,1);
    fragColor = vec4(color * diffuse * lightColor + lightColor * blinn,1.0);
}