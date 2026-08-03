// ---------------------------------------------------------
// Button actions: map a bottom-button's id to a function that
// should run when it's clicked. Leave a button's id out of this
// object if it doesn't need to do anything yet.
//
// Example:
// const buttonActions = {
//     'btn-1': () => { console.log('Button 1 clicked'); },
//     'btn-2': (btn) => { window.location.href = '/some-page'; },
// };
// ---------------------------------------------------------
const buttonActions = {
    'btn-1': () => {switchModel("boot2");},
    'btn-2': () => {switchModel("boot");},
    'btn-3': () => {switchModel("AnimatedCube");},
    'btn-4': () => {},
    'btn-5': () => {},
    'btn-6': () => {},
};

let targetYaw = 0;
let currentYaw = 0;
const step = 0.1; // Step size in degrees


// ---------------------------------------------------------
// Hotspot data, grouped per model. Each model has its own
// <model-viewer data-model-name="..."> element in the page (see
// index.html); at load, each viewer gets its own hotspots rendered
// directly into it, once, from hotspotDataByModel[modelName].
// `type` controls the color (green/blue/pink).
// ---------------------------------------------------------
const hotspotDataByModel = {
    boot: [
        {
            id: 'RearThrusterNote',
            slot: 'hotspot-repeat',
            type: 'green',
            position: '-0.0032096161814187327m 0.002002880477767366m 0.0071240278877170785m',
            normal: '-0.25661219674883984m 0.6402369570718106m 0.7240489066901237m',
            label: 'Heckantrieb',
            title: 'BRUNVOLL',
            body: 'Starke Power zum fahren..',
            images: ['/static/images/boat.jpg', '/static/images/boat.jpg']
        },
        {
            id: 'BacksideNote',
            slot: 'hotspot-backside',
            type: 'blue',
            position: '20m 10m 4m',
            normal: '0m 1m 0m',
            label: 'Rückseite',
            title: 'DETAIL',
            body: 'Das ist die Rückseite.',
            images: ['/static/images/boat.jpg']
        },
        {
            id: 'ExampleNote',
            slot: 'hotspot-example',
            type: 'pink',
            position: '6m 10m 3m',
            normal: '0m 1m 0m',
            label: 'Beispiel',
            title: 'NEU',
            body: '"On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."',
            images: ['/static/images/boat.jpg']
        }
    ],
    boot2: [
        {
            id: 'Example2',
            slot: 'hotspot-example2',
            type: 'pink',
            position: '-0.0032096161814187327m 0.002002880477767366m 0.0071240278877170785m',
            normal: '-0.25661219674883984m 0.6402369570718106m 0.7240489066901237m',
            label: 'Boot2',
            title: 'Boot2',
            body: 'Beispiel2',
            images: ['/static/images/boat.jpg', '/static/images/boat.jpg']
        },
        {
            id: 'Example3',
            slot: 'hotspot-example3',
            type: 'blue',
            position: '30m 15m 2m',
            normal: '0m 1m 0m',
            label: 'Rückseite',
            title: 'DETAIL',
            body: 'Das ist die Rückseite.',
            images: ['/static/images/boat.jpg']
        },
        {
            id: 'ExampleNote2',
            slot: 'hotspot-example-2b',
            type: 'pink',
            position: '6m 10m 3m',
            normal: '0m 1m 0m',
            label: 'Beispiel',
            title: 'NEU',
            body: '"On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains."',
            images: ['/static/images/boat.jpg']
        }
    ],
    AnimatedCube: [
        // Add AnimatedCube-specific hotspots here, same shape as above.
    ]
};

function renderHotspots(data, modelViewer) {
    data.forEach((item) => {
        const btn = document.createElement('button');
        btn.className = `hotspot hotspot--${item.type}`;
        btn.id = item.id;
        btn.setAttribute('slot', item.slot);
        btn.setAttribute('data-position', item.position);
        btn.setAttribute('data-normal', item.normal);
        btn.setAttribute('data-hotspot-id', item.id);

        modelViewer.appendChild(btn);
    });
}

// Set inside DOMContentLoaded, once the annotation panel is wired up,
// so switchModel() (called from buttonActions, outside that scope)
// can close whatever annotation was open before switching viewers.
let closeAnnotationPanelFn = null;

// ---------------------------------------------------------
// Switches which model-viewer instance is visible. Rather than
// changing a single viewer's src, every model has its own
// <model-viewer> already loaded in the page (see index.html) —
// this just toggles the "active" class so only one shows at a time.
// Each viewer keeps its own hotspots and its own camera-change
// listener (wired up once, in DOMContentLoaded), so no per-switch
// re-rendering is needed here.
// ---------------------------------------------------------
function switchModel(name) {
    if (closeAnnotationPanelFn) {
        closeAnnotationPanelFn();
    }

    document.querySelectorAll('.model-viewer-instance').forEach((el) => {
        el.classList.toggle('active', el.dataset.modelName === name);
    });
}

function getActiveModelViewer() {
    return document.querySelector('.model-viewer-instance.active');
}


document.addEventListener('DOMContentLoaded', (event) => {
    const modelViewers = document.querySelectorAll('.model-viewer-instance');

    if (modelViewers.length === 0) {
        console.log("No model-viewer instances found");
        return;
    }

    console.log(`Found ${modelViewers.length} model-viewer instance(s), loading hotspots for each`);

    // ---------------------------------------------------------
    // Shared annotation panel: clicking a hotspot on ANY viewer
    // populates and shows the single panel (colored/bordered per
    // hotspot type). Clicking the same hotspot again, the close
    // button, or switching models, hides it.
    // ---------------------------------------------------------
    const annotationPanel = document.getElementById('annotation-panel');
    const annotationClose = annotationPanel.querySelector('.annotation-close');
    const annotationLabel = annotationPanel.querySelector('.annotation-label');
    const annotationTitle = annotationPanel.querySelector('.annotation-title');
    const annotationBody = annotationPanel.querySelector('.annotation-body');
    const annotationImages = annotationPanel.querySelector('.annotation-images');

    let activeHotspotEl = null; // tracks which hotspot the panel is "attached" to

    function openAnnotationPanel(hotspotEl, item) {
        annotationPanel.className = `annotation-panel active type-${item.type}`;

        annotationLabel.textContent = item.label;
        annotationTitle.textContent = item.title;
        annotationBody.textContent = item.body;

        annotationImages.innerHTML = '';
        (item.images || []).slice(0, 2).forEach((src) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = item.title;
            annotationImages.appendChild(img);
        });

        activeHotspotEl = hotspotEl;
    }

    function closeAnnotationPanel() {
        annotationPanel.classList.remove('active');
        activeHotspotEl = null;
    }

    closeAnnotationPanelFn = closeAnnotationPanel;

    function checkYawInRange(cameraOrbitStr) {
        // Split the camera orbit string by spaces
        const parts = cameraOrbitStr.split(' ');

        // Extract the first part, which is the yaw value with "deg"
        const yawPart = parts[0];

        // Remove the "deg" suffix to get the numeric value
        const yawValue = parseFloat(yawPart.replace("deg", ""));

        // Check if the yaw value is between 10 and 15
        if (yawValue >= 10 && yawValue <= 15) {
            console.log(`Yaw value ${yawValue} is within the range of 10 to 15.`);
            return true;
        } else {
            console.log(`Yaw value ${yawValue} is outside the range of 10 to 15.`);
            return false;
        }
    }

    // ---------------------------------------------------------
    // Wire up every model-viewer instance identically: render its
    // own hotspots, listen for hotspot clicks (feeding the shared
    // annotation panel), and listen for camera-change the same way
    // the old single-viewer version did.
    // ---------------------------------------------------------
    modelViewers.forEach((modelViewerTransform) => {
        const modelName = modelViewerTransform.dataset.modelName;
        const hotspotData = hotspotDataByModel[modelName] || [];

        renderHotspots(hotspotData, modelViewerTransform);

        modelViewerTransform.addEventListener('click', (event) => {
            const hotspot = event.target.closest('.hotspot');
            if (!hotspot) return;

            event.stopPropagation();

            const item = hotspotData.find((h) => h.id === hotspot.dataset.hotspotId);
            if (!item) return;

            const wasActive = activeHotspotEl === hotspot && annotationPanel.classList.contains('active');

            if (wasActive) {
                closeAnnotationPanel();
            } else {
                openAnnotationPanel(hotspot, item);
            }
        });

        modelViewerTransform.addEventListener('camera-change', (event) => {
            console.log('Camera:', modelViewerTransform.getCameraOrbit());
            if (checkYawInRange(modelViewerTransform.cameraOrbit)) {
                modelViewerTransform.play();
            }
        });
    });

    annotationClose.addEventListener('click', (event) => {
        event.stopPropagation();
        closeAnnotationPanel();
    });

    // Server-Sent Events (gets data from the ARUCO recognizer).
    // Always applies to whichever model-viewer is currently visible.
    const eventSource = new EventSource('/stream');
    eventSource.onmessage = function (event) {
        console.log('New markers detected:', event.data);
        if (event.data && event.data !== "[]") {
            targetYaw = parseFloat(event.data.replace("[", "").replace("]", "")); // Update target yaw

            const activeViewer = getActiveModelViewer();
            if (activeViewer) {
                activeViewer.cameraOrbit = `${targetYaw}deg 75deg 500m`;
            }
        }
    };

    // ---------------------------------------------------------
    // Bottom button row: opened via the "<" toggle (bottom-right),
    // closed via the back button inside the row.
    // ---------------------------------------------------------
    const openToggle = document.getElementById('open-buttons-toggle');
    const buttonsRow = document.getElementById('bottom-buttons');
    const backBtn = buttonsRow.querySelector('.btn-back');

    openToggle.addEventListener('click', () => {
        buttonsRow.classList.add('open');
        openToggle.style.display = 'none';
    });

    backBtn.addEventListener('click', () => {
        buttonsRow.classList.remove('open');
        openToggle.style.display = 'flex';
    });

    // Selecting a content button deselects any other selected button
    // (single-select / radio-style), and runs its linked function
    // from buttonActions, if one is defined.
    // The back button is excluded — it's a control, not a selectable option.
    buttonsRow.querySelectorAll('.btn:not(.btn-back)').forEach((btn) => {
        btn.addEventListener('click', () => {
            const wasSelected = btn.classList.contains('selected');

            buttonsRow.querySelectorAll('.btn.selected').forEach((el) => {
                el.classList.remove('selected');
            });

            if (!wasSelected) {
                btn.classList.add('selected');
            }

            const action = buttonActions[btn.id];
            if (typeof action === 'function') {
                action(btn);
            }
        });
    });
});