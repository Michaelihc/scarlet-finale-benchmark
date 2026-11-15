window.createStoryboard = function (api) {
  const { THREE, scene, camera, effects, landmarks, groundY } = api;
  const V = THREE.Vector3;
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ramp = (t, a, b) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const root = new THREE.Group();
  effects.add(root);

  const previousLights = [];
  scene.traverse(o => { if (o.isLight) previousLights.push([o, o.intensity]); });
  scene.background = new THREE.Color(0x101b2b);
  scene.fog = new THREE.FogExp2(0x152235, 0.0032);
  const ambient = new THREE.HemisphereLight(0xbedbff, 0x242335, 1.25);
  const sun = new THREE.DirectionalLight(0xd1e6ff, 1.7);
  sun.position.set(-15, 50, -25);
  root.add(ambient, sun);
  const redLight = new THREE.PointLight(0xff183c, 100, 65, 1.6);
  redLight.position.copy(landmarks.rift);
  root.add(redLight);
  const blueLight = new THREE.PointLight(0x65ddff, 60, 65, 1.5);
  blueLight.position.set(-6, 25, -14);
  root.add(blueLight);

  const basic = (color, opacity = 1, additive = false) => new THREE.MeshBasicMaterial({
    color, transparent: opacity < 1 || additive, opacity, depthWrite: !additive && opacity === 1,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide
  });
  const solid = (color, emissive = 0x000000) => new THREE.MeshStandardMaterial({
    color, emissive, roughness: 0.75, metalness: 0.25
  });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const sphereGeo = new THREE.IcosahedronGeometry(1, 1);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
  const coneGeo = new THREE.ConeGeometry(1, 1, 7);
  const torusGeo = new THREE.TorusGeometry(1, 0.018, 6, 100);
  function mesh(geo, mat, parent, pos, scale) {
    const o = new THREE.Mesh(geo, mat);
    if (pos) o.position.set(...pos);
    if (scale) o.scale.set(...scale);
    (parent || root).add(o);
    return o;
  }
  function ring(parent, radius, mat, pos, horizontal) {
    const o = mesh(torusGeo, mat, parent, pos, [radius, radius, radius]);
    if (horizontal) o.rotation.x = PI / 2;
    return o;
  }
  const temp = new V(), temp2 = new V(), up = new V(0, 1, 0);
  function connect(o, a, b, thickness) {
    temp.subVectors(b, a);
    o.position.copy(a).addScaledVector(temp, 0.5);
    o.quaternion.setFromUnitVectors(up, temp2.copy(temp).normalize());
    o.scale.set(thickness, temp.length(), thickness);
  }
  function yAt(x, z, fallback = 1) {
    const y = groundY(x, z);
    return Number.isFinite(y) ? y : fallback;
  }
  function tag(text, color, width = 4.4) {
    const canvas = document.createElement('canvas');
    canvas.width = 768; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(6,13,23,0.88)';
    ctx.fillRect(0, 0, 768, 128);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 6, 128);
    ctx.fillRect(24, 100, 720, 2);
    ctx.font = '600 33px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 27, 57);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(width, width / 6, 1);
    root.add(sprite);
    return sprite;
  }

  // Vertical, primitive-built aperture. The real Gate A remains directly beneath it.
  const rift = new THREE.Group();
  root.add(rift);
  rift.position.copy(landmarks.rift);
  rift.rotation.y = 0.23;
  const blackMat = basic(0x040108);
  mesh(new THREE.CircleGeometry(1, 96), blackMat, rift, [0, 0, 0.12], [5.8, 8.4, 1]);
  const riftRings = [];
  for (let i = 0; i < 5; i++) {
    const mat = basic(i === 0 ? 0xffc0ab : 0xff143a, 0.7 / (1 + i * 0.5), true);
    const o = mesh(torusGeo, mat, rift, [0, 0, -0.05 - i * 0.015], [6 + i * 0.15, 8.7 + i * 0.2, 4 - i * 0.45]);
    riftRings.push(o);
  }
  const fissures = new THREE.Group();
  rift.add(fissures);
  for (let i = 0; i < 36; i++) {
    const a = i * TAU / 36;
    const length = 0.4 + hash(i) * 1.4;
    const o = mesh(boxGeo, basic(0xff234b, 0.65, true), fissures,
      [Math.cos(a) * 6.45, Math.sin(a) * 9.2, -0.15], [0.045, length, 0.04]);
    o.rotation.z = a - PI / 2;
  }
  const king = new THREE.Group();
  king.position.set(0, -0.7, -0.6);
  rift.add(king);
  const kingMat = solid(0x100911, 0x37020d);
  const kingEdge = basic(0xff3451, 0.8, true);
  mesh(coneGeo, kingMat, king, [0, -2.4, 0], [3.1, 7.5, 0.8]).rotation.z = PI;
  mesh(sphereGeo, kingMat, king, [0, 2.1, 0], [1.15, 1.7, 0.6]);
  for (const sign of [-1, 1]) {
    const arm = mesh(coneGeo, kingMat, king, [sign * 2.4, -0.3, 0], [0.65, 5, 0.7]);
    arm.rotation.z = sign * 0.6;
    mesh(boxGeo, kingEdge, king, [sign * 0.43, 2.35, -0.6], [0.5, 0.075, 0.04]).rotation.z = sign * -0.15;
    for (let j = 0; j < 3; j++) {
      const rib = mesh(boxGeo, kingEdge, king, [sign * 0.9, 0.9 - j * 0.55, -0.8], [1.55, 0.045, 0.035]);
      rib.rotation.z = sign * -0.28;
    }
  }
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 0.48;
    const spike = mesh(coneGeo, basic(0xa91c31), king, [x, 4.1 + (1 - Math.abs(i - 3) / 4) * 0.4, 0], [0.24, 1.6 + hash(i + 40), 0.25]);
    spike.rotation.z = -x * 0.22;
    mesh(sphereGeo, kingEdge, king, [x, 4.8 + (1 - Math.abs(i - 3) / 4) * 0.4, -0.1], [0.07, 0.1, 0.07]);
  }
  const riftTag = tag('GATE A  /  ONTOLOGICAL BREACH', '#ff6077', 9);
  riftTag.position.set(22, 35.5, -3);

  // Ritual markings and the underground-loss shock front.
  const gate = landmarks.gateA.clone();
  const ritual = new THREE.Group();
  root.add(ritual);
  ritual.position.copy(gate).add(new V(-2, 0.12, -4));
  const ritualMat = basic(0xff173f, 0.8, true);
  ring(ritual, 3.4, ritualMat, [0, 0, 0], true);
  ring(ritual, 2.8, ritualMat, [0, 0.01, 0], true);
  for (let i = 0; i < 7; i++) {
    const a = i * TAU / 7, b = (i + 3) * TAU / 7;
    const p = new V(Math.cos(a) * 2.8, 0.02, Math.sin(a) * 2.8);
    const q = new V(Math.cos(b) * 2.8, 0.02, Math.sin(b) * 2.8);
    const o = mesh(cylinderGeo, ritualMat, ritual);
    connect(o, p, q, 0.025);
  }
  const shocks = [];
  for (let i = 0; i < 4; i++) {
    shocks.push(ring(root, 1, basic(0xff3656, 0.5, true), [gate.x, 2 + i * 0.15, gate.z], true));
  }
  const lostTag = tag('FACILITY  /  SIGNAL LOST', '#ff6077', 7);
  lostTag.position.set(8.72, 7, 10.07);

  // Scranton Reality Anchors: compact pylons, not replacement scenery.
  const anchorLocations = landmarks.anchorSites || [new V(10, 1.0545, -9), new V(-3, 1.4137, -15), new V(13, 6.7817, -20)];
  const anchors = anchorLocations.map((site, i) => {
    const p = site.isVector3 ? site.clone() : new V(...site);
    const g = new THREE.Group();
    g.position.copy(p);
    root.add(g);
    const metal = solid(0x172938), pale = solid(0xa7c2ce);
    mesh(boxGeo, metal, g, [0, 0.18, 0], [1.5, 0.35, 1.5]);
    mesh(cylinderGeo, pale, g, [0, 1.1, 0], [0.32, 1.8, 0.32]);
    for (let j = 0; j < 3; j++) {
      const a = TAU * j / 3;
      mesh(boxGeo, metal, g, [Math.cos(a) * 0.5, 1.3, Math.sin(a) * 0.5], [0.18, 2.1, 0.18]);
    }
    const glowMat = basic(0x65edff, 0.8, true);
    const core = mesh(cylinderGeo, glowMat, g, [0, 1.5, 0], [0.16, 1.5, 0.16]);
    const halo = ring(g, 1.55, glowMat, [0, 0.05, 0], true);
    const hoops = [];
    for (let j = 0; j < 3; j++) hoops.push(ring(g, 0.68, glowMat, [0, 0.7 + j * 0.55, 0], true));
    const beamMat = basic(0x6beaff, 0.2, true);
    const beam = mesh(cylinderGeo, beamMat);
    const target = new V(22 + (i - 1) * 3.5, 18 + (i === 1 ? 11 : 0), -3.5);
    connect(beam, p.clone().add(new V(0, 2.5, 0)), target, 0.045);
    const label = tag('SRA 0' + (i + 1) + '  /  LOCK', '#82eaff', 4.6);
    label.position.copy(p).add(new V(0, 3.5, 0));
    return { g, glowMat, core, halo, hoops, beam, beamMat, label, start: 88 + i * 11 };
  });

  // Coalition soldiers and red-robed opponents use shared low-cost primitives.
  const dark = solid(0x111d29), skin = solid(0xb6a99b), gunMat = solid(0x11141b);
  const palettes = [
    { coat: solid(0x254d76), stripe: basic(0x5fceff), color: '#76d9ff', name: 'MTF / EPSILON', entry: [-19, 1.42, -14] },
    { coat: solid(0xb6cbd3), stripe: basic(0xc8f6ff), color: '#d2f6ff', name: 'GOC / STRIKE TEAM', entry: [-15, -0.17, -20] },
    { coat: solid(0x455339), stripe: basic(0xd2be6f), color: '#e0cd89', name: 'CHAOS / ALLIED', entry: [17, -2.68, -35] }
  ];
  function soldier(palette, cult = false) {
    const g = new THREE.Group();
    const limbs = [];
    const cloth = cult ? solid(0x691127) : palette.coat;
    if (cult) {
      mesh(coneGeo, cloth, g, [0, 0.65, 0], [0.46, 1.3, 0.4]);
      mesh(coneGeo, cloth, g, [0, 1.7, 0], [0.31, 0.65, 0.3]);
      mesh(boxGeo, basic(0xff4762), g, [0, 1.67, -0.25], [0.22, 0.04, 0.04]);
      mesh(cylinderGeo, dark, g, [0.49, 1.1, -0.05], [0.035, 2.2, 0.035]);
      mesh(sphereGeo, basic(0xff2348, 1, true), g, [0.49, 2.2, -0.05], [0.12, 0.17, 0.12]);
    } else {
      mesh(boxGeo, cloth, g, [0, 1.12, 0], [0.59, 0.68, 0.34]);
      mesh(boxGeo, dark, g, [0, 1.13, -0.19], [0.43, 0.48, 0.12]);
      mesh(sphereGeo, skin, g, [0, 1.64, 0], [0.2, 0.24, 0.2]);
      mesh(sphereGeo, cloth, g, [0, 1.79, 0], [0.26, 0.18, 0.26]);
      mesh(boxGeo, palette.stripe, g, [0, 1.68, -0.205], [0.3, 0.08, 0.055]);
      for (const s of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(s * 0.16, 0.78, 0);
        mesh(boxGeo, dark, leg, [0, -0.36, 0], [0.22, 0.72, 0.25]);
        g.add(leg); limbs.push(leg);
        const arm = mesh(boxGeo, cloth, g, [s * 0.36, 1.14, -0.16], [0.19, 0.5, 0.2]);
        arm.rotation.x = -0.65;
      }
      mesh(boxGeo, gunMat, g, [0.16, 1.16, -0.53], [0.12, 0.16, 0.72]);
    }
    root.add(g);
    return { g, limbs };
  }
  const actors = [], factionTags = [];
  function makePath(points) {
    const arr = [];
    for (let s = 0; s < points.length - 1; s++) {
      for (let j = 0; j < 12; j++) {
        const f = j / 12, x = mix(points[s][0], points[s + 1][0], f), z = mix(points[s][1], points[s + 1][1], f);
        arr.push(new V(x, yAt(x, z), z));
      }
    }
    const last = points[points.length - 1];
    arr.push(new V(last[0], yAt(last[0], last[1]), last[1]));
    return arr;
  }
  const humanPaths = [
    [[-19, -14], [-12, -15], [-6, -13], [3, -10]],
    [[-15, -20], [-9, -19], [-3, -15], [7, -12]],
    [[17, -35], [15, -27], [13, -20], [11, -14]]
  ].map(makePath);
  for (let f = 0; f < 3; f++) {
    const label = tag(palettes[f].name, palettes[f].color, 5);
    const entry = palettes[f].entry;
    label.position.set(entry[0], entry[1] + 4.6, entry[2]);
    factionTags.push(label);
    for (let i = 0; i < 12; i++) {
      const actor = soldier(palettes[f]);
      const muzzle = mesh(sphereGeo, basic(0xffedb1, 1, true), actor.g, [0.16, 1.16, -0.94], [0.13, 0.13, 0.3]);
      const tracer = mesh(cylinderGeo, basic(f === 2 ? 0xffd78e : 0x9de7ff, 0.65, true));
      actors.push({ ...actor, muzzle, tracer, faction: f, index: i, path: humanPaths[f], start: 41 + f * 5 + Math.floor(i / 4) * 21 + (i % 4) * 0.8 });
    }
  }
  const cultPath = makePath([[18.8, -1], [16, -5], [12, -8], [6, -10]]);
  const cultists = [];
  for (let i = 0; i < 21; i++) {
    const actor = soldier(null, true);
    cultists.push({ ...actor, index: i, path: cultPath });
  }
  // SCP silhouettes: a towering pale humanoid and a low, heavy quadruped.
  const scps = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Group();
    root.add(g);
    const mat = solid(i === 1 ? 0x343d37 : 0x9d9c99, 0x23070d);
    if (i === 1) {
      mesh(sphereGeo, mat, g, [0, 0.8, 0], [1.25, 0.65, 2]);
      mesh(coneGeo, mat, g, [0, 0.8, 2.1], [0.5, 2.6, 0.5]).rotation.x = PI / 2;
      for (const x of [-0.9, 0.9]) for (const z of [-1, 1]) mesh(boxGeo, mat, g, [x, 0.4, z], [0.4, 0.8, 0.6]);
      mesh(sphereGeo, mat, g, [0, 1, -1.8], [0.7, 0.6, 0.8]);
    } else {
      mesh(sphereGeo, mat, g, [0, 1.8, 0], [0.45, 0.9, 0.3]);
      mesh(sphereGeo, mat, g, [0, 2.9, -0.08], [0.3, 0.4, 0.3]);
      for (const s of [-1, 1]) {
        mesh(boxGeo, mat, g, [s * 0.25, 0.6, 0], [0.18, 1.3, 0.2]);
        const arm = mesh(boxGeo, mat, g, [s * 0.65, 1.4, 0], [0.16, 1.9, 0.18]);
        arm.rotation.z = s * 0.18;
      }
    }
    mesh(boxGeo, basic(0xff324e), g, [0, i === 1 ? 1.1 : 2.95, i === 1 ? -2.5 : -0.34], [0.25, 0.05, 0.04]);
    scps.push(g);
  }

  // Repeated transfer streaks make rift respawning unambiguous.
  const spawnStreaks = [];
  for (let i = 0; i < 12; i++) {
    const o = mesh(cylinderGeo, basic(0xff3051, 0.65, true));
    spawnStreaks.push(o);
  }

  // GOC thaumaturgic strike disk, constructed only from rings, ticks and chords.
  const diskCenter = new V(-7, 39, -14);
  const disk = new THREE.Group();
  root.add(disk);
  disk.position.copy(diskCenter);
  const diskMat = basic(0x82e8ff, 0.9, true);
  const goldMat = basic(0xffe1a3, 0.8, true);
  const diskRotors = [];
  ring(disk, 8, diskMat, [0, 0, 0], true);
  ring(disk, 7.6, diskMat, [0, 0.06, 0], true);
  ring(disk, 5.6, goldMat, [0, 0.03, 0], true);
  ring(disk, 2.1, diskMat, [0, 0, 0], true);
  mesh(new THREE.CircleGeometry(8, 96), basic(0x69d9ff, 0.035, true), disk).rotation.x = -PI / 2;
  for (let k = 0; k < 2; k++) {
    const rotor = new THREE.Group();
    disk.add(rotor); diskRotors.push(rotor);
    const count = k === 0 ? 48 : 12, radius = k === 0 ? 6.7 : 4.2;
    for (let i = 0; i < count; i++) {
      const a = i * TAU / count;
      const o = mesh(boxGeo, k ? goldMat : diskMat, rotor,
        [Math.cos(a) * radius, 0.1, Math.sin(a) * radius],
        [k ? 0.09 : 0.06, 0.06, k ? 1.2 : (i % 4 === 0 ? 0.7 : 0.28)]);
      o.rotation.y = -a + PI / 2;
    }
    if (k) for (let j = 0; j < 6; j++) {
      const a = j * TAU / 6, b = (j + 2) * TAU / 6;
      const o = mesh(cylinderGeo, goldMat, rotor);
      connect(o, new V(Math.cos(a) * 5.5, 0.05, Math.sin(a) * 5.5), new V(Math.cos(b) * 5.5, 0.05, Math.sin(b) * 5.5), 0.022);
    }
  }
  const diskTag = tag('GOC / THAUMATURGIC STRIKE', '#b7f3ff', 10);
  diskTag.position.set(-7, 44, -14);

  // A downward tangent becomes an upward tangent at the breach: the central action.
  const strikeCurve = new THREE.CubicBezierCurve3(
    diskCenter.clone(), new V(-9, 2, -16), new V(17, 9, -13), landmarks.rift.clone()
  );
  const beamLayers = [];
  for (const [radius, color, opacity] of [[0.72, 0x32aaff, 0.10], [0.34, 0x63dcff, 0.35], [0.13, 0xecfdff, 1]]) {
    const geo = new THREE.TubeGeometry(strikeCurve, 160, radius, 8, false);
    const mat = basic(color, opacity, true);
    const o = mesh(geo, mat);
    beamLayers.push(o);
  }
  const straight = mesh(cylinderGeo, basic(0xbaf4ff, 0.8, true));
  connect(straight, diskCenter, new V(-7, 19, -14), 0.14);
  const stream = [];
  const streamGeo = new THREE.IcosahedronGeometry(1, 0);
  for (let i = 0; i < 70; i++) stream.push(mesh(streamGeo, basic(i % 3 ? 0xc3f8ff : 0xffdfa1, 0.8, true), null, null, [0.07, 0.07, 0.28]));
  const curvePoints = strikeCurve.getPoints(500);
  const bendTag = tag('TRAJECTORY  /  CAPTURED', '#ffbb94', 7);
  bendTag.position.set(0, 15, -16);

  // Storm particles and segmented lightning use fixed buffers, updated on seek.
  const count = 700, particlePositions = new Float32Array(count * 3);
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xff4665, size: 0.12, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  const particles = new THREE.Points(particleGeo, particleMat);
  root.add(particles);
  const stormRings = [];
  for (let i = 0; i < 7; i++) {
    const geo = new THREE.TorusGeometry(11 + i * 0.8, 0.025 + i * 0.003, 4, 120, PI * (0.6 + hash(i) * 0.9));
    const o = mesh(geo, basic(i % 2 ? 0xc45279 : 0x639bbd, 0.25, true));
    o.position.copy(landmarks.rift);
    stormRings.push(o);
  }
  const bolts = [];
  for (let i = 0; i < 18; i++) {
    const positions = new Float32Array(25 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: i % 3 ? 0xff466c : 0xc0f6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    root.add(line);
    bolts.push({ line, positions, index: i });
  }
  const shards = [];
  const shardMat = basic(0xff2e55, 0.45, true);
  const shardGeo = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1, 0));
  for (let i = 0; i < 32; i++) {
    const o = new THREE.LineSegments(shardGeo, new THREE.LineBasicMaterial({ color: 0xff3557, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
    root.add(o); shards.push(o);
  }

  const shots = [
    { a: 0, b: 12, p: [0, 10, -18], q: [20, 13, 0], e: [1.5, 11, -19], f: 60, title: '01 / THE RITUAL IS COMPLETE', text: 'Gate A. The seventh seal is broken; the finale begins here.' },
    { a: 12, b: 25.681, p: [1.5, 11, -19], q: [22, 22, -3], e: [-2, 13, -22], f: 58, title: '02 / A KING WITHOUT A WORLD', text: 'A dimensional wound opens above Gate A. The Scarlet King begins to manifest.' },
    { a: 25.681, b: 44.397, p: [18, 60, -22], q: [4, 4, -7], e: [15, 57, -25], f: 58, title: '03 / ALL SUBLEVELS LOST', text: 'The underground facility is wiped out. Only the Surface remains.' },
    { a: 44.397, b: 66.688, p: [-15, 12, -25], q: [8, 4, -5], e: [-12, 13, -27], f: 56, title: '04 / ONE ENEMY. ONE OBJECTIVE.', text: 'MTF, GOC and Chaos waves converge. Allied fire is coordinated against the cult only.' },
    { a: 66.688, b: 92.346, p: [-3, 13, -24], q: [19, 12, -2], e: [-5, 15, -26], f: 59, title: '05 / THE BREACH FEEDS THEM', text: 'Cultists return through the rift. SCP entities fight alongside them; attrition cannot win this.' },
    { a: 92.346, b: 112.013, p: [-12, 13, -25], q: [7, 5, -12], e: [-9, 14, -27], f: 52, title: '06 / ESTABLISH THE ANCHORS', text: 'Three Scranton Reality Anchors form a containment network while the coalition holds the approaches.' },
    { a: 112.013, b: 130.357, p: [17, 54, -24], q: [7, 11, -8], e: [12, 52, -27], f: 57, title: '07 / HOLD THE TRIANGLE', text: 'Shared objective: protect every anchor and keep the Gate A firing solution open.' },
    { a: 130.357, b: 157.687, p: [-17, 28, -40], q: [5, 27, -7], e: [-14, 30, -40], f: 62, title: '08 / THAUMATURGIC AUTHORIZATION', text: 'The GOC strike disk assembles above the Surface. Anchor telemetry supplies its reality reference.' },
    { a: 157.687, b: 180.349, p: [-15, 28, -39], q: [5, 25, -7], e: [-18, 29, -40], f: 62, title: '09 / FINAL ACTION', text: 'The GOC releases its strike. The descending energy encounters the breach’s gravitational pull.' },
    { a: 180.349, b: 203.012, p: [-20, 27, -42], q: [7, 25, -7], e: [-17, 29, -43], f: 59, title: '10 / THE STRIKE BENDS', text: 'Not a ground impact: the thaumaturgic stream turns upward and pours directly into the rift.' },
    { a: 203.012, b: 224, p: [-16, 31, -43], q: [8, 26, -6], e: [-12, 32, -43], f: 62, title: '11 / REALITY AT THE LIMIT', text: 'Lightning bridges disk and breach. Red disturbances and storm bands overwhelm the battlefield.' },
    { a: 224, b: 244, p: [-15, 29, -43], q: [8, 26, -6], e: [-18, 32, -45], f: 64 },
    { a: 244, b: 263.2214, p: [18, 58, -25], q: [7, 8, -8], e: [14, 60, -25], f: 59 }
  ];
  let lastFov = -1;
  const camP = new V(), camQ = new V();
  const actorSource = new V(), actorTarget = new V();
  function pathPosition(path, fraction, destination) {
    const f = clamp(fraction) * (path.length - 1);
    const a = Math.min(path.length - 2, Math.floor(f));
    return destination.copy(path[a]).lerp(path[a + 1], f - a);
  }
  function update(time, ending) {
    const t = clamp(time, 0, 263.2214), human = ending !== 'cult';
    const open = ramp(t, 3.344, 25.681);
    const resolution = ramp(t, 224, 249);
    const sealed = human ? ramp(t, 230, 249) : 0;
    const collapse = human ? 0 : ramp(t, 228, 256);
    const combat = ramp(t, 41, 56) * (1 - ramp(t, 235, 250));
    const bend = ramp(t, 172.849, 183.02);
    const beamPower = ramp(t, 157.687, 166) * (1 - ramp(t, human ? 239 : 241, human ? 250 : 249));
    const storm = (0.15 + 0.85 * ramp(t, 150, 203)) * open * (1 - sealed);
    let shot = shots[shots.length - 1];
    for (let i = 0; i < shots.length; i++) if (t >= shots[i].a && t < shots[i].b) { shot = shots[i]; break; }
    const u = ramp(t, shot.a, shot.b);
    camP.set(...shot.p).lerp(temp.set(...shot.e), u);
    camQ.set(...shot.q);
    if (t >= 244 && !human) {
      camP.set(-18, 33 + 7 * ramp(t, 244, 263), -45);
      camQ.set(12, 28, -6);
    }
    camera.position.copy(camP);
    camera.lookAt(camQ);
    if (lastFov !== shot.f) { camera.fov = shot.f; camera.updateProjectionMatrix(); lastFov = shot.f; }

    const dawn = human ? ramp(t, 244, 262) : 0;
    scene.background.setRGB(mix(0.035, 0.16, dawn) * (1 - collapse * 0.85), mix(0.061, 0.23, dawn) * (1 - collapse * 0.92), mix(0.10, 0.31, dawn) * (1 - collapse * 0.93));
    scene.fog.color.copy(scene.background);
    scene.fog.density = 0.0032 + collapse * 0.009;
    previousLights.forEach(([o, intensity]) => { o.intensity = intensity * (1 - collapse * 0.85); });
    ambient.intensity = (1.25 + dawn * 0.6) * (1 - collapse * 0.9);
    sun.intensity = (1.7 + dawn * 0.6) * (1 - collapse * 0.94);
    redLight.intensity = (65 + 40 * Math.sin(t * 2.3) ** 2 + storm * 90) * open * (1 - sealed);
    blueLight.intensity = beamPower * 130 + dawn * 20;

    const riftScale = Math.max(0.001, open * (1 - sealed) * (1 + collapse * 2.8));
    rift.visible = open > 0 && sealed < 0.999;
    rift.scale.setScalar(riftScale);
    rift.position.set(22 - collapse * 7, 24 + collapse * 4, -3);
    rift.rotation.z = Math.sin(t * 0.45) * 0.018 + collapse * 0.3;
    riftRings.forEach((o, i) => {
      const pulse = 1 + 0.012 * Math.sin(t * (2.1 + i * 0.12) + i);
      o.scale.set((6 + i * 0.15) * pulse, (8.7 + i * 0.2) / pulse, 4 - i * 0.45);
      o.material.opacity = (0.65 + 0.3 * Math.sin(t * 4 + i) ** 2) / (1 + i * 0.5);
    });
    fissures.rotation.z = t * 0.035;
    king.scale.setScalar(Math.max(0.001, ramp(t, 15, 37)));
    king.position.y = mix(-4, -0.7, ramp(t, 15, 37)) + 0.12 * Math.sin(t * 0.7);
    riftTag.visible = t > 15 && t < 130;
    ritual.visible = t < 62;
    ritualMat.opacity = (0.5 + 0.4 * Math.sin(t * 1.6) ** 2) * (1 - ramp(t, 36, 62));
    ritual.rotation.y = t * 0.04;
    lostTag.visible = t >= 28 && t < 44.397;
    shocks.forEach((o, i) => {
      const p = clamp((t - 25.681 - i * 1.8) / 8);
      o.visible = p > 0 && p < 1;
      o.scale.setScalar(1 + p * 48);
      o.material.opacity = (1 - p) * 0.7;
    });

    anchors.forEach((a, i) => {
      const built = ramp(t, a.start, a.start + 10);
      a.g.visible = t > a.start - 5;
      a.g.scale.y = Math.max(0.01, ramp(t, a.start - 5, a.start + 3));
      a.glowMat.opacity = built * (0.6 + 0.4 * Math.sin(t * 2 + i) ** 2) * (1 - collapse);
      a.halo.rotation.z = t * 0.22;
      a.hoops.forEach((o, j) => { o.scale.setScalar(0.68 + Math.sin(t * 2 + j) * 0.05); });
      a.beam.visible = built > 0 && t < 250;
      a.beamMat.opacity = built * (0.12 + beamPower * 0.22) * (1 - resolution * 0.85);
      a.label.visible = t > a.start && t < 157;
    });
    factionTags.forEach((o, i) => { o.visible = t > 44 + i * 5 && t < 77; });

    actors.forEach(a => {
      const age = t - a.start;
      a.g.visible = age >= 0 && collapse < 0.95;
      const progress = ramp(age, 0, 36 + a.index * 0.5);
      pathPosition(a.path, progress * (0.68 + (a.index % 4) * 0.085), actorSource);
      const lateral = (a.index % 4 - 1.5) * 0.85;
      a.g.position.copy(actorSource);
      a.g.position.x += lateral;
      a.g.position.z += Math.floor(a.index / 4) * 0.65;
      a.g.rotation.y = Math.atan2(a.g.position.x - 18, a.g.position.z + 3);
      const walking = age > 0 && age < 38;
      a.limbs.forEach((l, j) => { l.rotation.x = walking ? Math.sin(age * 7 + j * PI) * 0.42 : 0; });
      const firing = a.g.visible && t > 55 && combat > 0.1 && hash(Math.floor(t * 9) + a.index * 41 + a.faction * 211) > 0.83;
      a.muzzle.visible = firing;
      a.tracer.visible = firing;
      if (firing) {
        actorSource.copy(a.g.position); actorSource.y += 1.2;
        actorTarget.set(14 + hash(a.index) * 4, 1.6 + hash(a.index + 9), -5 - hash(a.index + 20) * 4);
        temp.copy(actorTarget).sub(actorSource);
        const f = hash(Math.floor(t * 17) + a.index);
        actorTarget.copy(actorSource).addScaledVector(temp, f);
        actorSource.copy(actorTarget).addScaledVector(temp, -0.18);
        connect(a.tracer, actorSource, actorTarget, 0.018);
      }
    });
    cultists.forEach(a => {
      const i = a.index;
      const cycle = ((t - 12 + i * 1.91) % 23 + 23) % 23;
      a.g.visible = t > 8 + i * 0.6 && (human ? sealed < 0.55 : collapse < 0.97);
      if (t < 25) {
        const angle = TAU * i / 21;
        a.g.position.set(ritual.position.x + Math.cos(angle) * 3.6, gate.y, ritual.position.z + Math.sin(angle) * 3.6);
        a.g.rotation.y = -angle - PI / 2;
      } else {
        pathPosition(a.path, cycle / 26, a.g.position);
        a.g.position.x += (i % 3 - 1) * 0.8;
        a.g.position.z += (i % 2) * 0.7;
        a.g.rotation.y = -1.6;
      }
      a.g.scale.setScalar(Math.max(0.001, ramp(cycle, 0, 0.7) * (1 - sealed)));
    });
    scps.forEach((g, i) => {
      g.visible = t > 73 + i * 5 && (human ? sealed < 0.6 : collapse < 0.97);
      const f = (0.5 + 0.5 * Math.sin((t - 70) * 0.045 + i)) * 0.62;
      pathPosition(cultPath, f, g.position);
      g.position.x += (i - 1) * 2;
      g.rotation.y = -1.3 + Math.sin(t * 0.1 + i) * 0.3;
      g.scale.setScalar(1 - sealed);
    });
    spawnStreaks.forEach((o, i) => {
      const p = ((t * 0.32 + i / 12) % 1);
      o.visible = t > 25 && t < 241 && sealed < 0.7;
      o.position.set(20 + Math.sin(i * 2.4) * 2, mix(22, gate.y + 1, p), -1.5 + Math.cos(i) * 1.8);
      o.scale.set(0.035, 0.5 + p * 1.7, 0.035);
      o.material.opacity = Math.sin(p * PI) * 0.7 * (1 - sealed);
    });

    const charge = ramp(t, 130.357, 157.687);
    const diskConsumed = human ? 0 : ramp(t, 233, 249);
    disk.visible = charge > 0 && diskConsumed < 0.999 && t < 258;
    disk.position.copy(diskCenter).lerp(rift.position, diskConsumed);
    disk.position.x += Math.sin(diskConsumed * TAU) * diskConsumed * 4;
    disk.position.z += Math.cos(diskConsumed * TAU) * diskConsumed * 3;
    const diskScale = Math.max(0.001, charge * (1 - diskConsumed) * (1 - (human ? ramp(t, 249, 258) : 0)));
    disk.scale.setScalar(diskScale);
    disk.rotation.z = diskConsumed * 1.5;
    disk.rotation.x = diskConsumed * 0.6;
    diskRotors[0].rotation.y = t * 0.1;
    diskRotors[1].rotation.y = -t * 0.075;
    diskMat.opacity = charge * (0.65 + 0.3 * Math.sin(t * 3) ** 2);
    goldMat.opacity = charge * 0.85;
    diskTag.visible = t > 139 && t < 178;
    straight.visible = beamPower > 0 && bend < 1;
    straight.material.opacity = beamPower * (1 - bend) * 0.9;
    beamLayers.forEach((o, i) => {
      o.visible = beamPower > 0 && bend > 0;
      const reveal = clamp((t - 174) / 8);
      o.geometry.setDrawRange(0, Math.floor(160 * reveal) * 8 * 6);
      o.material.opacity = [0.10, 0.35, 1][i] * beamPower * bend;
      o.material.color.setHex(!human && t > 233 ? [0xff193c, 0xff5067, 0xffd6d7][i] : [0x32aaff, 0x63dcff, 0xecfdff][i]);
    });
    stream.forEach((o, i) => {
      const p = ((t * 0.24 + i / stream.length) % 1);
      const j = Math.floor(p * 499);
      o.visible = t > 178 && beamPower > 0.05;
      o.position.copy(curvePoints[j]);
      const a = t * 5 + i * 2.4;
      o.position.x += Math.cos(a) * 0.45;
      o.position.z += Math.sin(a) * 0.45;
      o.lookAt(curvePoints[j + 1]);
      o.material.opacity = beamPower * 0.9;
    });
    bendTag.visible = t > 178 && t < 193;

    for (let i = 0; i < count; i++) {
      const p = ((t * (0.035 + hash(i + 40) * 0.03) + hash(i)) % 1);
      const angle = i * 2.39996 + t * (0.3 + hash(i + 4) * 0.25);
      const radius = (3 + hash(i + 19) * 13) * (0.4 + p * 0.6) * (1 + collapse);
      particlePositions[i * 3] = 22 + Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = 7 + p * 34 + Math.sin(angle * 2) * 2;
      particlePositions[i * 3 + 2] = -3 + Math.sin(angle) * radius;
    }
    particleGeo.attributes.position.needsUpdate = true;
    particleMat.opacity = storm * 0.8;
    particles.visible = t > 12 && sealed < 0.99;
    stormRings.forEach((o, i) => {
      o.visible = t > 18 && sealed < 0.99;
      o.rotation.set(PI / 2 + Math.sin(i) * 0.4, Math.sin(t * 0.13 + i) * 0.3, t * (i % 2 ? -0.14 : 0.12) + i);
      o.position.y = 24 + Math.sin(i * 2) * 4;
      o.scale.setScalar((0.8 + storm * 0.3) * (1 + collapse * 1.8));
      o.material.opacity = storm * 0.23;
    });
    const bucket = Math.floor(t * 8);
    bolts.forEach(({ line, positions, index: i }) => {
      const active = hash(bucket * 31 + i * 19) > 0.77 - storm * 0.12;
      line.visible = active && t > 22 && sealed < 0.99;
      line.material.opacity = storm * (0.55 + hash(bucket + i) * 0.4);
      const a = hash(i + bucket * 0.31) * TAU;
      const radius = 8 + hash(i + 4) * 13;
      const sx = 22 + Math.cos(a) * 4, sy = 24 + Math.sin(a) * 6, sz = -3;
      const ex = i % 4 === 0 && t > 158 ? disk.position.x : 22 + Math.cos(a) * radius;
      const ey = i % 4 === 0 && t > 158 ? disk.position.y : 5 + hash(i + 11) * 29;
      const ez = i % 4 === 0 && t > 158 ? disk.position.z : -3 + Math.sin(a) * radius;
      for (let j = 0; j < 25; j++) {
        const p = j / 24, jitter = Math.sin(p * PI) * 1.6;
        positions[j * 3] = mix(sx, ex, p) + (hash(bucket * 300 + i * 31 + j) - 0.5) * jitter;
        positions[j * 3 + 1] = mix(sy, ey, p) + (hash(bucket * 170 + i * 71 + j) - 0.5) * jitter;
        positions[j * 3 + 2] = mix(sz, ez, p) + (hash(bucket * 200 + i * 43 + j) - 0.5) * jitter;
      }
      line.geometry.attributes.position.needsUpdate = true;
    });
    shards.forEach((o, i) => {
      o.visible = collapse > 0.01;
      const a = i * 2.4 + t * 0.06;
      const radius = (8 + hash(i) * 25) * (1 - collapse * 0.7);
      o.position.set(16 + Math.cos(a) * radius, 5 + hash(i + 3) * 32 + collapse * 8, -6 + Math.sin(a) * radius);
      o.scale.set(0.5 + hash(i + 1) * 2, 2 + hash(i + 2) * 6, 0.15);
      o.rotation.set(t * 0.07 + i, i * 0.5, t * 0.12);
      o.material.opacity = collapse * (0.25 + hash(i) * 0.5);
    });
  }
  function caption(time, ending) {
    const human = ending !== 'cult';
    if (time >= 244) return human ? {
      title: '13A / HUMAN VICTORY — SEAL CONFIRMED',
      text: 'The rift closes. Respawns cease. MTF, GOC and Chaos hold the surviving Surface beneath the anchors. Final Action — 西蒙Leonardo.'
    } : {
      title: '13B / CULT VICTORY — REALITY COLLAPSE',
      text: 'The breach consumes the GOC strike disk. The anchors fail; the Scarlet King’s reality replaces our own. Final Action — 西蒙Leonardo.'
    };
    if (time >= 224) return human ? {
      title: '12A / THE ANCHORS HOLD',
      text: 'The coalition maintains the reference field. The redirected strike cauterizes the rift from within.'
    } : {
      title: '12B / THE KING ACCEPTS THE OFFERING',
      text: 'Containment fails. The rift expands up the captured stream and engulfs the thaumaturgic disk.'
    };
    const shot = shots.find(s => time >= s.a && time < s.b) || shots[0];
    return { title: shot.title, text: shot.text };
  }
  update(0, 'human');
  return { update, caption };
};