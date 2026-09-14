const buttonConfig = {
    // ---- Base boats (indices 0-8) ----
    // `image` is optional — omit it (or set to null) to leave the button's
    // existing icon in place. Paths are relative to the page root, same as
    // hotspot image paths.
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
    // Variants can also carry an image if you want them to look different
    // from their base boat. Leave off to keep the base's icon.
    71: {label: "Walk to Work (Var. 1)",         statusText: "Extended Gangway",
         image: 'static/images/buttons/w2w_var1.jpg'},
    21: {label: "Rockbag Installation (Var. 1)", statusText: "Rockbag – Variante 1"},
    31: {label: "CFE (Var. 1)",                  statusText: "CFE – Variante 1"},
    41: {label: "Deck Payload (Var. 1)",         statusText: "Deck Payload – Variante 1"},
    61: {label: "ROV (Var. 1)",                  statusText: "ROV – Variante 1"},
};


// ═══════════════════════════════════════════════════════════════════════════
// SHARED GREEN HOTSPOTS
// ═══════════════════════════════════════════════════════════════════════════
const SHARED_GREEN_HOTSPOTS = [

    {
        id: 'tower-mittig-2',
        localPosition: new THREE.Vector3(-0.134, 0.75, -0.24),
        minAngle: 180,
        maxAngle: 269,
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
                { title: 'In Operation', video: 'static/images/f1gangway/video.mp4' }
            ]
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
                    images: ['static/images/f2crane/cranedeepdive.jpg']
                }
            ]
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
        localPosition: new THREE.Vector3(-1.29, 0.3, 0),
        minAngle: 180,
        maxAngle: 269,
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
        minAngle: 270,
        maxAngle: 359,
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
            images: ['static/images/f5deck/workingdecktopview.png']
        }
    },
    {
        id: 'propeller-heck-2',
  localPosition: new THREE.Vector3(-1.051, 0.1, 0.137),
        minAngle: 270,
        maxAngle: 359,
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
        minAngle: 270,
        maxAngle: 359,
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
        minAngle: 270,
        maxAngle: 359,
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
        minAngle: 90,
        maxAngle: 179,
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
        localPosition: new THREE.Vector3(1.4, 0.1, 0),
        minAngle: 90,
        maxAngle: 179,
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
        id: 'beiboot-2',
        localPosition: new THREE.Vector3(-0.295, 0.34, 0.23),
        minAngle: 0,
        maxAngle: 89,
        variant: 'green',
        icon: 'static/images/icons/hotspot-icon-green.png',
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
    },
    {
        id: 'bruecke-l-front-2',
        localPosition: new THREE.Vector3(0.45, 0.7, 0.2),
        minAngle: 0,
        maxAngle: 89,
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
        minAngle: 0,
        maxAngle: 89,
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
        minAngle: 0,
        maxAngle: 89,
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

•  Blackout recovery within 45 s
•  Enhanced monitoring and protection systems: 
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
        minAngle: 0,
        maxAngle: 89,
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
        minAngle: 0,
        maxAngle: 89,
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


// ═══════════════════════════════════════════════════════════════════════════
// SHARED BLUE HOTSPOTS
// ═══════════════════════════════════════════════════════════════════════════

const WALK_TO_WORK_BLUE = {
    id: '1-2-gangway-ende-2',
    localPosition: new THREE.Vector3(-0.24, 0.7, -0.08),
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
        images: ['static/images/m1walktowork/walktowork1.jpg','static/images/m1walktowork/walktowork2.jpg']
    }
};

const ROCKBAG_BLUE = {
    id: '3-1-kran-ausleger-2',
    localPosition: new THREE.Vector3(-0.81, 0.51, -0.755),
    minAngle: 0,
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

const CFE_BLUE = {
    id: '5-1-holz-richtung-r-2',
    localPosition: new THREE.Vector3(-0.79, 0.52, -0.75),
    minAngle: 0,
    maxAngle: 359,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'Control Flow Excavator',
        subtitle: 'Clear the way',
        text: `Removing sediment from around subsea structures is a recurring need throughout project construction and maintenance, for both planned campaigns and unplanned interventions. The DO C-CSOV can take on this scope directly, using its unique design features to run a controlled flow excavation spread. Ample deck space allows the works to run alongside other scopes - Absorbing the task on an existing vessel adds efficiency and gives the project valuable contingency.

For CFE deployment our DO C-CSOV provides the following key capabilities:

- Utility stations for power and services to the excavation spread
- 10t 3D MCC or 50t AHC crane capacity and reach
- Suitable stability and weight margins
- HiPAP 502 for subsea positioning
- Compatible with established CFE spreads such as the ROTECH TRS1
`,
        images: ['static/images/m5cfe/cfe1.png','static/images/m5cfe/cfe2.jpg']
    }
};

const PAYLOAD_BLUE = {
    id: 'boot9-deck-payload',
    localPosition: new THREE.Vector3(-1.023, 0.426, 0.003),
    minAngle: 260,
    maxAngle: 80,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'Deck payload',
        subtitle: 'When size matters',
        text: 'When the job calls for size, the DO C-CSOV delivers. A vast, strengthened deck, generous payload and a powerful crane let big, bulky equipment - from generator sets with pre-filled fuel tanks to subsea corrosion-protection spreads - be mobilised, installed and operated from a single vessel, whether planned or unplanned. Bigger lifts mean fewer of them: less deck shuffling, fewer supply runs and less port time, so campaigns run leaner and faster. And when priorities shift, this flexibility turns into contingency - ready to pick up slack and keep the offshore programme moving without missing a beat.\n',
        images: ['static/images/m6payload/deckpayload-a.jpg', 'static/images/m6payload/deckpayload-b.jpg']
    }
};

const ROV_BLUE = {
    id: '9-1-reling-2',
    localPosition: new THREE.Vector3(-0.295, 0.34, 0.29),
    minAngle: 0,
    maxAngle: 359,
    variant: 'blue',
    icon: 'static/images/icons/hotspot-icon-blue.png',
    content: {
        title: 'ROV Operations',
        subtitle: 'Your hands & eyes underwater\n',
        text: `The DO C-CSOV is a flexible platform for work-class ROV support - from inspection, maintenance and repair to construction support and contingency work. Its low freeboard and modular railings enable safe, efficient over-the-side deployment of high-capacity WROVs for requirements demanding station keeping and special tooling. The result is greater operational efficiency, less reliance on dedicated ROV vessels and valuable extra contingency capacity, when and where it is needed - both during construction and the O&M phase.

As such, the DO C-CSOV can facilitate various tasks such as foundation, cable and scour-protection inspection, cable route and burial surveys, cathodic-protection and anode checks; construction and lift support with touchdown monitoring as well as unplanned subsea interventions.

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


// ═══════════════════════════════════════════════════════════════════════════
// PER-MODEL HOTSPOT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════
const hotspotDefinitions = {

    0: [ // Boot 1 — greens only (pink removed)
        ...SHARED_GREEN_HOTSPOTS
    ],

    11: [ // Boot 1, variant 1
        ...SHARED_GREEN_HOTSPOTS,
        WALK_TO_WORK_BLUE,
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
            minAngle: 0,
            maxAngle: 359,
            variant: 'blue',
            icon: 'static/images/icons/hotspot-icon-blue.png',
            content: {
                title: 'Cable Repair',
                subtitle: 'Don\'t waste time',
                text: `Designed for rapid response, the DO C-CSOV provides a pre-engineered cable repair capability that is readily available and significantly reduces mobilization time when intervention is required. With offshore power cables forming part of critical energy infrastructure, fast deployment minimizes downtime, reduces opportunity costs and supports lower project risk. The integrated solution enables efficient cable repair operations without the delays associated with vessel and equipment availability.

Maximising cable repair capability is at the core of the DO C-CSOV's design. The vessel suits both cable replacement and repair campaigns, for inter-array and common AC export cables. On deck utility stations support the cable-repair spread and ROV operations, while the technical layout allows the below-deck warehouse space to be used to its full extent, significantly enlarging the total space available on board.

For cable repair the DO C-CSOV provides the following key capabilities:

- Up to 400t cable capacity on a dual partition carousel or reel
- Up to 20m highway length for suitable cable protection system installation
- Minimum bending radius (MBR) of 5m 
- 15t tensioner
- Quadrant deployment system with integrated joint handling crane
`,
                images: ['static/images/m8cablerepair/repair1.jpg','static/images/m8cablerepair/repair2.jpg']
            }
        },
        {
            id: '8-2-cable-repair-video-2',
            localPosition: new THREE.Vector3(-0.295, 0.34, -0.29),
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
            localPosition: new THREE.Vector3(-0.545, 0.131, 0.134),
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
            minAngle: 0,
            maxAngle: 359,
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
            localPosition: new THREE.Vector3(-1.07, 1, -0.735),
            minAngle: 0,
            maxAngle: 359,
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


import * as THREE from 'three';



import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

let camera, scene, renderer, controls;
let ambientLight, directionalLight, directionalLight2,cameraLight; // hoisted so the debug-overlay light controls can reach them
let lightVisual1, lightVisual2; // small sphere+line shown per light while the debug overlay (H) is open

// Initial camera settings (edit these to change the starting view)
const initialCameraPosition = new THREE.Vector3(-2.35, 1, 0);
let initialTargetY = 0.25; // desired initial look height (controls.target.y)
// Initial camera settings (edit these to change the starting view)

let initialTargetZ = 0;   // <-- desired initial look depth (controls.target.z)
let initialModelZ = 0; // initial Z offset for the active model
let currentModelZ = 0;

// Toggle which boat models are loaded/active — index 0 = Boot 1, index 1 = Boot 2, etc.
// Set to false to skip loading that model entirely (useful for testing/debugging).
let modelEnabled = [true, true, true, true, true, true,true,true,true];




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