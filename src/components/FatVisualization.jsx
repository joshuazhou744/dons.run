import { useEffect, useRef } from "preact/hooks";
import { vertex, fragment } from "../shaders/fatBlob.glsl.js";

// reference balls ordered by visual range
export const references = [
    { name: "Golf ball",    lbs: 0.1,  radiusCm: 2.1,  color: [0.85, 0.85, 0.82], maxFat: 5 },
    { name: "Tennis ball",  lbs: 0.13, radiusCm: 3.3,  color: [0.80, 0.84, 0.20], maxFat: 12 },
    { name: "Softball",     lbs: 0.4,  radiusCm: 4.8,  color: [0.90, 0.82, 0.30], maxFat: 25 },
    { name: "Soccer ball",  lbs: 0.9,  radiusCm: 11.0, color: [0.88, 0.88, 0.86], maxFat: 45 },
    { name: "Basketball",   lbs: 1.4,  radiusCm: 12.1, color: [0.82, 0.46, 0.20], maxFat: 65 },
    { name: "Bowling ball", lbs: 14,   radiusCm: 10.9, color: [0.45, 0.66, 0.72], maxFat: Infinity },
];

export function pickReference(fatMassLbs) {
    for (const ref of references) {
        if (fatMassLbs <= ref.maxFat) return ref;
    }
    return references[references.length - 1];
}

function createSphere(radius, segments) {
    const positions = [];
    const normals = [];
    const displacements = [];
    const indices = [];

    for (let lat = 0; lat <= segments; lat++) {
        const theta = (lat * Math.PI) / segments;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        for (let lon = 0; lon <= segments; lon++) {
            const phi = (lon * 2 * Math.PI) / segments;
            const x = Math.cos(phi) * sinT;
            const y = cosT;
            const z = Math.sin(phi) * sinT;

            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
            displacements.push(Math.random());
        }
    }

    for (let lat = 0; lat < segments; lat++) {
        for (let lon = 0; lon < segments; lon++) {
            const a = lat * (segments + 1) + lon;
            const b = a + segments + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }

    return { positions, normals, displacements, indices };
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function linkProgram(gl) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vertex);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Link error:", gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function uploadMesh(gl, mesh) {
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);

    const normBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);

    const dispBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dispBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.displacements), gl.STATIC_DRAW);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);

    return { posBuf, normBuf, dispBuf, idxBuf, count: mesh.indices.length };
}

function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0,
    ]);
}

function translate(x, y, z) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1,
    ]);
}

function multiply(a, b) {
    const r = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            r[i * 4 + j] =
                a[i * 4] * b[j] +
                a[i * 4 + 1] * b[4 + j] +
                a[i * 4 + 2] * b[8 + j] +
                a[i * 4 + 3] * b[12 + j];
        }
    }
    return r;
}

export function FatVisualization({ fatMassLbs }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    const pulseTimeRef = useRef(-10);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.parentElement.getBoundingClientRect();
            const w = rect.width;
            const h = Math.min(w * 0.65, window.innerHeight * 0.55);
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
        };
        resize();
        window.addEventListener("resize", resize);

        const onMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
            mouseRef.current.active = true;
        };
        const onMouseLeave = () => {
            mouseRef.current.active = false;
        };
        const onClick = () => {
            pulseTimeRef.current = performance.now() * 0.001;
        };
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseleave", onMouseLeave);
        canvas.addEventListener("click", onClick);

        const gl = canvas.getContext("webgl");
        if (!gl) return;

        const program = linkProgram(gl);
        if (!program) return;
        gl.useProgram(program);

        // Fat blob radius from volume
        const fatVolume = fatMassLbs * 454;
        const fatR = Math.pow((3 * fatVolume) / (4 * Math.PI), 1 / 3) / 50;
        const clampedFatR = Math.max(fatR, 0.15);

        // Pick reference based on fat mass
        const ref = pickReference(fatMassLbs);
        const refR = ref.radiusCm / 50;

        const fatMesh = uploadMesh(gl, createSphere(clampedFatR, 48));
        const refMesh = uploadMesh(gl, createSphere(refR, 48));

        const attr = {
            position: gl.getAttribLocation(program, "position"),
            normal: gl.getAttribLocation(program, "normal"),
            displacement: gl.getAttribLocation(program, "displacement"),
        };

        const uni = {
            projectionMatrix: gl.getUniformLocation(program, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(program, "uModelViewMatrix"),
            modelMatrix: gl.getUniformLocation(program, "uModelMatrix"),
            time: gl.getUniformLocation(program, "uTime"),
            radius: gl.getUniformLocation(program, "uRadius"),
            pointerDirection: gl.getUniformLocation(program, "uPointerDirection"),
            pointerStrength: gl.getUniformLocation(program, "uPointerStrength"),
            color: gl.getUniformLocation(program, "uColor"),
            solid: gl.getUniformLocation(program, "uSolid"),
            pulseTime: gl.getUniformLocation(program, "uPulseTime"),
        };

        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.102, 0.110, 0.125, 1.0);

        function drawMesh(mesh, attrs) {
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuf);
            gl.enableVertexAttribArray(attrs.position);
            gl.vertexAttribPointer(attrs.position, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normBuf);
            gl.enableVertexAttribArray(attrs.normal);
            gl.vertexAttribPointer(attrs.normal, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.dispBuf);
            gl.enableVertexAttribArray(attrs.displacement);
            gl.vertexAttribPointer(attrs.displacement, 1, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idxBuf);
            gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
        }

        const maxR = Math.max(clampedFatR, refR);
        const gap = maxR * 1.2;
        const totalSpan = clampedFatR * 2 + gap + refR * 2;
        const blobX = -(totalSpan / 2) + clampedFatR;
        const refX = (totalSpan / 2) - refR;
        const camZ = -(maxR * 2.2 + 2.5);

        let smoothPtrX = 0;
        let smoothPtrY = 0;
        let smoothStrength = 0;

        const render = (t) => {
            t *= 0.001;
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const aspect = canvas.width / canvas.height;
            const proj = perspective(Math.PI / 5, aspect, 0.1, 100);
            const view = translate(0, 0, camZ);

            gl.uniformMatrix4fv(uni.projectionMatrix, false, proj);
            gl.uniform1f(uni.time, t);

            const targetX = mouseRef.current.active ? mouseRef.current.x : 0;
            const targetY = mouseRef.current.active ? mouseRef.current.y : 0;
            const targetStr = mouseRef.current.active ? 1.0 : 0.0;
            smoothPtrX += (targetX - smoothPtrX) * 0.08;
            smoothPtrY += (targetY - smoothPtrY) * 0.08;
            smoothStrength += (targetStr - smoothStrength) * 0.06;

            // fall ball
            const blobModel = translate(blobX, 0, 0);
            gl.uniformMatrix4fv(uni.modelMatrix, false, blobModel);
            gl.uniformMatrix4fv(uni.modelViewMatrix, false, multiply(view, blobModel));
            gl.uniform1f(uni.radius, clampedFatR);
            gl.uniform3f(uni.pointerDirection, smoothPtrX, smoothPtrY, 0.5);
            gl.uniform1f(uni.pointerStrength, smoothStrength);
            gl.uniform3f(uni.color, 0.90, 0.71, 0.04);
            gl.uniform1f(uni.solid, 0.0);
            gl.uniform1f(uni.pulseTime, pulseTimeRef.current);
            drawMesh(fatMesh, attr);

            // reference ball
            const refModel = translate(refX, 0, 0);
            gl.uniformMatrix4fv(uni.modelMatrix, false, refModel);
            gl.uniformMatrix4fv(uni.modelViewMatrix, false, multiply(view, refModel));
            gl.uniform1f(uni.radius, refR);
            gl.uniform3f(uni.pointerDirection, 0, 0, 0);
            gl.uniform1f(uni.pointerStrength, 0);
            gl.uniform3f(uni.color, ref.color[0], ref.color[1], ref.color[2]);
            gl.uniform1f(uni.solid, 1.0);
            gl.uniform1f(uni.pulseTime, -10);
            drawMesh(refMesh, attr);

            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(rafRef.current);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mouseleave", onMouseLeave);
            canvas.removeEventListener("click", onClick);
            window.removeEventListener("resize", resize);
        };
    }, [fatMassLbs]);

    return <canvas ref={canvasRef} class="fat-canvas" />;
}
