import {
    buttonConfig,
    hotspotDefinitions,
} from './hotspot-definitions.js';

import * as THREE from 'three';


// Maps a loaded model index to the drawer button that should appear active.
// Base models whose only UI entry is a variant button point back at that
// variant, so clicking a pink from a variant to reach the base keeps the
// correct button lit instead of leaving every button inactive.
const activeButtonForModel = {
    0: 0,     // Base — its own button
    1: 21,    // base reachable only via the Rockbags variant button
    2: 31,    // CFE variant button
    3: 41,    // Deck Payload variant button
    4: 4,     // no variant — its own button
    5: 61,    // ROV variant button
    6: 71,    // Walk-to-Work variant button
    7: 7,     // no variant — its own button
    8: 8,     // no variant — its own button
    // Variants map to themselves:
    11: 0, 21: 21, 31: 31, 41: 41, 61: 61, 71: 71,
};


import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

let camera, scene, renderer, controls;
let ambientLight, directionalLight, directionalLight2,cameraLight; // hoisted so the debug-overlay light controls can reach them
let lightVisual1, lightVisual2; // small sphere+line shown per light while the debug overlay (H) is open

// Initial camera settings (edit these to change the starting view)
const initialCameraPosition = new THREE.Vector3(-2.52, 0.67, 0);
let initialTargetY = 0.25; // desired initial look height (controls.target.y)
// Initial camera settings (edit these to change the starting view)

let initialTargetZ = 0;   // <-- desired initial look depth (controls.target.z)
let initialModelZ = 0; // initial Z offset for the active model
let currentModelZ = 0;

// Toggle which boat models are loaded/active — index 0 = Boot 1, index 1 = Boot 2, etc.
// Set to false to skip loading that model entirely (useful for testing/debugging).
let modelEnabled = [true, true, true, true, true, true,true,true,true];



// Added on top of targetYaw every frame — lets you correct a model whose forward
// axis doesn't line up with the tracked yaw, without touching the tracking math
// itself. Radians internally; the debug overlay slider (press H) edits it in degrees.
let modelRotationOffset = 119;

// Live-editable min/max controls for the active model's hotspots (debug overlay)
let hotspotRangeControlsEl;
let hotspotRangeRows = new Map(); // id -> {minInput, maxInput}

// Mouse-driven camera rotation toggle (top-right button) — starts OFF.
let mouseRotationEnabled = false;
let mouseRotationToggleBtn;
let mouseRotationToggleIconEl; // <-- moved up here
let mouseRotationSavedCameraState = null; // camera position/rotation/target, restored on toggle-off


// Global 3D offset applied to every hotspot marker, in the pivot's local space.
// Adding (0.1, 0, 0) moves every marker 0.1 units along the pivot's +X axis —
// same unit system the hotspot localPosition values use. Adjustable via the
// debug overlay (press H). Persists across model switches.
const hotspotOffset = new THREE.Vector3(-0.155, -0.265, 0);

// Path to the two icon files — swap these to point at your own SVGs.
// LOCKED = shown while the mode is OFF (camera fixed). UNLOCKED = shown while
// the mode is ON (free mouse rotation).
let mouseRotationIconLockedSrc = 'static/images/icons/camera-video-off.svg';
let mouseRotationIconUnlockedSrc = 'static/images/icons/camera-video.svg';

// Whether OrbitControls zoom (wheel/pinch) is allowed in the default
// (rotation-off) state. Final mode locks this off so the kiosk view is
// fully read-only. Independent of mouseRotationAllowZoom, which only
// governs zoom *while* mouse-rotation mode is active.
let cameraZoomEnabled = true;

// Independent switch: whether OrbitControls zoom (wheel/pinch) is allowed
// while mouse rotation mode is active.
let mouseRotationAllowZoom = true;


// For Aruco Based Detection
let targetYaw = 0; // degrees, updated by SSE
let rotationLerpSpeed = 4.5; // higher = snappier turn, tune to taste

// For Keyboard Movement (DEBUG)
const moveState = {forward: false, backward: false, left: false, right: false, up: false, down: false};
const moveSpeed = 5; // units per second, tune to your scene scale

// Master switch for WASD/arrow-key camera movement — set to false to disable
// keyboard-driven camera movement entirely (e.g. for kiosk deployments where
// only mouse rotation or the encoder should control the camera).
let keyboardMovementEnabled = true;

const clock = new THREE.Clock();

// Screensaver
const screensaverTimeout = 60000; // ms of inactivity before screensaver shows
const screensaverImages = ['static/images/screensaver-1.png', 'static/images/screensaver-2.png'];
const screensaverImageHoldTime = 2000;
const screensaverCrossfadeDuration = 4000;
let screensaverTimer = null;
let screensaverCycleTimer = null; // drives the hold→crossfade loop while active
let screensaverEl, screensaverActive = false;
let screensaverImgA, screensaverImgB; // two stacked, crossfadable images


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
// Live snapshot of the base rotation used to decide which hotspots are
// visible — the camera's azimuth around the active model, in the model's own
// rotation frame. Written every frame by updateHotspots(), read by the debug
// overlay (press H). Null while no model is active yet.
let lastHotspotCameraAngle = null;

// Reference to the debug overlay's angle readout element, created once in
// initDebugOverlay() and only ever text-updated afterwards.
let debugCamAngleEl;


// For hotspot placement tool (Press P)
let placementModeActive = false;
const placementRaycaster = new THREE.Raycaster();
const placementMouse = new THREE.Vector2();

let hotspotOverlayEl, hotspotOverlayContentEl, hotspotOverlayIconEl,
    hotspotOverlayTitleEl, hotspotOverlayTextEl, hotspotOverlayImagesEl,
    hotspotOverlaySubtitleEl, hotspotOverlayLogoEl, // <-- new
    deepDiveButtonsEl;

let hotspotOverlayScrollEl;

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

// Valid hotspot color variants — used to validate hotspot definitions and to build
// the CSS class / overlay class names (hotspot-btn--<variant>, hotspot-overlay--<variant>).
const HOTSPOT_VARIANTS = ['green', 'blue', 'pink'];

// Pixel size the hotspot PNG icons are rendered at — set inline (not left to CSS/the
// image's natural size) so a hotspot never balloons to its source PNG's full
// resolution. Adjust to taste.
const HOTSPOT_ICON_SIZE = 40;

// Green hotspots toggle state and button reference (will be assigned in initGreenToggle)
let greenHotspotsVisible = true;   // true = visible
let greenToggleBtn;                // will be assigned in initGreenToggle()

// Slideshow deep-dive — tracks the autoplay interval so it can be stopped when
// the overlay closes or a different deep dive/hotspot is opened.
let slideshowAutoplayTimer = null;
const SLIDESHOW_AUTOPLAY_MS = 4000;

function clearSlideshowAutoplay() {
    clearInterval(slideshowAutoplayTimer);
    slideshowAutoplayTimer = null;
}


// --------------------------------------------
// MODIFY the existing updateHotspots() function
// --------------------------------------------
// Find the original updateHotspots() and replace it with this version,
// which adds a check for green hotspots and the global flag.
function updateHotspots() {
  if (hotspots.length === 0) return;

  const activeEntry = getActiveModelEntry();
  if (!activeEntry || !activeEntry.object) return;

  const cameraAngle = getCameraAngleRelativeToObject(activeEntry.object);
  lastHotspotCameraAngle = cameraAngle;

  hotspots.forEach((hotspot) => {
    if (hotspot.object !== activeEntry.object) {
      hotspot.el.style.display = 'none';
      return;
    }

    // ---- GREEN HOTSPOT TOGGLE ----
    const isGreen = hotspot.el.dataset.variant === 'green';
    if (isGreen && !greenHotspotsVisible) {
      hotspot.el.style.display = 'none';
      return;
    }

    if (!isAngleInRange(cameraAngle, hotspot.minAngle, hotspot.maxAngle)) {
      hotspot.el.style.display = 'none';
      return;
    }

 _worldPos.copy(hotspot.localPosition).add(hotspotOffset).applyMatrix4(hotspot.object.matrixWorld);
    _projected.copy(_worldPos).project(camera);

    if (_projected.z > 1) {
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



function buildHotspotRangeControls() {
    if (!hotspotRangeControlsEl) return;

    hotspotRangeControlsEl.innerHTML = '';
    hotspotRangeRows.clear();

    const activeEntry = getActiveModelEntry();
    if (!activeEntry) return;

    const relevantHotspots = hotspots.filter(h => h.object === activeEntry.object);

    relevantHotspots.forEach((hotspot) => {

        const row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:4px; margin:2px 0; font-weight:300; font-size:11px;';

        const label = document.createElement('span');
        label.textContent = hotspot.id;
        label.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
        row.appendChild(label);

        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.min = '0';
        minInput.max = '360';
        minInput.step = '1';
        minInput.value = hotspot.minAngle;
        minInput.style.width = '48px';
        row.appendChild(minInput);

        const sep = document.createElement('span');
        sep.textContent = '–';
        row.appendChild(sep);

        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.min = '0';
        maxInput.max = '360';
        maxInput.step = '1';
        maxInput.value = hotspot.maxAngle;
        maxInput.style.width = '48px';
        row.appendChild(maxInput);

        minInput.addEventListener('input', () => {
            hotspot.minAngle = THREE.MathUtils.euclideanModulo(parseFloat(minInput.value) || 0, 360);
            updateHotspots();
        });

        maxInput.addEventListener('input', () => {
            hotspot.maxAngle = THREE.MathUtils.euclideanModulo(parseFloat(maxInput.value) || 0, 360);
            updateHotspots();
        });

        hotspotRangeControlsEl.appendChild(row);
        hotspotRangeRows.set(hotspot.id, {minInput, maxInput});

    });

}


// -------------------------------------------------------------------
// The camera controls code has been moved inside init() (see below)
// to ensure `controls` exists before we attach event listeners.
// -------------------------------------------------------------------

// Await the final-mode flag before anything else starts up. init() reads
// modelEnabled to decide which boats to fetch, and the input handlers read
// mouseRotationAllowZoom / keyboardMovementEnabled, so all three need to be
// settled before any of these are called.
(async function bootstrap() {

    await applyFinalModeOverrides();

    initLoadingOverlay();
    initSwitchOverlay();       // ← moved up here, before init()
    await init();

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
    // initSwitchOverlay();   ← remove from here
    await initTrackingControls();
    initGreenToggle();
    initMouseRotationToggle();
    initLogoClick();
    initHotspotPlacementMode();

})();

// Queries the backend for --final mode and, if enabled, overrides the three
// client-side flags that control the kiosk presentation:
//   • every model is enabled (modelEnabled all true)
//   • OrbitControls zoom is locked off while mouse-rotation mode is active
//   • WASD/arrow-key camera movement is disabled
// Runs BEFORE any other init so model loading, controls, and input handlers
// all see the final values from the very first frame.
async function applyFinalModeOverrides() {

    try {

        const res = await fetch('/api/final');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data && data.final) {

            console.log('FINAL mode active — overriding client settings');

            modelEnabled = modelEnabled.map(() => true);
            mouseRotationAllowZoom = false;
                cameraZoomEnabled = false;          // <-- add this
            keyboardMovementEnabled = false;

        } else {

        }

    } catch (e) {

        // If the backend can't be reached, fall back to the defaults declared at
        // the top of the file rather than blocking startup.
        console.warn('Could not query /api/final — using default settings:', e);

    }

}

// ============================================================================
//                              FUNCTION DEFINITIONS
// ============================================================================

function initServerSentEvents() {

    const eventSource = new EventSource('/stream');

    eventSource.onmessage = function (event) {

        // While mouse rotation mode is active, ignore commands from the
        // /stream route entirely — the mouse is in control of the camera,
        // not the encoder-driven model yaw.
        if (mouseRotationEnabled) return;

        console.log('New markers detected:', event.data);

        if (event.data && event.data !== "[]") {

            const yawDegrees = parseFloat(event.data.replace("[", "").replace("]", ""));
            targetYaw = THREE.MathUtils.degToRad(yawDegrees);

        }

    };

    eventSource.addEventListener('encoder', function () {
        resetScreensaverTimer();
    });

}


function initKeyboardControls() {

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

}
function onKeyDown(event) {

    if (!keyboardMovementEnabled) return;

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


    if (!keyboardMovementEnabled) return;

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


// Caches per-texture-image whether flattening was actually needed, so a texture
// shared across multiple meshes/materials only gets sniffed once.
const _alphaFlattenCache = new WeakMap();

// Cheap transparency check — draws the image once at a small, fixed size (not
// full resolution) and samples every pixel's alpha channel from that downscaled
// copy. Full-size getImageData on a 2K/4K texture is itself not free, so this
// keeps the check itself fast regardless of source resolution.
function textureHasRealAlpha(img) {

    const SAMPLE_SIZE = 32; // small enough to be near-instant, large enough to catch real alpha

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = SAMPLE_SIZE;
    sampleCanvas.height = SAMPLE_SIZE;

    const ctx = sampleCanvas.getContext('2d', {willReadFrequently: true});
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) return true; // found a non-opaque pixel
    }

    return false;

}

function flattenTextureAlpha(texture) {

    if (!texture || !texture.image || !texture.image.width) return;

    const img = texture.image;

    if (_alphaFlattenCache.has(img)) {
        if (!_alphaFlattenCache.get(img)) return; // already checked, no real alpha — skip
    } else {

        const hasAlpha = textureHasRealAlpha(img);
        _alphaFlattenCache.set(img, hasAlpha);

        if (!hasAlpha) return; // nothing to flatten — skip the full-size canvas entirely

    }

    // Only textures that actually had baked alpha reach this point.
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
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
    camera.position.copy(initialCameraPosition); // Set above the model (adjust height based on scale and size)
    camera.rotation.set(-161.3, 43.3, -166.5); // Ensures it's looking at the center; adjust to the middle of your scene if needed
    //camera.lookAt(0,0,0)
// Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // white background — must match #model-switch-overlay's background in index.html

      hotspotLayer = document.getElementById('hotspot-layer');
    statusTextEl = document.getElementById('status-text');
    // Lights: moody via a very low, cool-tinted ambient (keeps shadows deep instead of
    // washing them out) plus a strong warm key light with tight, high-res shadows, and
    // a dim cool fill light so the shadow side doesn't go pure black.
    // ambientLight/directionalLight variable names are unchanged — initLightControls()
    // binds the light panel sliders to these specific variables.
    ambientLight = new THREE.AmbientLight(0xffffff, 1.325); // slightly lower than before — a bit more contrast, darker shadows
    //ambientLight.castShadow = true;
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 4); // warm, punchy key light
    directionalLight.position.set(5.5, 6.5, -3); // low, angled position for longer, more dramatic shadows

    directionalLight.castShadow = true;

    // Higher-res, tightly-fitted shadow camera — sharp shadow edges read as more
    // "cinematic" than the soft, low-res shadows the old wide/loose camera produced.
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.left = -4;
    directionalLight.shadow.camera.right = 4;
    directionalLight.shadow.camera.top = 4;
    directionalLight.shadow.camera.bottom = -4;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 30;
    directionalLight.shadow.bias = -0.0005;
directionalLight.shadow.normalBias = 0.02;
// reduces shadow acne at this higher resolution

    scene.add(directionalLight);

        directionalLight2 = new THREE.DirectionalLight(0xd6d6d6, 6.5); // warm, punchy key light
    directionalLight2.position.set(4.8, 3, 7.7); // low, angled position for longer, more dramatic shadows
    directionalLight2.castShadow = true;

    // Higher-res, tightly-fitted shadow camera — sharp shadow edges read as more
    // "cinematic" than the soft, low-res shadows the old wide/loose camera produced.
    directionalLight2.shadow.mapSize.width = 4096;
    directionalLight2.shadow.mapSize.height = 4096;
    directionalLight2.shadow.camera.left = -4;
    directionalLight2.shadow.camera.right = 4;
    directionalLight2.shadow.camera.top = 4;
    directionalLight2.shadow.camera.bottom = -4;
    directionalLight2.shadow.camera.near = 0.5;
    directionalLight2.shadow.camera.far = 30;
    directionalLight2.shadow.bias = -0.0005; // reduces shadow acne at this higher resolution
directionalLight2.shadow.normalBias = 0.02;
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


    //_______________________CAMERALIGHT START

    cameraLight = new THREE.SpotLight(
    0xffffff,          // color
    8,                 // intensity — tune to taste
    0,                 // distance: 0 = no cutoff
    Math.PI / 4,       // angle: ~45° cone
    0.4,               // penumbra: soft edge
    1.5                // decay — higher = falls off faster
);
cameraLight.position.set(0, 0, 0.2); // nudge forward so it sits just past the lens
cameraLight.castShadow = false;      // keep off — moving shadow maps are costly
camera.add(cameraLight);

const cameraLightTarget = new THREE.Object3D();
cameraLightTarget.position.set(0, 0, -1); // 1 unit in front, in camera space
camera.add(cameraLightTarget);
cameraLight.target = cameraLightTarget;

//____________________________CAMERA LIGHT END



    const dracoLoader = new DRACOLoader();

    dracoLoader.setDecoderPath('static/js/vendor/three/examples/jsm/libs/draco/gltf/'); // note the /gltf/ subfolder — that's the JS-based decoder variant, most compatible

    dracoLoader.setDecoderConfig({type: 'js'}); // force JS decoder, skip WASM entirely
    const gltfLoader = new GLTFLoader().setCrossOrigin('anonymous').setDRACOLoader(dracoLoader);
    const boatCount = 9;

    const availableModelFolders = await fetchAvailableModelFolders();

    const modelsToLoad = []; // { folderAndFile, modelIndex }

    for (let i = 1; i <= boatCount; i++) {

        const modelIndex = i - 1;

        if (!modelEnabled[modelIndex]) {
            console.log(`Skipping Boot ${i} (disabled via modelEnabled)`);
            continue;
        }

        modelsToLoad.push({folderAndFile: `Boot ${i}`, modelIndex});

    }

    // Variant index formula: boat i, variant v → index (i * 10 + v). Fixed
    // and predictable regardless of load order or which variants exist, so
    // hotspotDefinitions can be hardcoded per variant (e.g. hotspotDefinitions[31]
    // for "Boot 3_1") without it shifting as folders are added/removed.
    for (let i = 1; i <= boatCount; i++) {

        if (!modelEnabled[i - 1]) continue; // base boat disabled — skip its variants too

        const variants = getVariantFoldersForBoat(availableModelFolders, i);

        variants.forEach((folderAndFile) => {

            const match = folderAndFile.match(/_(\d+)$/);
            const variantNumber = match ? parseInt(match[1], 10) : 1;
            const modelIndex = i * 10 + variantNumber;

            modelsToLoad.push({folderAndFile, modelIndex});

        });

    }

    const enabledCount = modelsToLoad.length;
    let modelsLoadedSoFar = 0;


const CONCURRENCY = 4; // tune to your bandwidth/decode headroom — start at 3-4

async function loadOneModel({folderAndFile, modelIndex}) {

    const folderPath = `static/models/${folderAndFile}/`;

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

        model.scale.setScalar(0.03);

        const pivot = new THREE.Group();
        pivot.add(model);
        scene.add(pivot);

        registerHotspotsForModel(modelIndex, pivot);
        registerToggleableModel(modelIndex, folderAndFile, pivot);

    } catch (error) {

        console.error(`Failed to load model for ${folderAndFile}:`, error);

    } finally {

        modelsLoadedSoFar++;

        updateLoadingProgress({
            fileName: folderAndFile,
            fileProgress: 1,
            modelsLoaded: modelsLoadedSoFar,
            modelsTotal: enabledCount
        });

    }

}

// Keeps CONCURRENCY loads in flight instead of loading all boats one at a time.
async function runWithConcurrencyLimit(items, limit, worker) {

    const queue = [...items];

    async function runNext() {
        const item = queue.shift();
        if (!item) return;
        await worker(item);
        await runNext();
    }

    const workers = Array.from({length: Math.min(limit, items.length)}, runNext);
    await Promise.all(workers);

}

await runWithConcurrencyLimit(modelsToLoad, CONCURRENCY, loadOneModel);


// Configure renderer to use shadow map
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadow maps

    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping; // filmic contrast curve — supports the moody look better than the flat linear default
    renderer.toneMappingExposure = 0.9;

    document.body.appendChild(renderer.domElement);

   // const pmremGenerator = new THREE.PMREMGenerator(renderer);
  //  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;


// Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.1;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0); // Ensure the orbit control target is centered at the model
    controls.update();

     controls.enableRotate = false;
     controls.enableZoom = cameraZoomEnabled;   // <-- was implicitly OrbitControls' default (true)

    // ----- CAMERA CONTROLS (X, Y, Target Y, Model Z) -----
const camXSlider = document.getElementById('cam-pos-x');
const camYSlider = document.getElementById('cam-pos-y');
const camXVal = document.getElementById('cam-pos-x-val');
const camYVal = document.getElementById('cam-pos-y-val');

const camTargetYSlider = document.getElementById('cam-target-y');
const camTargetYVal = document.getElementById('cam-target-y-val');

const camModelZSlider = document.getElementById('cam-model-z');
const camModelZVal = document.getElementById('cam-model-z-val');

// Global variable to track model Z offset
let currentModelZ = initialModelZ;

// ----- Helper functions -----

function setCameraX(x) {
    if (!controls) return;
    camera.position.x = x;
    controls.update();
    updateSliders();
}

function setCameraY(y) {
    if (!controls) return;
    camera.position.y = y;
    controls.update();
    updateSliders();
}

function setTargetY(y) {
    if (!controls) return;
    const deltaY = y - controls.target.y;
    controls.target.y += deltaY;
    camera.position.y += deltaY;
    controls.update();
    updateSliders();
}

function setModelZ(z) {
    currentModelZ = z;
    const activeEntry = getActiveModelEntry();
    if (activeEntry && activeEntry.object) {
        activeEntry.object.position.z = z;
    }
    updateSliders();
}

function updateSliders() {
    if (!controls) return;

    // Position sliders
    camXSlider.value = camera.position.x;
    camXVal.textContent = camera.position.x.toFixed(2);
    camYSlider.value = camera.position.y;
    camYVal.textContent = camera.position.y.toFixed(2);

    // Target Y slider
    camTargetYSlider.value = controls.target.y;
    camTargetYVal.textContent = controls.target.y.toFixed(2);

    // Model Z slider – read from the active model if available
    const activeEntry = getActiveModelEntry();
    const modelZ = (activeEntry && activeEntry.object) ? activeEntry.object.position.z : currentModelZ;
    camModelZSlider.value = modelZ;
    camModelZVal.textContent = modelZ.toFixed(2);
}

// Initial sync – using top‑level variables
camera.position.copy(initialCameraPosition);
controls.target.y = initialTargetY;
controls.target.z = 0; // not used, but keep it 0
controls.update();
updateSliders();

// ----- X position event -----
camXSlider.addEventListener('input', () => {
    const x = parseFloat(camXSlider.value);
    setCameraX(x);
});

// ----- Y position event -----
camYSlider.addEventListener('input', () => {
    const y = parseFloat(camYSlider.value);
    setCameraY(y);
});

// ----- Target Y event -----
camTargetYSlider.addEventListener('input', () => {
    const y = parseFloat(camTargetYSlider.value);
    setTargetY(y);
});

// ----- Model Z event -----
camModelZSlider.addEventListener('input', () => {
    const z = parseFloat(camModelZSlider.value);
    setModelZ(z);
});

// Keep sliders in sync when orbiting or panning with the mouse
controls.addEventListener('change', updateSliders);
// --------------------------------------------------------------

    // Adjust with window resize
    window.addEventListener('resize', onWindowResize);


     // Simulate button 1 being pressed once everything is loaded and running,
    // so the first model is selected and the status text reflects it.
    selectModel(0);

    // Preload hotspot media (images/videos/slideshows) and warm up every
    // model's shaders/textures while the loading overlay is still covering
    // the screen — so nothing has to fetch or compile for the first time
    // later, when the person is actually watching.
    updateLoadingProgress({
        fileName: 'Hotspot-Medien',
        fileProgress: 0,
        modelsLoaded: enabledCount,
        modelsTotal: enabledCount
    });

    await preloadAllHotspotMedia({
        onProgress: (done, total) => {
            loadingCurrentFileEl.textContent = `Hotspot-Medien (${done} / ${total})`;
            const percent = total > 0 ? Math.round((done / total) * 100) : 100;
            loadingBarFillEl.style.width = `${percent}%`;
            loadingProgressTextEl.textContent = `${percent}%`;
        }
    });

    warmUpAllModels({
        onProgress: (done, total) => {
            loadingCurrentFileEl.textContent = `Modelle vorbereiten (${done} / ${total})`;
            const percent = total > 0 ? Math.round((done / total) * 100) : 100;
            loadingBarFillEl.style.width = `${percent}%`;
            loadingProgressTextEl.textContent = `${percent}%`;
        }
    });

    hideLoadingOverlay(); // models, hotspot media, and GPU warm-up all done — hide the loading screen

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

    screensaverImgA = document.createElement('img');
    screensaverImgB = document.createElement('img');

    [screensaverImgA, screensaverImgB].forEach((img) => {
        img.classList.add('screensaver-image');
        img.style.transition = `opacity ${screensaverCrossfadeDuration}ms ease-in-out`;
        img.draggable = false;
        screensaverEl.appendChild(img);
    });

    screensaverImgA.src = screensaverImages[0];
    screensaverImgB.src = screensaverImages[1];
    screensaverImgA.style.opacity = '1';
    screensaverImgB.style.opacity = '0';

    resetScreensaverTimer();

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

// True while the hotspot info overlay is on screen. The overlay is shown/hidden
// purely via its inline display style ('flex' when open, 'none' when closed),
// so that's what we check.
function isHotspotOverlayOpen() {
    return !!hotspotOverlayEl && hotspotOverlayEl.style.display !== 'none';
}

function showScreensaver() {

    // Don't cover an open hotspot overlay — the person may be reading a long
    // text or watching a video, and a screensaver on top of it would hide the
    // close button and interrupt them. Re-arm the timer and wait instead.
    if (isHotspotOverlayOpen()) {
        resetScreensaverTimer();
        return;
    }

    screensaverActive = true;
    screensaverEl.style.display = 'flex';

    // Always start on image 1, fully opaque, before beginning the hold/crossfade
    // loop — snap instantly (no transition) so re-triggering never shows a stray
    // fade from wherever the images were left last time.
    screensaverImgA.style.transition = 'none';
    screensaverImgB.style.transition = 'none';
    screensaverImgA.style.opacity = '1';
    screensaverImgB.style.opacity = '0';
    void screensaverImgA.offsetHeight; // force layout so the transition removal "sticks" before re-enabling it
    screensaverImgA.style.transition = `opacity ${screensaverCrossfadeDuration}ms ease-in-out`;
    screensaverImgB.style.transition = `opacity ${screensaverCrossfadeDuration}ms ease-in-out`;

    runScreensaverCycle(true); // true = currently showing image A

    closeDrawer();
    drawerToggleEl.classList.add('hidden');

}

// Alternates: hold current image → crossfade to the other → hold → crossfade back, etc.
function runScreensaverCycle(showingA) {
    clearTimeout(screensaverCycleTimer);

    screensaverCycleTimer = setTimeout(() => {
        if (!screensaverActive) return;

        // Toggle opacities: if showingA is true, show B; otherwise show A
        screensaverImgA.style.opacity = showingA ? '0' : '1';
        screensaverImgB.style.opacity = showingA ? '1' : '0';

        // No recursive call → cycle stops after this single transition
    }, screensaverImageHoldTime);
}

function hideScreensaver() {

    screensaverActive = false;
    screensaverEl.style.display = 'none';

    clearTimeout(screensaverCycleTimer);

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
                if (mat.name === 'PaintHull_PS' || mat.name === 'PaintHull_SB' ) {
                    console.log("Found Painthull, changing scaler");
                   // mat.color.multiplyScalar(0.75);  // 0.7 = 30% darker; lower = darker still
                }
                //Heliport
                   if (mat.name === 'PaintDeck_DOS_RAL_9023.003' ) {
                    console.log("Found Painthull, changing scaler");
                     mat.color.setHex(0x505050);
                   // mat.color.multiplyScalar(0.75);  // 0.7 = 30% darker; lower = darker still
                }
                // Relinge
                               if (mat.name === 'PaintDeck_DOS_RAL_9023.002' ) {
                    console.log("Found Painthull, changing scaler");
                     mat.color.setHex(0x606060);
                   // mat.color.multiplyScalar(0.75);  // 0.7 = 30% darker; lower = darker still
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

    // ---- Per-button image (optional) ----
    // If the config has an `image`, set it on the button's background <img>.
    // Otherwise leave whatever icon the HTML template provides.
    if (configEntry && configEntry.image) {
        let iconEl = btn.querySelector('.model-toggle-icon');
        if (!iconEl) {
            iconEl = document.createElement('img');
            iconEl.className = 'model-toggle-icon';
            iconEl.alt = '';
            iconEl.draggable = false;
            btn.insertBefore(iconEl, btn.firstChild);
        }
        iconEl.src = configEntry.image;
    }

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
        });

        // Which drawer button should appear active for the loaded model —
        // for a base loaded via its variant's pink, this is the variant's
        // button, so the drawer state stays consistent.
        const activeBtnIndex = (activeButtonForModel[index] !== undefined)
            ? activeButtonForModel[index]
            : index;

        document.querySelectorAll('.model-toggle-btn').forEach((btn) => {
            const btnIndex = parseInt(btn.dataset.index, 10);
            btn.classList.toggle('active', btnIndex === activeBtnIndex);
            btn.classList.toggle('inactive', btnIndex !== activeBtnIndex);
        });

       activeModelIndex = index;

       if (debugOverlayVisible) buildHotspotRangeControls(); // ← added

// Apply the current model Z offset to the newly active model
const newEntry = toggleableModels[index];
if (newEntry && newEntry.object) {
    newEntry.object.position.z = currentModelZ;
}

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
            if (debugOverlayVisible) buildHotspotRangeControls(); // ← added
        }

    });

    // ── Hotspot cam-angle readout — created exactly ONCE here. The render loop
    // only updates its text content, never creates new elements. ──
    const camAngleRow = document.createElement('div');
    camAngleRow.innerHTML = '<strong>Hotspot cam angle:</strong> <span id="debug-cam-angle">—</span>';
    debugOverlayEl.insertBefore(camAngleRow, debugOverlayEl.firstChild);
    debugCamAngleEl = camAngleRow.querySelector('#debug-cam-angle');

    // ── Hotspot marker offset sliders (three.js units) ──
    const offsetBlock = document.createElement('div');
    offsetBlock.id = 'hotspot-offset-controls';
    offsetBlock.style.cssText = 'margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.25);';

    function makeOffsetRow(axis, initialValue, onChange) {
        const row = document.createElement('label');
        row.style.cssText = 'display:flex; align-items:center; gap:6px; margin:2px 0; font-weight:300;';

        const label = document.createElement('span');
        label.textContent = axis;
        label.style.minWidth = '18px';
        row.appendChild(label);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '-1';
        slider.max = '1';
        slider.step = '0.005';       // fine enough to nudge by half a centimetre
        slider.value = String(initialValue);
        slider.style.flex = '1';
        slider.style.accentColor = '#00AC00';
        row.appendChild(slider);

        const valueEl = document.createElement('span');
        valueEl.className = 'light-value';
        valueEl.textContent = initialValue.toFixed(3);
        row.appendChild(valueEl);

        slider.addEventListener('input', () => {
            const v = parseFloat(slider.value);
            valueEl.textContent = v.toFixed(3);
            onChange(v);
        });

        offsetBlock.appendChild(row);
        return {slider, valueEl};
    }

    makeOffsetRow('X', hotspotOffset.x, (v) => { hotspotOffset.x = v; });
    makeOffsetRow('Y', hotspotOffset.y, (v) => { hotspotOffset.y = v; });
    makeOffsetRow('Z', hotspotOffset.z, (v) => { hotspotOffset.z = v; });

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset offsets';
    resetBtn.className = 'rotate-btn';
    resetBtn.style.marginTop = '4px';
    resetBtn.style.width = '100%';
    resetBtn.addEventListener('click', () => {
        hotspotOffset.set(0, 0, 0);
        offsetBlock.querySelectorAll('input[type="range"]').forEach((s) => { s.value = '0'; });
        offsetBlock.querySelectorAll('.light-value').forEach((el) => { el.textContent = '0.000'; });
    });
    offsetBlock.appendChild(resetBtn);

    debugOverlayEl.appendChild(offsetBlock);

        // ── Model rotation offset (degrees, added on top of targetYaw) ──
    const rotationOffsetBlock = document.createElement('div');
    rotationOffsetBlock.id = 'rotation-offset-controls';
    rotationOffsetBlock.style.cssText = 'margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.25);';

    const rotationOffsetTitle = document.createElement('div');
    rotationOffsetTitle.textContent = 'Rotation offset';
    rotationOffsetTitle.style.cssText = 'font-weight:600; margin-bottom:4px;';
    rotationOffsetBlock.appendChild(rotationOffsetTitle);

    const rotationOffsetRow = document.createElement('label');
    rotationOffsetRow.style.cssText = 'display:flex; align-items:center; gap:6px; margin:2px 0; font-weight:300;';

    const rotationOffsetLabel = document.createElement('span');
    rotationOffsetLabel.textContent = '°';
    rotationOffsetLabel.style.minWidth = '18px';
    rotationOffsetRow.appendChild(rotationOffsetLabel);

    const rotationOffsetSlider = document.createElement('input');
    rotationOffsetSlider.type = 'range';
    rotationOffsetSlider.min = '-180';
    rotationOffsetSlider.max = '180';
    rotationOffsetSlider.step = '1';
    rotationOffsetSlider.value = String(THREE.MathUtils.radToDeg(modelRotationOffset));
    rotationOffsetSlider.style.flex = '1';
    rotationOffsetSlider.style.accentColor = '#00AC00';
    rotationOffsetRow.appendChild(rotationOffsetSlider);

    const rotationOffsetVal = document.createElement('span');
    rotationOffsetVal.className = 'light-value';
    rotationOffsetVal.textContent = THREE.MathUtils.radToDeg(modelRotationOffset).toFixed(0);
    rotationOffsetRow.appendChild(rotationOffsetVal);

    rotationOffsetSlider.addEventListener('input', () => {
        const deg = parseFloat(rotationOffsetSlider.value);
        modelRotationOffset = THREE.MathUtils.degToRad(deg);
        rotationOffsetVal.textContent = deg.toFixed(0);
    });

    rotationOffsetBlock.appendChild(rotationOffsetRow);

    const resetRotationOffsetBtn = document.createElement('button');
    resetRotationOffsetBtn.textContent = 'Reset rotation offset';
    resetRotationOffsetBtn.className = 'rotate-btn';
    resetRotationOffsetBtn.style.marginTop = '4px';
    resetRotationOffsetBtn.style.width = '100%';
    resetRotationOffsetBtn.addEventListener('click', () => {
        modelRotationOffset = 0;
        rotationOffsetSlider.value = '0';
        rotationOffsetVal.textContent = '0';
    });
    rotationOffsetBlock.appendChild(resetRotationOffsetBtn);

    debugOverlayEl.appendChild(rotationOffsetBlock);
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

    // Only the text is updated here — the element itself was created once in
    // initDebugOverlay(). Guard against the case where initDebugOverlay hasn't
    // run yet (shouldn't happen in practice, but cheap insurance).
    if (debugCamAngleEl) {
        debugCamAngleEl.textContent = (lastHotspotCameraAngle === null)
            ? '—'
            : `${lastHotspotCameraAngle.toFixed(1)}°`;
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

        entry.object.rotation.y = lerpAngle(entry.object.rotation.y, targetYaw + modelRotationOffset, t);

    });

}

function initHotspotEngine() {

    hotspotLayer = document.getElementById('hotspot-layer');

}

// Initialise the green toggle button – called after DOM is ready
function initGreenToggle() {
    greenToggleBtn = document.getElementById('green-hotspots-toggle');
    if (!greenToggleBtn) {
        console.warn('Green toggle button not found in DOM');
        return;
    }

    // Set initial state (visible → green)
    greenToggleBtn.classList.remove('inactive');

    // Click handler
    greenToggleBtn.addEventListener('click', () => {
        greenHotspotsVisible = !greenHotspotsVisible;
        greenToggleBtn.classList.toggle('inactive', !greenHotspotsVisible);
        updateHotspots(); // apply immediately
    });
}


function registerHotspot({id, object, localPosition, minAngle, maxAngle, label, variant, iconSrc, onClick}) {
    const el = document.createElement('button');
    el.className = 'hotspot-btn';
    el.dataset.id = id;

    // position and transform are now handled by CSS
    // el.style.position = 'absolute';        // removed
    // el.style.transform = 'translate(-50%, -50%)'; // removed

    if (variant) {
        if (!HOTSPOT_VARIANTS.includes(variant)) {
            console.warn(`Hotspot "${id}" has unknown variant "${variant}" — falling back to default styling. Expected one of: ${HOTSPOT_VARIANTS.join(', ')}`);
        } else {
            el.classList.add(`hotspot-btn--${variant}`);
            el.dataset.variant = variant;
        }
    }

    if (iconSrc) {
        const iconEl = document.createElement('img');
        iconEl.className = 'hotspot-icon';
        iconEl.src = iconSrc;
        iconEl.alt = label || '';
        iconEl.draggable = false;
        el.appendChild(iconEl);
    }

    if (onClick) {
        el.addEventListener('click', onClick);
    }

    hotspotLayer.appendChild(el);

    hotspots.push({
        id,
        object,
        localPosition: localPosition.clone(),
        minAngle: THREE.MathUtils.euclideanModulo(minAngle, 360),
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
    hotspotOverlayContentEl = document.getElementById('hotspot-overlay-content');
    hotspotOverlayTitleEl = document.getElementById('hotspot-overlay-title');
    hotspotOverlayTextEl = document.getElementById('hotspot-overlay-text');
    hotspotOverlayImagesEl = document.getElementById('hotspot-overlay-images');

    // ── TOP BAR (Title + Subtitle + Logo) — stays fixed, never scrolls ──
    const topBar = document.createElement('div');
    topBar.className = 'hotspot-overlay-topbar';
    hotspotOverlayContentEl.insertBefore(topBar, hotspotOverlayTitleEl);

    const titleBlock = document.createElement('div');
    titleBlock.className = 'hotspot-overlay-titleblock';
    topBar.appendChild(titleBlock);

    titleBlock.appendChild(hotspotOverlayTitleEl); // moves title into the title block

    hotspotOverlaySubtitleEl = document.createElement('div');
    hotspotOverlaySubtitleEl.className = 'hotspot-overlay-subtitle hidden';
    titleBlock.appendChild(hotspotOverlaySubtitleEl);

    hotspotOverlayLogoEl = document.createElement('img');
    hotspotOverlayLogoEl.className = 'hotspot-overlay-logo hidden';
    hotspotOverlayLogoEl.alt = '';
    hotspotOverlayLogoEl.draggable = false;
    topBar.appendChild(hotspotOverlayLogoEl);

     // ── SCROLL AREA (Text + Images scroll together) ──
    hotspotOverlayScrollEl = document.createElement('div');
    hotspotOverlayScrollEl.className = 'hotspot-overlay-scroll';
    hotspotOverlayContentEl.insertBefore(hotspotOverlayScrollEl, hotspotOverlayTextEl);

    hotspotOverlayScrollEl.appendChild(hotspotOverlayTextEl);   // moves text into the scroll wrapper
    hotspotOverlayScrollEl.appendChild(hotspotOverlayImagesEl); // moves images into the scroll wrapper

    // ── Deep dive buttons (bottom, absolute — unchanged) ──
    deepDiveButtonsEl = document.createElement('div');
    deepDiveButtonsEl.className = 'hotspot-deep-dive-buttons';
    hotspotOverlayContentEl.appendChild(deepDiveButtonsEl);

    // ── Hotspot icon (top-left badge, absolute — unchanged) ──
    hotspotOverlayIconEl = document.createElement('img');
    hotspotOverlayIconEl.className = 'hotspot-overlay-icon';
    hotspotOverlayIconEl.alt = '';
    hotspotOverlayIconEl.draggable = false;
    hotspotOverlayIconEl.classList.add('hidden');
    hotspotOverlayContentEl.insertBefore(hotspotOverlayIconEl, hotspotOverlayContentEl.firstChild);

    document.getElementById('hotspot-overlay-close').addEventListener('click', closeHotspotOverlay);

    hotspotOverlayEl.addEventListener('click', (event) => {
        if (event.target === hotspotOverlayEl) closeHotspotOverlay();
    });

    window.addEventListener('keydown', (event) => {
        if (event.code === 'Escape') closeHotspotOverlay();
    });
}


function renderHotspotMedia(content) {
    clearSlideshowAutoplay();
    hotspotOverlayImagesEl.innerHTML = '';

    if (content.video) {

        // `video` may be a single string path OR an array of paths — the
        // definitions use both shapes. Normalise so either works.
        const videoSources = Array.isArray(content.video) ? content.video : [content.video];

        videoSources.forEach((src) => {
            const video = document.createElement('video');
            video.className = 'hotspot-overlay-video';
            video.src = src;
            video.controls = true;
            video.playsInline = true;
            video.preload = 'metadata';

            // Centre + size the video so it behaves like the images do, without
            // relying on outer CSS existing. `margin: 0 auto` is the horizontal
            // centring; max-height keeps it from running off-screen.
            video.style.display = 'block';
            video.style.margin = '0 auto';
            video.style.width = '100%';
            video.style.maxWidth = '100%';
            video.style.height = 'auto';
            video.style.maxHeight = '60vh';
            video.style.objectFit = 'contain';
            video.style.background = '#000';

            hotspotOverlayImagesEl.appendChild(video);
                  video.play().catch(() => {});
        });

    } else if (content.slideshow) {
        renderSlideshow(content.slideshow);

    } else {
        (content.images || []).forEach((src) => {
            const img = document.createElement('img');
            // All images now use `cover` — fills the container regardless of
            // source format. No PNG/JPG distinction any more.
            img.className = 'hotspot-overlay-image hotspot-overlay-image--cover';
            img.src = src;
            hotspotOverlayImagesEl.appendChild(img);
        });
    }
}


// Fetches the list of available model folder names from the backend once —
// the browser can't list a server directory on its own, so this is how we
// discover "Boot N_1", "Boot N_2", etc. variant folders without hardcoding them.
async function fetchAvailableModelFolders() {

    try {
        const res = await fetch('/api/list-models');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('Could not fetch model folder list — variant models (e.g. "Boot 1_1") will be skipped:', e);
        return [];
    }

}

// Given the full folder list and a base boat number (1-based), returns the
// variant folder names belonging to that boat — e.g. for boatNumber=1:
// "Boot 1_1", "Boot 1_2", ... — sorted numerically by their suffix.
function getVariantFoldersForBoat(allFolders, boatNumber) {

    const pattern = new RegExp(`^Boot ${boatNumber}_(\\d+)$`);

    return allFolders
        .map((name) => {
            const match = name.match(pattern);
            return match ? {name, suffix: parseInt(match[1], 10)} : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.suffix - b.suffix)
        .map((entry) => entry.name);

}


async function fetchSlideshowImages(dirPath) {

    try {
        const res = await fetch(`/api/list-images?dir=${encodeURIComponent(dirPath)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error(`Failed to list images in "${dirPath}":`, e);
        return [];
    }

}

async function renderSlideshow(dirPath) {
    const container = document.createElement('div');
    container.className = 'hotspot-slideshow';

    const loadingLabel = document.createElement('div');
    loadingLabel.className = 'slideshow-loading';
    loadingLabel.textContent = 'Lade Bilder...';
    container.appendChild(loadingLabel);

    hotspotOverlayImagesEl.appendChild(container);

    const images = await fetchSlideshowImages(dirPath);

    if (!container.isConnected) return;

    loadingLabel.remove();

    if (images.length === 0) {
        const emptyLabel = document.createElement('div');
        emptyLabel.className = 'slideshow-empty';
        emptyLabel.textContent = 'Keine Bilder gefunden.';
        container.appendChild(emptyLabel);
        return;
    }

    let currentIndex = 0;

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'slideshow-image-wrapper';

    const imgEl = document.createElement('img');
    imgEl.className = 'slideshow-image';
    imgWrapper.appendChild(imgEl);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'slideshow-nav-btn slideshow-nav-btn--prev';
    prevBtn.setAttribute('aria-label', 'Previous image');
    const prevIcon = document.createElement('img');
    prevIcon.className = 'slideshow-nav-icon';
    prevIcon.src = 'static/images/icons/chevron-left.svg';
    prevIcon.alt = 'Previous image';
    prevIcon.draggable = false;
    prevBtn.appendChild(prevIcon);
    imgWrapper.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'slideshow-nav-btn slideshow-nav-btn--next';
    nextBtn.setAttribute('aria-label', 'Next image');
    const nextIcon = document.createElement('img');
    nextIcon.className = 'slideshow-nav-icon';
    nextIcon.src = 'static/images/icons/chevron-right.svg';
    nextIcon.alt = 'Next image';
    nextIcon.draggable = false;
    nextBtn.appendChild(nextIcon);
    imgWrapper.appendChild(nextBtn);

    container.appendChild(imgWrapper);

    const controlsRow = document.createElement('div');
    controlsRow.className = 'slideshow-controls';

    const counterEl = document.createElement('span');
    counterEl.className = 'slideshow-counter';
    controlsRow.appendChild(counterEl);

    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'slideshow-dots';
    controlsRow.appendChild(dotsWrapper);

    container.appendChild(controlsRow);

    const dots = images.map((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slideshow-dot';
        dot.addEventListener('click', () => {
            showImage(i);
            resetAutoplay();
        });
        dotsWrapper.appendChild(dot);
        return dot;
    });

    function showImage(index) {
        currentIndex = ((index % images.length) + images.length) % images.length;
        imgEl.src = images[currentIndex];
        counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    function resetAutoplay() {
        clearSlideshowAutoplay();
        slideshowAutoplayTimer = setInterval(() => showImage(currentIndex + 1), SLIDESHOW_AUTOPLAY_MS);
    }

    prevBtn.addEventListener('click', () => {
        showImage(currentIndex - 1);
        resetAutoplay();
    });
    nextBtn.addEventListener('click', () => {
        showImage(currentIndex + 1);
        resetAutoplay();
    });

    showImage(0);
    resetAutoplay();
}


function renderHotspotContent(content) {
    if (!hotspotOverlayContentEl) return;

    const hasText     = !!(content.text && content.text.trim().length > 0);
    const hasImages   = !!(content.images && content.images.length > 0);
    const hasVideo    = !!content.video;
    const hasSlideshow = !!content.slideshow;

    // Full-bleed modes:
    //   • slideshow with no text  → slideshow fills overlay (existing behaviour)
    //   • video with no text      → video fills overlay
    //   • text-only (no other media) → text fills overlay
    const slideshowFull = hasSlideshow && !hasText;
    const videoFull     = hasVideo && !hasText;
    const textFull      = hasText && !hasImages && !hasVideo && !hasSlideshow;

    hotspotOverlayContentEl.classList.toggle('slideshow-full', slideshowFull);
    hotspotOverlayContentEl.classList.toggle('video-full',     videoFull);
    hotspotOverlayContentEl.classList.toggle('text-full',      textFull);

    hotspotOverlayTitleEl.textContent = content.title || '';
    renderHotspotText(content.text || '');

    // Subtitle (optional)
    if (content.subtitle) {
        hotspotOverlaySubtitleEl.textContent = content.subtitle;
        hotspotOverlaySubtitleEl.classList.remove('hidden');
    } else {
        hotspotOverlaySubtitleEl.textContent = '';
        hotspotOverlaySubtitleEl.classList.add('hidden');
    }

    // Logo (optional)
    if (content.logo) {
        hotspotOverlayLogoEl.src = content.logo;
        hotspotOverlayLogoEl.classList.remove('hidden');
    } else {
        hotspotOverlayLogoEl.classList.add('hidden');
        hotspotOverlayLogoEl.removeAttribute('src');
    }

    renderHotspotMedia(content);
        // Scroll back to the top whenever content changes — opening a hotspot,
    // switching deep dives, or returning to the base content. Without this,
    // a stale scroll position from a previous, longer hotspot would carry over.
    if (hotspotOverlayScrollEl) hotspotOverlayScrollEl.scrollTop = 0;
}

// Splits the raw hotspot text on "\n" (and "\t", which the data uses as a
// soft paragraph separator), turning any line starting with "•" into a
// proper <li> inside a <ul>. Non-bullet lines become <p> paragraphs.
// Returns a DocumentFragment ready to append.
function parseHotspotText(rawText) {

    const fragment = document.createDocumentFragment();
    let currentList = null;

    function flushList() {
        if (currentList) {
            fragment.appendChild(currentList);
            currentList = null;
        }
    }

    rawText.split('\n').forEach((rawLine) => {

        rawLine.split('\t').forEach((subLine) => {

            const line = subLine.trim();

            if (line.length === 0) {
                flushList();
                return;
            }

            if (line.startsWith('•')) {

                if (!currentList) {
                    currentList = document.createElement('ul');
                    currentList.className = 'hotspot-overlay-list';
                }

                const li = document.createElement('li');
                li.textContent = line.slice(1).trim(); // drop the "•" and any following spaces
                currentList.appendChild(li);

            } else {

                flushList();
                const p = document.createElement('p');
                p.textContent = line;
                fragment.appendChild(p);

            }

        });

    });

    flushList();
    return fragment;

}

function renderHotspotText(rawText) {
    hotspotOverlayTextEl.innerHTML = '';
    hotspotOverlayTextEl.appendChild(parseHotspotText(rawText || ''));
}

function buildDeepDiveButtons(baseContent) {
    deepDiveButtonsEl.innerHTML = '';

    const deepDives = baseContent.deepDives || [];

    if (deepDives.length === 0) {
        deepDiveButtonsEl.classList.remove('visible');
        return;
    }

    deepDiveButtonsEl.classList.add('visible');

    const overviewBtn = document.createElement('button');
    overviewBtn.className = 'hotspot-deep-dive';
    overviewBtn.textContent = 'Return';
    overviewBtn.addEventListener('click', () => renderHotspotContent(baseContent));
    deepDiveButtonsEl.appendChild(overviewBtn);

    deepDives.forEach((dive, i) => {
        const btn = document.createElement('button');
        btn.className = 'hotspot-deep-dive';
        btn.textContent = dive.title || `Deep Dive ${i + 1}`;

        btn.addEventListener('click', () => {

            // ---- Linked-hotspot deep dive ----
            if (dive.linkedHotspotId) {
                const linkedDef = findHotspotDefinitionById(dive.linkedHotspotId);
                if (!linkedDef || !linkedDef.content) {
                    console.warn(`Deep dive "${dive.title}" references unknown hotspot id "${dive.linkedHotspotId}"`);
                    return;
                }
                if (linkedDef.variant && HOTSPOT_VARIANTS.includes(linkedDef.variant)) {
                    HOTSPOT_VARIANTS.forEach((v) => hotspotOverlayEl.classList.remove(`hotspot-overlay--${v}`));
                    hotspotOverlayEl.classList.add(`hotspot-overlay--${linkedDef.variant}`);
                }
                if (linkedDef.icon) {
                    hotspotOverlayIconEl.src = linkedDef.icon;
                    hotspotOverlayIconEl.classList.remove('hidden');
                }

                renderHotspotContent(linkedDef.content);
                // Different hotspot → it has its own deep-dive list, so rebuild.
                buildDeepDiveButtons(linkedDef.content);
                return;
            }

            // ---- Normal deep dive ----
            // Just swap the content. KEEP the existing button row so the user
            // can still hit "Return" or jump to a sibling deep dive.
            renderHotspotContent(dive);
        });

        deepDiveButtonsEl.appendChild(btn);
    });
}

function openHotspotOverlay(content, variant, iconSrc) {
    HOTSPOT_VARIANTS.forEach((v) => hotspotOverlayEl.classList.remove(`hotspot-overlay--${v}`));
    if (variant && HOTSPOT_VARIANTS.includes(variant)) {
        hotspotOverlayEl.classList.add(`hotspot-overlay--${variant}`);
    }

    if (iconSrc) {
        hotspotOverlayIconEl.src = iconSrc;
        hotspotOverlayIconEl.classList.remove('hidden');
    } else {
        hotspotOverlayIconEl.classList.add('hidden');
    }

    renderHotspotContent(content);
    buildDeepDiveButtons(content);

    hotspotOverlayEl.style.display = 'flex';
}



function closeHotspotOverlay() {

    hotspotOverlayEl.style.display = 'none';

    clearSlideshowAutoplay();

    const video = hotspotOverlayImagesEl.querySelector('video');
    if (video) video.pause();

}

function registerHotspotsForModel(modelIndex, object3D) {

    const definitions = hotspotDefinitions[modelIndex];
    if (!definitions) return;

    definitions.forEach((def) => {

        // A hotspot with `linkedModelIndex` switches to that model instead of
        // opening the info overlay — same selectModel() the drawer buttons
        // use, just triggered from a click in the 3D scene. `content` is
        // optional for these since there's no overlay to show.
        const onClick = (def.linkedModelIndex !== undefined)
            ? () => selectModel(def.linkedModelIndex)
            : () => openHotspotOverlay(def.content, def.variant, def.icon);

        registerHotspot({
            id: def.id,
            object: object3D,
            localPosition: def.localPosition,
            minAngle: def.minAngle,
            maxAngle: def.maxAngle,
            label: def.content ? def.content.title : (def.label || ''),
            variant: def.variant,
            iconSrc: def.icon,
            onClick
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
    if (greenToggleBtn) greenToggleBtn.classList.add('hidden');   // hide circular button
}

function closeDrawer() {
    drawerOpen = false;
    toggleBarEl.classList.remove('open');
    drawerToggleEl.classList.remove('hidden');
    if (greenToggleBtn) greenToggleBtn.classList.remove('hidden');   // show circular button
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

        wireDirectionalLightControls(directionalLight, '');
    wireDirectionalLightControls(directionalLight2, '-2');

    // ---- Camera light (spot light parented to the camera) ----
    const camLightSlider = document.getElementById('camera-light-intensity');
    const camLightVal = document.getElementById('camera-light-intensity-val');

    camLightSlider.value = cameraLight.intensity;
    camLightVal.textContent = cameraLight.intensity.toFixed(1);

    camLightSlider.addEventListener('input', () => {
        const val = parseFloat(camLightSlider.value);
        cameraLight.intensity = val;
        camLightVal.textContent = val.toFixed(1);
    });



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
        connectionWarningDismissedFor = null;
        return;
    }

    let message = '';
    if (problems.length === 2) {
        // Both missing – combine with a generic cable check
        message = 'Kamera & Encoder nicht verbunden,Warten und Kabel prüfen';
    } else if (problems.includes('Kamera')) {
        message = 'Kamera nicht verbunden, Warten oder Kabel prüfen';
    } else if (problems.includes('Encoder')) {
        message = 'Encoder nicht verbunden, Kabel prüfen';
    }

    connectionWarningTextEl.textContent = message;

    // Only stay hidden if the user dismissed exactly this message
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
    const lookaheadSlider = document.getElementById('anticipation-lookahead');
    const lookaheadVal = document.getElementById('anticipation-lookahead-val');

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

    const initialAlpha = (state && typeof state.marker_correction_alpha === 'number') ? state.marker_correction_alpha : 0.25;
    const initialSnapThreshold = (state && typeof state.marker_snap_threshold_deg === 'number') ? state.marker_snap_threshold_deg : 15.0;
    const initialMultiplier = (state && typeof state.rotation_multiplier === 'number') ? state.rotation_multiplier : 1.0;
    const initialLookahead = (state && typeof state.anticipation_lookahead_markers === 'number') ? state.anticipation_lookahead_markers : 3;

    alphaSlider.value = initialAlpha;
    alphaVal.textContent = initialAlpha.toFixed(2);
    snapSlider.value = initialSnapThreshold;
    snapVal.textContent = initialSnapThreshold.toFixed(0);
    multiplierSlider.value = initialMultiplier;
    multiplierVal.textContent = initialMultiplier.toFixed(1);
    lookaheadSlider.value = initialLookahead;
    lookaheadVal.textContent = initialLookahead.toFixed(0);

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

    lookaheadSlider.addEventListener('input', () => {
        const val = parseFloat(lookaheadSlider.value);
        lookaheadVal.textContent = val.toFixed(0);
        pushTrackingSetting('anticipation_lookahead_markers', val);
    });

}

function initMouseRotationToggle() {

    mouseRotationToggleBtn = document.createElement('button');
    mouseRotationToggleBtn.id = 'mouse-rotation-toggle';
    mouseRotationToggleBtn.className = 'inactive';
    mouseRotationToggleBtn.title = 'Kamera-Mausrotation';

    mouseRotationToggleIconEl = document.createElement('img');
    mouseRotationToggleIconEl.alt = '';
    mouseRotationToggleIconEl.draggable = false;
    mouseRotationToggleIconEl.style.width = '22px';
    mouseRotationToggleIconEl.style.height = '22px';
    mouseRotationToggleIconEl.style.pointerEvents = 'none';
    mouseRotationToggleBtn.appendChild(mouseRotationToggleIconEl);

    mouseRotationToggleBtn.addEventListener('click', toggleMouseRotationMode);

    document.body.appendChild(mouseRotationToggleBtn);

    updateMouseRotationToggleVisual();

}

function updateMouseRotationToggleVisual() {

    if (!mouseRotationToggleBtn) return;

    mouseRotationToggleBtn.classList.toggle('inactive', !mouseRotationEnabled);
    mouseRotationToggleIconEl.src = mouseRotationEnabled
        ? mouseRotationIconUnlockedSrc
        : mouseRotationIconLockedSrc;

}



function toggleMouseRotationMode() {

    mouseRotationEnabled = !mouseRotationEnabled;

    if (mouseRotationEnabled) {

        // Save the camera's current position/rotation/target so it can be
        // restored exactly once mouse rotation mode is turned back off.
        mouseRotationSavedCameraState = {
            position: camera.position.clone(),
            rotation: camera.rotation.clone(),
            target: controls.target.clone()
        };

        controls.enableRotate = true;
        controls.enableZoom = mouseRotationAllowZoom;

    } else {

        controls.enableRotate = false;
           controls.enableZoom = cameraZoomEnabled;   // <-- was: true

        if (mouseRotationSavedCameraState) {
            camera.position.copy(mouseRotationSavedCameraState.position);
            camera.rotation.copy(mouseRotationSavedCameraState.rotation);
            controls.target.copy(mouseRotationSavedCameraState.target);
            controls.update();
        }

        mouseRotationSavedCameraState = null;

    }

    updateMouseRotationToggleVisual();

}


// Walks hotspotDefinitions (including nested deepDives) and collects every
// media reference so it can be preloaded. Returns { images, videos, slideshowDirs }.
function collectAllHotspotMedia() {

    const images = new Set();
    const videos = new Set();
    const slideshowDirs = new Set();

    function collectFromContent(content) {

        if (!content) return;

        (content.images || []).forEach((src) => images.add(src));
        if (content.video) videos.add(content.video);
        if (content.logo) images.add(content.logo);
        if (content.slideshow) slideshowDirs.add(content.slideshow);

        (content.deepDives || []).forEach(collectFromContent);

    }

    Object.values(hotspotDefinitions).forEach((defs) => {
        defs.forEach((def) => {
            if (def.icon) images.add(def.icon);
            collectFromContent(def.content);
        });
    });

    return {
        images: Array.from(images),
        videos: Array.from(videos),
        slideshowDirs: Array.from(slideshowDirs)
    };

}

function preloadImage(src) {

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // don't let one bad path stall the whole preload
        img.src = src;
    });

}

// Videos are heavy — "preload" here just means asking the browser to fetch
// and buffer metadata/data ahead of time via a hidden <video>, rather than
// blocking on the full file (which could be large).
function preloadVideo(src) {

    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata'; // was 'auto' — don't force full buffering during startup
        video.muted = true;
        video.style.display = 'none';
        video.addEventListener('loadedmetadata', () => resolve(), {once: true}); // was 'canplaythrough'
        video.addEventListener('error', () => resolve(), {once: true});
        video.src = src;
        document.body.appendChild(video);
    });

}
async function preloadSlideshowDir(dirPath) {

    const imagePaths = await fetchSlideshowImages(dirPath); // already defined elsewhere in this file
    await Promise.all(imagePaths.map(preloadImage));

}

// Preloads every hotspot image, video, and slideshow folder, reporting
// progress through the same loading overlay used for the 3D models.
async function preloadAllHotspotMedia({onProgress} = {}) {

    const {images, videos, slideshowDirs} = collectAllHotspotMedia();

    const totalItems = images.length + videos.length + slideshowDirs.length;
    let completedItems = 0;

    function reportDone() {
        completedItems++;
        if (onProgress) onProgress(completedItems, totalItems);
    }

    const tasks = [
        ...images.map((src) => preloadImage(src).then(reportDone)),
        ...videos.map((src) => preloadVideo(src).then(reportDone)),
        ...slideshowDirs.map((dir) => preloadSlideshowDir(dir).then(reportDone))
    ];

    await Promise.all(tasks);

}

// Warms up the GPU/shader pipeline for every loaded model by briefly making
// each one visible and rendering a frame while the loading overlay still
// covers the screen — this is the "press every button once" trick. It forces
// three.js to compile shaders and upload textures for each model's materials
// now, instead of on the first real selectModel() click, which is what
// causes the visible hitch/stutter the first time a boat is switched to.
function warmUpAllModels({onProgress} = {}) {

    const entries = toggleableModels.filter(Boolean);
    if (entries.length === 0) return;

    // Remember what's actually visible right now (set by registerToggleableModel),
    // so it can be restored exactly once warm-up is done.
    const originalVisibility = toggleableModels.map((entry) => entry ? entry.object.visible : null);

    entries.forEach((entry, i) => {

        toggleableModels.forEach((otherEntry) => {
            if (otherEntry) otherEntry.object.visible = false;
        });
        entry.object.visible = true;

        renderer.render(scene, camera); // triggers shader compilation + texture upload for this model

        if (onProgress) onProgress(i + 1, entries.length);

    });

    toggleableModels.forEach((entry, index) => {
        if (entry) entry.object.visible = originalVisibility[index];
    });

}

// Looks up a hotspot definition by its `id` across every model's list.
// Returns the definition object (with .content, .variant, .icon) or null.
function findHotspotDefinitionById(id) {
    for (const modelIndex in hotspotDefinitions) {
        const defs = hotspotDefinitions[modelIndex];
        if (!Array.isArray(defs)) continue;
        const found = defs.find((def) => def.id === id);
        if (found) return found;
    }
    return null;
}

function initLogoClick() {

    const logoEl = document.querySelector('.logo-image');
    if (!logoEl) {
        console.warn('Logo element (.logo-image) not found — click-to-reset disabled');
        return;
    }

    logoEl.style.cursor = 'pointer';

    logoEl.addEventListener('click', (event) => {
        event.stopPropagation();     // don't trigger drawer-close-on-outside-click logic
        selectModel(0);
    });

}