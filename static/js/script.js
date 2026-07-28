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
// Hotspot data, grouped per model. When switchModel(name) runs,
// the hotspots shown on the model are swapped to
// hotspotDataByModel[name] (or an empty set if that model has none
// defined). Add/remove entries here to change what's shown.
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

// Set by DOMContentLoaded once the annotation panel / model-viewer are
// wired up, so switchModel() (called from buttonActions, outside that
// scope) can swap the hotspot set and reset the annotation panel.
let applyHotspotsForModel = null;

function switchModel(name) {
    const modelViewerTransform = document.querySelector("model-viewer#viewer");
    const base = "/static/models/" + name;
    modelViewerTransform.src = base + '.gltf';

    if (applyHotspotsForModel) {
        applyHotspotsForModel(name);
    }
}


document.addEventListener('DOMContentLoaded', (event) => {
    const modelViewerTransform = document.querySelector("model-viewer#viewer");
    const viewerContainer = document.getElementById('viewer-container');
    const svg = document.getElementById('connector-overlay');

    if (!modelViewerTransform) {
        console.log("Modelviewer not found");
        return;
    }

    console.log("Modelviewer found, loading hotspots");

    renderHotspots(hotspotDataByModel.boot || [], modelViewerTransform);
    let currentHotspotData = hotspotDataByModel.boot || [];

    // ---------------------------------------------------------
    // Shared annotation panel: clicking a hotspot populates and
    // shows the single panel (colored/bordered per hotspot type),
    // rather than each hotspot carrying its own annotation card.
    // Clicking the same hotspot again, or the close button, hides it.
    // ---------------------------------------------------------
    const annotationPanel = document.getElementById('annotation-panel');
    const annotationClose = annotationPanel.querySelector('.annotation-close');
    const annotationLabel = annotationPanel.querySelector('.annotation-label');
    const annotationTitle = annotationPanel.querySelector('.annotation-title');
    const annotationBody = annotationPanel.querySelector('.annotation-body');
    const annotationImages = annotationPanel.querySelector('.annotation-images');

    let activeHotspotEl = null; // tracks which hotspot the panel is "attached" to, for the connector line

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

    // ---------------------------------------------------------
    // Swap the hotspots shown on the model: removes the currently
    // rendered hotspot buttons, renders the set for `modelName`
    // (falling back to an empty set if none is defined), and closes
    // the annotation panel since whatever it was showing no longer
    // applies to the new model.
    // ---------------------------------------------------------
    function applyHotspots(modelName) {
        closeAnnotationPanel();

        modelViewerTransform.querySelectorAll('.hotspot').forEach((el) => el.remove());

        currentHotspotData = hotspotDataByModel[modelName] || [];
        renderHotspots(currentHotspotData, modelViewerTransform);
    }

    applyHotspotsForModel = applyHotspots;

    modelViewerTransform.addEventListener('click', (event) => {
        const hotspot = event.target.closest('.hotspot');
        if (!hotspot) return;

        event.stopPropagation();

        const item = currentHotspotData.find((h) => h.id === hotspot.dataset.hotspotId);
        if (!item) return;

        const wasActive = activeHotspotEl === hotspot && annotationPanel.classList.contains('active');

        if (wasActive) {
            closeAnnotationPanel();
        } else {
            openAnnotationPanel(hotspot, item);
        }
    });

    annotationClose.addEventListener('click', (event) => {
        event.stopPropagation();
        closeAnnotationPanel();
    });



    modelViewerTransform.addEventListener('camera-change', (event) => {
        console.log('Camera:', modelViewerTransform.getCameraOrbit());
        if (checkYawInRange(modelViewerTransform.cameraOrbit)) {
            modelViewerTransform.play();
        }
    });

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

    // Server-Sent Events (gets data from the ARUCO recognizer)
    const eventSource = new EventSource('/stream');
    eventSource.onmessage = function (event) {
        console.log('New markers detected:', event.data);
        if (event.data && event.data !== "[]") {
            targetYaw = parseFloat(event.data.replace("[", "").replace("]", "")); // Update target yaw
            modelViewerTransform.cameraOrbit = `${targetYaw}deg 75deg 500m`;
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