export const vertex = /* glsl */ `
precision mediump float;

attribute vec3 position;
attribute vec3 normal;
attribute float displacement;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uModelMatrix;
uniform vec3 uPointerDirection;
uniform float uPointerStrength;
uniform float uTime;
uniform float uRadius;
uniform float uSolid;
uniform float uPulseTime;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vDisplacement;
varying float vPulse;

void main() {
    vNormal = normal;
    vDisplacement = displacement;
    vec4 worldPosition = uModelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Gentle organic wobble — slow, layered sine waves (disabled for solid objects)
    float wave1 = sin(displacement * 12.0 + uTime * 0.8) * 0.012;
    float wave2 = sin(displacement * 7.0 - uTime * 0.5) * 0.018;
    float wave3 = sin(displacement * 20.0 + uTime * 1.2) * 0.006;
    float wobble = (wave1 + wave2 + wave3) * uRadius * (1.0 - uSolid);

    // Click pulse — expand outward then settle
    float pulseElapsed = uTime - uPulseTime;
    float pulseWave = 0.0;
    vPulse = 0.0;
    if (pulseElapsed > 0.0 && pulseElapsed < 1.5) {
        float decay = exp(-pulseElapsed * 3.0);
        // Ripple ring that propagates across the surface
        float phase = displacement * 6.28 - pulseElapsed * 4.0;
        pulseWave = sin(phase) * decay * uRadius * 0.06;
        // Color pulse: ring that travels across surface
        float ring = sin(displacement * 12.0 - pulseElapsed * 8.0);
        vPulse = max(ring, 0.0) * decay;
    }

    // Mouse interaction — push the surface toward the pointer
    float pointerLen = length(uPointerDirection);
    float pointerDeform = 0.0;
    if (pointerLen > 0.001) {
        vec3 pDir = uPointerDirection / pointerLen;
        float alignment = dot(normalize(normal), pDir);
        // Very tight, narrow bulge toward pointer
        float bulge = pow(max(alignment, 0.0), 16.0);
        pointerDeform = bulge * uPointerStrength * uRadius * 0.6;
    }

    vec3 newPosition = position + normal * (wobble + pointerDeform + pulseWave);

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const fragment = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uRadius;
uniform vec3 uColor;
uniform float uSolid;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vDisplacement;
varying float vPulse;

void main() {
    // Simple directional lighting
    vec3 lightDir = normalize(vec3(0.5, 0.8, 1.0));
    float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);

    // Ambient + diffuse
    float lighting = 0.35 + 0.65 * diffuse;

    // Subtle subsurface-like color variation (disabled for solid objects)
    float variation = sin(vDisplacement * 15.0 + uTime * 0.3) * 0.05 * (1.0 - uSolid);

    vec3 color = uColor * (lighting + variation);

    // Click pulse highlight — bright white flash that ripples across
    vec3 pulseColor = mix(uColor, vec3(1.0), 0.6);
    color = mix(color, pulseColor * lighting, vPulse * (1.0 - uSolid));

    gl_FragColor = vec4(color, 1.0);
}
`;
