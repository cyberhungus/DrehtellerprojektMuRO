import * as THREE from 'three';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

let camera, scene, renderer, controls;
let ambientLight, directionalLight, directionalLight2; // hoisted so the debug-overlay light controls can reach them
let lightVisual1, lightVisual2; // small sphere+line shown per light while the debug overlay (H) is open

// Initial camera settings (edit these to change the starting view)
const initialCameraPosition = new THREE.Vector3(-2.35, 1, 0);
let initialTargetY = 0.45; // desired initial look height (controls.target.y)
// Initial camera settings (edit these to change the starting view)

let initialTargetZ = 0;   // <-- desired initial look depth (controls.target.z)
let initialModelZ = 0; // initial Z offset for the active model
let currentModelZ = 0;

// Toggle which boat models are loaded/active — index 0 = Boot 1, index 1 = Boot 2, etc.
// Set to false to skip loading that model entirely (useful for testing/debugging).
const modelEnabled = [true, true, false, true, false, false];



// Edit this to customize what each button shows and what the top-right status text
// says when that button is clicked. Index matches modelEnabled / data-index (0 = button 1, etc).
// "label" overrides the button's text — leave as null to just use the model's loaded name instead.
// "statusText" is what appears top-right on click — leave as null to fall back to the model's name.
const buttonConfig = [
    {label: "Walk to Work", statusText: "Walk to Work"}, // Model 1
    {label: "Rockbag Installation", statusText: "Rockbag Installation"}, // Model 2
    {label: "Spezial", statusText: "Spezial"}, // Model 3
    {label: "Deck Payload", statusText: "Deck Payload"}, // Model 4
    {label: null, statusText: null}, // Model 5
    {label: null, statusText: null}, // Model 6
    {label: null, statusText: null}, // Model 7
    {label: null, statusText: null}  // Model 8
];

// Mouse-driven camera rotation toggle (top-right button) — starts OFF.
let mouseRotationEnabled = false;
let mouseRotationToggleBtn;
let mouseRotationToggleIconEl; // <-- moved up here
let mouseRotationSavedCameraState = null; // camera position/rotation/target, restored on toggle-off


// Path to the two icon files — swap these to point at your own SVGs.
// LOCKED = shown while the mode is OFF (camera fixed). UNLOCKED = shown while
// the mode is ON (free mouse rotation).
let mouseRotationIconLockedSrc = 'static/images/icons/camera-video-off.svg';
let mouseRotationIconUnlockedSrc = 'static/images/icons/camera-video.svg';


// Independent switch: whether OrbitControls zoom (wheel/pinch) is allowed
// while mouse rotation mode is active. Flip this to taste — separate from
// mouseRotationEnabled so you can enable rotation without necessarily
// enabling zoom, or vice versa.
let mouseRotationAllowZoom = true;



// For Aruco Based Detection
let targetYaw = 0; // degrees, updated by SSE
let rotationLerpSpeed = 4.5; // higher = snappier turn, tune to taste

// For Keyboard Movement (DEBUG)
const moveState = {forward: false, backward: false, left: false, right: false, up: false, down: false};
const moveSpeed = 5; // units per second, tune to your scene scale

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

// For hotspot placement tool (Press P)
let placementModeActive = false;
const placementRaycaster = new THREE.Raycaster();
const placementMouse = new THREE.Vector2();

let hotspotOverlayEl, hotspotOverlayContentEl, hotspotOverlayIconEl,
    hotspotOverlayTitleEl, hotspotOverlayTextEl, hotspotOverlayImagesEl,
    hotspotOverlaySubtitleEl, hotspotOverlayLogoEl, // <-- new
    deepDiveButtonsEl;

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

    _worldPos.copy(hotspot.localPosition).applyMatrix4(hotspot.object.matrixWorld);
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


const hotspotDefinitions = {

    0: [ // Boot 1

             {
        id: '1-1-tower-oben-2',
        localPosition: new THREE.Vector3(-0.134, 1, -0.03),
        minAngle: 0,
        maxAngle: 359,
        variant: 'blue',
        icon: 'static/images/icons/hotspot-icon-blue.png',
        content: {
            title: '1.1 Tower Oben',
            text: 'PLATZHALTER Beschreibung für 1.1 Tower Oben PLATZHALTER',
            images: ['static/images/hotspots/placeholder.jpg']
        }
    },
    {
        id: '1-2-gangway-ende-2',
        localPosition: new THREE.Vector3(0.458, 0.85, -0.215),
        minAngle: 10,
        maxAngle: 180,
        variant: 'blue',
        icon: 'static/images/icons/hotspot-icon-blue.png',
        content: {
            title: 'Walk to Work ',
            text: '"Beyond its core W2W and accommodation role, the DO C-CSOV is configured to support a broad range of offshore scopes with the following key capabilities:\n' +
                '\n' +
                '•  Motion-compensated gangway with DP2 station-keeping for safe personnel transfer\n' +
                '•  Walk-to-Work tower, large modular deck and flexible crane for equipment handling and light construction works\n' +
                '•  HiPAP system for subsea positioning on operations such as grouting and inspection\n' +
                '•  Removable daughter craft to extend in-field reach\n' +
                '•  Helideck for rapid crew changes\n' +
                '•  Internal logistics layout linking deck, storage and gangway for efficient movement of cargo and personnel\n' +
                '\n' +
                'This configuration lets the vessel combine W2W, accommodation and additional offshore scopes within a single deployment, or serve as a dedicated project vessel for scopes such as grouting - creating synergies with installation vessels. Its W2W capability further provides in-field transfer capacity as project contingency when personnel transfer becomes a bottleneck for the primary W2W fleet."\n',
            images: ['static/images/walktoworkimage.jpg']
        }
    }

    ],

    1: [ // Boot 2
   // ---- Green hotspots for Boot 2 (Gruppe 1 & 4 swapped) ----

{
    id: 'tower-mittig-2',
    localPosition: new THREE.Vector3(-0.134, 0.75, -0.24),
    minAngle: 180,
    maxAngle: 269,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Gangway',
        subtitle: 'Walk to work',
        logo: 'static/images/mt-logo.png',
        text: '"The DO C-CSOV is fitted with the SMST TAB-L2 motion-compensated gangway. Behind it stands proven technology with a track record of over 86 gangway systems delivered. It is engineered for safety, reliability and operability, keeping technicians moving and operations running in tough offshore conditions. \n' +
            '\n' +
            '"\n' +
            '\n' +
            '"Technical Main Data:\n' +
            '\n' +
            '•  Large safety distance: >12 m safety distance between offshore structure and vessel at all times\n' +
            '•  Deck & helideck access: independent access from both deck and helideck enables flexible personnel flow without reliance on the vessel’s elevator.\n' +
            '•  Ship-to-fixed as well as ship-to-floating connection\n' +
            '•  Condition monitoring: predictive maintenance capabilities help maximise system availability and operational uptime.\n' +
            '•  Landing heights: 12 to 30 m (with luffing angle of 0°)\n' +
            '•  Gangway inclination angle: +20°/-16.5°\n' +
            '•  Telescoping length: 11 m\n' +
            '•  Telescoping speed: up to 2.5 m/s\n' +
            '•  Slewing range: 194°\n' +
            '•  Cargo limits for gangway and winch: 1,000 kg / 3,000 kg\n' +
            '•  ATEX prepared"\n',
        images: ['static/images/gangwayimage.jpg'],
                deepDives: [
            {
                title: 'Technical Specifications',
                text: 'Landing heights 12–30 m, telescoping length 11 m, slewing range 194°...',
                images: ['static/images/walktoworkimage.jpg']
            },
            {
                title: 'In Operation',
                text: 'See the SMST TAB-L2 gangway in action during a live transfer.',
                video: 'static/videos/autolanding.mp4'
            }]
    }
},
{
    id: 'kran-beuge-2',
    localPosition: new THREE.Vector3(-0.788, 0.4, -0.26),
    minAngle: 180,
    maxAngle: 269,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Switch It',
        text: '"One crane, many missions. At the heart of the DO C-CSOV sits flexibility: The SMST KBC-M modular knuckle-boom crane is engineered around a concept that turns a single asset into many. Its knuckle configuration spear heads the modularity concept: the boom reconfigures for different tasks quickly and without external lifts. \n' +
            '\n' +
            'For the charterer, that means one crane that adapts to the mission at hand - higher efficiency, less downtime, and the confidence to have contingency to switch between tasks without adding vessels.\n' +
            '\n' +
            '"\t50 t Active heave compensation or 10 t 3D motion control deliver precise and safe load handling in live seaways. Live collision-avoidance technology enhances safety by accounting for structures and preventing interference with construction spreads. Continuous condition monitoring safeguards uptime on equipment the whole campaign depends on.\n',
        images: ['static/images/kranimage.jpg']
    }
},
{
    id: 'leiter-2',
    localPosition: new THREE.Vector3(-0.9, 0.35, -0.3),
    minAngle: 180,
    maxAngle: 269,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Leiter',
        text: 'PLATZHALTER Beschreibung für Leiter PLATZHALTER',
        images: ['static/images/hotspots/placeholder.jpg']
    }
},
{
    id: 'heck-2',
    localPosition: new THREE.Vector3(-1.29, 0.3, 0),
    minAngle: 180,
    maxAngle: 269,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Heck',
        text: 'PLATZHALTER Beschreibung für Heck PLATZHALTER',
        images: ['static/images/hotspots/placeholder.jpg']
    }
},

{
    id: 'holz-2',
    localPosition: new THREE.Vector3(-0.78, 0.32, 0),
    minAngle: 270,
    maxAngle: 359,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Working deck',
        subtitle: 'Space to out-perform',
        text: 'The working deck is a vast, unobstructed platform that reconfigures around whatever the job demands - from cable repair to subsea and light construction. Modular sockets and utility stations turn open deck into a purpose-built workspace, and hatches to the warehouse below puts stores and spares within immediate reach. For a charterer, this adaptability is the real advantage: one vessel that flexes across scopes, steps in when plans change, and keeps the campaign moving when risks materialize. Efficiency in every operation, contingency when it counts.\t"The DO C-CSOV working deck features payload, flexibility and multi-scope operations:\n' +
            '\n' +
            '•  Size: 800 sqm of open, unobstructed working area\n' +
            '•  Deck strength: rated for 10 t/m² \n' +
            '•  T-bars: up to 30 t/m, allowing heavy equipment mobilization\n' +
            '•  Clean deck: free of vent heads, mooring equipment and other obstructions, maximising usable working area\n' +
            '•  Modularity: removable infrastructure (daughter craft, boat landing, refuelling) \n' +
            '•  Utility stations: distributed supply of water, communications, electrical power and high pressure for demanding spreads (e.g. WROV / cable repair) without temporary infrastructure\n' +
            '•  Warehouse access: dedicated hatch enables operations at sea and effectively extends the working deck via the warehouse below\n' +
            '•  Functional layout: 5.2 m low freeboard with removable railings for easy overboard access"\n',
        images: ['static/images/workingdecktopview.png']
    }
},
{
    id: 'propeller-heck-2',
    localPosition: new THREE.Vector3(-1.2, 0, 0.11),
    minAngle: 270,
    maxAngle: 359,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Works like a Swiss watch\n',
        text: 'Powered by two Voith Schneider Propellers (VSP), each delivering 1,860 kW, the vessel combines exceptional manoeuvrability with precise thrust control. This propulsion concept enables rapid and accurate positioning while delivering a transit speed of up to 13.8 kn. At the same time, the VSP system provides highly efficient thrust generation, reducing energy consumption compared with conventional propulsion concepts.\t"Rapid response: More than 3× faster reaction to weather-induced forces than comparable azimuth-propelled vessels, with approximately 2 seconds thrust ramp-up and rapid 180° thrust reversal.\n' +
            '\n' +
            '\n' +
            'High operability: Optimised for challenging offshore conditions, with up to 98% operability demonstrated for the specific location and metocean conditions shown.\n' +
            '\n' +
            'Reduced roll motion: Active VSP control counteracts wave-induced roll, reducing vessel motion, extending the operational window and improving transfer conditions and comfort.\n' +
            '\n' +
            'Low-noise operation: Electric VSP propulsion enables quiet operation, supporting DNV Comfort Class C2 and V2 requirements.\n' +
            '"\n',
        video: 'static/videos/voithpropulsion.mp4',
    }
},
{
    id: 'heck-l-2',
    localPosition: new THREE.Vector3(-0.67, 0.29, 0.29),
    minAngle: 270,
    maxAngle: 359,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Heck L',
        text: 'PLATZHALTER Beschreibung für Heck L PLATZHALTER',
        images: ['static/images/hotspots/placeholder.jpg']
    }
},
{
    id: 'bruecke-l-seite-2',
    localPosition: new THREE.Vector3(0.285, 0.72, 0.33),
    minAngle: 270,
    maxAngle: 359,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Brücke L Seite',
        text: 'PLATZHALTER Beschreibung für Brücke L Seite PLATZHALTER',
        images: ['static/images/hotspots/placeholder.jpg']
    }
},

{
    id: 'kabinen-r-2',
    localPosition: new THREE.Vector3(0.7, 0.32, -0.29),
    minAngle: 90,
    maxAngle: 179,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'A home at sea',
        text: 'Skilled and experienced personnel are becoming scarce across the industry. They are the single most important factor in achieving high-quality progress offshore. Crew and charterer personnel need to be well-rested to perform safely, thus the vessel is their safe haven after a hard day\'s work, the foundation for all and the reason every small detail has been considered in the design of the interior, facilities, and layout of the DO C-CSOV.\t"•  99 cabins, each over 11 sqm, with 76 daylight cabins dedicated to charterer personnel\n' +
            '•  Flexible 1+1 cabin concept, allowing selected single cabins to be converted into doubles with a ceiling-mounted Pullman bed - without compromising comfort or space\n' +
            '•  140 sqm dedicated office wing, comprising four offices, 17 workstations and two combinable meeting rooms accommodating up to 24 people\n' +
            '•  Clear separation of work, recreation and private living, with the layout designed around the daily workflow of personnel\n' +
            '•  Over 180 sqm of gym and wellness facilities across two decks, including a dedicated spa and treatment area, supporting health, mobility and recovery\n' +
            '•  Dedicated C-Deck leisure area with library, sports bar and lounge, providing space to switch off and recharge"\n',
        images: ['static/images/cabins-a.jpg','static/images/cabins-b.jpg'],
                deepDives: [
            {
                title: 'Deck Gallery',
                slideshow: 'static/images/accommodation' // <-- directory, not a single file
            }
        ]
    }
},
{
    id: 'propeller-front-2',
    localPosition: new THREE.Vector3(1.4, 0.1, 0),
    minAngle: 90,
    maxAngle: 179,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Give it a nudge\n',
        text: '"The DO C-CSOV is equipped with a high-end Brunvoll bow thrusters designed to maximise manoeuvrability, DP performance and operational redundancy. \n' +
            '\n' +
            'Configuration and arrangement of the thrusters are aligned to ensure safe and reliable position keeping in challenging environmental conditions. Size, power, location and performance criteria are balanced in order to match the thrust agility of the aft eVSP while minimizing ventilation, noise and vibrations and maintaining strong power reserves.\n' +
            '"\t"The DO C-CSOV bow thruster arrangement combines high power, rapid response and redundancy to deliver precise vessel control across a wide range of offshore operating conditions:\n' +
            '\n' +
            '•  Three-thruster configuration: Two tunnel thrusters and one retractable azimuth thruster provide high levels of manoeuvrability and redundancy\n' +
            '•  High power: 3x 1,500 kW provides strong thrust for demanding DP and manoeuvring conditions\n' +
            '•  Resiliently mounted thrusters for minimal noise and vibration emissions during DP"\n',
        images: ['static/images/bowthruster.png']
    }
},

{
    id: 'beiboot-2',
    localPosition: new THREE.Vector3(-0.295, 0.34, 0.23),
    minAngle: 0,
    maxAngle: 89,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Pick me up ',
        text: '"The DO C-CSOV is equipped with a Vestdavit launched Chartwell Catamaran Workboat. Its large deck space in combination with its modularity concept allows for carrying a high performance Daughter Craft without compromising on the asset\'s capabilities. The working deck remains spacious with sufficient capacity for containerized or bulk cargo. As the davit is skid mounted, quick mobilization and demobilization is catered for the event the additional space is required. \n' +
            '"\t"Benefiting from the use of a Daughter Craft should not go along unacceptable risks. The Vestdavit PLD-15002 is DNV-ST-0498 certified, setting a baseline to deploy and retrieve Daughter Crafts safely. A telescopic painter boom ensures proper hull clearance and controlled motion at high sea states, safeguarding that a recovery can be conducted under any circumstances.\n' +
            '"\n',
        images: ['static/images/daughtercraft.png']

    }
},
{
    id: 'bruecke-l-front-2',
    localPosition: new THREE.Vector3(0.45, 0.7, 0.2),
    minAngle: 0,
    maxAngle: 89,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Control at your fingertips',
        text: '"The DO C-CSOV is equipped with a high-performance dynamic positioning and Integrated bridge system from Marine Technologies (MT). This combines proven DP capability with advanced navigation and communications systems for safe and reliable offshore operations.\n' +
            '\n' +
            'DP Alert, Clear Comms, integrated HiPAP and dedicated anti-jamming and anti-spoofing technology further enhance positioning integrity, communication resilience and operational robustness.\n' +
            '\n' +
            'With 800+ DP2 systems delivered and more than 35 million DP operating hours, Marine Technologies brings proven technology, hardened by experience. "\t"Modern offshore assets have adopted closed-bus operations in order to reduce fuel cost and carbon emissions, turning away from traditional open-bus-tie configurations. \n' +
            '\n' +
            'Improved commercials and sustainability may however not come at the cost of safety. The DO C-CSOV is the first purpose-built W2W asset to adopt the DNV DYNPOS AUTR-CB notation, incorporating the latest learnings and developments for a leap forward in closed-bus safety. \n' +
            '\n' +
            'As such, the notation achieves the operational safety standards of conventional open-bus operation while delivering the fuel-efficiency benefits of closed-bus operation. "\n',
        images: ['static/images/mt-logo.png']
    }
},
{
    id: 'rumpf-l-mitte-2',
    localPosition: new THREE.Vector3(0, 0.2, 0.29),
    minAngle: 0,
    maxAngle: 89,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Full steam ahead! \n',
        text: '"The DO C-CSOV’s powertrain has been designed around an efficient and robust primary power generation system, recognising that the overall performance of the vessel’s energy concept starts with the selection of the main engines. Three medium-speed MAN engines, optimised for part-load operation, provide a highly efficient power source for propulsion, mission equipment and vessel services across a wide range of applicable load scenarios.\n' +
            '\n' +
            'The engines work in synergy with the vessel’s battery hybrid energy architecture. This enables the vessel to efficiently respond to varying power demands on the spot, cover demand peaks and act as temporary boosters.\n' +
            '"\t"The DO C-CSOV powertrain combines efficient primary generation with hybrid energy storage and flexible fuel capability to maximise efficiency, resilience and operational flexibility. Key features include:\n' +
            '\n' +
            '•  Main engines: 3 × 1,760 kW MAN 8L21/31H MK2 PLO medium-speed engines\n' +
            '•  Part-load efficiency: Engines optimised for efficient operation across varying load profiles, supporting reduced fuel consumption during typical offshore operations\n' +
            '•  Hybrid battery: 1,000 kWh battery system supporting peak shaving, power boosting and DP spinning reserve\n' +
            '•  Alternative fuels: Methanol-ready from delivery and capable of operating on biofuels including HVO-100 and FAME"\n',
        images: ['static/images/cabins-a.jpg','static/images/cabins-b.jpg']
    }
},
{
    id: 'rumpf-l-vorner-2',
    localPosition: new THREE.Vector3(0.54, 0.23, 0.29),
    minAngle: 0,
    maxAngle: 89,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Rumpf L Vorner',
        text: 'PLATZHALTER Beschreibung für Rumpf L Vorner PLATZHALTER',
        images: ['static/images/hotspots/placeholder.jpg']
    }
},
{
    id: 'helipad-2',
    localPosition: new THREE.Vector3(0.89, 0.8, 0),
    minAngle: 0,
    maxAngle: 89,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Helipad',
        text: 'PLATZHALTER Beschreibung für Helipad PLATZHALTER',
        images: ['static/images/hotspots/placeholder.jpg']
    }
},
{
    id: 'bug-2',
    localPosition: new THREE.Vector3(1.5, 0.477, 0),
    minAngle: 0,
    maxAngle: 89,
    variant: 'green',
    icon: 'static/images/icons/hotspot-icon-green.png',
    content: {
        title: 'Bug',
        text: 'PLATZHALTER Beschreibung für Bug PLATZHALTER',
        images: ['static/images/hotspots/placeholder.jpg']
    }
},
            {
        id: '3-1-kran-ausleger-2',
        localPosition: new THREE.Vector3(-0.81, 0.51, -0.755),
        minAngle: 0,
        maxAngle: 359,
        variant: 'blue',
        icon: 'static/images/icons/hotspot-icon-blue.png',
        content: {
            title: 'On the Rocks',
            text: 'The DO C-CSOV extends the scope of Walk-to-Work operations by combining W2W with rock bag installation for scour and cable protection. Its large working deck and high-capacity crane enable efficient handling and installation of rock bags alongside W2W activities. Those complementary tasks reduce the need for costly short term tonnage, decreasing the total number of assets in the field and increasing overall offshore efficiency.\n',
            images: ['static/images/hotspots/placeholder.jpg']
        }
    },


    ],

    2: [ // Boot 3 (new)
        {
            id: 'boot3-hull',
            localPosition: new THREE.Vector3(0, -0.5, 0),
            minAngle: 0,
            maxAngle: 360,
            variant: 'green',
            icon: 'static/images/icons/hotspot-icon-green.png',
            content: {
                title: 'Rumpf',
                text: 'PLATZHALTER GFK‑Rumpf mit Antifouling‑Beschichtung. PLATZHALTER',
                images: ['static/images/hotspots/hull.jpg']
            }
        },
        {
            id: 'boot3-antenna',
            localPosition: new THREE.Vector3(0.2, 1.5, -0.3),
            minAngle: 45,
            maxAngle: 135,
            variant: 'blue',
            icon: 'static/images/icons/hotspot-icon-blue.png',
            content: {
                title: 'Antenne',
                text: 'PLATZHALTER VHF‑Antenne mit 2 m Reichweite. PLATZHALTER',
                images: ['static/images/hotspots/antenna.jpg']
            }
        },
        {
            id: 'boot3-anchor',
            localPosition: new THREE.Vector3(-1.0, -0.2, 1.8),
            minAngle: 200,
            maxAngle: 300,
            variant: 'green',
            icon: 'static/images/icons/hotspot-icon-green.png',
            content: {
                title: 'Anker',
                text: 'PLATZHALTER Edelstahl‑Anker, 15 kg, mit Kette. PLATZHALTER',
                images: ['static/images/hotspots/anchor.jpg']
            }
        }
    ],

    3: [ // Boot 4 (new)
           {
        id: 'boot4-deck-payload',
        localPosition: new THREE.Vector3(-0.7, 0.32, 0),
        minAngle: 260,
        maxAngle: 80,
        variant: 'blue',
        icon: 'static/images/icons/hotspot-icon-blue.png',
        content: {
            title: 'When size matters',
            text: 'When the job calls for size, the DO C-CSOV delivers. A vast, strengthened deck, generous payload and a powerful crane let big, bulky equipment - from generator sets with pre-filled fuel tanks to subsea corrosion-protection spreads - be mobilised, installed and operated from a single vessel, whether planned or unplanned. Bigger lifts mean fewer of them: less deck shuffling, fewer supply runs and less port time, so campaigns run leaner and faster. And when priorities shift, this flexibility turns into contingency - ready to pick up slack and keep the offshore programme moving without missing a beat.\n',
            images: ['static/images/deckpayload-a.jpg','static/images/deckpayload-b.jpg']
        }
    },
    ],

    4: [ // Boot 5 (new)
        {
            id: 'boot5-radio',
            localPosition: new THREE.Vector3(-0.2, 0.6, -0.5),
            minAngle: 0,
            maxAngle: 359,
            variant: 'green',
            icon: 'static/images/icons/hotspot-icon-green.png',
            content: {
                title: 'Funkgerät',
                text: 'PLATZHALTER Digitales UKW‑Funkgerät mit DSC. PLATZHALTER',
                images: ['static/images/hotspots/radio.jpg']
            }
        },
        {
            id: 'boot5-bilge',
            localPosition: new THREE.Vector3(0.0, -0.7, 0.8),
            minAngle: 180,
            maxAngle: 270,
            variant: 'blue',
            icon: 'static/images/icons/hotspot-icon-blue.png',
            content: {
                title: 'Bilgenpumpe',
                text: 'PLATZHALTER Automatische Bilgenpumpe 2000 l/h. PLATZHALTER',
                images: ['static/images/hotspots/bilge.jpg']
            }
        },
        {
            id: 'boot5-windlass',
            localPosition: new THREE.Vector3(-1.2, -0.1, 1.2),
            minAngle: 300,
            maxAngle: 30,
            variant: 'green',
            icon: 'static/images/icons/hotspot-icon-green.png',
            content: {
                title: 'Ankerwinde',
                text: 'PLATZHALTER Elektrische Ankerwinde mit Fernbedienung. PLATZHALTER',
                images: ['static/images/hotspots/windlass.jpg']
            }
        }
    ],

    5: [ // Boot 6 (new)
        {
            id: 'boot6-sail',
            localPosition: new THREE.Vector3(0, 1.2, 0),
            minAngle: 0,
            maxAngle: 360,
            variant: 'green',
            icon: 'static/images/icons/hotspot-icon-green.png',
            content: {
                title: 'Segel',
                text: 'PLATZHALTER Großsegel aus Dacron, 25 m². PLATZHALTER',
                images: ['static/images/hotspots/sail.jpg']
            }
        },
        {
            id: 'boot6-rudder',
            localPosition: new THREE.Vector3(0.0, -0.4, 1.8),
            minAngle: 135,
            maxAngle: 225,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            content: {
                title: 'Ruder',
                text: 'PLATZHALTER Ausgewogenes Ruder mit Edelstahlschaft. PLATZHALTER',
                images: ['static/images/hotspots/rudder.jpg']
            }
        },
        {
            id: 'boot6-cleat',
            localPosition: new THREE.Vector3(1.0, 0.1, -1.0),
            minAngle: 60,
            maxAngle: 150,
            variant: 'green',
            icon: 'static/images/icons/hotspot-icon-green.png',
            content: {
                title: 'Klampe',
                text: 'PLATZHALTER Edelstahl‑Klampe für Festmacherleinen. PLATZHALTER',
                images: ['static/images/hotspots/cleat.jpg']
            }
        }
    ]

};



// -------------------------------------------------------------------
// The camera controls code has been moved inside init() (see below)
// to ensure `controls` exists before we attach event listeners.
// -------------------------------------------------------------------

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
initGreenToggle();   // <-- added: initialise the green toggle button
initMouseRotationToggle(); // <-- add this line

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
    camera.position.copy(initialCameraPosition); // Set above the model (adjust height based on scale and size)
    camera.rotation.set(-161.3, 43.3, -166.5); // Ensures it's looking at the center; adjust to the middle of your scene if needed
    //camera.lookAt(0,0,0)
// Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // white background — must match #model-switch-overlay's background in index.html

    // Lights: moody via a very low, cool-tinted ambient (keeps shadows deep instead of
    // washing them out) plus a strong warm key light with tight, high-res shadows, and
    // a dim cool fill light so the shadow side doesn't go pure black.
    // ambientLight/directionalLight variable names are unchanged — initLightControls()
    // binds the light panel sliders to these specific variables.
    ambientLight = new THREE.AmbientLight(0xffffff, 1.325); // slightly lower than before — a bit more contrast, darker shadows
    //ambientLight.castShadow = true;
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xfff1d0, 4); // warm, punchy key light
    directionalLight.position.set(5.5, 7.5, -3.5); // low, angled position for longer, more dramatic shadows

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
    directionalLight2.position.set(4.8, 5.9, 7.7); // low, angled position for longer, more dramatic shadows
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

    // Preload every hotspot image/video/slideshow folder while the loading
    // overlay is still up, so opening a hotspot later never has to wait on
    // a network fetch.
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

function showScreensaver() {

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
    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'hotspot-overlay-scroll';
    hotspotOverlayContentEl.insertBefore(scrollWrapper, hotspotOverlayTextEl);

    scrollWrapper.appendChild(hotspotOverlayTextEl);   // moves text into the scroll wrapper
    scrollWrapper.appendChild(hotspotOverlayImagesEl); // moves images into the scroll wrapper

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


// Renders just the media (video OR image gallery) into hotspotOverlayImagesEl.
function renderHotspotMedia(content) {
    clearSlideshowAutoplay();
    hotspotOverlayImagesEl.innerHTML = '';

    if (content.video) {
        const video = document.createElement('video');
        video.src = content.video;
        video.controls = true;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.display = 'block';
        hotspotOverlayImagesEl.appendChild(video);
    } else if (content.slideshow) {
        renderSlideshow(content.slideshow);
    } else {
        (content.images || []).forEach((src) => {
            const img = document.createElement('img');
            img.className = 'hotspot-overlay-image';
            const isPng = src.toLowerCase().endsWith('.png');
            if (isPng) {
                img.classList.add('hotspot-overlay-image--contain');
            } else {
                img.classList.add('hotspot-overlay-image--cover');
            }
            img.src = src;
            hotspotOverlayImagesEl.appendChild(img);
        });
    }
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
    prevBtn.textContent = '‹';
    imgWrapper.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'slideshow-nav-btn slideshow-nav-btn--next';
    nextBtn.textContent = '›';
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

    const hasText = content.text && content.text.trim().length > 0;
    const isSlideshow = !!content.slideshow;
    const slideshowFull = isSlideshow && !hasText;

    hotspotOverlayContentEl.classList.toggle('slideshow-full', slideshowFull);

    hotspotOverlayTitleEl.textContent = content.title || '';
    hotspotOverlayTextEl.textContent = content.text || '';

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

    // Render the media (video, slideshow, or static images)
    renderHotspotMedia(content);
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
    overviewBtn.textContent = 'Übersicht';
    overviewBtn.addEventListener('click', () => renderHotspotContent(baseContent));
    deepDiveButtonsEl.appendChild(overviewBtn);

    deepDives.forEach((dive, i) => {
        const btn = document.createElement('button');
        btn.className = 'hotspot-deep-dive';
        btn.textContent = dive.title || `Deep Dive ${i + 1}`;
        btn.addEventListener('click', () => renderHotspotContent(dive));
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

        registerHotspot({
            id: def.id,
            object: object3D,
            localPosition: def.localPosition,
            minAngle: def.minAngle,
            maxAngle: def.maxAngle,
            label: def.content.title,
            variant: def.variant,
            iconSrc: def.icon,
            onClick: () => openHotspotOverlay(def.content, def.variant, def.icon)
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
        controls.enableZoom = true; // restore normal (non-rotation-mode) zoom behavior

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
        video.preload = 'auto';
        video.muted = true;
        video.style.display = 'none';
        video.addEventListener('canplaythrough', () => resolve(), {once: true});
        video.addEventListener('error', () => resolve(), {once: true});
        video.src = src;
        document.body.appendChild(video);
        // Leave it in the DOM — the browser keeps the buffered data tied to
        // this element/its cache entry, and removing it can drop the buffer.
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