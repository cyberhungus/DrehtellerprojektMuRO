import * as THREE from 'three';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js'; // add this import

let camera, scene, renderer, controls;
let ambientLight, directionalLight; // hoisted so the debug-overlay light controls can reach them

// Toggle which boat models are loaded/active — index 0 = Boot 1, index 1 = Boot 2, etc.
// Set to false to skip loading that model entirely (useful for testing/debugging).
const modelEnabled = [true, true, true, true, true, true];

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
const rotationLerpSpeed = 2.0; // higher = snappier turn, tune to taste

// For Keyboard Movement (DEBUG)
const moveState = {forward: false, backward: false, left: false, right: false, up: false, down: false};
const moveSpeed = 5; // units per second, tune to your scene scale

const fadeDuration = 0.6; // seconds for a full fade in/out — tune to taste
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

let isTransitioning = false;

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

// Drawer + status text
let drawerToggleEl, toggleBarEl, statusTextEl;
let drawerOpen = false;

const hotspotDefinitions = {

    0: [ // Boot 1
        {
            id: 'boot1-engine',
            localPosition: new THREE.Vector3(0, 0.5, -1.2),
            minAngle: 315, // degrees — hotspot shows only while the camera sits within this arc
            maxAngle: 45,  // wraps through 0°, e.g. 315°→360°/0°→45°
            content: {
                title: 'Motor',
                text: 'Der Motor liefert 150 PS und ermöglicht eine Höchstgeschwindigkeit von 45 km/h.',
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
initDrawer();
initLightControls();
initServerSentEvents();
initKeyboardControls();
initScreensaver();
initToggleButtons();
initDebugOverlay();
initHotspotEngine();
initHotspotOverlay();


function initServerSentEvents() {
    const eventSource = new EventSource('/stream');
    eventSource.onmessage = function (event) {

        console.log('New markers detected:', event.data);

        if (event.data && event.data !== "[]") {

            const yawDegrees = parseFloat(event.data.replace("[", "").replace("]", ""));
            targetYaw = THREE.MathUtils.degToRad(yawDegrees); // convert once, store in radians

        }

    };
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

async function init() {
// Set the camera position above the model and pointing downwards to center on the model
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(-0.16, 2.7, 2.85); // Set above the model (adjust height based on scale and size)
    camera.lookAt(0, 0, 0); // Ensures it's looking at the center; adjust to the middle of your scene if needed

// Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // Set scene background to white

    // Lights: Ambient and Directional light for shadows
    ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // White ambient light
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 5); // Position it so it casts shadows
    directionalLight.castShadow = true; // Enable shadow casting

    // Adjust shadow map size and camera
    directionalLight.shadow.mapSize.width = 256;
    directionalLight.shadow.mapSize.height = 256;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;

    scene.add(directionalLight);
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
        const path = `static/models/${folderAndFile}/${folderAndFile}.gltf`;

        updateLoadingProgress({
            fileName: `${folderAndFile}.gltf`,
            fileProgress: 0,
            modelsLoaded: modelsLoadedSoFar,
            modelsTotal: enabledCount
        });

        try {

            // Wrap loader.load() in a Promise to get onProgress callbacks
            // while keeping the same await-based flow as loadAsync
            const gltf = await new Promise((resolve, reject) => {

                gltfLoader.load(
                    path,
                    resolve,
                    (xhr) => {

                        // xhr.total is 0 if the server doesn't send a Content-Length header —
                        // guard against divide-by-zero in that case
                        const fileProgress = xhr.total > 0 ? xhr.loaded / xhr.total : 0;

                        updateLoadingProgress({
                            fileName: `${folderAndFile}.gltf`,
                            fileProgress,
                            modelsLoaded: modelsLoadedSoFar,
                            modelsTotal: enabledCount
                        });

                    },
                    reject
                );

            });

            const model = gltf.scene;

            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            model.scale.setScalar(0.03); // adjust per-model if needed

            const boundingBox = new THREE.Box3().setFromObject(model);
            const center = boundingBox.getCenter(new THREE.Vector3());

            model.position.sub(center);
            model.position.y = model.position.y - boundingBox.min.y + center.y;

            const pivot = new THREE.Group();
            pivot.add(model);
            scene.add(pivot);

            registerHotspotsForModel(modelIndex, pivot);
            registerToggleableModel(modelIndex, folderAndFile, pivot);

            modelsLoadedSoFar++;

            updateLoadingProgress({
                fileName: `${folderAndFile}.gltf`,
                fileProgress: 1,
                modelsLoaded: modelsLoadedSoFar,
                modelsTotal: enabledCount
            });

        } catch (error) {

            console.error(`Failed to load ${path}:`, error);
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

    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);


    // Create a ground plane to receive shadows
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.ShadowMaterial({color: 0x000000, opacity: 1});
    const ground = new THREE.Mesh(planeGeometry, planeMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
    ground.position.y = -0.5; // Slightly below the model to catch shadows
    ground.receiveShadow = true; // Enable shadow receiving

    scene.add(ground);


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
    updateModelFades(delta); // add this
    updateDebugOverlay(); // add this
    updateHotspots();
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
                materials.push(mat);
            });

        }

    });

    const isFirstRegistered = !hasSetInitialActiveModel;

    toggleableModels[index] = {
        name,
        object: object3D,
        materials, // cached — no more re-traversal needed
        targetOpacity: isFirstRegistered ? 1 : 0,
        currentOpacity: isFirstRegistered ? 1 : 0,
        fading: false
    };

    object3D.visible = isFirstRegistered;

    if (isFirstRegistered) {

        hasSetInitialActiveModel = true;
        activeModelIndex = index;

    } else {

        materials.forEach((mat) => {
            mat.opacity = 0;
        });

    }

    const btn = document.querySelector(`.model-toggle-btn[data-index="${index}"]`);
    if (btn) {

        // Set the label text on the inner span, not the whole button —
        // using btn.textContent here would wipe out the <img> icon element.
        // Uses buttonConfig's override if set, otherwise falls back to the model's loaded name.
        const labelEl = btn.querySelector('.model-toggle-label');
        const configEntry = buttonConfig[index];
        if (labelEl) labelEl.textContent = (configEntry && configEntry.label) ? configEntry.label : name;

        btn.classList.remove('inactive');
        btn.classList.toggle('active', isFirstRegistered);
    }

}

function selectModel(index) {

    const entry = toggleableModels[index];
    if (!entry) return;

    const btn = document.querySelector(`.model-toggle-btn[data-index="${index}"]`);

    if (index !== activeModelIndex) {

        if (isTransitioning) return; // ignore while another fade is already in progress

        isTransitioning = true;

        entry.targetOpacity = 1;
        entry.fading = true;
        entry.object.visible = true;

        toggleableModels.forEach((otherEntry, otherIndex) => {

            if (!otherEntry || otherIndex === index) return;

            otherEntry.targetOpacity = 0;
            otherEntry.fading = true;

            const otherBtn = document.querySelector(`.model-toggle-btn[data-index="${otherIndex}"]`);
            if (otherBtn) {
                otherBtn.classList.add('inactive');
                otherBtn.classList.remove('active');
            }

        });

    }

    activeModelIndex = index;

    if (btn) {
        btn.classList.remove('inactive');
        btn.classList.add('active');
    }

    setStatusText(
        (buttonConfig[index] && buttonConfig[index].statusText) ? buttonConfig[index].statusText : entry.name
    ); // <-- edit buttonConfig at the top to customize this per model

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

function updateModelFades(delta) {

    let anyStillFading = false;

    toggleableModels.forEach((entry) => {

        if (!entry || !entry.fading) return;

        anyStillFading = true;

        const fadeStep = delta / fadeDuration;

        if (entry.currentOpacity < entry.targetOpacity) {
            entry.currentOpacity = Math.min(entry.targetOpacity, entry.currentOpacity + fadeStep);
        } else if (entry.currentOpacity > entry.targetOpacity) {
            entry.currentOpacity = Math.max(entry.targetOpacity, entry.currentOpacity - fadeStep);
        }

        // No traverse() here anymore — just loop the cached flat array
        entry.materials.forEach((mat) => {
            mat.opacity = entry.currentOpacity;
        });

        if (entry.currentOpacity === entry.targetOpacity) {

            entry.fading = false;

            if (entry.targetOpacity === 0) {
                entry.object.visible = false;
            }

        }

    });

    isTransitioning = anyStillFading;

}

function initLightControls() {

    // Small helper: wires a range input to a setter function and keeps its
    // numeric readout span in sync, both on load and on every drag.
    function bindRange(inputId, valueId, initialValue, onChange) {

        const input = document.getElementById(inputId);
        const valueEl = document.getElementById(valueId);

        input.value = initialValue;
        valueEl.textContent = initialValue;

        input.addEventListener('input', () => {
            const val = parseFloat(input.value);
            onChange(val);
            valueEl.textContent = val;
        });

    }

    // Ambient light
    bindRange('ambient-intensity', 'ambient-intensity-val', ambientLight.intensity,
        (val) => { ambientLight.intensity = val; });

    const ambientColor = document.getElementById('ambient-color');
    ambientColor.value = '#' + ambientLight.color.getHexString();
    ambientColor.addEventListener('input', () => {
        ambientLight.color.set(ambientColor.value);
    });

    // Directional light
    bindRange('dir-intensity', 'dir-intensity-val', directionalLight.intensity,
        (val) => { directionalLight.intensity = val; });
    bindRange('dir-x', 'dir-x-val', directionalLight.position.x,
        (val) => { directionalLight.position.x = val; });
    bindRange('dir-y', 'dir-y-val', directionalLight.position.y,
        (val) => { directionalLight.position.y = val; });
    bindRange('dir-z', 'dir-z-val', directionalLight.position.z,
        (val) => { directionalLight.position.z = val; });

    const dirColor = document.getElementById('dir-color');
    dirColor.value = '#' + directionalLight.color.getHexString();
    dirColor.addEventListener('input', () => {
        directionalLight.color.set(dirColor.value);
    });

}

function initDebugOverlay() {

    debugOverlayEl = document.getElementById('debug-overlay');
    debugModelNameEl = document.getElementById('debug-model-name');
    debugCamPosEl = document.getElementById('debug-cam-pos');
    debugCamRotEl = document.getElementById('debug-cam-rot');
    debugModelPosEl = document.getElementById('debug-model-pos');
    debugModelRotEl = document.getElementById('debug-model-rot');

    window.addEventListener('keydown', (event) => {

        if (event.code === 'KeyH') {
            debugOverlayVisible = !debugOverlayVisible;
            debugOverlayEl.style.display = debugOverlayVisible ? 'block' : 'none';
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

function updateModelRotations(delta) {

    const t = 1 - Math.exp(-rotationLerpSpeed * delta);

    toggleableModels.forEach((entry) => {

        if (!entry) return;
        if (!entry.object.visible) return; // skip fully hidden models

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