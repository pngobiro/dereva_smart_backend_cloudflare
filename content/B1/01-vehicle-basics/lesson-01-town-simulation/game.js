/* =========================================
   NTSA Driving Simulator – game.js
   B1 Licence Training – Kenya Traffic Act
   ========================================= */

const Game = (() => {
    // ── State ──────────────────────────────
    let scene, camera, renderer, car, animId;
    let carSpeed = 0, carRotation = 0;
    let currentGear = 'N';
    let score = 100, violations = 0;
    let cameraMode = 0; // 0:follow, 1:top, 2:first-person
    let lightsOn = false, hornActive = false;
    let seatbeltOn = true;
    let currentScenarioIdx = 0;
    let scenarioActive = false;
    let lastViolationTime = 0;
    let trafficPhase = 0; // 0:red, 1:amber, 2:green
    let trafficTimer = 0;
    let trafficPhaseDur = [5000, 2000, 6000]; // ms
    let lastTrafficUpdate = Date.now();
    let nearTrafficLight = false;
    let tipTimeout = null;
    let alertTimeout = null;
    let collisionCooldown = {};

    const MAX_SPEED = 80;   // km/h equivalent
    const ACCEL     = 0.3;
    const BRAKE     = 0.6;
    const TURN_SPD  = 0.028;

    const keys = {};
    let obstacles = [], trafficLightMeshes = [], buildingBoxes = [];

    // ── NTSA Scenarios ──────────────────────
    const SCENARIOS = [
        {
            id: 'free-drive',
            name: 'Free Drive',
            desc: 'Explore the town. Obey all road signs and traffic signals.',
            tip: 'Always wear your seatbelt. It is law under Traffic Act Cap 403.'
        },
        {
            id: 'traffic-lights',
            name: 'Traffic Signal Obedience',
            desc: 'Stop at all red lights. Slow down at amber. Proceed only on green.',
            tip: 'Red means STOP. Amber means prepare to stop. Green means GO — only if safe.'
        },
        {
            id: 'speed-limit',
            name: 'Speed Limit Compliance',
            desc: 'Maintain speed below 50 km/h in this urban zone. Speed limit signs are posted.',
            tip: 'Urban speed limit in Kenya is 50 km/h. Exceeding it risks lives & penalties.'
        },
        {
            id: 'roundabout',
            name: 'Roundabout Navigation',
            desc: 'Approach the roundabout, give way to traffic from the right, and exit correctly.',
            tip: 'At a roundabout: give way to vehicles already on the roundabout (traffic from the right).'
        },
        {
            id: 'parking',
            name: 'Parking Manoeuvres',
            desc: 'Find the designated parking bay and park without hitting kerbs or other vehicles.',
            tip: 'Always signal before parking. Check mirrors and blind spots before manoeuvring.'
        },
        {
            id: 'defensive',
            name: 'Defensive Driving',
            desc: 'Navigate through traffic while maintaining safe following distance.',
            tip: 'Keep a 3-second following gap. In wet conditions, double this distance.'
        }
    ];

    // ── NTSA Tips pool ──────────────────────
    const NTSA_TIPS = [
        'Always signal at least 30 metres before turning.',
        'Do not use a mobile phone while driving — it is a criminal offence.',
        'Pedestrians have right of way at marked crossings.',
        'Check all mirrors every 5–8 seconds while driving.',
        'Never drink and drive. BAC limit in Kenya is 0.08%.',
        'Overtake only when it is safe and legal to do so.',
        'Headlights should be on between 6:30 PM and 6:30 AM.',
        'Keep left except when overtaking.',
        'Emergency vehicles with sirens have right of way — pull over and stop.',
        'Ensure tyres are inflated to manufacturer specification.',
    ];
    let lastTipIdx = -1;

    // ── Init ────────────────────────────────
    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.009);

        // Camera
        camera = new THREE.PerspectiveCamera(
            70, window.innerWidth / window.innerHeight, 0.1, 600
        );
        camera.position.set(0, 10, 20);

        // Renderer
        const canvas = document.getElementById('canvas');
        renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile(), powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = !isMobile();
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        buildScene();

        // Events
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            keys[k] = true;
            if (k === 'c') { cycleCamera(); keys['c'] = false; }
            if (k === 'h') honk();
            if (k === 'l') toggleLights();
        });
        window.addEventListener('keyup',  e => { keys[e.key.toLowerCase()] = false; });
        window.addEventListener('resize', onResize);

        initMinimap();
        showScenario(0);
        showRandomTip();
        animate();
    }

    function buildScene() {
        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xfff8e7, 0.85);
        sun.position.set(60, 120, 60);
        if (!isMobile()) {
            sun.castShadow = true;
            sun.shadow.mapSize.set(1024, 1024);
            sun.shadow.camera.near = 0.5;
            sun.shadow.camera.far = 300;
            sun.shadow.camera.left = sun.shadow.camera.bottom = -100;
            sun.shadow.camera.right = sun.shadow.camera.top = 100;
        }
        scene.add(sun);

        createGround();
        createRoads();
        createBuildings();
        createTrafficLights();
        createRoadSigns();
        createTrees();
        createParkedCars();
        createPedestrians();
        createCar();
    }

    // ── Ground ──────────────────────────────
    function createGround() {
        const geo = new THREE.PlaneGeometry(400, 400);
        const mat = new THREE.MeshLambertMaterial({ color: 0x4a7c4a });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        scene.add(mesh);
    }

    // ── Roads ───────────────────────────────
    function createRoads() {
        const roadMat  = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const lineMat  = new THREE.MeshBasicMaterial({ color: 0xffff99 });
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const roads = [
            // Main N-S
            { x:0, z:0, w:12, l:300, rot:0 },
            // Main E-W
            { x:0, z:0, w:12, l:300, rot:Math.PI/2 },
            // Secondary
            { x:40, z:0, w:9, l:150, rot:0 },
            { x:-40, z:0, w:9, l:150, rot:0 },
            { x:0, z:40, w:9, l:150, rot:Math.PI/2 },
            { x:0, z:-40, w:9, l:150, rot:Math.PI/2 },
        ];

        roads.forEach(r => {
            // Road surface
            const geo = new THREE.PlaneGeometry(r.w, r.l);
            const mesh = new THREE.Mesh(geo, roadMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.rotation.z = r.rot;
            mesh.position.set(r.x, 0.01, r.z);
            mesh.receiveShadow = true;
            scene.add(mesh);

            // Centre line
            const lineGeo = new THREE.PlaneGeometry(0.25, r.l);
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.rotation.z = r.rot;
            line.position.set(r.x, 0.03, r.z);
            scene.add(line);

            // Edge markings
            [-1,1].forEach(side => {
                const edgeGeo = new THREE.PlaneGeometry(0.3, r.l);
                const edge = new THREE.Mesh(edgeGeo, whiteMat);
                edge.rotation.x = -Math.PI / 2;
                edge.rotation.z = r.rot;
                const off = (r.w / 2 - 0.5) * side;
                if (r.rot === 0) {
                    edge.position.set(r.x + off, 0.03, r.z);
                } else {
                    edge.position.set(r.x, 0.03, r.z + off);
                }
                scene.add(edge);
            });
        });

        // Zebra crossings
        const zebra = [
            { x:0, z:9 }, { x:0, z:-9 }, { x:9, z:0 }, { x:-9, z:0 }
        ];
        zebra.forEach(pos => {
            for (let i = -2; i <= 2; i++) {
                const zg = new THREE.PlaneGeometry(0.6, 12);
                const zm = new THREE.Mesh(zg, whiteMat);
                zm.rotation.x = -Math.PI / 2;
                zm.position.set(pos.x + i * 1.0, 0.04, pos.z);
                scene.add(zm);
            }
        });
    }

    // ── Buildings ───────────────────────────
    function createBuildings() {
        buildingBoxes = [];
        const buildings = [
            // quadrant 1
            { x:22, z:22, w:14, h:18, d:12, color:0x8b6c5c },
            { x:55, z:22, w:10, h:12, d:10, color:0xa0784d },
            { x:22, z:55, w:12, h:22, d:14, color:0x7a6040 },
            // quadrant 2
            { x:-22, z:22, w:12, h:15, d:10, color:0x6e8b78 },
            { x:-55, z:22, w:10, h:20, d:12, color:0x4e7060 },
            { x:-22, z:55, w:14, h:14, d:14, color:0x5a7060 },
            // quadrant 3
            { x:22, z:-22, w:10, h:25, d:10, color:0x7a5c5c },
            { x:55, z:-22, w:12, h:16, d:12, color:0x8c6464 },
            // quadrant 4
            { x:-22, z:-22, w:14, h:20, d:10, color:0x5c6878 },
            { x:-55, z:-22, w:10, h:14, d:12, color:0x6878a0 },
            // market stall area
            { x:55, z:55, w:8, h:6, d:8, color:0xc09050 },
            { x:-55, z:-55, w:8, h:8, d:8, color:0x809050 },
        ];

        const windowMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
        const darkWindowMat = new THREE.MeshBasicMaterial({ color: 0x222244 });

        buildings.forEach(b => {
            const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
            const mat = new THREE.MeshLambertMaterial({ color: b.color });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(b.x, b.h / 2, b.z);
            mesh.castShadow = true; mesh.receiveShadow = true;
            scene.add(mesh);

            // Bounding box for collision
            const box = new THREE.Box3().setFromObject(mesh);
            buildingBoxes.push(box);

            // Windows
            const rows = Math.floor(b.h / 3.5);
            const cols = 3;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const wg = new THREE.PlaneGeometry(1.2, 1.5);
                    const wm = Math.random() > 0.4 ? windowMat : darkWindowMat;
                    const win = new THREE.Mesh(wg, wm);
                    win.position.set(
                        b.x + b.w / 2 + 0.01,
                        row * 3.5 + 2.5,
                        b.z - b.d / 2 + col * (b.d / 3) + b.d / 6
                    );
                    win.rotation.y = Math.PI / 2;
                    scene.add(win);
                }
            }
        });
    }

    // ── Traffic Lights ──────────────────────
    function createTrafficLights() {
        trafficLightMeshes = [];
        const positions = [
            { x:7, z:7 }, { x:-7, z:7 }, { x:7, z:-7 }, { x:-7, z:-7 },
            { x:47, z:7 }, { x:-47, z:7 },
        ];

        positions.forEach(pos => {
            const poleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 5, 8);
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(pos.x, 2.5, pos.z);
            scene.add(pole);

            const boxGeo = new THREE.BoxGeometry(0.6, 1.8, 0.5);
            const boxMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(pos.x, 5.5, pos.z);
            scene.add(box);

            const colors = [0xff2222, 0xffcc00, 0x00ff66];
            const lightGroup = [];
            colors.forEach((col, i) => {
                const lg = new THREE.SphereGeometry(0.18, 10, 10);
                const lm = new THREE.MeshBasicMaterial({ color: 0x333333 });
                const lmesh = new THREE.Mesh(lg, lm);
                lmesh.position.set(pos.x, 6.1 - i * 0.6, pos.z + 0.26);
                scene.add(lmesh);
                lightGroup.push({ mesh: lmesh, activeColor: col, phase: i });
            });
            trafficLightMeshes.push(...lightGroup);
        });
    }

    function updateTrafficLights() {
        const now = Date.now();
        const elapsed = now - lastTrafficUpdate;
        trafficTimer += elapsed;
        lastTrafficUpdate = now;

        if (trafficTimer >= trafficPhaseDur[trafficPhase]) {
            trafficTimer = 0;
            trafficPhase = (trafficPhase + 1) % 3;
        }

        trafficLightMeshes.forEach(l => {
            const on = l.phase === trafficPhase;
            l.mesh.material.color.setHex(on ? l.activeColor : 0x222222);
        });

        // Update HUD traffic light indicator
        const r = document.getElementById('tl-red');
        const y = document.getElementById('tl-yellow');
        const g = document.getElementById('tl-green');
        r.className = 'tl-light' + (trafficPhase === 0 ? ' red-on' : '');
        y.className = 'tl-light' + (trafficPhase === 1 ? ' yellow-on' : '');
        g.className = 'tl-light' + (trafficPhase === 2 ? ' green-on' : '');
    }

    // ── Road Signs ──────────────────────────
    function createRoadSigns() {
        const signs = [
            { x:10, z:25, type:'STOP', color:0xdd1111 },
            { x:-10, z:-25, type:'YIELD', color:0xee4400 },
            { x:22, z:12, type:'50', color:0xffffff, textColor:0x111111 },
            { x:-22, z:12, type:'KEEP\nLEFT', color:0x003399 },
            { x:12, z:-22, type:'NO\nOVERTAKE', color:0xff2222 },
        ];

        signs.forEach(s => {
            const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6);
            const poleMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(s.x, 1.25, s.z);
            scene.add(pole);

            const shape = s.type === 'STOP'
                ? new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8)
                : new THREE.BoxGeometry(1.4, 1.2, 0.08);
            const mat = new THREE.MeshLambertMaterial({ color: s.color });
            const sign = new THREE.Mesh(shape, mat);
            sign.position.set(s.x, 3, s.z);
            scene.add(sign);
        });
    }

    // ── Trees ───────────────────────────────
    function createTrees() {
        const positions = [];
        const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
        const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2d7a2d });

        for (let i = 0; i < (isMobile() ? 25 : 50); i++) {
            let x, z;
            do {
                x = (Math.random() - 0.5) * 220;
                z = (Math.random() - 0.5) * 220;
            } while (Math.abs(x) < 14 || Math.abs(z) < 14);

            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 3, 7), trunkMat);
            trunk.position.set(x, 1.5, z);

            const leaves = new THREE.Mesh(new THREE.SphereGeometry(2, 7, 7), leavesMat);
            leaves.position.set(x, 5, z);
            leaves.scale.y = 1.2;

            const group = new THREE.Group();
            group.add(trunk); group.add(leaves);
            group.castShadow = true;
            scene.add(group);
        }
    }

    // ── Parked Cars ─────────────────────────
    function createParkedCars() {
        const carColors = [0x1155cc, 0xcc4411, 0x11aa55, 0xddaa00, 0x888888, 0xaa1177];
        const spots = [
            { x:16, z:30 }, { x:16, z:36 }, { x:16, z:42 },
            { x:-16, z:-30 }, { x:-16, z:-36 },
            { x:30, z:16 }, { x:36, z:16 },
        ];
        spots.forEach((s, i) => {
            const carGrp = new THREE.Group();
            const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
            const bodyMat = new THREE.MeshLambertMaterial({ color: carColors[i % carColors.length] });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.5;

            const roofGeo = new THREE.BoxGeometry(1.7, 0.7, 2.2);
            const roofMat = new THREE.MeshLambertMaterial({ color: carColors[i % carColors.length] });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(0, 1.35, -0.3);

            carGrp.add(body); carGrp.add(roof);
            carGrp.position.set(s.x, 0, s.z);
            carGrp.castShadow = true;
            scene.add(carGrp);
            obstacles.push({ mesh: carGrp, radius: 3.2 });
        });
    }

    // ── Pedestrians ─────────────────────────
    function createPedestrians() {
        // Simple animated pedestrians
        const pedColors = [0xffddaa, 0x553311, 0xeeccaa, 0x774422];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = 12 + Math.random() * 4;
            const pedGrp = new THREE.Group();
            const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 8);
            const headGeo = new THREE.SphereGeometry(0.28, 8, 8);
            const mat = new THREE.MeshLambertMaterial({ color: pedColors[i % pedColors.length] });
            const body = new THREE.Mesh(bodyGeo, mat);
            body.position.y = 0.75;
            const head = new THREE.Mesh(headGeo, mat);
            head.position.y = 1.8;
            pedGrp.add(body); pedGrp.add(head);
            pedGrp.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
            pedGrp.userData = { angle, speed: 0.004 + Math.random() * 0.004, radius: r };
            scene.add(pedGrp);
            obstacles.push({ mesh: pedGrp, radius: 1.5, isPed: true });
        }
    }

    // ── Player Car ──────────────────────────
    function createCar() {
        car = new THREE.Group();

        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xdd2222 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4.2), bodyMat);
        body.position.y = 0.6;
        body.castShadow = true;
        car.add(body);

        const roofMat = new THREE.MeshLambertMaterial({ color: 0xbb1111 });
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.75, 2.2), roofMat);
        roof.position.set(0, 1.55, -0.3);
        car.add(roof);

        // Windshield
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x88aacc, transparent: true, opacity: 0.6 });
        const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), glassMat);
        ws.position.set(0, 1.45, 0.81);
        ws.rotation.x = 0.3;
        car.add(ws);

        // Headlights
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
        [-0.7, 0.7].forEach(side => {
            const hl = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), hlMat);
            hl.position.set(side, 0.7, 2.11);
            hl.userData.isHeadlight = true;
            car.add(hl);
        });

        // Number plate (KEN style)
        const plateMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), plateMat);
        plate.position.set(0, 0.5, 2.12);
        car.add(plate);

        // Wheels
        const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const rimMat   = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        const wheelPositions = [[-1.1, 0.4, 1.4], [1.1, 0.4, 1.4], [-1.1, 0.4, -1.4], [1.1, 0.4, -1.4]];
        wheelPositions.forEach(pos => {
            const wg = new THREE.Group();
            const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.35, 14), wheelMat);
            w.rotation.z = Math.PI / 2;
            const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 8), rimMat);
            rim.rotation.z = Math.PI / 2;
            wg.add(w); wg.add(rim);
            wg.position.set(...pos);
            wg.castShadow = true;
            car.add(wg);
        });

        car.position.set(0, 0, 0);
        scene.add(car);
    }

    // ── Animate Pedestrians ─────────────────
    function animatePedestrians() {
        obstacles.forEach(ob => {
            if (ob.isPed) {
                ob.mesh.userData.angle += ob.mesh.userData.speed;
                const a = ob.mesh.userData.angle;
                const r = ob.mesh.userData.radius;
                ob.mesh.position.x = Math.cos(a) * r;
                ob.mesh.position.z = Math.sin(a) * r;
                ob.mesh.rotation.y = -a + Math.PI / 2;
            }
        });
    }

    // ── Car Physics ─────────────────────────
    function updateCar(dt) {
        const accelKey = keys['w'] || keys['arrowup'];
        const brakeKey = keys['s'] || keys['arrowdown'];
        const leftKey  = keys['a'] || keys['arrowleft'];
        const rightKey = keys['d'] || keys['arrowright'];
        const hbKey    = keys[' '];

        // Acceleration / braking
        if (accelKey) {
            carSpeed = Math.min(carSpeed + ACCEL * dt, MAX_SPEED);
        } else if (brakeKey) {
            carSpeed = Math.max(carSpeed - BRAKE * dt, -MAX_SPEED * 0.4);
        } else {
            // Natural deceleration
            carSpeed *= Math.pow(0.97, dt);
            if (Math.abs(carSpeed) < 0.05) carSpeed = 0;
        }

        // Handbrake
        if (hbKey) carSpeed *= Math.pow(0.88, dt);

        // Gear
        if (carSpeed < -0.5) currentGear = 'R';
        else if (Math.abs(carSpeed) < 0.5) currentGear = 'N';
        else if (carSpeed < 22) currentGear = '1';
        else if (carSpeed < 40) currentGear = '2';
        else if (carSpeed < 60) currentGear = '3';
        else currentGear = '4';

        // Steering (speed-dependent)
        const turnFactor = Math.min(Math.abs(carSpeed) / MAX_SPEED, 1) * TURN_SPD;
        if (leftKey  && Math.abs(carSpeed) > 0.5) carRotation += turnFactor * (carSpeed > 0 ? 1 : -1);
        if (rightKey && Math.abs(carSpeed) > 0.5) carRotation -= turnFactor * (carSpeed > 0 ? 1 : -1);

        // Move
        const nx = car.position.x + Math.sin(carRotation) * carSpeed * 0.05 * dt;
        const nz = car.position.z + Math.cos(carRotation) * carSpeed * 0.05 * dt;

        // Boundary
        if (Math.abs(nx) < 145 && Math.abs(nz) < 145) {
            car.position.x = nx;
            car.position.z = nz;
        } else {
            carSpeed *= -0.5;
            triggerViolation('Out of bounds – road boundary exceeded!');
        }

        car.rotation.y = carRotation;

        // Spin wheels
        car.children.forEach(c => {
            if (c.children && c.children.length === 2) {
                c.children[0].rotation.x += carSpeed * 0.03 * dt;
            }
        });

        checkCollisions();
        checkTrafficViolations();
        updateCamera();
        updateHUD();
        updateMinimap();
    }

    // ── Collision Detection ─────────────────
    function checkCollisions() {
        const carPos = car.position;
        obstacles.forEach((ob, idx) => {
            const dist = carPos.distanceTo(ob.mesh.position);
            if (dist < ob.radius) {
                const now = Date.now();
                if (!collisionCooldown[idx] || now - collisionCooldown[idx] > 3000) {
                    collisionCooldown[idx] = now;
                    carSpeed *= -0.4;
                    triggerViolation(ob.isPed ? '⚠️ Pedestrian collision! -15 pts' : '💥 Collision! -10 pts');
                    score -= ob.isPed ? 15 : 10;
                    violations++;
                }
            }
        });

        // Building collision
        const carBox = new THREE.Box3().setFromObject(car).expandByScalar(-0.3);
        buildingBoxes.forEach((bb, idx) => {
            if (carBox.intersectsBox(bb)) {
                const now = Date.now();
                if (!collisionCooldown['b' + idx] || now - collisionCooldown['b' + idx] > 2000) {
                    collisionCooldown['b' + idx] = now;
                    carSpeed *= -0.3;
                    triggerViolation('💥 Hit a building! -10 pts');
                    score -= 10; violations++;
                }
            }
        });
    }

    // ── NTSA Violations ─────────────────────
    function checkTrafficViolations() {
        const speed = Math.abs(carSpeed) * 2;
        const now = Date.now();

        // Speed limit violation (scenario)
        if (currentScenarioIdx === 2 && speed > 52) {
            if (!lastViolationTime || now - lastViolationTime > 5000) {
                lastViolationTime = now;
                triggerViolation('🚔 Speeding! Over 50 km/h zone. -8 pts');
                score -= 8; violations++;
            }
        }

        // Check nearness to any traffic light
        nearTrafficLight = car.position.length() < 14; // near main intersection

        // Red light running
        if (nearTrafficLight && trafficPhase === 0 && speed > 2) {
            if (!lastViolationTime || now - lastViolationTime > 5000) {
                lastViolationTime = now;
                triggerViolation('🚦 Red light violation! -15 pts');
                score -= 15; violations++;
            }
        }
    }

    // ── Camera ──────────────────────────────
    function updateCamera() {
        const pos = car.position;
        switch(cameraMode) {
            case 0: // Follow
                camera.position.set(
                    pos.x - Math.sin(carRotation) * 14,
                    pos.y + 7,
                    pos.z - Math.cos(carRotation) * 14
                );
                camera.lookAt(new THREE.Vector3(pos.x, pos.y + 1, pos.z));
                break;
            case 1: // Top-down
                camera.position.set(pos.x, 45, pos.z);
                camera.lookAt(pos);
                break;
            case 2: // First-person
                camera.position.set(
                    pos.x + Math.sin(carRotation) * 1.5,
                    pos.y + 1.8,
                    pos.z + Math.cos(carRotation) * 1.5
                );
                camera.lookAt(new THREE.Vector3(
                    pos.x + Math.sin(carRotation) * 20,
                    pos.y + 1.5,
                    pos.z + Math.cos(carRotation) * 20
                ));
                break;
        }
    }

    // ── HUD ─────────────────────────────────
    function updateHUD() {
        const kmh = Math.abs(Math.round(carSpeed * 2));
        const speedEl = document.getElementById('speed-val');
        speedEl.textContent = kmh;
        speedEl.style.color = kmh > 50 ? '#ff4444' : '';
        document.getElementById('gear-val').textContent = currentGear;
        document.getElementById('score-val').textContent = Math.max(0, score);
        const vEl = document.getElementById('violations-val');
        vEl.textContent = violations;
        vEl.style.color = violations > 0 ? '#ff4444' : '';
    }

    // ── Minimap ─────────────────────────────
    function initMinimap() {
        const mc = document.getElementById('minimap');
        const mSize = mc.width;
        const ctx = mc.getContext('2d');
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, mSize, mSize);
    }

    function updateMinimap() {
        const mc = document.getElementById('minimap');
        const mSize = mc.width;
        const ctx = mc.getContext('2d');
        const scale = mSize / 300;
        const cx = mSize / 2, cy = mSize / 2;

        ctx.fillStyle = '#0a1e10';
        ctx.fillRect(0, 0, mSize, mSize);

        // Roads
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 8 * scale;
        ctx.lineCap = 'butt';

        // N-S road
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, mSize); ctx.stroke();
        // E-W road
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(mSize, cy); ctx.stroke();

        // Secondary roads
        ctx.lineWidth = 5 * scale;
        ctx.strokeStyle = '#333';
        [[40, true], [-40, true], [40, false], [-40, false]].forEach(([off, horiz]) => {
            const pxOff = off * scale;
            ctx.beginPath();
            if (horiz) { ctx.moveTo(cx + pxOff, 0); ctx.lineTo(cx + pxOff, mSize); }
            else { ctx.moveTo(0, cy + pxOff); ctx.lineTo(mSize, cy + pxOff); }
            ctx.stroke();
        });

        // Car dot
        const carPx = cx + car.position.x * scale;
        const carPz = cy + car.position.z * scale;
        ctx.save();
        ctx.translate(carPx, carPz);
        ctx.rotate(-carRotation);
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.moveTo(0, -5 * scale);
        ctx.lineTo(3 * scale, 4 * scale);
        ctx.lineTo(-3 * scale, 4 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Traffic light phase dot
        const tlColors = ['#ff3333', '#ffcc00', '#00ff88'];
        ctx.fillStyle = tlColors[trafficPhase];
        ctx.beginPath();
        ctx.arc(cx + 7 * scale, cy + 7 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Violations & Tips ───────────────────
    function triggerViolation(msg) {
        score = Math.max(0, score);
        const el = document.getElementById('violation-alert');
        document.getElementById('violation-msg').textContent = msg;
        el.classList.remove('hidden');
        clearTimeout(alertTimeout);
        alertTimeout = setTimeout(() => el.classList.add('hidden'), 3000);
    }

    function showRandomTip() {
        let idx;
        do { idx = Math.floor(Math.random() * NTSA_TIPS.length); }
        while (idx === lastTipIdx);
        lastTipIdx = idx;

        document.getElementById('tip-text').textContent = NTSA_TIPS[idx];
        const tip = document.getElementById('ntsa-tip');
        tip.classList.remove('hidden');
        clearTimeout(tipTimeout);
        tipTimeout = setTimeout(() => {
            tip.classList.add('hidden');
            setTimeout(showRandomTip, 20000);
        }, 6000);
    }

    // ── Scenarios ───────────────────────────
    function showScenario(idx) {
        currentScenarioIdx = idx;
        const sc = SCENARIOS[idx] || SCENARIOS[0];
        document.getElementById('scenario-label').textContent = sc.name;
        document.getElementById('sp-title').textContent = sc.name;
        document.getElementById('sp-body').textContent = sc.desc;
        if (sc.tip) {
            document.getElementById('tip-text').textContent = sc.tip;
            document.getElementById('ntsa-tip').classList.remove('hidden');
            clearTimeout(tipTimeout);
            tipTimeout = setTimeout(() => {
                document.getElementById('ntsa-tip').classList.add('hidden');
            }, 8000);
        }
    }

    // ── Actions ─────────────────────────────
    function cycleCamera() {
        cameraMode = (cameraMode + 1) % 3;
    }

    function honk() {
        document.getElementById('ind-horn').style.opacity = '1';
        setTimeout(() => document.getElementById('ind-horn').style.opacity = '0.2', 600);
    }

    function toggleLights() {
        lightsOn = !lightsOn;
        const ind = document.getElementById('ind-light');
        ind.classList.toggle('on', lightsOn);
        car.children.forEach(c => {
            if (c.userData && c.userData.isHeadlight) {
                c.material.color.setHex(lightsOn ? 0xffffff : 0xffffee);
            }
        });
    }

    // ── Resize ──────────────────────────────
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ── Animation Loop ──────────────────────
    let lastFrame = performance.now();
    function animate() {
        animId = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min((now - lastFrame) / 16.67, 3); // target 60fps, cap delta
        lastFrame = now;

        updateCar(dt);
        updateTrafficLights();
        animatePedestrians();
        renderer.render(scene, camera);
    }

    // ── Utils ────────────────────────────────
    function isMobile() {
        return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent)
            || window.innerWidth < 768;
    }

    // ── Public API ───────────────────────────
    function start() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('minimap-wrap').classList.remove('hidden');
        document.getElementById('traffic-status').classList.remove('hidden');
        document.getElementById('scenario-panel').classList.remove('hidden');

        if (isMobile()) {
            document.getElementById('mobile-controls').classList.remove('hidden');
            document.getElementById('mobile-note').style.display = 'block';
        }
        init();
    }

    function restart() {
        document.getElementById('scenario-complete').classList.add('hidden');
        score = 100; violations = 0; carSpeed = 0;
        car.position.set(0, 0, 0);
        carRotation = 0;
        showScenario(currentScenarioIdx);
    }

    function nextScenario() {
        document.getElementById('scenario-complete').classList.add('hidden');
        const next = (currentScenarioIdx + 1) % SCENARIOS.length;
        showScenario(next);
    }

    return { start, restart, nextScenario, cycleCamera, honk, toggleLights };
})();
