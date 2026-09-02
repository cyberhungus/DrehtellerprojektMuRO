import * as THREE from 'three';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

let camera, scene, renderer, controls;
let ambientLight, directionalLight, directionalLight2; // hoisted so the debug-overlay light controls can reach them
let lightVisual1, lightVisual2; // small sphere+line shown per light while the debug overlay (H) is open
// Toggle which boat models are loaded/active — index 0 = Boot 1, index 1 = Boot 2, etc.
// Set to false to skip loading that model entirely (useful for testing/debugging).
const modelEnabled = [true, true, false, false, false, false];

// Edit this to customize what each button shows and what the top-right status text
// says when that button is clicked. Index matches modelEnabled / data-index (0 = button 1, etc).
// "label" overrides the button's text — leave as null to just use the model's loaded name instead.
// "statusText" is what appears top-right on click — leave as null to fall back to the model's name.
const buttonConfig = [
    {label: "Standard", statusText: "Standard"}, // Model 1
    {label: "Kran", statusText: "Greifer"}, // Model 2
    {label: "Spezial", statusText: "Spezial"}, // Model 3
    {label: null, statusText: null}, // Model 4
    {label: null, statusText: null}, // Model 5
    {label: null, statusText: null}, // Model 6
    {label: null, statusText: null}, // Model 7
    {label: null, statusText: null}  // Model 8
];

// For Aruco Based Detection
let targetYaw = 0; // degrees, updated by SSE
let rotationLerpSpeed = 4.5; // higher = snappier turn, tune to taste

// For Keyboard Movement (DEBUG)
const moveState = {forward: false, backward: false, left: false, right: false, up: false, down: false};
const moveSpeed = 5; // units per second, tune to your scene scale

const clock = new THREE.Clock();

// Screensaver
const screensaverTimeout = 60000; // ms of inactivity before screensaver shows — adjust as needed
let screensaverTimer = null;
let screensaverEl, screensaverActive = false;

// Model visibility toggling — index matches button data-index
let toggleableModels = []; // populated once models are loaded, see below
let activeModelIndex = null; // tracks most recently toggled-on model
let hasSetInitialActiveModel = false;

//For Hotspot Overlay
let hotspotLayer;
const hotspots = []; // { id, object, localPosition, minAngle, maxAngle, el, onClick }

// Reused every frame instead of re-allocated
const _worldPos = new THREE.Vector3();
const _projected = new THREE.Vector3();

// For Debug Overlay - press H:
let debugOverlayVisible = false;
let debugOverlayEl, debugModelNameEl, debugCamPosEl, debugCamRotEl, debugModelPosEl, debugModelRotEl;

// For hotspot placement tool (Press P)
let placementModeActive = false;
const placementRaycaster = new THREE.Raycaster();
const placementMouse = new THREE.Vector2();

// Hotspot overlay - becomes visible when clicking a bubble in the models
let hotspotOverlayEl, hotspotOverlayTitleEl, hotspotOverlayTextEl, hotspotOverlayImagesEl;

// Loading overlay - shown during startup while models are fetched
let loadingOverlayEl, loadingTitleEl, loadingCurrentFileEl, loadingBarFillEl, loadingProgressTextEl,
    loadingOverallTextEl;

// Connection warning (camera/serial)
let connectionWarningEl, connectionWarningTextEl, connectionWarningDismissEl;
let connectionWarningDismissedFor = null; // text of the message the user dismissed — a *different* problem re-shows it
const CONNECTION_POLL_INTERVAL = 2000; // ms between /api/state polls

// Model-switch cover overlay — hides the instant swap between models (replaces the
// old opacity crossfade, which caused overlapping translucent surfaces to blend
// toward the white scene background). Must match the CSS transition duration on
// #model-switch-overlay in index.html.
let switchOverlayEl;
let switchInProgress = false;
const switchTransitionMs = 300;

// Drawer + status text
let drawerToggleEl, toggleBarEl, statusTextEl;
let drawerOpen = false;


const hotspotDefinitions = {

    0: [ // Boot 1
        {
            id: 'boot1-engine',
            localPosition: new THREE.Vector3(0, 0, 0),
            minAngle: 315, // degrees — hotspot shows only while the camera sits within this arc
            maxAngle: 45,  // wraps through 0°, e.g. 315°→360°/0°→45°
            content: {
                title: 'Motor',
                text: 'Der Motor liefert 150 PS und ermöglicht eine Höchstgeschwindigkeit von 45 km/h.',
                images: ['static/images/hotspots/engine-1.jpg']
            }
        },
        {
            id: 'boot1-pipe',
            localPosition: new THREE.Vector3(1.5, 0, 0),
            minAngle: 0, // degrees — hotspot shows only while the camera sits within this arc
            maxAngle: 358,  // wraps through 0°, e.g. 315°→360°/0°→45°
            content: {
                title: 'Pipe',
                text: 'Fat smokestack remove all bad air ',
                images: ['static/images/hotspots/engine-1.jpg']
            }
        }
    ],

    1: [ // Boot 2
        {
            id: 'boot2-cabin',
            localPosition: new THREE.Vector3(0, 0.8, 0.3),
            minAngle: 135,
            maxAngle: 225,
            content: {
                title: 'Kabine',
                text: 'Die Kabine bietet Platz für bis zu 4 Personen inklusive Navigationssystem.',
                images: ['static/images/hotspots/cabin-1.jpg']
            }
        }
    ]

    // 2: [ ... Boot 3 hotspots ... ],
    // 3: [ ... Boot 4 hotspots ... ],
    // 4: [ ... Boot 5 hotspots ... ],
    // 5: [ ... Boot 6 hotspots ... ],

};

initLoadingOverlay();
init();
initLightControls();
initDrawer();
initServerSentEvents();
initKeyboardControls();
initScreensaver();
initToggleButtons();
initDebugOverlay();
initHotspotEngine();
initHotspotOverlay();
initConnectionWarning();
initSwitchOverlay();
initTrackingControls();

function initServerSentEvents() {

    const eventSource = new EventSource('/stream');

    eventSource.onmessage = function (event) {

        console.log('New markers detected:', event.data);

        if (event.data && event.data !== "[]") {

            const yawDegrees = parseFloat(event.data.replace("[", "").replace("]", ""));
            targetYaw = THREE.MathUtils.degToRad(yawDegrees);

        }

    };

    // Non-zero encoder readings (STEPS/SPEED/DIR) mean someone's physically
    // spinning the object — treat that as user activity, same as mouse/keyboard,
    // so the screensaver doesn't kick in mid-interaction.
    eventSource.addEventListener('encoder', function () {
        resetScreensaverTimer();
    });

}

function initKeyboardControls() {

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

}

function onKeyDown(event) {

    switch (event.code) {

        case 'ArrowUp':
        case 'KeyW':
            moveState.forward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveState.backward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveState.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveState.right = true;
            break;
        case 'KeyQ':
            moveState.down = true;
            break;
        case 'KeyE':
            moveState.up = true;
            break;

    }

}

function onKeyUp(event) {

    switch (event.code) {

        case 'ArrowUp':
        case 'KeyW':
            moveState.forward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveState.backward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveState.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveState.right = false;
            break;
        case 'KeyQ':
            moveState.down = false;
            break;
        case 'KeyE':
            moveState.up = false;
            break;

    }

}

function updateCameraMovement(delta) {

    if (!moveState.forward && !moveState.backward && !moveState.left &&
        !moveState.right && !moveState.up && !moveState.down) return;

    const distance = moveSpeed * delta;

    // Get camera's forward and right directions, flattened so movement stays level
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const moveVector = new THREE.Vector3();

    if (moveState.forward) moveVector.add(forward);
    if (moveState.backward) moveVector.sub(forward);
    if (moveState.right) moveVector.add(right);
    if (moveState.left) moveVector.sub(right);
    if (moveState.up) moveVector.y += 1;
    if (moveState.down) moveVector.y -= 1;

    if (moveVector.lengthSq() > 0) {

        moveVector.normalize().multiplyScalar(distance);

        camera.position.add(moveVector);
        controls.target.add(moveVector); // keep orbit target in sync so OrbitControls doesn't snap back

    }

}

// Signed volume of a closed mesh — negative means its triangle winding is
// inside-out relative to a normal, consistently-wound mesh.
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


// Draws a texture's image onto an opaque white canvas, discarding any alpha channel
// baked into the source file. Needed because registerToggleableModel keeps
// mat.transparent = true, which means three.js still honors a texture's own
// per-pixel alpha — this removes that data so a texture's alpha channel can't punch
// holes in the model regardless of what mat.opacity is set to.
function flattenTextureAlpha(texture) {

    if (!texture || !texture.image || !texture.image.width) return;

    const img = texture.image;
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // fully-transparent source pixels become opaque white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    texture.image = canvas;
    texture.needsUpdate = true;
}

// Flat/open geometry (railings, decals, thin panels) has no real "inside", so its
// computed volume is just floating-point noise near zero — this checks whether the
// volume is large enough relative to the mesh's size to be a meaningful signal at all.
function isVolumeMeasurable(geometry, volume) {

    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere.radius;
    const scaleReference = Math.pow(radius, 3);

    return scaleReference > 0 && Math.abs(volume) / scaleReference > 0.01;

}

// Reverses triangle winding (swaps vertex 0 and 2 of every triangle) on any closed
// mesh whose winding comes out inside-out — fixes disappearing faces caused by
// inconsistent winding baked into the source model (mirrored geometry, bad exports, etc).
// Skips open/flat geometry where "inside vs outside" isn't a meaningful concept.
function fixInvertedWinding(object3D) {

    object3D.traverse((node) => {

        if (!node.isMesh) return;

        const geometry = node.geometry;
        const volume = getSignedVolume(geometry);

        if (!isVolumeMeasurable(geometry, volume)) {
            console.log(`Skipping "${node.name}" — too flat/open to reliably tell if winding is inverted`);
            return;
        }

        if (volume >= 0) return; // already correctly wound

        console.log(`Fixing inverted winding on mesh "${node.name}" (material: ${node.material.name || 'unnamed'})`);

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

        geometry.computeVertexNormals(); // normals must be recomputed to match the corrected winding

    });

}

// Loads "<folder>/<folderAndFile>.gltf" via GLTFLoader.
async function loadBoatModel({gltfLoader, folderPath, folderAndFile, onProgress}) {

    const gltfPath = `${folderPath}${folderAndFile}.gltf`;

    const gltf = await new Promise((resolve, reject) => {

        gltfLoader.load(
            gltfPath,
            resolve,
            (xhr) => onProgress(xhr.total > 0 ? xhr.loaded / xhr.total : 0),
            reject
        );

    });

    return gltf.scene;

}

async function init() {
// Set the camera position above the model and pointing downwards to center on the model
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(-2.42, 1.08, 1.06); // Set above the model (adjust height based on scale and size)
    camera.rotation.set(57, 52.2, 50.5); // Ensures it's looking at the center; adjust to the middle of your scene if needed

// Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // white background — must match #model-switch-overlay's background in index.html

    // Lights: moody via a very low, cool-tinted ambient (keeps shadows deep instead of
    // washing them out) plus a strong warm key light with tight, high-res shadows, and
    // a dim cool fill light so the shadow side doesn't go pure black.
    // ambientLight/directionalLight variable names are unchanged — initLightControls()
    // binds the light panel sliders to these specific variables.
    ambientLight = new THREE.AmbientLight(0x223344, 0.025); // slightly lower than before — a bit more contrast, darker shadows
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xfff1d0, 10); // warm, punchy key light
    directionalLight.position.set(4, 12, 6); // low, angled position for longer, more dramatic shadows
    directionalLight.position.set(4, 12, 6); // low, angled position for longer, more dramatic shadows
    directionalLight.castShadow = true;

    // Higher-res, tightly-fitted shadow camera — sharp shadow edges read as more
    // "cinematic" than the soft, low-res shadows the old wide/loose camera produced.
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -4;
    directionalLight.shadow.camera.right = 4;
    directionalLight.shadow.camera.top = 4;
    directionalLight.shadow.camera.bottom = -4;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 30;
    directionalLight.shadow.bias = -0.0005; // reduces shadow acne at this higher resolution

    scene.add(directionalLight);

        directionalLight2 = new THREE.DirectionalLight(0xff00ff, 10); // warm, punchy key light
    directionalLight2.position.set(6, 8, -4); // low, angled position for longer, more dramatic shadows
    directionalLight2.castShadow = true;

    // Higher-res, tightly-fitted shadow camera — sharp shadow edges read as more
    // "cinematic" than the soft, low-res shadows the old wide/loose camera produced.
    directionalLight2.shadow.mapSize.width = 1024;
    directionalLight2.shadow.mapSize.height = 1024;
    directionalLight2.shadow.camera.left = -4;
    directionalLight2.shadow.camera.right = 4;
    directionalLight2.shadow.camera.top = 4;
    directionalLight2.shadow.camera.bottom = -4;
    directionalLight2.shadow.camera.near = 0.5;
    directionalLight2.shadow.camera.far = 30;
    directionalLight2.shadow.bias = -0.0005; // reduces shadow acne at this higher resolution

    scene.add(directionalLight2);

    lightVisual1 = createLightVisual(0xff5555);
    lightVisual1.group.visible = debugOverlayVisible;
    scene.add(lightVisual1.group);

    lightVisual2 = createLightVisual(0x55aaff);
    lightVisual2.group.visible = debugOverlayVisible;
    scene.add(lightVisual2.group);
    // Dim, cool rim/fill light from the opposite side — preserves some shadow-side
    // detail and adds a bit of separation without flattening the contrast.
    const fillLight = new THREE.DirectionalLight(0x3a5a8f, 0.3);
    fillLight.position.set(-6, 3, 5);
    scene.add(fillLight);

    scene.add(camera);


    const dracoLoader = new DRACOLoader();

    dracoLoader.setDecoderPath('static/js/vendor/three/examples/jsm/libs/draco/gltf/'); // note the /gltf/ subfolder — that's the JS-based decoder variant, most compatible

    dracoLoader.setDecoderConfig({type: 'js'}); // force JS decoder, skip WASM entirely
    const gltfLoader = new GLTFLoader().setCrossOrigin('anonymous').setDRACOLoader(dracoLoader);

    const boatCount = 6;
    const enabledCount = modelEnabled.filter(Boolean).length;
    let modelsLoadedSoFar = 0;

    for (let i = 1; i <= boatCount; i++) {

        const modelIndex = i - 1; // toggleableModels / hotspotDefinitions index, 0-based

        if (!modelEnabled[modelIndex]) {
            console.log(`Skipping Boot ${i} (disabled via modelEnabled)`);
            continue; // skip this model entirely — no fetch, no registration
        }

        const folderAndFile = `Boot ${i}`;
        const folderPath = `static/models/${folderAndFile}/`;

        updateLoadingProgress({
            fileName: folderAndFile,
            fileProgress: 0,
            modelsLoaded: modelsLoadedSoFar,
            modelsTotal: enabledCount
        });

        try {

            const model = await loadBoatModel({
                gltfLoader,
                folderPath,
                folderAndFile,
                onProgress: (fileProgress) => updateLoadingProgress({
                    fileName: folderAndFile,
                    fileProgress,
                    modelsLoaded: modelsLoadedSoFar,
                    modelsTotal: enabledCount
                })
            });

            fixInvertedWinding(model);

            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            model.scale.setScalar(0.03); // adjust per-model if needed

            //         const boundingBox = new THREE.Box3().setFromObject(model);
            //      const center = boundingBox.getCenter(new THREE.Vector3());

            //    model.position.sub(center);
            //    model.position.y = model.position.y - boundingBox.min.y + center.y;

            const pivot = new THREE.Group();
            pivot.add(model);
            scene.add(pivot);

            registerHotspotsForModel(modelIndex, pivot);
            registerToggleableModel(modelIndex, folderAndFile, pivot);

            modelsLoadedSoFar++;

            updateLoadingProgress({
                fileName: folderAndFile,
                fileProgress: 1,
                modelsLoaded: modelsLoadedSoFar,
                modelsTotal: enabledCount
            });

        } catch (error) {

            console.error(`Failed to load model for ${folderAndFile}:`, error);
            modelsLoadedSoFar++; // still count it so the overall counter progresses even on failure

        }

    }

    hideLoadingOverlay(); // all models attempted — hide the loading screen


// Configure renderer to use shadow map
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadow maps

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping; // filmic contrast curve — supports the moody look better than the flat linear default
    renderer.toneMappingExposure = 0.9;

    document.body.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;


// Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0); // Ensure the orbit control target is centered at the model
    controls.update();

// Adjust with window resize
    window.addEventListener('resize', onWindowResize);

    //Initialize the placement helper here after renderer is set up
    initHotspotPlacementMode();

    // Simulate button 1 being pressed once everything is loaded and running,
    // so the first model is selected and the status text reflects it.
    selectModel(0);

    // Started here, not right after the renderer is created — animate() calls
    // controls.update(), which needs controls to exist first. The awaited boat model
    // loads above yield control back to the browser mid-init(); if the loop had
    // already started earlier, an animation frame could fire before controls was
    // ready and crash on `undefined`.
    renderer.setAnimationLoop(animate);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    const delta = clock.getDelta();

    updateModelRotations(delta); // rotates every registered model toward targetYaw

    updateCameraMovement(delta);
    updateDebugOverlay();
    updateHotspots();

        if (debugOverlayVisible) {
        updateLightVisual(lightVisual1, directionalLight);
        updateLightVisual(lightVisual2, directionalLight2);
    }

    controls.update();
    renderer.render(scene, camera);

}


function initScreensaver() {

    screensaverEl = document.getElementById('screensaver');

    resetScreensaverTimer();

    // Any interaction resets the idle timer and dismisses the screensaver
    window.addEventListener('mousemove', resetScreensaverTimer);
    window.addEventListener('mousedown', resetScreensaverTimer);
    window.addEventListener('touchstart', resetScreensaverTimer);
    window.addEventListener('keydown', resetScreensaverTimer);

}

function resetScreensaverTimer() {

    if (screensaverActive) {
        hideScreensaver();
    }

    clearTimeout(screensaverTimer);
    screensaverTimer = setTimeout(showScreensaver, screensaverTimeout);

}

function showScreensaver() {

    screensaverActive = true;
    screensaverEl.style.display = 'flex';

    closeDrawer();
    drawerToggleEl.classList.add('hidden');

}

function hideScreensaver() {

    screensaverActive = false;
    screensaverEl.style.display = 'none';

    drawerToggleEl.classList.remove('hidden');

}

function initLoadingOverlay() {

    loadingOverlayEl = document.getElementById('loading-overlay');
    loadingTitleEl = document.getElementById('loading-title');
    loadingCurrentFileEl = document.getElementById('loading-current-file');
    loadingBarFillEl = document.getElementById('loading-bar-fill');
    loadingProgressTextEl = document.getElementById('loading-progress-text');
    loadingOverallTextEl = document.getElementById('loading-overall-text');

}

function updateLoadingProgress({fileName, fileProgress, modelsLoaded, modelsTotal}) {

    loadingCurrentFileEl.textContent = fileName;

    const percent = Math.round(fileProgress * 100);
    loadingBarFillEl.style.width = `${percent}%`;
    loadingProgressTextEl.textContent = `${percent}%`;

    loadingOverallTextEl.textContent = `Model ${modelsLoaded} / ${modelsTotal}`;

}

function hideLoadingOverlay() {

    loadingOverlayEl.style.display = 'none';

}

function registerToggleableModel(index, name, object3D) {

    const materials = []; // cache once

    object3D.traverse((node) => {

        if (node.isMesh) {

            const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];

            nodeMaterials.forEach((mat) => {
                mat.transparent = true;
                mat.opacity = 1;
                mat.side = THREE.DoubleSide; // FrontSide culled thin/open geometry (railings, ladders) depending on view angle

                // Kill baked-in glass/physical transparency from GLTF extensions like
                // KHR_materials_transmission — this is what made bridge "windows" see-through.
                if ('transmission' in mat) mat.transmission = 0;

                mat.alphaTest = 0; // don't let per-pixel alpha punch discard-holes independently
                mat.blending = THREE.NormalBlending; // Additive/Subtractive would make black pixels vanish

                // GLTFLoader auto-disables this for any material exported with alphaMode: BLEND
                // (Blender's "Blend" material blend mode) — without it, this single continuous hull
                // mesh can't correctly self-occlude, since triangles draw in export order rather than
                // camera-distance order, letting far-side geometry paint over near-side by draw order.
                mat.depthWrite = true;

                // Strip any baked alpha channel from the diffuse texture — see comment above.
                if (mat.map) flattenTextureAlpha(mat.map);

                // ---- glass material grey ----
                if (mat.name === 'Scheiben' || node.name === 'Glass_22') {
                    mat.color.setHex(0x000000);  // light grey, adjust as desired
                    // If you want it darker: 0x888888 or 0x666666
                }

                materials.push(mat);
            });

        }

    });

    const isFirstRegistered = !hasSetInitialActiveModel;

    toggleableModels[index] = {
        name,
        object: object3D,
        materials // cached — no more re-traversal needed
    };

    object3D.visible = isFirstRegistered;

    if (isFirstRegistered) {

        hasSetInitialActiveModel = true;
        activeModelIndex = index;

    }

    const btn = document.querySelector(`.model-toggle-btn[data-index="${index}"]`);
    if (btn) {

        const labelEl = btn.querySelector('.model-toggle-label');
        const configEntry = buttonConfig[index];
        if (labelEl) labelEl.textContent = (configEntry && configEntry.label) ? configEntry.label : name;

        btn.classList.remove('inactive');
        btn.classList.toggle('active', isFirstRegistered);
    }

}

// Switches the active model by covering the screen with an opaque overlay, hard-swapping
// visibility underneath (no blending, so no white-wash from overlapping translucent
// surfaces), then revealing. Hidden models keep rotating toward targetYaw the whole
// time via updateModelRotations(), so whichever one appears is already facing correctly.
function selectModel(index) {

    const entry = toggleableModels[index];
    if (!entry) return;

    if (index === activeModelIndex || switchInProgress) {

        // Not actually switching (re-clicking the active model) — just make sure the
        // button/status state is correct, no cover animation needed.
        const btn = document.querySelector(`.model-toggle-btn[data-index="${index}"]`);
        if (btn) {
            btn.classList.remove('inactive');
            btn.classList.add('active');
        }

        setStatusText(
            (buttonConfig[index] && buttonConfig[index].statusText) ? buttonConfig[index].statusText : entry.name
        );

        return;

    }

    switchInProgress = true;
    switchOverlayEl.style.opacity = '1';

    setTimeout(() => {

        // Screen is fully covered here — hard-swap visibility, no blending involved.
        toggleableModels.forEach((otherEntry, otherIndex) => {

            if (!otherEntry) return;

            otherEntry.object.visible = (otherIndex === index);

            const otherBtn = document.querySelector(`.model-toggle-btn[data-index="${otherIndex}"]`);
            if (otherBtn) {
                otherBtn.classList.toggle('active', otherIndex === index);
                otherBtn.classList.toggle('inactive', otherIndex !== index);
            }

        });

        activeModelIndex = index;

        setStatusText(
            (buttonConfig[index] && buttonConfig[index].statusText) ? buttonConfig[index].statusText : entry.name
        ); // <-- edit buttonConfig at the top to customize this per model

        // Reveal on the next frame, so the browser paints the fully-covered
        // state at least once before starting the fade-out transition.
        requestAnimationFrame(() => {
            switchOverlayEl.style.opacity = '0';
        });

    }, switchTransitionMs);

    setTimeout(() => {
        switchInProgress = false;
    }, switchTransitionMs * 2);

}

function initSwitchOverlay() {

    switchOverlayEl = document.getElementById('model-switch-overlay');

}

function initToggleButtons() {

    document.querySelectorAll('.model-toggle-btn').forEach((btn) => {

        btn.addEventListener('click', (event) => {

            event.stopPropagation(); // prevent this click from also triggering the drawer's close-on-outside-click logic

            const index = parseInt(btn.dataset.index, 10);
            selectModel(index);

        });

    });

}

function initDebugOverlay() {

    debugOverlayEl = document.getElementById('debug-overlay');
    debugModelNameEl = document.getElementById('debug-model-name');
    debugCamPosEl = document.getElementById('debug-cam-pos');
    debugCamRotEl = document.getElementById('debug-cam-rot');
    debugModelPosEl = document.getElementById('debug-model-pos');
    debugModelRotEl = document.getElementById('debug-model-rot');

    // Rotate-left/right buttons live in the HTML template (#rotate-left-btn /
    // #rotate-right-btn) — just wire them up here. They nudge targetYaw, reusing the
    // existing smooth lerp-based rotation in updateModelRotations() rather than
    // snapping the model instantly.
    const rotateStep = THREE.MathUtils.degToRad(15); // degrees per click — adjust to taste

    document.getElementById('rotate-left-btn').addEventListener('click', () => {
        targetYaw -= rotateStep;
    });

    document.getElementById('rotate-right-btn').addEventListener('click', () => {
        targetYaw += rotateStep;
    });

    window.addEventListener('keydown', (event) => {

        if (event.code === 'KeyH') {
            debugOverlayVisible = !debugOverlayVisible;
            debugOverlayEl.style.display = debugOverlayVisible ? 'block' : 'none';
                        lightVisual1.group.visible = debugOverlayVisible;
            lightVisual2.group.visible = debugOverlayVisible;
        }

    });

}

function updateDebugOverlay() {

    if (!debugOverlayVisible) return;

    const activeEntry = getActiveModelEntry();

    debugModelNameEl.textContent = activeEntry ? activeEntry.name : 'none';

    debugCamPosEl.textContent = `x:${camera.position.x.toFixed(2)}  y:${camera.position.y.toFixed(2)}  z:${camera.position.z.toFixed(2)}`;
    debugCamRotEl.textContent = `x:${THREE.MathUtils.radToDeg(camera.rotation.x).toFixed(1)}°  y:${THREE.MathUtils.radToDeg(camera.rotation.y).toFixed(1)}°  z:${THREE.MathUtils.radToDeg(camera.rotation.z).toFixed(1)}°`;

    if (activeEntry) {

        const obj = activeEntry.object;
        debugModelPosEl.textContent = `x:${obj.position.x.toFixed(2)}  y:${obj.position.y.toFixed(2)}  z:${obj.position.z.toFixed(2)}`;
        debugModelRotEl.textContent = `x:${THREE.MathUtils.radToDeg(obj.rotation.x).toFixed(1)}°  y:${THREE.MathUtils.radToDeg(obj.rotation.y).toFixed(1)}°  z:${THREE.MathUtils.radToDeg(obj.rotation.z).toFixed(1)}°`;

    } else {

        debugModelPosEl.textContent = '—';
        debugModelRotEl.textContent = '—';

    }

}

function lerpAngle(current, target, t) {

    let delta = (target - current) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return current + delta * t;

}

// Converts a light's Cartesian position into azimuth/elevation/radius, using the
// same atan2(x, z) convention as getCameraAngleRelativeToObject() elsewhere in this
// file, so "azimuth" reads consistently across the app.
function positionToSpherical(position) {

    const radius = position.length();
    if (radius === 0) return {radius: 0, azimuthDeg: 0, elevationDeg: 0};

    const elevationRad = Math.asin(THREE.MathUtils.clamp(position.y / radius, -1, 1));
    const azimuthRad = Math.atan2(position.x, position.z);

    return {
        radius,
        azimuthDeg: THREE.MathUtils.radToDeg(azimuthRad),
        elevationDeg: THREE.MathUtils.radToDeg(elevationRad)
    };

}

// Inverse of positionToSpherical() — rebuilds a Cartesian position from a
// radius/azimuth/elevation triple. Used so dragging "rotation" sliders orbits the
// light around the origin at its current distance instead of moving it in a line.
function sphericalToPosition(radius, azimuthDeg, elevationDeg) {

    const azimuthRad = THREE.MathUtils.degToRad(azimuthDeg);
    const elevationRad = THREE.MathUtils.degToRad(elevationDeg);
    const horizontalRadius = radius * Math.cos(elevationRad);

    return new THREE.Vector3(
        horizontalRadius * Math.sin(azimuthRad),
        radius * Math.sin(elevationRad),
        horizontalRadius * Math.cos(azimuthRad)
    );

}

// A small sphere at the light's position plus a line out to its target (the origin —
// our directional lights never set a custom .target) — shown only while the debug
// overlay (H) is open, so it never appears in the normal kiosk view.
function createLightVisual(color) {

    const group = new THREE.Group();

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshBasicMaterial({color})
    );
    group.add(sphere);

    const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineBasicMaterial({color})
    );
    group.add(line);

    return {group, sphere, line};

}

function updateLightVisual(visual, light) {

    visual.sphere.position.copy(light.position);

    const positions = visual.line.geometry.attributes.position;
    positions.setXYZ(0, light.position.x, light.position.y, light.position.z);
    positions.setXYZ(1, 0, 0, 0);
    positions.needsUpdate = true;

}


function updateModelRotations(delta) {

    const t = 1 - Math.exp(-rotationLerpSpeed * delta);

    toggleableModels.forEach((entry) => {

        if (!entry) return;

        entry.object.rotation.y = lerpAngle(entry.object.rotation.y, targetYaw, t);

    });

}

function initHotspotEngine() {

    hotspotLayer = document.getElementById('hotspot-layer');

}

function registerHotspot({id, object, localPosition, minAngle, maxAngle, label, onClick}) {

    const el = document.createElement('button');
    el.className = 'hotspot-btn';
    el.dataset.id = id;

    if (label) {

        const labelEl = document.createElement('span');
        labelEl.className = 'hotspot-label';
        labelEl.textContent = label;
        el.appendChild(labelEl);

    }

    if (onClick) {
        el.addEventListener('click', onClick);
    }

    hotspotLayer.appendChild(el);

    hotspots.push({
        id,
        object,                                   // the pivot/mesh this hotspot is attached to
        localPosition: localPosition.clone(),      // position in the object's local space, for screen projection
        minAngle: THREE.MathUtils.euclideanModulo(minAngle, 360), // degrees, in the object's own rotation frame
        maxAngle: THREE.MathUtils.euclideanModulo(maxAngle, 360),
        el
    });

}

function unregisterHotspot(id) {

    const index = hotspots.findIndex(h => h.id === id);
    if (index === -1) return;

    hotspots[index].el.remove();
    hotspots.splice(index, 1);

}

// Computes the camera's current azimuthal angle (degrees, 0–360) around the given
// object, measured in that object's OWN rotation frame — i.e. it already accounts
// for the object's current rotation.y, so the angle stays meaningful as the model turns.
function getCameraAngleRelativeToObject(object3D) {

    const dx = camera.position.x - object3D.position.x;
    const dz = camera.position.z - object3D.position.z;

    const worldAngle = Math.atan2(dx, dz); // radians, 0 = facing +Z in world space
    const localAngle = worldAngle - object3D.rotation.y; // subtract the model's own spin

    return THREE.MathUtils.radToDeg(THREE.MathUtils.euclideanModulo(localAngle, Math.PI * 2));

}

// Range check that correctly handles wraparound (e.g. min:315, max:45 covers 315°→360°→45°)
function isAngleInRange(angle, min, max) {

    if (min <= max) return angle >= min && angle <= max;
    return angle >= min || angle <= max;

}

function updateHotspots() {

    if (hotspots.length === 0) return;

    const activeEntry = getActiveModelEntry();
    if (!activeEntry || !activeEntry.object) return; // bail safely instead of crashing on undefined

    const cameraAngle = getCameraAngleRelativeToObject(activeEntry.object);

    hotspots.forEach((hotspot) => {

        // Skip hotspots belonging to any model that isn't currently active
        if (hotspot.object !== activeEntry.object) {
            hotspot.el.style.display = 'none';
            return;
        }

        // Show only while the camera sits within this hotspot's configured angle range
        if (!isAngleInRange(cameraAngle, hotspot.minAngle, hotspot.maxAngle)) {
            hotspot.el.style.display = 'none';
            return;
        }

        // Project the hotspot's 3D position to 2D screen space
        _worldPos.copy(hotspot.localPosition).applyMatrix4(hotspot.object.matrixWorld);
        _projected.copy(_worldPos).project(camera);

        if (_projected.z > 1) { // behind the camera
            hotspot.el.style.display = 'none';
            return;
        }

        const screenX = (_projected.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-_projected.y * 0.5 + 0.5) * window.innerHeight;

        hotspot.el.style.display = 'block';
        hotspot.el.style.left = `${screenX}px`;
        hotspot.el.style.top = `${screenY}px`;

    });

}

function initHotspotPlacementMode() {

    window.addEventListener('keydown', (event) => {
        if (event.code === 'KeyP') {
            placementModeActive = !placementModeActive;
            console.log(`Hotspot placement mode: ${placementModeActive ? 'ON — click a model surface' : 'OFF'}`);
        }
    });

    renderer.domElement.addEventListener('click', (event) => {

        if (!placementModeActive) return;

        placementMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        placementMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        placementRaycaster.setFromCamera(placementMouse, camera);

        const occluders = toggleableModels
            .filter(entry => entry && entry.object.visible)
            .map(entry => entry.object);

        const hits = placementRaycaster.intersectObjects(occluders, true);
        if (hits.length === 0) return;

        const hit = hits[0];

        // Find which registered model this hit belongs to, so we can give local coords
        const parentEntry = toggleableModels.find(entry => entry && entry.object.visible &&
            hit.object.parent && entry.object.getObjectById(hit.object.id));

        if (!parentEntry) return;

        const localPos = parentEntry.object.worldToLocal(hit.point.clone());

        // Suggest a starting angle range centered on wherever the camera is right now —
        // widen/narrow this by hand afterward to taste.
        const currentAngle = getCameraAngleRelativeToObject(parentEntry.object);
        const suggestedMin = Math.round(THREE.MathUtils.euclideanModulo(currentAngle - 30, 360));
        const suggestedMax = Math.round(THREE.MathUtils.euclideanModulo(currentAngle + 30, 360));

        console.log(`Hotspot placement — model: "${parentEntry.name}"`);
        console.log(`localPosition: new THREE.Vector3(${localPos.x.toFixed(3)}, ${localPos.y.toFixed(3)}, ${localPos.z.toFixed(3)})`);
        console.log(`minAngle: ${suggestedMin}, maxAngle: ${suggestedMax}  (current camera angle: ${currentAngle.toFixed(1)}°)`);

        // --- Material diagnostic dump — tells us exactly what's actually set on
        // --- whatever mesh you clicked on, instead of guessing from screenshots. ---
        const clickedMats = Array.isArray(hit.object.material) ? hit.object.material : [hit.object.material];
        clickedMats.forEach((mat, i) => {
            console.log(`Mesh "${hit.object.name}" material[${i}] ("${mat.name || 'unnamed'}"):`, {
                type: mat.type,
                transparent: mat.transparent,
                opacity: mat.opacity,
                depthWrite: mat.depthWrite,
                depthTest: mat.depthTest,
                side: mat.side, // 0 = FrontSide, 1 = BackSide, 2 = DoubleSide
                blending: mat.blending,
                alphaTest: mat.alphaTest,
                transmission: mat.transmission,
                hasMap: !!mat.map,
                mapImageIsCanvas: mat.map ? (mat.map.image instanceof HTMLCanvasElement) : null,
                vertexColors: mat.vertexColors,
            });
        });

    });

}

function initHotspotOverlay() {

    hotspotOverlayEl = document.getElementById('hotspot-overlay');
    hotspotOverlayTitleEl = document.getElementById('hotspot-overlay-title');
    hotspotOverlayTextEl = document.getElementById('hotspot-overlay-text');
    hotspotOverlayImagesEl = document.getElementById('hotspot-overlay-images');

    document.getElementById('hotspot-overlay-close').addEventListener('click', closeHotspotOverlay);

    // Click on the dark backdrop (but not the content box) also closes it
    hotspotOverlayEl.addEventListener('click', (event) => {
        if (event.target === hotspotOverlayEl) closeHotspotOverlay();
    });

    window.addEventListener('keydown', (event) => {
        if (event.code === 'Escape') closeHotspotOverlay();
    });

}

function openHotspotOverlay(content) {

    hotspotOverlayTitleEl.textContent = content.title || '';
    hotspotOverlayTextEl.textContent = content.text || '';

    hotspotOverlayImagesEl.innerHTML = '';
    (content.images || []).forEach((src) => {
        const img = document.createElement('img');
        img.src = src;
        hotspotOverlayImagesEl.appendChild(img);
    });

    hotspotOverlayEl.style.display = 'flex';

}

function closeHotspotOverlay() {

    hotspotOverlayEl.style.display = 'none';

}

function registerHotspotsForModel(modelIndex, object3D) {

    const definitions = hotspotDefinitions[modelIndex];
    if (!definitions) return;

    definitions.forEach((def) => {

        registerHotspot({
            id: def.id,
            object: object3D,
            localPosition: def.localPosition,
            minAngle: def.minAngle,
            maxAngle: def.maxAngle,
            label: def.content.title,
            onClick: () => openHotspotOverlay(def.content)
        });

    });

}

function getActiveModelEntry() {

    if (activeModelIndex !== null && toggleableModels[activeModelIndex]) {

        const entry = toggleableModels[activeModelIndex];
        if (entry.object && entry.object.visible) return entry;

    }

    return toggleableModels.find((entry) => entry && entry.object && entry.object.visible) || null;

}

function initDrawer() {

    drawerToggleEl = document.getElementById('drawer-toggle');
    toggleBarEl = document.getElementById('toggle-bar');
    statusTextEl = document.getElementById('status-text');

    drawerToggleEl.addEventListener('click', (event) => {
        event.stopPropagation(); // don't let this click bubble to the document listener and immediately re-close
        toggleDrawer();
    });

    // Click anywhere else while open closes the drawer
    document.addEventListener('click', (event) => {

        if (!drawerOpen) return;

        const clickedInsideDrawer = toggleBarEl.contains(event.target);
        const clickedToggleHandle = drawerToggleEl.contains(event.target);

        if (!clickedInsideDrawer && !clickedToggleHandle) {
            closeDrawer();
        }

    });

}

function toggleDrawer() {
    drawerOpen ? closeDrawer() : openDrawer();
}

function openDrawer() {
    drawerOpen = true;
    toggleBarEl.classList.add('open');
    drawerToggleEl.classList.add('hidden');
}

function closeDrawer() {
    drawerOpen = false;
    toggleBarEl.classList.remove('open');
    drawerToggleEl.classList.remove('hidden');
}

// Put a custom string in the top-right status text — call this from anywhere
// (model-toggle click, a hotspot's onClick, etc.)
function setStatusText(text) {
    statusTextEl.textContent = text;
}


function wireDirectionalLightControls(light, idSuffix) {

    const intensitySlider = document.getElementById(`dir-intensity${idSuffix}`);
    const xSlider = document.getElementById(`dir-x${idSuffix}`);
    const ySlider = document.getElementById(`dir-y${idSuffix}`);
    const zSlider = document.getElementById(`dir-z${idSuffix}`);
    const colorPicker = document.getElementById(`dir-color${idSuffix}`);
    const azimuthSlider = document.getElementById(`dir-azimuth${idSuffix}`);
    const elevationSlider = document.getElementById(`dir-elevation${idSuffix}`);

    const intensityVal = document.getElementById(`dir-intensity-val${idSuffix}`);
    const xVal = document.getElementById(`dir-x-val${idSuffix}`);
    const yVal = document.getElementById(`dir-y-val${idSuffix}`);
    const zVal = document.getElementById(`dir-z-val${idSuffix}`);
    const azimuthVal = document.getElementById(`dir-azimuth-val${idSuffix}`);
    const elevationVal = document.getElementById(`dir-elevation-val${idSuffix}`);

    // Reflects the light's current position into both the X/Y/Z sliders and the
    // azimuth/elevation sliders — called after either representation changes it,
    // so the two always agree.
    function syncSlidersFromPosition() {

        xSlider.value = light.position.x;
        xVal.textContent = light.position.x.toFixed(1);
        ySlider.value = light.position.y;
        yVal.textContent = light.position.y.toFixed(1);
        zSlider.value = light.position.z;
        zVal.textContent = light.position.z.toFixed(1);

        const {azimuthDeg, elevationDeg} = positionToSpherical(light.position);
        azimuthSlider.value = azimuthDeg;
        azimuthVal.textContent = azimuthDeg.toFixed(0);
        elevationSlider.value = elevationDeg;
        elevationVal.textContent = elevationDeg.toFixed(0);

    }

    intensitySlider.value = light.intensity;
    intensityVal.textContent = light.intensity.toFixed(1);
    colorPicker.value = '#' + light.color.getHexString();
    syncSlidersFromPosition();

    intensitySlider.addEventListener('input', () => {
        const val = parseFloat(intensitySlider.value);
        light.intensity = val;
        intensityVal.textContent = val.toFixed(1);
    });

    colorPicker.addEventListener('input', () => {
        light.color.copy(new THREE.Color(colorPicker.value));
    });

    // Dragging X/Y/Z moves the light directly and keeps azimuth/elevation in sync.
    xSlider.addEventListener('input', () => {
        light.position.x = parseFloat(xSlider.value);
        syncSlidersFromPosition();
    });
    ySlider.addEventListener('input', () => {
        light.position.y = parseFloat(ySlider.value);
        syncSlidersFromPosition();
    });
    zSlider.addEventListener('input', () => {
        light.position.z = parseFloat(zSlider.value);
        syncSlidersFromPosition();
    });

    // Dragging azimuth/elevation orbits the light around the origin at its current
    // distance and keeps X/Y/Z in sync.
    function applyRotation() {
        const {radius} = positionToSpherical(light.position);
        light.position.copy(sphericalToPosition(
            radius || 1,
            parseFloat(azimuthSlider.value),
            parseFloat(elevationSlider.value)
        ));
        syncSlidersFromPosition();
    }

    azimuthSlider.addEventListener('input', applyRotation);
    elevationSlider.addEventListener('input', applyRotation);

}

function initLightControls() {

    const ambintensitySlider = document.getElementById('ambient-intensity');
    const ambcolorPicker = document.getElementById('ambient-color');
    const ambintensityVal = document.getElementById('ambient-intensity-val');

    ambintensitySlider.value = ambientLight.intensity;
    ambintensityVal.textContent = ambientLight.intensity.toFixed(2);
    ambcolorPicker.value = '#' + ambientLight.color.getHexString();

    ambintensitySlider.addEventListener('input', () => {
        const val = parseFloat(ambintensitySlider.value);
        ambientLight.intensity = val;
        ambintensityVal.textContent = val.toFixed(2);
    });

    ambcolorPicker.addEventListener('input', () => {
        const color = new THREE.Color(ambcolorPicker.value);
        ambientLight.color.copy(color);
    });

    wireDirectionalLightControls(directionalLight, '');
    wireDirectionalLightControls(directionalLight2, '-2');

}


function initConnectionWarning() {

    connectionWarningEl = document.getElementById('connection-warning');
    connectionWarningTextEl = document.getElementById('connection-warning-text');
    connectionWarningDismissEl = document.getElementById('connection-warning-dismiss');

    connectionWarningDismissEl.addEventListener('click', () => {
        connectionWarningDismissedFor = connectionWarningTextEl.textContent;
        connectionWarningEl.classList.remove('visible');
    });

    pollConnectionState();
    setInterval(pollConnectionState, CONNECTION_POLL_INTERVAL);

}

async function pollConnectionState() {

    try {

        const res = await fetch('/api/state');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const state = await res.json();
        updateConnectionWarning(state.camera_active, state.serial_connected);

    } catch (e) {
        // Backend unreachable — treat both as offline so the user still gets a signal.
        updateConnectionWarning(false, false);
    }

}

function updateConnectionWarning(cameraActive, serialConnected) {

    const problems = [];
    if (!cameraActive) problems.push('Kamera');
    if (!serialConnected) problems.push('Encoder');

    if (problems.length === 0) {
        connectionWarningEl.classList.remove('visible');
        connectionWarningDismissedFor = null; // clear so a future problem always shows again
        return;
    }

    const message = `${problems.join(' & ')} nicht verbunden`;
    connectionWarningTextEl.textContent = message;

    // Only stay hidden if the user dismissed exactly this message — if the problem
    // changes (e.g. serial also drops after camera alone was flagged), show again.
    if (message === connectionWarningDismissedFor) return;

    connectionWarningEl.classList.add('visible');

}


let trackingSettingsTimer = null;

// Debounced push to the backend — sliders fire an 'input' event on every pixel of
// drag, and without this each drag would spam /api/settings with a request per
// frame. Coalesces rapid changes into one request after the user pauses.
function pushTrackingSetting(key, value) {

    clearTimeout(trackingSettingsTimer);
    trackingSettingsTimer = setTimeout(() => {
        fetch('/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({[key]: value})
        }).catch(() => {
            // Best-effort — the slider still shows the value locally either way;
            // the backend keeps its previous setting until connectivity is
            // restored and the slider is nudged again.
        });
    }, 150);

}

async function initTrackingControls() {

    const alphaSlider = document.getElementById('marker-correction-alpha');
    const alphaVal = document.getElementById('marker-correction-alpha-val');
    const snapSlider = document.getElementById('marker-snap-threshold');
    const snapVal = document.getElementById('marker-snap-threshold-val');
    const lerpSlider = document.getElementById('rotation-lerp-speed');
    const lerpVal = document.getElementById('rotation-lerp-speed-val');
    const multiplierSlider = document.getElementById('rotation-multiplier');
    const multiplierVal = document.getElementById('rotation-multiplier-val');

    // rotationLerpSpeed is purely client-side — no backend round trip needed.
    lerpSlider.value = rotationLerpSpeed;
    lerpVal.textContent = rotationLerpSpeed.toFixed(1);

    lerpSlider.addEventListener('input', () => {
        rotationLerpSpeed = parseFloat(lerpSlider.value);
        lerpVal.textContent = rotationLerpSpeed.toFixed(1);
    });


        // Declared here, at function scope, so it's guaranteed to exist below
    // regardless of whether the fetch succeeds — no dangling reference from a
    // try-block-local variable.
    let state = null;

    try {
        const res = await fetch('/api/state');
        if (res.ok) state = await res.json();
    } catch (e) {
        // Backend unreachable at startup — state stays null, defaults below apply.
    }
    // marker_correction_alpha / marker_snap_threshold_deg / rotation_multiplier all
    // live on the backend — pull their current values first so the sliders start in
    // sync with whatever app.py actually has configured, instead of defaulting to 0.
    let initialAlpha = 0.25;
    let initialSnapThreshold = 15.0;
    let initialMultiplier = 1.0;

    try {

        const res = await fetch('/api/state');

        if (res.ok) {

            const state = await res.json();

            if (typeof state.marker_correction_alpha === 'number') initialAlpha = state.marker_correction_alpha;
            if (typeof state.marker_snap_threshold_deg === 'number') initialSnapThreshold = state.marker_snap_threshold_deg;
            if (typeof state.rotation_multiplier === 'number') initialMultiplier = state.rotation_multiplier;

        }

    } catch (e) {
        // Backend unreachable at startup — sliders fall back to the defaults above;
        // the connection-warning banner already covers surfacing this to the user.
    }

    alphaSlider.value = initialAlpha;
    alphaVal.textContent = initialAlpha.toFixed(2);
    snapSlider.value = initialSnapThreshold;
    snapVal.textContent = initialSnapThreshold.toFixed(0);
    multiplierSlider.value = initialMultiplier;
    multiplierVal.textContent = initialMultiplier.toFixed(1);

    alphaSlider.addEventListener('input', () => {
        const val = parseFloat(alphaSlider.value);
        alphaVal.textContent = val.toFixed(2);
        pushTrackingSetting('marker_correction_alpha', val);
    });

    snapSlider.addEventListener('input', () => {
        const val = parseFloat(snapSlider.value);
        snapVal.textContent = val.toFixed(0);
        pushTrackingSetting('marker_snap_threshold_deg', val);
    });

    multiplierSlider.addEventListener('input', () => {
        const val = parseFloat(multiplierSlider.value);
        multiplierVal.textContent = val.toFixed(1);
        pushTrackingSetting('rotation_multiplier', val);
    });

}
