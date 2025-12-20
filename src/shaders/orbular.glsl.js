export const vertex = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vNormal;
attribute float displacement;
uniform vec3 pointer_direction;
uniform float extrusion;
uniform float time;
uniform float radius;
uniform float scale;

#define M_PI 3.1415926535897932384626433832795

void main() {
    vNormal = normal;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    float pointerLen = length(pointer_direction);
    float dotVal = 0.0;
    if (pointerLen > 0.0001) {
        dotVal = dot(normalize(vNormal), pointer_direction / pointerLen);
    }
    float asinDotVal = asin(dotVal);
    float sinDotVal = 1.051462224 * sin(asinDotVal * 0.8);
    float level = pow(max(sinDotVal, 0.0), 16.0);
    float wobbleLevel = pow(max(sinDotVal, 0.0), 4.0);

    float wobble = 6.0 * sin(10.0 * displacement * radius + time);
    float slowWobble = 5.0 * sin(2.0 * displacement * radius + time * 0.3);

    float extrusion_ = min(max(extrusion - 0.9 * radius, 0.0) / scale, 1.5 * radius);

    vec3 newPosition = position + normalize(normal)
        * vec3(level * displacement * extrusion_ + wobble * wobbleLevel)
        + normalize(normal) * slowWobble;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const fragment = /* glsl */ `
uniform vec3 rippleCenter;
uniform float rippleStartTime;
uniform float time;
uniform float radius;
varying vec3 vNormal;
varying vec3 vWorldPosition;

vec3 baseColor = vec3(0.90, 0.71, 0.04);
vec3 rippleColor = vec3(1.0, 0.0, 0.0);

void main() {
    vec3 light = vec3(0.8, 0.8, 10.0);
    light = normalize(light);
    float dProd = 1.0;

    float elapsed = time - rippleStartTime;
    if (elapsed < 0.0) {
        gl_FragColor = vec4(dProd * baseColor, 1.0);
        return;
    }

    float dist = distance(vWorldPosition, rippleCenter);
    float rippleRadius = elapsed * 140.0;
    float rippleThickness = 100.0;

    float edge = smoothstep(rippleRadius - rippleThickness, rippleRadius, dist)
        * (1.0 - smoothstep(rippleRadius, rippleRadius + rippleThickness, dist));

    vec3 color = mix(baseColor, rippleColor, edge);
    gl_FragColor = vec4(dProd * color, 1.0);
}
`;
