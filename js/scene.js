import * as THREE from '../libs/three.js/build/three.module.js';

import Stats from '../libs/three.js/examples/jsm/libs/stats.module.js';

import { OrbitControls } from '../libs/three.js/examples/jsm/controls/OrbitControls.js';

// Graphics variables
var container, stats;
var camera, controls, scene, renderer;
var textureLoader;
var clock = new THREE.Clock();

// Physics variables
var gravityConstant = - 9.8;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var softBodySolver;
var physicsWorld;
var rigidBodies = [];
var margin = 0.05;
var hinge;
var rope;
var cloth;
var transformAux1;

var armMovement = 0;

Ammo().then(function (AmmoLib) {

  Ammo = AmmoLib;

  init();
  animate();

});

function init() {

  initGraphics();

  initPhysics();

  createObjects();

  initInput();

}

function initGraphics() {

  container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  camera.position.set(-12, 10, 3);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.update();

  textureLoader = new THREE.TextureLoader();

  var ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  var light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(- 10, 10, 5);
  light.castShadow = true;
  var d = 10;
  light.shadow.camera.left = - d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = - d;

  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;

  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  scene.add(light);

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild(stats.domElement);

  //

  window.addEventListener('resize', onWindowResize, false);

}

function initPhysics() {

  // Physics configuration

  collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  broadphase = new Ammo.btDbvtBroadphase();
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  softBodySolver = new Ammo.btDefaultSoftBodySolver();
  physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
  physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
  physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();

}

function createObjects() {

  var pos = new THREE.Vector3();
  var quat = new THREE.Quaternion();

  // Ground
  pos.set(0, - 0.5, 0);
  quat.set(0, 0, 0, 1);
  var ground = createParalellepiped(40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial({ color: 0xFFFFFF }));
  ground.castShadow = true;
  ground.receiveShadow = true;
  textureLoader.load("textures/grid.png", function (texture) {

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40);
    ground.material.map = texture;
    ground.material.needsUpdate = true;

  });

  // Wall
  var brickMass = 0.5;
  var brickLength = 1.2;
  var brickDepth = 0.6;
  var brickHeight = brickLength * 0.5;
  var numBricksLength = 10;
  var numBricksHeight = 8;
  var z0 = - numBricksLength * brickLength * 0.5;
  pos.set(0, brickHeight * 0.5, z0);
  quat.set(0, 0, 0, 1);
  for (var j = 0; j < numBricksHeight; j++) {

    var oddRow = (j % 2) == 1;

    pos.z = z0;

    if (oddRow) {

      pos.z -= 0.25 * brickLength;

    }

    var nRow = oddRow ? numBricksLength + 1 : numBricksLength;
    for (var i = 0; i < nRow; i++) {

      var brickLengthCurrent = brickLength;
      var brickMassCurrent = brickMass;
      if (oddRow && (i == 0 || i == nRow - 1)) {

        brickLengthCurrent *= 0.5;
        brickMassCurrent *= 0.5;

      }

      var brick = createParalellepiped(brickDepth, brickHeight, brickLengthCurrent, brickMassCurrent, pos, quat, createMaterial());
      brick.castShadow = true;
      brick.receiveShadow = true;

      if (oddRow && (i == 0 || i == nRow - 2)) {

        pos.z += 0.75 * brickLength;

      } else {

        pos.z += brickLength;

      }

    }
    pos.y += brickHeight;

  }

  // Ball
  var ballMass = 1.5;
  var ballRadius = 0.6;

  var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 20, 20), new THREE.MeshPhongMaterial({ color: 0x202020 }));
  ball.castShadow = true;
  ball.receiveShadow = true;
  var ballShape = new Ammo.btSphereShape(ballRadius);
  ballShape.setMargin(margin);
  pos.set(-3, 0.8, 3);
  quat.set(0, 0, 0, 1);
  createRigidBody(ball, ballShape, ballMass, pos, quat);
  ball.userData.physicsBody.setFriction(0.5);

  // The rope
  // Rope graphic object
  var ropeNumSegments = 10;
  var ropeLength = 4;
  var ropeMass = 1.0;
  var ropePos = ball.position.clone();
  ropePos.y += ballRadius;

  var segmentLength = ropeLength / ropeNumSegments;
  var ropeGeometry = new THREE.BufferGeometry();
  var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  var ropePositions = [];
  var ropeIndices = [];

  for (var i = 0; i < ropeNumSegments + 1; i++) {

    ropePositions.push(ropePos.x, ropePos.y + i * segmentLength, ropePos.z);

  }

  for (var i = 0; i < ropeNumSegments; i++) {

    ropeIndices.push(i, i + 1);

  }

  ropeGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(ropeIndices), 1));
  ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
  ropeGeometry.computeBoundingSphere();
  rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
  rope.castShadow = true;
  rope.receiveShadow = true;
  scene.add(rope);

  // Rope physic object
  var softBodyHelpers = new Ammo.btSoftBodyHelpers();
  var ropeStart = new Ammo.btVector3(ropePos.x, ropePos.y, ropePos.z);
  var ropeEnd = new Ammo.btVector3(ropePos.x, ropePos.y + ropeLength, ropePos.z);
  var ropeSoftBody = softBodyHelpers.CreateRope(physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0);
  var sbConfig = ropeSoftBody.get_m_cfg();
  sbConfig.set_viterations(10);
  sbConfig.set_piterations(10);
  ropeSoftBody.setTotalMass(ropeMass, false);
  Ammo.castObject(ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
  physicsWorld.addSoftBody(ropeSoftBody, 1, - 1);
  rope.userData.physicsBody = ropeSoftBody;
  // Disable deactivation
  ropeSoftBody.setActivationState(4);

  // The cloth
  // Cloth graphic object
  var clothWidth = 2.5;
  var clothHeight = 5;
  var clothNumSegmentsZ = clothWidth * 5;
  var clothNumSegmentsY = clothHeight * 5;
  var clothPos = new THREE.Vector3(ropePos.x, ropePos.y + ropeLength - 0.5 * clothHeight + 0.1, -2.5);

  var clothGeometry = new THREE.PlaneBufferGeometry(clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY);
  clothGeometry.rotateY(Math.PI * 0.5);
  clothGeometry.translate(clothPos.x, clothPos.y, clothPos.z - clothWidth * 0.5);

  var clothMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
  cloth = new THREE.Mesh(clothGeometry, clothMaterial);
  cloth.castShadow = true;
  cloth.receiveShadow = true;
  scene.add(cloth);
  textureLoader.load("../textures/sunflower.jpg", function (texture) {

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(clothNumSegmentsZ, clothNumSegmentsY);
    texture.repeat.set(1, 2);
    cloth.material.map = texture;
    cloth.material.needsUpdate = true;

  });

  // Cloth physic object
  var softBodyHelpers2 = new Ammo.btSoftBodyHelpers();
  var clothCorner00 = new Ammo.btVector3(clothPos.x, clothPos.y + 0.5 * clothHeight, clothPos.z);
  var clothCorner01 = new Ammo.btVector3(clothPos.x, clothPos.y + 0.5 * clothHeight, clothPos.z - clothWidth);
  var clothCorner11 = new Ammo.btVector3(clothPos.x, clothPos.y - 0.5 * clothHeight, clothPos.z - clothWidth);
  var clothCorner10 = new Ammo.btVector3(clothPos.x, clothPos.y - 0.5 * clothHeight, clothPos.z);
  var clothSoftBody = softBodyHelpers2.CreatePatch(physicsWorld.getWorldInfo(), clothCorner00, clothCorner01, clothCorner10, clothCorner11, clothNumSegmentsZ + 1, clothNumSegmentsY + 1, 0, true);
  var sbConfig2 = clothSoftBody.get_m_cfg();
  sbConfig2.set_viterations(10);
  sbConfig2.set_piterations(10);

  clothSoftBody.setTotalMass(0.9, false);
  Ammo.castObject(clothSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
  physicsWorld.addSoftBody(clothSoftBody, 1, - 1);
  cloth.userData.physicsBody = clothSoftBody;
  // Disable deactivation
  clothSoftBody.setActivationState(4);

  // The base
  var armMass = 2;
  var armLength = 10;
  var pylonHeight = ropePos.y + ropeLength;
  var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x606060 });

  pos.set(ropePos.x, 0.1, 0);
  quat.set(0, 0, 0, 1);
  var base = createParalellepiped(1, 0.2, 1, 0, pos, quat, baseMaterial);
  base.castShadow = true;
  base.receiveShadow = true;

  pos.set(ropePos.x, 0.5 * pylonHeight, 0);
  var pylon = createParalellepiped(0.8, pylonHeight, 0.8, 0, pos, quat, baseMaterial);
  pylon.castShadow = true;
  pylon.receiveShadow = true;

  pos.set(ropePos.x, pylonHeight + 0.2, 0);
  var arm = createParalellepiped(0.4, 0.4, armLength + 0.4, armMass, pos, quat, baseMaterial);
  arm.castShadow = true;
  arm.receiveShadow = true;

  // Glue the rope extremes to the ball and the arm
  var influence = 1;
  ropeSoftBody.appendAnchor(0, ball.userData.physicsBody, true, influence);
  ropeSoftBody.appendAnchor(ropeNumSegments, arm.userData.physicsBody, true, influence);

  // Glue the cloth to the arm
  var influence2 = 0.5;
  clothSoftBody.appendAnchor(0, arm.userData.physicsBody, false, influence2);
  clothSoftBody.appendAnchor(clothNumSegmentsZ, arm.userData.physicsBody, false, influence2);

  // Hinge constraint to move the arm
  var pivotA = new Ammo.btVector3(0, pylonHeight * 0.5, 0);
  var pivotB = new Ammo.btVector3(0, - 0.2, 0);
  var axis = new Ammo.btVector3(0, 1, 0);
  hinge = new Ammo.btHingeConstraint(pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true);
  physicsWorld.addConstraint(hinge, true);


}

function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {

  var threeObject = new THREE.Mesh(new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1), material);
  var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
  shape.setMargin(margin);

  createRigidBody(threeObject, shape, mass, pos, quat);

  return threeObject;

}

function createRigidBody(threeObject, physicsShape, mass, pos, quat) {

  threeObject.position.copy(pos);
  threeObject.quaternion.copy(quat);

  var transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  var motionState = new Ammo.btDefaultMotionState(transform);

  var localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
  var body = new Ammo.btRigidBody(rbInfo);

  threeObject.userData.physicsBody = body;

  scene.add(threeObject);

  if (mass > 0) {

    rigidBodies.push(threeObject);

    // Disable deactivation
    body.setActivationState(4);

  }

  physicsWorld.addRigidBody(body);

}

function createRandomColor() {

  return Math.floor(Math.random() * (1 << 24));

}

function createMaterial() {

  return new THREE.MeshPhongMaterial({ color: createRandomColor() });

}

function initInput() {

  window.addEventListener('keydown', function (event) {

    switch (event.keyCode) {

      // Q
      case 81:
        armMovement = 1;
        break;

      // A
      case 65:
        armMovement = - 1;
        break;

    }

  }, false);

  window.addEventListener('keyup', function () {

    armMovement = 0;

  }, false);

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

  requestAnimationFrame(animate);

  render();
  stats.update();

}

function render() {

  var deltaTime = clock.getDelta();

  updatePhysics(deltaTime);

  renderer.render(scene, camera);

}

function updatePhysics(deltaTime) {

  // Hinge control
  hinge.enableAngularMotor(true, 1.5 * armMovement, 50);

  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rope
  var softBody = rope.userData.physicsBody;
  var ropePositions = rope.geometry.attributes.position.array;
  var numVerts = ropePositions.length / 3;
  var nodes = softBody.get_m_nodes();
  var indexFloat = 0;
  for (var i = 0; i < numVerts; i++) {

    var node = nodes.at(i);
    var nodePos = node.get_m_x();
    ropePositions[indexFloat++] = nodePos.x();
    ropePositions[indexFloat++] = nodePos.y();
    ropePositions[indexFloat++] = nodePos.z();

  }
  rope.geometry.attributes.position.needsUpdate = true;

  // Update rigid bodies
  for (var i = 0, il = rigidBodies.length; i < il; i++) {

    var objThree = rigidBodies[i];
    var objPhys = objThree.userData.physicsBody;
    var ms = objPhys.getMotionState();
    if (ms) {

      ms.getWorldTransform(transformAux1);
      var p = transformAux1.getOrigin();
      var q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

    }

  }

  // Update cloth
  softBody = cloth.userData.physicsBody;
  var clothPositions = cloth.geometry.attributes.position.array;
  numVerts = clothPositions.length / 3;
  nodes = softBody.get_m_nodes();
  indexFloat = 0;
  for (var i = 0; i < numVerts; i++) {

    var node = nodes.at(i);
    var nodePos = node.get_m_x();
    clothPositions[indexFloat++] = nodePos.x();
    clothPositions[indexFloat++] = nodePos.y();
    clothPositions[indexFloat++] = nodePos.z();

  }
  cloth.geometry.computeVertexNormals();
  cloth.geometry.attributes.position.needsUpdate = true;
  cloth.geometry.attributes.normal.needsUpdate = true;

  // Update rigid bodies
  for (var i = 0, il = rigidBodies.length; i < il; i++) {

    var objThree = rigidBodies[i];
    var objPhys = objThree.userData.physicsBody;
    var ms = objPhys.getMotionState();
    if (ms) {

      ms.getWorldTransform(transformAux1);
      var p = transformAux1.getOrigin();
      var q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

    }

  }

}