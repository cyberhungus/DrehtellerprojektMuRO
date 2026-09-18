// ═══════════════════════════════════════════════════════════════════════════
// HOTSPOT DEFINITIONS
// Standalone module — imported by the main app.js. Everything hotspot- and
// button-related lives here so the main file stays focused on 3D logic.
// ═══════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';


// ─────────────────────────────────────────────────────────────────────────
// BUTTON CONFIG
// Drives the drawer buttons + top-right status text. `image` is optional —
// omit it (or set to null) to fall back to the model's loaded name/icon.
// ─────────────────────────────────────────────────────────────────────────
export const buttonConfig = {
    // ---- Base boats (indices 0-8) ----
    0: {label: "Base",                statusText: "Base Variant",
        image: 'static/images/shipicons/basis.png'},
    1: {label: "Rockbags", statusText: "Rockbag Installation",
        image: 'static/images/shipicons/rockbag.png'},
    2: {label: "CFE",                  statusText: "Control Flow Excavator",
        image: 'static/images/shipicons/cfe.png'},
    3: {label: "Deck Payload",         statusText: "Deck Payload",
        image: 'static/images/shipicons/deckpayload.png'},
    4: {label: "Cable Repair",         statusText: "Cable Repair Spread",
        image: 'static/images/shipicons/cable.png'},
    5: {label: "ROV",                  statusText: "ROV Operations",
        image: 'static/images/shipicons/rov.png'},
    6: {label: "Walk to work",         statusText: "Daughter Craft",
        image: 'static/images/shipicons/walktowork.png'},
    7: {label: "Grouting",             statusText: "Grouting",
        image: 'static/images/shipicons/grouting.png'},
    8: {label: "Monopile Cleaning",    statusText: "Monopile Cleaning",
        image: 'static/images/shipicons/cleaning.png'},

    // ---- Variants (index = boatNumber * 10 + variantNumber) ----
// These carry the same label/statusText/image as the base they replace, so
// the buttons don't relabel themselves when the variant model is loaded.
11: {label: "Base",          statusText: "Base Variant",
     image: 'static/images/shipicons/basis.png'},
71: {label: "Walk to work",  statusText: "Daughter Craft",
     image: 'static/images/shipicons/walktowork.png'},
21: {label: "Rockbags",      statusText: "Rockbag Installation",
     image: 'static/images/shipicons/rockbag.png'},
31: {label: "CFE",           statusText: "Control Flow Excavator",
     image: 'static/images/shipicons/cfe.png'},
41: {label: "Deck Payload",  statusText: "Deck Payload",
     image: 'static/images/shipicons/deckpayload.png'},
61: {label: "ROV",           statusText: "ROV Operations",
     image: 'static/images/shipicons/rov.png'},};


// ─────────────────────────────────────────────────────────────────────────
// SHARED GREEN HOTSPOTS
// Reused by every model that spreads them: `...SHARED_GREEN_HOTSPOTS`.
// ─────────────────────────────────────────────────────────────────────────
export const SHARED_GREEN_HOTSPOTS = [

    {
        id: 'tower-mittig-2',
        localPosition: new THREE.Vector3(-0.134, 0.75, -0.24),
        minAngle: 120,
        maxAngle: 20,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Gangway',
            subtitle: 'Stay Safe!',
            logo: 'static/images/logos/smst-logo.webp',
            text: "The DO C-CSOV is fitted with the SMST TAB-L2 motion-compensated gangway. Behind it stands proven technology with a track record of over 86 gangway systems delivered. It is engineered for safety, reliability and operability, keeping technicians moving and operations running in tough offshore conditions."
                + "The DO C-CSOV is equipped with an SMST gangway system designed to maximise transfer efficiency, flexibility and uptime:"
                + "Its 12 to 30 m landing height range is the highest on the market, giving unrestricted access to any offshore infrastructure. The 3D winch provides redundancy for the main crane and enables 3D motion-compensated lifting when configured with the 50 t AHC crane. Digitalization such as AI assisted auto docking enable repeatable, high-speed connections for fast transfer of personnel. ",
            images: ['static/images/f1gangway/TAB-L.jpg', 'static/images/f1gangway/TAB-L2.png'],
            deepDives: [
                {
                    title: 'Technical Specifications',
                    text: `Technical Main Data:
                    
                    •  Large safety distance: >12 m safety distance between offshore structure and vessel at all times
                    •  Deck & helideck access: independent access from both deck and helideck enables flexible personnel flow without reliance on the vessel’s elevator.
                    •  Ship-to-fixed as well as ship-to-floating connection
                    •  Condition monitoring: predictive maintenance capabilities help maximise system availability and operational uptime.
                    •  Landing heights: 12 to 30 m (with luffing angle of 0°)
                    •  Gangway inclination angle: +20°/-16.5°
                    •  Telescoping length: 11 m
                    •  Telescoping speed: up to 2.5 m/s
                    •  Slewing range: 194°
                    •  Cargo limits for gangway and winch: 1,000 kg / 3,000 kg
                    •  ATEX prepared`,
                    images: ['static/images/f1gangway/gangwaydeepdive.png']
                },
                { title: 'Video', video: 'static/images/f1gangway/video.mp4' }
            ]
        }
    },
    {
        id: 'kran-beuge-2',
        localPosition: new THREE.Vector3(-0.788, 0.4, -0.26),
        minAngle: 90,
        maxAngle: 10,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Crane',
            subtitle: 'Switch it!',
            logo: 'static/images/logos/smst-logo.webp',
            text: 'One crane, many missions. At the heart of the DO C-CSOV sits flexibility: The SMST KBC-M modular knuckle-boom crane is engineered around a concept that turns a single asset into many. Its knuckle configuration spear heads the modularity concept: the boom reconfigures for different tasks quickly and without external lifts. \n' +
                '\n' +
                'For the charterer, that means one crane that adapts to the mission at hand - higher efficiency, less downtime, and the confidence to have contingency to switch between tasks without adding vessels.\n' +
                '\n' +
                '\t50 t Active heave compensation or 10 t 3D motion control deliver precise and safe load handling in live seaways. Live collision-avoidance technology enhances safety by accounting for structures and preventing interference with construction spreads. Continuous condition monitoring safeguards uptime on equipment the whole campaign depends on.\n',
            images: ['static/images/f2crane/crane1.jpg', 'static/images/f2crane/crane2.png'],
            deepDives: [
                {
                    title: 'Technical Specifications',
                    text: `The DO C-CSOV is fitted with the SMST KBC-M modular knuckle-boom crane, engineered for capacity, precision and uptime:

•  Construction mode: 50 t @ 12 m outreach for heavy lifts
•  3D mode: 10 t with active heave compensation and 3D motion control for precise subsea lifts
•  Operating height: 30 m above waterline - reaches offshore substation (OSS) decks
•  Workability: operable up to 2.5 m Hs
•  Winch: 650 m of cable for deep subsea deployment
•  Redundancy: crane and SMST gangway 3D winch back each other up, forming a redundant lifting system
•  Live collision-avoidance radar protects temporary structures during construction support
•  smartACTIONS Condition monitoring enables predictive maintenance for high uptime on critical equipment
•  smartENERGY for energy storage and power balancing 
•  smartCRANE Modular knuckle boom: rig-up within ~48 h without external lifts - the main driver of the vessel's modularity`,
                    images: ['static/images/f2crane/cranedeepdive.jpg','static/images/f2crane/cranedeepdive2.png']
                }
            ]
        }
    },
    {
        id: 'leiter-2',
        localPosition: new THREE.Vector3(-0.9, 0.35, -0.3),
        minAngle: 110,
        maxAngle: 0,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Boatlanding',
            subtitle: 'Please come in',
            logo: 'static/images/logos/aukra-logo.jpg',
            text: 'Designed for safe and efficient vessel-to-vessel transfers, the DO C-CSOV features an height-adjustable Aukra Boat Landing that accommodates a wide range of daughter craft and CTVs. Its sheltered, step-less design enhances transfer safety by providing a controlled transfer environment while remaining clear of propeller wash.\n' +
                '\n' +
                'Its removable configuration supports the vessel’s modular approach, allowing the boat landing to be removed to suit the operational task at hand.\tThe DO C-CSOV is equipped with a height-adjustable Aukra Boat Landing, designed to provide safe and flexible vessel-to-vessel personnel transfer:\n' +
                '\n' +
                '•  Step-less access: Seamless personnel transfer to other vessels, reducing transfer barriers and enhancing safety\n' +
                '•  Height-adjustable: Accommodates working heights from 1.7 m to 4.5 m, supporting both small daughter craft and larger CTVs\n' +
                '•  Clear of propeller wash: Positioned outside the propeller wash for a safer and more predictable transfer\n' +
                '•  Sheltered transfer: Lee side access from the vessel side provides a safer, more comfortable transfer environment in challenging offshore conditions\n' +
                '•  Removable design: Fully removable to maintain the vessel’s modularity and adapt the configuration to the operational requirement\n',
            images: ['static/images/f11boatlanding/boatlanding1.png', 'static/images/f11boatlanding/boatlanding2.png']
        }
    },
    {
        id: 'heck-2',
        localPosition: new THREE.Vector3(-1.29, 0.6, 0),
        minAngle: 290,
        maxAngle: 50,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Sustainability',
            subtitle: 'Embrace today, prepare for tomorrow\n',
            text: 'The DO C-CSOV is built to embrace today\'s and prepare for tomorrow\'s technology. \n' +
                '\n' +
                'Upon delivery, the DO C-CSOV leverages on available technology to achieve sustainable operations. Optimised hull, efficient Voith Schneider propulsion, a closed bus battery hybrid energy concept as well as energy regeneration keep fuel consumption and emissions low. While in turnaround, shore power delivers zero-emission port stays.\n' +
                '\n' +
                'Green technologies develop fast, whereas the DO C-CSOV remains flexible to adapt to those that will prevail over time: methanol-ready engines and pre-installed MeoH infrastructure, biofuel capability and a clear path to full electric operation let the vessel decarbonise step by step - lowering the carbon footprint today while steering towards a climate neutral future.\tThe DO C-CSOV\'s sustainability concept is engineered into every system, from propulsion to crane:\n' +
                '\n' +
                '•   Propulsion: 2 x Voith Schneider with PM motors - up to 15-22% lower transit power\n' +
                '•   Hybrid battery: 1,017 kWh (Corvus Orca) for peak shaving, boosting and DP spinning reserve\n' +
                '•   Part load optimized main engines: 3 x 1,760 kW MAN, IMO Tier III + SCR\n' +
                '•   Alternative fuels: HVO-100 and FAME biofuels supported\n' +
                '•   Shore power: 1,000 kVA for zero-emission port stays\n' +
                '•   Energy recovery: >70% regeneration from the gangway winch, plus crane accumulator, waste-heat recovery\n' +
                '•   Variable air flow HVAC and frequency-controlled pumps for variable consumers\n' +
                '•   Future-proof: prepared for >10,000 kWh battery upgrade for 100% electric operation\n',
            images: ['static/images/f14sustain/sustain1.png', 'static/images/f14sustain/sustain2.png']
        }
    },
    {
        id: 'holz-2',
        localPosition: new THREE.Vector3(-0.78, 0.32, 0),
        minAngle: 255,
        maxAngle: 30,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Working deck',
            subtitle: 'Space to out-perform',
            text: 'The working deck is a vast, unobstructed platform that reconfigures around whatever the job demands - from cable repair to subsea and light construction. Modular sockets and utility stations turn open deck into a purpose-built workspace, and hatches to the warehouse below puts stores and spares within immediate reach. For a charterer, this adaptability is the real advantage: one vessel that flexes across scopes, steps in when plans change, and keeps the campaign moving when risks materialize. Efficiency in every operation, contingency when it counts.\tThe DO C-CSOV working deck features payload, flexibility and multi-scope operations:\n' +
                '\n' +
                '•  Size: 800 sqm of open, unobstructed working area\n' +
                '•  Deck strength: rated for 10 t/m² \n' +
                '•  T-bars: up to 30 t/m, allowing heavy equipment mobilization\n' +
                '•  Clean deck: free of vent heads, mooring equipment and other obstructions, maximising usable working area\n' +
                '•  Modularity: removable infrastructure (daughter craft, boat landing, refuelling) \n' +
                '•  Utility stations: distributed supply of water, communications, electrical power and high pressure for demanding spreads (e.g. WROV / cable repair) without temporary infrastructure\n' +
                '•  Warehouse access: dedicated hatch enables operations at sea and effectively extends the working deck via the warehouse below\n' +
                '•  Functional layout: 5.2 m low freeboard with removable railings for easy overboard access\n',
            images: ['static/images/f5deck/workingdeck.png']
        }
    },
    {
        id: 'propeller-heck-2',
        localPosition: new THREE.Vector3(-1.051, 0.1, 0.137),
        minAngle: 255,
        maxAngle: 45,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Voith',
            subtitle: 'Works like a Swiss watch\n',
            logo: 'static/images/logos/voith-logo.svg',
            text: 'Powered by two Voith Schneider Propellers (VSP), each delivering 1,860 kW, the vessel combines exceptional manoeuvrability with precise thrust control. This propulsion concept enables rapid and accurate positioning while delivering a transit speed of up to 13.8 kn. At the same time, the VSP system provides highly efficient thrust generation, reducing energy consumption compared with conventional propulsion concepts.\tRapid response: More than 3× faster reaction to weather-induced forces than comparable azimuth-propelled vessels, with approximately 2 seconds thrust ramp-up and rapid 180° thrust reversal.\n' +
                '\n\n' +
                'High operability: Optimised for challenging offshore conditions, with up to 98% operability demonstrated for the specific location and metocean conditions shown.\n' +
                '\n' +
                'Reduced roll motion: Active VSP control counteracts wave-induced roll, reducing vessel motion, extending the operational window and improving transfer conditions and comfort.\n' +
                '\n' +
                'Low-noise operation: Electric VSP propulsion enables quiet operation, supporting DNV Comfort Class C2 and V2 requirements.\n' +
                '\n',
            images: ['static/images/f7voith/voith1.png', 'static/images/f7voith/voith2.png'],
            deepDives: [
                { title: 'Keeping Steady - Video', video: ['static/images/f7voith/video.mp4'] },
                {
                    title: 'Technical Specifications',
                    text: `DP Performance: 
The VSP propulsion system delivers a DP footprint of less than 2 m, in conditions up to 3.5 m Hs, 1.5 kn current and approximately 30 m/s wind at 45% ASOG power utilisation. This supports safe, reliable and precision operations such as W2W, crane and cable repair.

Lower energy demand: 
The VSP system requires approximately 15–22% less power than alternative propulsion arrangements, reducing fuel consumption, operating costs and CO₂ emissions.`,
                    images: ['static/images/f7voith/voithdeepdive1.png', 'static/images/f7voith/voithdeepdive2.png']
                }
            ]
        }
    },
    {
        id: 'heck-l-2',
        localPosition: new THREE.Vector3(-0.67, 0.29, 0.29),
        minAngle: 255,
        maxAngle: 45,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Warehouse',
            subtitle: 'Comes with a big belly',
            text: 'The DO C-CSOV offers a large warehouse facility designed to keep the transfer of people, tools, and materials to the offshore structure safe and efficient. A unique integrated skidding system handles containers with a 6 × 30t/TEU capacity, while dedicated hatches allow containers and pallets to be handled even while offshore. \n' +
                '\n' +
                'Step-less access, via a dedicated elevator, runs throughout the vessel and onto the offshore structure via the gangway, allowing personnel and equipment to move without obstruction at any stage of the offshore operation.\tThe DO C-CSOV integrated warehouse facility supports offshore operations with a diverse set of capabilities:\n' +
                '\n' +
                '•  525 sqm dedicated warehouse with 300 sqm of free deck space and 3.4 m clear height\n' +
                '•  Integrated skidding system handling containers with a 6 × 30 t / TEU capacity, complemented by >120-pallet shelving\n' +
                '•  Dedicated hatches allowing containers and pallets to be handled even while offshore\n' +
                '•  Fully temperature- and humidity-controlled warehouse at 23 °C / 50 % RH, plus an additional 29 sqm area controlled at 23 °C / 30 % RH for sensitive goods\n' +
                '•  Complete supporting infrastructure, including large, client-dedicated IMDG store and workshop as well as storekeeper office and related duty mess\n',
            images: ['static/images/f12warehouse/warehouse2.jpg', 'static/images/f12warehouse/warehouse1.png']
        }
    },
    {
        id: 'bruecke-l-seite-2',
        localPosition: new THREE.Vector3(0.285, 0.72, 0.33),
        minAngle: 310,
        maxAngle: 75,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Waveradar',
            subtitle: 'What if you could predict the future?\n',
            logo: 'static/images/logos/miros-logo.png',
            text: 'The DO C-CSOV is equipped with a Miros WaveRadar incorporating predictive AI technology. \n' +
                '\n' +
                'The Miros WaveSystem provides accurate, local, real-time wave and current data, giving the crew a reliable picture of the actual conditions during weather-critical offshore wind operations.\n' +
                '\n' +
                'By combining real-time measurements from WaveSystem with short-term wave and vessel-motion prediction, PredictifAI gives the crew greater visibility ahead of weather-critical operations, supporting better timing and more informed operational decisions.\tMiros PredictifAI combines X-band radar measurements of the incoming wave field with local wave measurements to support DO C-CSOV operations:\n' +
                '\n' +
                '•  Enhanced safety: Anticipate incoming waves and vessel motions before they occur, allowing proactive measures during critical operations such as W2W transfers\n' +
                '•  Objective weather assessment: Real-time measurement of local sea conditions provides a clear understanding of the forces acting on the vessel\n' +
                '•  Increased operability: Greater visibility of approaching conditions enables the crew to make better use of available weather windows\n' +
                '•  Improved decision-making: Combining measured conditions with predicted vessel response provides greater transparency when assessing operational limits\n' +
                '•  Reduced downtime: Better understanding of short-term conditions can help avoid unnecessary interruptions and maximise productive operating time\n',
            images: ['static/images/f13waveradar/waveradar1.jpg', 'static/images/f13waveradar/waveradar2.jpg'],
            deepDives: [ { title: 'Video', video: ['static/images/f13waveradar/video.mp4'] } ]
        }
    },
    {
        id: 'kabinen-r-2',
        localPosition: new THREE.Vector3(0.7, 0.32, -0.29),
        minAngle: 105,
        maxAngle: 195,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Accommodation',
            subtitle: 'A home at sea',
            text: 'Skilled and experienced personnel are becoming scarce across the industry. They are the single most important factor in achieving high-quality progress offshore. Crew and charterer personnel need to be well-rested to perform safely, thus the vessel is their safe haven after a hard day\'s work, the foundation for all and the reason every small detail has been considered in the design of the interior, facilities, and layout of the DO C-CSOV.\t •  99 cabins, each over 11 sqm, with 76 daylight cabins dedicated to charterer personnel\n' +
                '•  Flexible 1+1 cabin concept, allowing selected single cabins to be converted into doubles with a ceiling-mounted Pullman bed - without compromising comfort or space\n' +
                '•  140 sqm dedicated office wing, comprising four offices, 17 workstations and two combinable meeting rooms accommodating up to 24 people\n' +
                '•  Clear separation of work, recreation and private living, with the layout designed around the daily workflow of personnel\n' +
                '•  Over 180 sqm of gym and wellness facilities across two decks, including a dedicated spa and treatment area, supporting health, mobility and recovery\n' +
                '•  Dedicated C-Deck leisure area with library, sports bar and lounge, providing space to switch off and recharge',
            images: ['static/images/f6acommodations/cabins-a.jpg', 'static/images/f6acommodations/cabins-b.jpg'],
            deepDives: [
                { title: 'Image Slideshow', slideshow: 'static/images/accommodation' },
                {
                    title: 'Specifications',
                    text: `The DO C-CSOV offers a comprehensive range of state-of-the-art facilities and amenities, providing a comfortable, productive and flexible environment for crew and charterer personnel.

Accommodation 

99 cabins are provided, including 76 daylight cabins dedicated to charterer personnel. Each exceeds 11 sqm and features natural light, private bathroom, individual temperature control, high-bandwidth Wi-Fi for private video calls, video-on-demand and multiple resting positions (bed and day bed). Standard beds measure 0.9 × 2.1 m, with larger beds available in selected state cabins.

A flexible 1+1 cabin concept allows selected cabins to be converted to double occupancy using a ceiling-mounted Pullman bed, discreetly integrated into the ceiling, providing additional capacity without compromising comfort or space.

Recreation 

300 sqm including: 

•  Two games rooms with PlayStation and 4D simulators
•  Sports bar, library and TV entertainment with VoD and satellite
•  Lounges and recreational balcony
•  Lobby with coffee bar, main mess and duty messes
•  Sauna and treatment area
•  Dedicated smoking room

Fitness

A two-floor 180 sqm gym includes cardio equipment, an extensive free-weights area with dumbbells and barbells, and a multifunctional cable tower. The adjacent sauna and spa provide dedicated post-workout relaxation facilities.

Offices & Meeting Facilities 

Four client offices and 17 workstations are provided in flexible 4/8/3/2 configurations. The main office overlooks the aft deck and gangway operations.
Two 16.2 sqm meeting rooms accommodate 12 persons each and can be combined into a 32.4 sqm room for 24 seated persons. Both feature screens and video-conferencing systems with integrated speakers and microphones.

Medical Facilities

A 16 sqm hospital and 12 sqm sick bay include a separate adjoining ward, treatment room and dedicated toilet/bathroom facilities. Medical equipment and medicines are tailored to the vessel's operational profile, trading area and risk assessment.

Changing & Drying Facilities

The 48 sqm changing room provides 88 lockers and can be divided into separate men's and women's areas, accommodating up to 20 lockers in the women's area and a minimum of 68 in the men's area. A separate 44 sqm drying room is provided for suits, footwear, gloves and PPE. Crew members have dedicated facilities and do not share these areas.`
                },
                { title: 'Video', video: 'static/images/f6acommodations/video.mp4' }
            ]
        }
    },
    {
        id: 'propeller-front-2',
        localPosition: new THREE.Vector3(1.4, -0.1, 0),
        minAngle: 345,
        maxAngle: 180,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Bowthruster',
            subtitle: 'Give it a nudge',
            logo: 'static/images/logos/brunvoll-logo.jpg',
            text: 'The DO C-CSOV is equipped with a high-end Brunvoll bow thrusters designed to maximise manoeuvrability, DP performance and operational redundancy. \n' +
                '\n' +
                'Configuration and arrangement of the thrusters are aligned to ensure safe and reliable position keeping in challenging environmental conditions. Size, power, location and performance criteria are balanced in order to match the thrust agility of the aft eVSP while minimizing ventilation, noise and vibrations and maintaining strong power reserves.\n' +
                'The DO C-CSOV bow thruster arrangement combines high power, rapid response and redundancy to deliver precise vessel control across a wide range of offshore operating conditions:\n' +
                '\n' +
                '•  Three-thruster configuration: Two tunnel thrusters and one retractable azimuth thruster provide high levels of manoeuvrability and redundancy\n' +
                '•  High power: 3x 1,500 kW provides strong thrust for demanding DP and manoeuvring conditions\n' +
                '•  Resiliently mounted thrusters for minimal noise and vibration emissions during DP\n',
            deepDives: [
                {
                    title: 'Technical Specifications',
                    text: `•  Enlarged tunnel thrusters: 2.5 m diameter propellers deliver increased thrust and improved efficiency
•  Rapid thrust response: 20–80% thrust ramp-up in 4 seconds enables fast response to changing environmental forces
•  High rotational speed: 5 rpm provides faster thrust agility to match operational advantage of Voith propellers
•  Retractable azimuth thruster: Provides additional control and reduced thrust deduction when operating in high-current environments
•  Optimised thruster grids: Designed to maximise thrust performance and DP efficiency
•  Split configuration: Maintains redundancy during DP operations`,
                    images: ['static/images/f8bowthruster/thrusterdeepdive.png']
                }
            ]
        }
    },
    {
        id: 'bruecke-l-front-2',
        localPosition: new THREE.Vector3(0.45, 0.7, 0.2),
        minAngle: 0,
        maxAngle: 90,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Dynamic Positioning',
            subtitle: 'Control at your fingertips',
            logo: 'static/images/logos/mt-logo.png',
            text: 'The DO C-CSOV is equipped with Dynamic Positioning, Integrated Bridge Systems, and Thruster Control System, engineered and delivered by Marine Technologies. All systems share a single data model — position, thruster state, navigation and alarm management resolved in one architecture, not reconciled across vendor boundaries. \n' +
                '\n' +
                'With 800+ DP2 systems delivered and more than 35 million DP operating hours, Marine Technologies brings proven technology — hardened by experience across the most demanding offshore environments in the world.\n' +
                '\n' +
                'DNV DYNPOS AUTR-CB certifies that the closed-bus configuration aboard the DO fleet achieves the operational safety standards of conventional open-bus operation. This is not a regulatory waiver. It is an engineering result — achieved through architecture, through failure-mode modelling, and through the same redundancy discipline that defines DP2.\n' +
                '\n' +
                'Building on that notation - the DO C-CSOV delivers:\n' +
                '\n' +
                '•  Safe and efficient DP operations from four independent redundancy groups \n' +
                '•  Efficient closed-bus-tie operation under the CB class notation - keeping fuel burn low while achieving same safety standards as Open Bus Tie operations. \n' +
                '•  DP Alert, Clear Comms, integrated HiPAP and dedicated anti-jamming and anti-spoofing technology further enhance positioning integrity, communication resilience and operational robustness\n' +
                '•  Combined with the vessel\'s powerful, fast-responding propulsion, this delivers maximised operability\n' +
                '•  The DO C-CSOV holds position across a wider weather window, so more work gets done, more safely, on every day of the campaign\n' +
                '•  DP position-keeping capability is demonstrated up to 4.0 m Hs at ±30° from head seas.\n',
            images: ['static/images/f4dynpos/DOS1.png', 'static/images/f4dynpos/DOS2.png'],
            deepDives: [
                {
                    title: 'Technical Specifications',
                    text: `The DO C-CSOV is fitted with DNV DYNPOS-AUTR-CB electric system designed by ABB:

•  Blackout recovery within 45 s
•  Enhanced monitoring and protection systems: 
     ◦  Additional protection relays are fitted for vital components to ensure discrimination of the bus‑tie in case of relevant fault modes
     ◦  Current and voltage transformer sensors serve as the core sensing elements for protection relays and measuring systems
     ◦  Arc detection system ensures that the bus‑tie has selective protection capability in case of arcing faults and other relevant fault modes
     ◦  AGS (Advanced Generator Supervisor) as key component of the power management system (PMS) for closed bus‑tie operation, used to monitor generator speed control and voltage control systems to prevent fault propagation
     ◦  A stringent verification regime with FMEA and simulation modelling , such as short circuit ride-through study and arc flash study`,
                    images: ['static/images/f4dynpos/dynposdeepdive.png']
                },
                { title: 'Operability', linkedHotspotId: 'bug-2' }
            ]
        }
    },
    {
        id: 'rumpf-l-mitte-2',
        localPosition: new THREE.Vector3(0, 0.2, 0.29),
        minAngle: 330,
        maxAngle: 75,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Power Train',
            subtitle: 'Full steam ahead! \n',
            logo: 'static/images/logos/man-logo.jpg',
            text: 'The DO C-CSOV’s powertrain has been designed around an efficient and robust primary power generation system, recognising that the overall performance of the vessel’s energy concept starts with the selection of the main engines. Three medium-speed MAN engines, optimised for part-load operation, provide a highly efficient power source for propulsion, mission equipment and vessel services across a wide range of applicable load scenarios.\n' +
                '\n' +
                'The engines work in synergy with the vessel’s battery hybrid energy architecture. This enables the vessel to efficiently respond to varying power demands on the spot, cover demand peaks and act as temporary boosters.\n' +
                'The DO C-CSOV powertrain combines efficient primary generation with hybrid energy storage and flexible fuel capability to maximise efficiency, resilience and operational flexibility. Key features include:\n' +
                '\n' +
                '•  Main engines: 3 × 1,760 kW MAN 8L21/31H MK2 PLO medium-speed engines\n' +
                '•  Part-load efficiency: Engines optimised for efficient operation across varying load profiles, supporting reduced fuel consumption during typical offshore operations\n' +
                '•  Hybrid battery: 1,000 kWh battery system supporting peak shaving, power boosting and DP spinning reserve\n' +
                '•  Alternative fuels: Methanol-ready from delivery and capable of operating on biofuels including HVO-100 and FAME',
            images: ['static/images/f9powertrain/powertrain1.png', 'static/images/f9powertrain/powertrain2.png']
        }
    },
    {
        id: 'rumpf-l-vorner-2',
        localPosition: new THREE.Vector3(0.54, 0.23, 0.29),
        minAngle: 330,
        maxAngle: 75,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Electric System',
            subtitle: 'Safety and robustness prevail! ',
            logo: 'static/images/logos/abb-logo.webp',
            text: 'The DO C-CSOV’s electrical system has been engineered with safety, robustness and operational continuity at its core. The vessel is fitted with a three-split 690 V AC/DC hybrid system, arranged across four independent redundancy groups and supporting the vessel’s DNV DYNPOS-AUTR-CB class notation. \n' +
                '\n' +
                'This architecture ensures that a single failure cannot compromise the vessel’s overall power availability, providing the resilience required to maintain critical DP integrity during demanding offshore operations.\n' +
                '\n' +
                'A closed-loop configuration connects the main switchboards for fuel efficient and balanced operation, while allowing individual redundancy groups to be isolated and the system to operate in full open-bus-tie configuration when required. The power system architecture and energy management concept combines multiple technologies to maximise efficiency, resilience and future flexibility:\n' +
                '\n' +
                '•  2x 1800 kW instant power discharge to match Voith thrust agility\n' +
                '•  Two redundant battery packs integrated via a DC Bus system\n' +
                '•  Shore power: 1,000 kVA shore connection enabling zero-emission operation while in port\n' +
                '•  2x 1000 kVA at 690 V Utility Station on deck to support heavy consumers\n' +
                '•  All Permanent Magnet motors for increased efficiency at part loads\n' +
                '•  Energy recovery: Energy recuperation from crane and gangway\n' +
                '•  Future-ready: Prepared for a battery upgrade exceeding 10,000 kWh, supporting a future transition towards fully electric operation',
            images: ['static/images/f10electrics/electrics1.png', 'static/images/f10electrics/electrics2.png'],
            deepDives: [
                {
                    title: 'Technical Specifications',
                    text: `The DO C-CSOV is fitted with DNV DYNPOS-AUTR-CB electric system designed by ABB:

     ◦  Blackout recovery within 45 s
     ◦  Enhanced monitoring and protection systems: 
     ◦  Additional protection relays are fitted for vital components to ensure discrimination of the bus‑tie in case of relevant fault modes
     ◦  Current and voltage transformer sensors serve as the core sensing elements for protection relays and measuring systems
     ◦  Arc detection system ensures that the bus‑tie has selective protection capability in case of arcing faults and other relevant fault modes
     ◦  AGS (Advanced Generator Supervisor) as key component of the power management system (PMS) for closed bus‑tie operation, used to monitor generator speed control and voltage control systems to prevent fault propagation
     ◦  A stringent verification regime with FMEA and simulation modelling , such as short circuit ride-through study and arc flash study`,
                    images: ['static/images/f4dynpos/dynposdeepdive.png']
                }
            ]
        }
    },
    {
        id: 'helipad-2',
        localPosition: new THREE.Vector3(0.89, 0.8, 0),
        minAngle: 15,
        maxAngle: 165,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Helideck\n',
            subtitle: 'Big boat meets big bird',
            text: 'The DO C-CSOV’s D-21 rated helideck adds another dimension of operational flexibility offshore, supporting large helicopter types including the S-92. Beyond crew changes, material transfers and medevac, the helideck integrates directly with the vessel’s logistics chain: the gangway can connect to the helideck to provide step-less access throughout the vessel and into the warehouse, enabling efficient movement of personnel and materials.\n' +
                '\n' +
                ' The dedicated platform also provides a safe operating area for drones without occupying valuable working deck space.\tThe DO C-CSOV helideck has been designed with operational efficiency and ease of access in mind:\n' +
                '\n' +
                '•   D-21 rated helideck with maximum take-off weight of 12.6 t\n' +
                '•   Suitable for S-92 and other helicopter types\n' +
                '•   CAP 437 certification\n' +
                '•   Drone operations: Dedicated platform for safe deployment and recovery\n' +
                '•   Three access points: For efficient access and egress\n' +
                '•   Direct MCC gangway connection: Enables step-free transfer of personnel and materials throughout the vessel as well as elevator redundancy\n' +
                '•   Fully certified Helideck monitoring system',
            images: ['static/images/f15heliport/heliport1.jpg', 'static/images/f15heliport/heliport2.jpg']
        }
    },
    {
        id: 'bug-2',
        localPosition: new THREE.Vector3(1.5, 0.477, 0),
        minAngle: 20,
        maxAngle: 130,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
        content: {
            title: 'Operability\n',
            subtitle: 'Stay steady, work ready\n',
            text: 'The DO C-CSOV offers excellent seakeeping and station keeping performance and consequently strong W2W and crane operability. These capabilities are primarily driven by:\n' +
                '\n' +
                'Propulsion configuration: 2 × Voith Schneider Propellers, 2 × 1,500 kW Brunvoll bow thrusters and 1 × 1,500 kW retractable azimuth thruster.\n' +
                '\n' +
                'Power availability: 3-split AC/DC hybrid power distribution with 3 × 1,760 kW main engines and a 1,017 kWh battery.\n' +
                '\n' +
                'Hull design: 96.25 m LOA × 20 m beam with a bow-shaped stern optimised for all-heading seakeeping.\n' +
                '\n' +
                'The vessel’s operational capability has been verified through DNV L3 time-domain analysis and assessed against actual 2025 German Bight metocean data. The results demonstrate approximately 98% annual W2W availability, with a W2W envelope of up to 3.5 m Hs at ±20° headings and 3.25 m Hs at ±30°, at mean wind speeds up to 16 m/s. DP position-keeping capability is demonstrated up to 4.0 m Hs at ±30° from head seas.\tBeyond the vessel’s inherent seakeeping performance, dedicated motion-control, positioning and prediction systems further enhance operability, safety and comfort.\n' +
                '\n' +
                'Motion & Roll Control\n' +
                'Voith propulsion control, Hoppe active stabilisers and bilge keels work together to reduce roll motions, improving transfer conditions, comfort and operational windows.\n' +
                '\n' +
                'Positioning & Motion Prediction\n' +
                'Five independent position-reference systems — SceneScan, CyScan, HiPAP 502 and 2 × Veripos DGNSS with anti-jamming/spoofing capability — provide robust positioning. JRC wave radar, Miros WaveSystem, PredictifAI and multiple MRUs support accurate motion monitoring and short-term wave and motion prediction.\n' +
                '\n' +
                'Human Factor\n' +
                'Motion sickness analysis indicates that less than 10% of personnel are expected to experience motion sickness up to 3.0 m Hs, supporting safe and comfortable offshore operations.',
            images: ['static/images/f16operability/ops1.jpeg', 'static/images/f16operability/ops2.png']
        }
    }

];


// ─────────────────────────────────────────────────────────────────────────
// SHARED BLUE HOTSPOTS
// Per-scope blues referenced by both a base boat and its variant.
// ─────────────────────────────────────────────────────────────────────────

export const WALK_TO_WORK_BLUE = {
    id: '1-2-gangway-ende-2',
    localPosition: new THREE.Vector3(-0.24, 0.7, -0.08),
    minAngle: 195,
    maxAngle: 345,
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
        images: ['static/images/m1walktowork/walktowork1.jpg','static/images/m1walktowork/walktowork2.jpg']
    }
};

export const DAUGHTER_CRAFT_BLUE = {
    id: 'beiboot-2',
    localPosition: new THREE.Vector3(-0.295, 0.34, 0.23),
    minAngle: 200,
    maxAngle: 270,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'Daughter Craft ',
        subtitle: 'Pick me up!',
        logo: 'static/images/logos/combined-logos.png',
        text: 'The DO C-CSOV is equipped with a Vestdavit launched Chartwell Catamaran Workboat. Its large deck space in combination with its modularity concept allows for carrying a high performance Daughter Craft without compromising on the asset\'s capabilities. The working deck remains spacious with sufficient capacity for containerized or bulk cargo. As the davit is skid mounted, quick mobilization and demobilization is catered for the event the additional space is required. \n' +
            '\tBenefiting from the use of a Daughter Craft should not go along unacceptable risks. The Vestdavit PLD-15002 is DNV-ST-0498 certified, setting a baseline to deploy and retrieve Daughter Crafts safely. A telescopic painter boom ensures proper hull clearance and controlled motion at high sea states, safeguarding that a recovery can be conducted under any circumstances.\n',
        images: ['static/images/f3daughtercraft/daughtercraft.png', 'static/images/f3daughtercraft/daughtercraft2.png'],
        deepDives: [
            {
                title: 'Technical Specifications',
                text: `The DO C-CSOV is fitted with the Chartwell Marine Catamaran Workboat 12, amended to the DO requirements:

•  Increased safety standards: UK Workboat Code Cat.1
•  Length: 12.66 m
•  Width: 4.1 m
•  Max capacity: 12 + 2 PAX
•  Speed: 25 kn
•  Payload 1 t
•  Operational transfer limit: Hs 1.5 m
•  Lateral and vertical accelerations: Max 0.15 g RMS for Hs 1.5 m`
            }
        ]
    }
};

export const ROCKBAG_BLUE = {
    id: '3-1-kran-ausleger-2',
    localPosition: new THREE.Vector3(-0.81, 0.51, -0.755),
    minAngle: 100,
    maxAngle: 359,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'Rockbag Installation',
        subtitle: 'On the Rocks',
        text: `For rock bag installation the DO C-CSOV provides the following key capabilities:

•  Large and strengthened deck area with 800 sqm and 10 t/m²
•  50 t AHC crane capacity
•  Warehouse (500 sqm) with 6 x 30 t TEU skidding system, for the storage of project specific tools and/or additional rock bags stored in open-top containers, accessible offshore via the main hatch
•  Utility stations and ROV infrastructure 
•  Suitable stability and weight margins
•  Compatible with established rock bag deployment tools such as the UTILITY ROV RBDT, deploying either single 8 ton bags or 2 x 4 ton bags per lift
`,
        images: ['static/images/m3rockbag/rockbag2.jpg','static/images/m3rockbag/rockbag1.jpg']
    }
};

export const CFE_BLUE = {
    id: '5-1-holz-richtung-r-2',
    localPosition: new THREE.Vector3(-0.79, 0.52, -0.75),
    minAngle: 100,
    maxAngle: 340,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'Control Flow Excavator',
        subtitle: 'Clear the way',
        text: `Removing sediment from around subsea structures is a recurring need throughout project construction and maintenance, for both planned campaigns and unplanned interventions. The DO C-CSOV can take on this scope directly, using its unique design features to run a controlled flow excavation spread. Ample deck space allows the works to run alongside other scopes - Absorbing the task on an existing vessel adds efficiency and gives the project valuable contingency.

For CFE deployment our DO C-CSOV provides the following key capabilities:

• Utility stations for power and services to the excavation spread
• 10t 3D MCC or 50t AHC crane capacity and reach
• Suitable stability and weight margins
• HiPAP 502 for subsea positioning
• Compatible with established CFE spreads such as the ROTECH TRS1
`,
        images: ['static/images/m5cfe/cfe1.png','static/images/m5cfe/cfe2.jpg']
    }
};

export const PAYLOAD_BLUE = {
    id: 'boot9-deck-payload',
    localPosition: new THREE.Vector3(-1.023, 0.426, 0.003),
    minAngle: 180,
    maxAngle: 30,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'Deck payload',
        subtitle: 'When size matters',
        text: 'When the job calls for size, the DO C-CSOV delivers. A vast, strengthened deck, generous payload and a powerful crane let big, bulky equipment - from generator sets with pre-filled fuel tanks to subsea corrosion-protection spreads - be mobilised, installed and operated from a single vessel, whether planned or unplanned. Bigger lifts mean fewer of them: less deck shuffling, fewer supply runs and less port time, so campaigns run leaner and faster. And when priorities shift, this flexibility turns into contingency - ready to pick up slack and keep the offshore programme moving without missing a beat.\n',
        images: ['static/images/m6payload/deckpayload-a.jpg', 'static/images/m6payload/deckpayload-b.jpg']
    }
};

export const ROV_BLUE = {
    id: '9-1-reling-2',
    localPosition: new THREE.Vector3(-0.295, 0.34, 0.29),
    minAngle: 255,
    maxAngle: 45,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'ROV Operations',
        subtitle: 'Your hands & eyes underwater\n',
        text: `The DO C-CSOV is a flexible platform for work-class ROV support - from inspection, maintenance and repair to construction support and contingency work. Its low freeboard and modular railings enable safe, efficient over-the-side deployment of high-capacity WROVs for demanding station keeping and special tooling requirements. The result is greater operational efficiency, less reliance on dedicated ROV vessels and valuable extra contingency capacity, when and where it is needed- both during construction and the O&M phase.

As such, the DO C-CSOV can facilitate various tasks such as foundation, cable and scour-protection inspection, cable route and burial surveys, cathodic-protection and anode checks; construction and lift support with touchdown monitoring as well as unplanned subsea interventions
For work-class ROV capability the DO C-CSOV provides the following key capabilities:

•  High-capacity work-class ROV (WROV) for requirements beyond observation
•  Permanent ROV mobilization by integration of ROV piloting into convertible charterer's office 
•  HiPAP 502 acoustic subsea positioning
•  Ample space for ROV integration next to conventional CSOV scopes
•  Large warehouse and workshop facilities to accommodate maintenance requirements for high spec underwater assets
`,
        images: ['static/images/m9rov/rov1.jpg','static/images/m9rov/rov2.png']
    }
};


// ─────────────────────────────────────────────────────────────────────────
// PER-MODEL HOTSPOT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────
export const hotspotDefinitions = {

    0: [ // Boot 1 — greens only (pink removed)
        ...SHARED_GREEN_HOTSPOTS
    ],

    11: [ // Boot 1, variant 1
        ...SHARED_GREEN_HOTSPOTS,
        WALK_TO_WORK_BLUE,
        DAUGHTER_CRAFT_BLUE,
        {
            id: 'boot1-1-switch-back-to-boot1',
            localPosition: new THREE.Vector3(-0.505, 0.56, -0.284),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 0
        }
    ],

    1: [ // Boot 2
        ...SHARED_GREEN_HOTSPOTS,
        ROCKBAG_BLUE,
        {
            id: 'boot2-switch-to-variant',
            localPosition: new THREE.Vector3(-0.505, 0.56, -0.284),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 21
        }
    ],

    21: [ // Boot 2, variant 1
        ...SHARED_GREEN_HOTSPOTS,
        {
            ...ROCKBAG_BLUE,
            localPosition: new THREE.Vector3(-1.1, 0.4, 0.03)
        },
        {
            id: 'boot2-1-switch-back-to-boot2',
            localPosition: new THREE.Vector3(-0.505, 0.56, -0.284),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 1
        }
    ],

    2: [ // Boot 3
        ...SHARED_GREEN_HOTSPOTS,
        CFE_BLUE,
        {
            id: 'boot3-switch-to-variant',
            localPosition: new THREE.Vector3(-0.505, 0.56, -0.284),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 31
        }
    ],

    31: [ // Boot 3, variant 1
        ...SHARED_GREEN_HOTSPOTS,
        {
            ...CFE_BLUE,
            localPosition: new THREE.Vector3(-0.692, 0.39, -0.167)
        },
        {
            id: 'boot3-1-switch-back-to-boot3',
            localPosition: new THREE.Vector3(-0.505, 0.56, -0.284),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 2
        }
    ],

    3: [ // Boot 4
        ...SHARED_GREEN_HOTSPOTS,
        PAYLOAD_BLUE,
        {
            id: 'boot4-switch-to-variant',
            localPosition: new THREE.Vector3(-0.505, 0.56, -0.284),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 41
        }
    ],

    41: [ // Boot 4, variant 1
        ...SHARED_GREEN_HOTSPOTS,
        PAYLOAD_BLUE,
        {
            id: 'boot4-1-switch-back-to-boot4',
            localPosition: new THREE.Vector3(-0.505, 0.56, -0.284),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 3
        }
    ],

    4: [ // Boot 5
        ...SHARED_GREEN_HOTSPOTS,
        {
            id: '8-1-container-2',
            localPosition: new THREE.Vector3(-1.2, 0.3, 0),
            minAngle: 150,
            maxAngle: 45,
            variant: 'blue',
            icon: 'static/images/icons/hotspot-icon-blue.png',
            content: {
                title: 'Cable Repair',
                subtitle: 'Don\'t waste time',
                text: `Designed for rapid response, the DO C-CSOV provides a pre-engineered cable repair capability that is readily available and significantly reduces mobilization time when intervention is required. With offshore power cables forming part of critical energy infrastructure, fast deployment minimizes downtime, reduces opportunity costs and supports lower project risk. The integrated solution enables efficient cable repair operations without the delays associated with vessel and equipment availability.

Maximising cable repair capability is at the core of the DO C-CSOV's design. The vessel suits both cable replacement and repair campaigns, for inter-array and common AC export cables. On deck utility stations support the cable-repair spread and ROV operations, while the technical layout allows the below-deck warehouse space to be used to its full extent, significantly enlarging the total space available on board.

For cable repair the DO C-CSOV provides the following key capabilities:

• Up to 400t cable capacity on a dual partition carousel or reel
• Up to 20m highway length for suitable cable protection system installation
• Minimum bending radius (MBR) of 5m 
• 15t tensioner
• Quadrant deployment system with integrated joint handling crane
`,
                images: ['static/images/m8cablerepair/repair1.jpg','static/images/m8cablerepair/repair2.jpg']
            }
        },
        {
            id: '8-2-cable-repair-video-2',
            localPosition: new THREE.Vector3(-0.295, 0.44, -0.29),
            minAngle: 0,
            maxAngle: 359,
            variant: 'blue',
            icon: 'static/images/icons/hotspot-icon-blue.png',
            content: {
                title: 'Cable Repair Video',
                video: ['static/images/m8cablerepair/video.mp4']
            }
        }
    ],

    5: [ // Boot 6
        ...SHARED_GREEN_HOTSPOTS,
        ROV_BLUE,
        {
            id: 'boot6-switch-to-variant',
            localPosition: new THREE.Vector3(-0.545, 0.231, 0.134),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 61
        }
    ],

    61: [ // Boot 6, variant 1
        ...SHARED_GREEN_HOTSPOTS,
        ROV_BLUE,
        {
            id: 'boot6-1-switch-back-to-boot6',
            localPosition: new THREE.Vector3(-0.545, 0.131, 0.134),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 5
        }
    ],

    6: [ // Boot 7 — Walk to Work
        ...SHARED_GREEN_HOTSPOTS,
        WALK_TO_WORK_BLUE,
        DAUGHTER_CRAFT_BLUE,
        {
            id: 'boot7-switch-to-variant',
            localPosition: new THREE.Vector3(-0.37, 0.579, -1.064),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 71
        }
    ],

    71: [ // Boot 7, variant 1
        ...SHARED_GREEN_HOTSPOTS,
        WALK_TO_WORK_BLUE,
        DAUGHTER_CRAFT_BLUE,
        {
            id: 'boot7-1-switch-back-to-boot7',
            localPosition: new THREE.Vector3(-0.37, 0.579, -1.064),
            minAngle: 0,
            maxAngle: 359,
            variant: 'pink',
            icon: 'static/images/icons/hotspot-icon-pink.png',
            linkedModelIndex: 6
        }
    ],

    7: [ // Boot 8
        ...SHARED_GREEN_HOTSPOTS,
        {
            id: '6-1-holz-richtung-bug-2',
            localPosition: new THREE.Vector3(-0.7, 0.32, 0),
            minAngle: 180,
            maxAngle: 45,
            variant: 'blue',
            icon: 'static/images/icons/hotspot-icon-blue.png',
            content: {
                title: 'Grouting spread',
                subtitle: 'Close the gap',
                text: `The DO C-CSOV supports grouting operations as a complementary scope to HLV campaigns, significantly increasing overall project efficiency. By taking over the grouting and bolt fastening thus reducing the time CAPEX-intensive HLV needs to remain on location, the DO C-CSOV helps minimise costly idle time and enables heavy-lift assets to move on faster.

Stability and weight margins as well as a working deck suitable to carry spacious and heavy equipment, enable the DO C-CSOV to mobilize up to 400 t of dry grout powder in combination with high output mixer (e.g. Found Ocean's HRJM 27) and other necessary infrastructure. Depending on project requirements, either 100 t / 50 t silos or container based silos can be deployed, enabling quick turnaround times in harbour.

Grouting operations can be combined with bolt tightening, as additional space is both available on deck as well as below deck. The DO C-CSOVs W2W capability eliminates the need to mobilise a rental gangway, saving mobilisation time and cost while improving overall project efficiency.
`,
                images: ['static/images/m7grouting/grouting1.jpg','static/images/m7grouting/grouting2.png']
            }
        }
    ],

    8: [ // Boot 9
        ...SHARED_GREEN_HOTSPOTS,
        {
            id: '9-1-holz-richtung-heck-2',
            localPosition: new THREE.Vector3(-0.75, 0.5, -0.735),
            minAngle: 255,
            maxAngle: 45,
            variant: 'blue',
            icon: 'static/images/icons/hotspot-icon-blue.png',
            content: {
                title: 'Monopile Cleaning',
                subtitle: 'Nice and shiny!',
                text: `The DO C-CSOV offers the unique capability to support installation vessels with monopile and pile cleaning, a step required to remove marine growth prior to installation of the transition piece. Its large, strengthened working deck and AHC crane accommodate cleaning tools, skids and all ancillary equipment.

The DO C-CSOV is able to support offshore construction with its unique capability set. By offering significantly increased deck space in combination with suitable crane capacity as well as power supply, monopile cleaning can be performed alongside regular W2W activities, either as a contingency measure, or as a preplanned scope. This offers cost saving potential compared to a WTIV deployed scenario, or removes the dependency on a dedicated construction vessel which needs to be chartered from the volatile spot market.
`,
                images: ['static/images/m4cleaning/cleaning1.jpg','static/images/m4cleaning/cleaning2.png']
            }
        }
    ]

};