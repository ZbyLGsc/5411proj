import * as THREE from '../libs/three.js/build/three.module.js';

import Stats from '../libs/three.js/examples/jsm/libs/stats.module.js';

import { OrbitControls } from '../libs/three.js/examples/jsm/controls/OrbitControls.js';

import * as GEN from './generate.js';

import { DDSLoader } from '../libs/three.js/examples/jsm/loaders/DDSLoader.js';

// Graphics variables
var container, stats;
var camera, controls, scene, renderer, cubeCamera, cubeCamera2;
var textureLoader;
var clock = new THREE.Clock();

var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
var skyBallMesh;
var backgroundTexture;

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

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 6000);

  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xbfd1e5);
  var r = "textures/cube/Bridge2/";
  var urls = [r + "posx.jpg", r + "negx.jpg", r + "posy.jpg", r + "negy.jpg", r + "posz.jpg", r + "negz.jpg"];
  backgroundTexture = new THREE.CubeTextureLoader().load(urls);
  scene.background = backgroundTexture;

  camera.position.set(0, 1500, 2000);

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
  light.position.set(- 30, 30, 30);
  light.castShadow = true;
  var d = 30;
  light.shadow.camera.left = - d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = - d;

  light.shadow.camera.near = 1;
  light.shadow.camera.far = 100;

  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  scene.add(light);

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild(stats.domElement);

  // cubeCamera for reflection effect

  cubeCamera = new THREE.CubeCamera(1, 1000, 256);
  cubeCamera.renderTarget.texture.generateMipmaps = true;
  cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
  // cubeCamera.renderTarget.texture.mapping = THREE.CubeReflectionMapping;

  cubeCamera.position.set(0, 12, 0);
  scene.add(cubeCamera);

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

  /* only for showing the axis direction */
  var ball0 = new THREE.Mesh(new THREE.SphereBufferGeometry(50, 20, 20), new THREE.MeshPhongMaterial({ color: 0xffffff }));
  var ballx = new THREE.Mesh(new THREE.SphereBufferGeometry(50, 20, 20), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
  ballx.position.set(1000, 0, 0);
  var bally = new THREE.Mesh(new THREE.SphereBufferGeometry(50, 20, 20), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
  bally.position.set(0, 1000, 0);
  var ballz = new THREE.Mesh(new THREE.SphereBufferGeometry(50, 20, 20), new THREE.MeshPhongMaterial({ color: 0x0000ff }));
  ballz.position.set(0, 0, 1000);
  scene.add(ball0);
  scene.add(ballx);
  scene.add(bally);
  scene.add(ballz);

  /* add physical objects to scene */
  var pos = new THREE.Vector3();
  var quat = new THREE.Quaternion();
  var baseMaterialRed = new THREE.MeshPhongMaterial({ color: 0xaa0000 });
  var baseMaterialYel = new THREE.MeshPhongMaterial({ color: 0xa0a000 });
  var baseMaterialGreen = new THREE.MeshPhongMaterial({ color: 0x00a000 });

  // boxes of the glsl's quads 
  var theta = Math.atan(0.1);
  var slope = createParalellepiped(2000, 20, 3115.46, 0, new THREE.Vector3(0, 145, -3100 * 0.5), new THREE.Quaternion(Math.sin(theta / 2), 0, 0, Math.cos(theta / 2)), baseMaterialRed);
  var back = createParalellepiped(2000, 510, 20, 0, new THREE.Vector3(0, 245, -3000), quat, baseMaterialYel);
  var left = createParalellepiped(20, 510, 3100, 0, new THREE.Vector3(-1000, 245, -3000 * 0.5), quat, baseMaterialYel);
  var right = createParalellepiped(20, 510, 3100, 0, new THREE.Vector3(1000, 245, -3000 * 0.5), quat, baseMaterialYel);

  // boxes of the glsl's boxes
  var box0 = createParalellepiped(164, 340, 160, 0, new THREE.Vector3(180, 170, -350), new THREE.Quaternion(0, Math.sin(Math.PI * 0.1), 0, Math.cos(Math.PI * 0.1)), baseMaterialYel);
  var box1 = createParalellepiped(172, 170, 160, 0, new THREE.Vector3(370, 85, -170), new THREE.Quaternion(0, Math.sin(-Math.PI * 0.05), 0, Math.cos(-Math.PI * 0.05)), baseMaterialGreen);

  // spheres
  var sphere0 = createSphere(90, 0, new THREE.Vector3(500, 90, 25), quat, baseMaterialRed);
  var sphere1 = createSphere(90, 0, new THREE.Vector3(-500, 90, 0), quat, baseMaterialGreen);
  var sphere2 = createSphere(90, 0, new THREE.Vector3(50, 90, 0), quat, baseMaterialYel);

  console.log("change4");

}

function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {

  var threeObject = new THREE.Mesh(new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1), material);
  var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
  shape.setMargin(margin);

  createRigidBody(threeObject, shape, mass, pos, quat);

  return threeObject;

}

function createSphere(radius, mass, pos, quat, material) {
  var threeObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 20, 20), material);
  var shape = new Ammo.btSphereShape(radius);
  shape.setMargin(margin);
  createRigidBody(threeObject, shape, mass, pos, quat);
  return threeObject;
}

function createCone(radius, height, pos, quat, material) {
  var threeObject = new THREE.Mesh(new THREE.ConeBufferGeometry(radius, height, 20, 2), material);
  var shape = new Ammo.btConeShape(radius, height);
  shape.setMargin(margin);
  createRigidBody(threeObject, shape, mass, pos, quat);
  return threeObject;
}

function createCylinder(radius, height, pos, quat, material) {
  var threeObject = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 20, 1), material);
  var shape = new Ammo.btCylinderShape(new Ammo.btVector3(radius, height * 0.5, radius));
  shape.setMargin(margin);
  createRigidBody(threeObject, shape, mass, pos, quat);
  return threeObject;
}

function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {

  if (pos) {

    object.position.copy(pos);

  } else {

    pos = object.position;

  }
  if (quat) {

    object.quaternion.copy(quat);

  } else {

    quat = object.quaternion;

  }

  var transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  var motionState = new Ammo.btDefaultMotionState(transform);

  var localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
  var body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(0.5);

  if (vel) {

    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));

  }
  if (angVel) {

    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));

  }

  object.userData.physicsBody = body;
  object.userData.collided = false;

  scene.add(object);

  if (mass > 0) {

    rigidBodies.push(object);

    // Disable deactivation
    body.setActivationState(4);

  }

  physicsWorld.addRigidBody(body);

  return body;

}

function createMaterial() {
  return new THREE.MeshPhongMaterial({ color: Math.floor(Math.random() * (1 << 24)) });
}

function generateNewSphere() {

  var threeObject = null;
  var shape = null;

  var objectSize = 2;
  var margin = 0.05;

  // Sphere
  var radius = 1 + Math.random() * objectSize;
  // threeObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 20, 20), createMaterial());

  var material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: scene.background, refractionRatio: 0.5 });
  material.envMap.mapping = THREE.CubeRefractionMapping;

  threeObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 20, 20), material);
  shape = new Ammo.btSphereShape(radius);
  shape.setMargin(margin);


  threeObject.position.set(Math.random() - 0.5, objectSize + 25, Math.random() - 0.5);

  var mass = 0.1;
  createRigidBody(threeObject, shape, mass, threeObject.position, new THREE.Quaternion(0, 0, 0, 1));

}

function initInput() {

  // keyboard control of arm
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

      // S
      case 83:
        armMovement = 0;
        break;

      case 87:
        generateNewSphere();
        console.log(GEN.test(rigidBodies));
        break;

    }

  }, false);

  window.addEventListener('keyup', function () {

    // armMovement = 0;

  }, false);

  // mouse control of shooting
  window.addEventListener('mousedown', function (event) {

    // triggered by right button
    if (event.which != 3) {
      return;
    }
    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      - (event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    // Creates a ball and throws it
    var ballMass = 35;
    var ballRadius = 0.4;

    var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 14, 10), ballMaterial);
    ball.castShadow = true;
    ball.receiveShadow = true;
    var ballShape = new Ammo.btSphereShape(ballRadius);
    ballShape.setMargin(margin);

    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    pos.copy(raycaster.ray.direction);
    pos.add(raycaster.ray.origin);
    quat.set(0, 0, 0, 1);
    var ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);

    var vel = new THREE.Vector3();
    vel.copy(raycaster.ray.direction);
    vel.multiplyScalar(50);
    ballBody.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));

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

  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

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