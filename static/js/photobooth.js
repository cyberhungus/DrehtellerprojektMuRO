import * as THREE from 'three';

import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// Which boats to offer for preview/capture — same folder convention as the main viewer:
// static/models/Boot N/Boot N.gltf (or .obj + .mtl fallback).
const boatCount = 6;
const modelsToCapture = [true, true, true, true, true, true];

// Output image size, in pixels. Independent of the on-page preview canvas size —
// the renderer gets resized to this just before each capture.
const outputWidth = 1600;
const outputHeight = 1600;

let camera, scene, renderer;
let currentModel = null; // the currently-loaded pivot group, so it can be removed before loading the next one

let previewCanvasEl, statusLogEl, folderStatusEl;
let posXInput, posYInput, posZInput, rotXInput, rotYInput, rotZInput;
let modelSelectEl, previewBtn, captureAllBtn, chooseFolderBtn;

let outputDirHandle = null; // set once the user picks a folder via the File System Access API

init();

async function init() {

    previewCanvasEl = document.getElementById('preview-canvas');
    statusLogEl = document.getElementById('status-log');
    folderStatusEl = document.getElementById('folder-status');

    posXInput = document.getElementById('pos-x');
    posYInput = document.getElementById('pos-y');
    posZInput = document.getElementById('pos-z');
    rotXInput = document.getElementById('rot-x');
    rotYInput = document.getElementById('rot-y');
    rotZInput = document.getElementById('rot-z');

    modelSelectEl = document.getElementById('model-select');
    previewBtn = document.getElementById('preview-btn');
    captureAllBtn = document.getElementById('capture-all-btn');
    chooseFolderBtn = document.getElementById('choose-folder-btn');

    // Defaults match the main viewer's camera starting position, so preview roughly
    // matches what you're used to seeing — tweak from here.
    posXInput.value = -0.16;
    posYInput.value = 2.7;
    posZInput.value = 2.85;
    rotXInput.value = 0;
    rotYInput.value = 0;
    rotZInput.value = 0;

    for (let i = 1; i <= boatCount; i++) {
        if (!modelsToCapture[i - 1]) continue;
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = `Boot ${i}`;
        modelSelectEl.appendChild(opt);
    }

    // Scene setup — transparent background is the whole point of this tool, so no
    // background color/plane, and the renderer clears to alpha 0.
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000); // aspect fixed to 1 (square output); adjust if you want non-square shots


    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true});
    renderer.setClearColor(0x000000, 0); // fully transparent clear
    renderer.setSize(outputWidth, outputHeight);
    previewCanvasEl.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture; // lighting only — doesn't affect background alpha

    [posXInput, posYInput, posZInput, rotXInput, rotYInput, rotZInput].forEach((input) => {
        input.addEventListener('input', applyCameraSettings);
    });

    previewBtn.addEventListener('click', onPreviewClicked);
    captureAllBtn.addEventListener('click', onCaptureAllClicked);
    chooseFolderBtn.addEventListener('click', onChooseFolderClicked);

    if (!window.showDirectoryPicker) {
        chooseFolderBtn.disabled = true;
        folderStatusEl.textContent = 'Your browser doesn\'t support folder access (try Chrome/Edge) — captures will download individually instead.';
    }
applyCameraSettings();
}

function applyCameraSettings() {

    camera.position.set(
        parseFloat(posXInput.value) || 0,
        parseFloat(posYInput.value) || 0,
        parseFloat(posZInput.value) || 0
    );

    camera.rotation.set(
        THREE.MathUtils.degToRad(parseFloat(rotXInput.value) || 0),
        THREE.MathUtils.degToRad(parseFloat(rotYInput.value) || 0),
        THREE.MathUtils.degToRad(parseFloat(rotZInput.value) || 0)
    );

    renderer.render(scene, camera); // re-render immediately so slider drags feel live

}

function log(message) {
    const line = document.createElement('div');
    line.textContent = message;
    statusLogEl.appendChild(line);
    statusLogEl.scrollTop = statusLogEl.scrollHeight;
}

async function urlExists(url) {
    try {
        const res = await fetch(url, {method: 'HEAD'});
        return res.ok;
    } catch (e) {
        return false;
    }
}

// Strips directory info off texture map lines in a raw .mtl file's text — see main.js
// for the full explanation. Duplicated here so this tool has no dependency on main.js.
function stripMtlTexturePaths(mtlText) {

    const mapDirectives = ['map_Kd', 'map_Ks', 'map_Ka', 'map_Bump', 'bump', 'map_d', 'map_Ns', 'disp', 'decal', 'refl'];

    return mtlText
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();
            const directive = mapDirectives.find((d) => trimmed.startsWith(d + ' ') || trimmed.startsWith(d + '\t'));
            if (!directive) return line;
            const parts = trimmed.slice(directive.length).trim().split(/\s+/);
            const fileName = parts[parts.length - 1].replace(/\\/g, '/').split('/').pop();
            parts[parts.length - 1] = fileName;
            return `${directive} ${parts.join(' ')}`;
        })
        .join('\n');

}

// Signed-volume winding fix — same as main.js. Duplicated for the same no-dependency reason.
function getSignedVolume(geometry) {

    const pos = geometry.attributes.position;
    const index = geometry.index;
    const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
    let volume = 0;
    const triCount = index ? index.count : pos.count;

    for (let i = 0; i < triCount; i += 3) {
        const i1 = index ? index.getX(i) : i;
        const i2 = index ? index.getX(i + 1) : i + 1;
        const i3 = index ? index.getX(i + 2) : i + 2;
        p1.fromBufferAttribute(pos, i1);
        p2.fromBufferAttribute(pos, i2);
        p3.fromBufferAttribute(pos, i3);
        volume += p1.dot(p2.clone().cross(p3)) / 6;
    }

    return volume;

}

function isVolumeMeasurable(geometry, volume) {
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere.radius;
    const scaleReference = Math.pow(radius, 3);
    return scaleReference > 0 && Math.abs(volume) / scaleReference > 0.01;
}

function fixInvertedWinding(object3D) {

    object3D.traverse((node) => {

        if (!node.isMesh) return;
        const geometry = node.geometry;
        const volume = getSignedVolume(geometry);

        if (!isVolumeMeasurable(geometry, volume)) return;
        if (volume >= 0) return;

        if (geometry.index) {
            const arr = geometry.index.array;
            for (let i = 0; i < arr.length; i += 3) {
                const tmp = arr[i];
                arr[i] = arr[i + 2];
                arr[i + 2] = tmp;
            }
            geometry.index.needsUpdate = true;
        } else {
            for (const attr of Object.values(geometry.attributes)) {
                const itemSize = attr.itemSize;
                for (let i = 0; i < attr.count; i += 3) {
                    const a = i * itemSize, c = (i + 2) * itemSize;
                    for (let k = 0; k < itemSize; k++) {
                        const tmp = attr.array[a + k];
                        attr.array[a + k] = attr.array[c + k];
                        attr.array[c + k] = tmp;
                    }
                }
                attr.needsUpdate = true;
            }
        }

        geometry.computeVertexNormals();

    });

}

// Same GLTF-first, OBJ+MTL-fallback loader as main.js.
async function loadBoatModel(folderAndFile) {

    const folderPath = `static/models/${folderAndFile}/`;
    const gltfPath = `${folderPath}${folderAndFile}.gltf`;
    const objPath = `${folderPath}${folderAndFile}.obj`;
    const mtlPath = `${folderPath}${folderAndFile}.mtl`;

    if (await urlExists(gltfPath)) {

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('static/js/vendor/three/examples/jsm/libs/draco/gltf/');
        dracoLoader.setDecoderConfig({type: 'js'});
        const gltfLoader = new GLTFLoader().setCrossOrigin('anonymous').setDRACOLoader(dracoLoader);

        const gltf = await new Promise((resolve, reject) => {
            gltfLoader.load(gltfPath, resolve, undefined, reject);
        });

        return gltf.scene;

    }

    if (!(await urlExists(objPath))) {
        throw new Error(`Neither ${gltfPath} nor ${objPath} exist`);
    }

    let materials = null;

    if (await urlExists(mtlPath)) {
        const rawMtlText = await (await fetch(mtlPath)).text();
        const cleanedMtlText = stripMtlTexturePaths(rawMtlText);
        const mtlLoader = new MTLLoader().setPath(folderPath);
        materials = mtlLoader.parse(cleanedMtlText, folderPath);
        materials.preload();
    }

    const objLoader = new OBJLoader().setPath(folderPath);
    if (materials) objLoader.setMaterials(materials);

    return await new Promise((resolve, reject) => {
        objLoader.load(`${folderAndFile}.obj`, resolve, undefined, reject);
    });

}

// Loads one boat, replacing whatever was previously in the scene. No crossfade needed
// here (unlike the main viewer) so materials are just set to fully opaque normally —
// transparent stays false, which means three.js ignores any alpha baked into the
// source textures entirely, avoiding the whole hole-punching issue main.js had to
// work around.
async function loadAndPrepareModel(boatIndex) {

    if (currentModel) {
        scene.remove(currentModel);
        currentModel = null;
    }

    const folderAndFile = `Boot ${boatIndex}`;
    log(`Loading ${folderAndFile}…`);

    const model = await loadBoatModel(folderAndFile);
    fixInvertedWinding(model);

    model.traverse((node) => {

        if (!node.isMesh) return;

        node.castShadow = false;
        node.receiveShadow = false;

        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
            mat.transparent = false; // ignores baked texture alpha — no crossfade here, so no need to keep it true
            mat.side = THREE.DoubleSide; // avoids angle-dependent culling on thin/open geometry (railings, ladders)
            if ('transmission' in mat) mat.transmission = 0; // kill any baked-in glass transparency
            mat.needsUpdate = true;
        });

    });

    model.scale.setScalar(0.03); // matches the main viewer's model scale

    const pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    currentModel = pivot;

    log(`${folderAndFile} loaded.`);

    return pivot;

}

async function onPreviewClicked() {

    previewBtn.disabled = true;

    try {
        const boatIndex = parseInt(modelSelectEl.value, 10);
        await loadAndPrepareModel(boatIndex);
        applyCameraSettings(); // also triggers a render
    } catch (error) {
        log(`Error: ${error.message}`);
        console.error(error);
    } finally {
        previewBtn.disabled = false;
    }

}

async function onChooseFolderClicked() {

    try {
        outputDirHandle = await window.showDirectoryPicker();
        folderStatusEl.textContent = `Saving to: ${outputDirHandle.name}`;
    } catch (error) {
        // User cancelled the picker — not an error worth logging loudly
        if (error.name !== 'AbortError') console.error(error);
    }

}

// Renders the current scene at outputWidth×outputHeight and returns a PNG Blob.
async function captureCurrentFrameAsPng() {

    renderer.setSize(outputWidth, outputHeight);
    camera.aspect = outputWidth / outputHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);

    return await new Promise((resolve) => {
        renderer.domElement.toBlob(resolve, 'image/png');
    });

}

async function saveBlob(blob, fileName) {

    if (outputDirHandle) {

        const fileHandle = await outputDirHandle.getFileHandle(fileName, {create: true});
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

    } else {

        // Fallback for browsers without the File System Access API (e.g. Firefox) —
        // triggers an individual download per image instead of writing into one folder.
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

    }

}

async function onCaptureAllClicked() {

    captureAllBtn.disabled = true;
    previewBtn.disabled = true;

    try {

        for (let i = 1; i <= boatCount; i++) {

            if (!modelsToCapture[i - 1]) continue;

            const folderAndFile = `Boot ${i}`;

            try {

                await loadAndPrepareModel(i);
                applyCameraSettings();

                const blob = await captureCurrentFrameAsPng();
                await saveBlob(blob, `${folderAndFile}.png`);

                log(`Saved ${folderAndFile}.png`);

            } catch (error) {

                log(`Failed on ${folderAndFile}: ${error.message}`);
                console.error(error);

            }

        }

        log('All done.');

        // Restore the on-screen preview canvas size after the batch run, since capture
        // temporarily resized the renderer to the full output resolution.
        renderer.setSize(outputWidth, outputHeight);

    } finally {

        captureAllBtn.disabled = false;
        previewBtn.disabled = false;

    }

}