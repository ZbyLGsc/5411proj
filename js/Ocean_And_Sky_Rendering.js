// scene/demo-specific variables go here
var EPS_intersect;
var sceneIsDynamic = true;
var camFlightSpeed = 300;
var sunAngle = 0;
var sunDirection = new THREE.Vector3();
var tallBoxGeometry, tallBoxMaterial, tallBoxMesh;
var shortBoxGeometry, shortBoxMaterial, shortBoxMesh;

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

// called automatically from within initTHREEjs() function
function initSceneData() {
        
        // scene/demo-specific three.js objects setup goes here
        EPS_intersect = mouseControl ? 0.01 : 1.0; // less precision on mobile

        // Boxes
        tallBoxGeometry = new THREE.BoxGeometry(1,1,1);
        tallBoxMaterial = new THREE.MeshPhysicalMaterial( {
                color: new THREE.Color(0.95, 0.95, 0.95), //RGB, ranging from 0.0 - 1.0
                roughness: 1.0 // ideal Diffuse material	
        } );
        
        tallBoxMesh = new THREE.Mesh(tallBoxGeometry, tallBoxMaterial);
        pathTracingScene.add(tallBoxMesh);
        tallBoxMesh.visible = false; // disable normal Three.js rendering updates of this object: 
        // it is just a data placeholder as well as an Object3D that can be transformed/manipulated by 
        // using familiar Three.js library commands. It is then fed into the GPU path tracing renderer
        // through its 'matrixWorld' matrix. See below:
        tallBoxMesh.rotation.set(0, Math.PI * 0.1, 0);
        tallBoxMesh.position.set(180, 170, -350);
        tallBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update
        
        
        shortBoxGeometry = new THREE.BoxGeometry(1,1,1);
        shortBoxMaterial = new THREE.MeshPhysicalMaterial( {
                color: new THREE.Color(0.95, 0.95, 0.95), //RGB, ranging from 0.0 - 1.0
                roughness: 1.0 // ideal Diffuse material	
        } );
        
        shortBoxMesh = new THREE.Mesh(shortBoxGeometry, shortBoxMaterial);
        pathTracingScene.add(shortBoxMesh);
        shortBoxMesh.visible = false;
        shortBoxMesh.rotation.set(0, -Math.PI * 0.09, 0);
        shortBoxMesh.position.set(370, 85, -170);
        shortBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update



        var pos = new THREE.Vector3();
        var quat = new THREE.Quaternion();
        var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x606060 });
        // The rope ball =======================================================================

        // Ball
        var ballMass = 15;
        var ballRadius = 90;

        var material3 = new THREE.MeshBasicMaterial({ color: 0xffffff, refractionRatio: 0.1 });
        // material3.envMap.mapping = THREE.CubeRefractionMapping;
        var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 20, 20), material3);
        ball.castShadow = true;
        ball.receiveShadow = true;
        var ballShape = new Ammo.btSphereShape(ballRadius);
        ballShape.setMargin(margin);
        pos.set(500, 90, 25);
        quat.set(0, 0, 0, 1);
        createRigidBody(ball, ballShape, ballMass, pos, quat);
        ball.userData.physicsBody.setFriction(0.5);

        // Rope graphic object
        var ropeNumSegments = 10;
        var ropeLength = 4;
        var ropeMass = 1.0;
        var ropePos = ball.position.clone();
        // ropePos.y += ballRadius;

        // var segmentLength = ropeLength / ropeNumSegments;
        // var ropeGeometry = new THREE.BufferGeometry();
        // var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        // var ropePositions = [];
        // var ropeIndices = [];

        // for (var i = 0; i < ropeNumSegments + 1; i++) {

        // ropePositions.push(ropePos.x, ropePos.y + i * segmentLength, ropePos.z);

        // }

        // for (var i = 0; i < ropeNumSegments; i++) {

        // ropeIndices.push(i, i + 1);

        // }

        // ropeGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(ropeIndices), 1));
        // ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
        // ropeGeometry.computeBoundingSphere();
        // rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
        // rope.castShadow = true;
        // rope.receiveShadow = true;
        // scene.add(rope);

        // // Rope physic object
        // var softBodyHelpers = new Ammo.btSoftBodyHelpers();
        // var ropeStart = new Ammo.btVector3(ropePos.x, ropePos.y, ropePos.z);
        // var ropeEnd = new Ammo.btVector3(ropePos.x, ropePos.y + ropeLength, ropePos.z);
        // var ropeSoftBody = softBodyHelpers.CreateRope(physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0);
        // var sbConfig = ropeSoftBody.get_m_cfg();
        // sbConfig.set_viterations(10);
        // sbConfig.set_piterations(10);
        // ropeSoftBody.setTotalMass(ropeMass, false);
        // Ammo.castObject(ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
        // physicsWorld.addSoftBody(ropeSoftBody, 1, - 1);
        // rope.userData.physicsBody = ropeSoftBody;
        // // Disable deactivation
        // ropeSoftBody.setActivationState(4);

        // The cloth =======================================================================
        // Cloth graphic object
        // var clothWidth = 5;
        // var clothHeight = 6;
        // var clothNumSegmentsZ = clothWidth * 5;
        // var clothNumSegmentsY = clothHeight * 5;
        // var clothPos = new THREE.Vector3(ropePos.x, ropePos.y + ropeLength - 0.5 * clothHeight + 0.1, -9);

        // var clothGeometry = new THREE.PlaneBufferGeometry(clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY);
        // clothGeometry.rotateY(Math.PI * 0.5);
        // clothGeometry.translate(clothPos.x, clothPos.y, clothPos.z - clothWidth * 0.5);

        // var clothMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
        // cloth = new THREE.Mesh(clothGeometry, clothMaterial);
        // cloth.castShadow = true;
        // cloth.receiveShadow = true;
        // scene.add(cloth);
        // textureLoader.load("../textures/sunflower.jpg", function (texture) {

        // texture.wrapS = THREE.RepeatWrapping;
        // texture.wrapT = THREE.RepeatWrapping;
        // // texture.repeat.set(clothNumSegmentsZ, clothNumSegmentsY);
        // texture.repeat.set(1, 2);
        // cloth.material.map = texture;
        // cloth.material.needsUpdate = true;

        // });

        // // Cloth physic object
        // var softBodyHelpers2 = new Ammo.btSoftBodyHelpers();
        // var clothCorner00 = new Ammo.btVector3(clothPos.x, clothPos.y + 0.5 * clothHeight, clothPos.z);
        // var clothCorner01 = new Ammo.btVector3(clothPos.x, clothPos.y + 0.5 * clothHeight, clothPos.z - clothWidth);
        // var clothCorner11 = new Ammo.btVector3(clothPos.x, clothPos.y - 0.5 * clothHeight, clothPos.z - clothWidth);
        // var clothCorner10 = new Ammo.btVector3(clothPos.x, clothPos.y - 0.5 * clothHeight, clothPos.z);
        // var clothSoftBody = softBodyHelpers2.CreatePatch(physicsWorld.getWorldInfo(), clothCorner00, clothCorner01, clothCorner10, clothCorner11, clothNumSegmentsZ + 1, clothNumSegmentsY + 1, 0, true);
        // var sbConfig2 = clothSoftBody.get_m_cfg();
        // sbConfig2.set_viterations(10);
        // sbConfig2.set_piterations(10);

        // clothSoftBody.setTotalMass(0.9, false);
        // Ammo.castObject(clothSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
        // physicsWorld.addSoftBody(clothSoftBody, 1, - 1);
        // cloth.userData.physicsBody = clothSoftBody;
        // // Disable deactivation
        // clothSoftBody.setActivationState(4);
        // The base =======================================================================
        var armMass = 20;
        var armLength = 280;
        var pylonHeight = ropePos.y + ropeLength;

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


        // set camera's field of view
        worldCamera.fov = 60;
        focusDistance = 1180.0;

        // position and orient camera
        cameraControlsObject.position.set(278, 270, 1050);
        ///cameraControlsYawObject.rotation.y = 0.0;
        // look slightly upward
        cameraControlsPitchObject.rotation.x = 0.005;
        
        PerlinNoiseTexture = new THREE.TextureLoader().load( 'textures/perlin256.png' );
        PerlinNoiseTexture.wrapS = THREE.RepeatWrapping;
        PerlinNoiseTexture.wrapT = THREE.RepeatWrapping;
        PerlinNoiseTexture.flipY = false;
        PerlinNoiseTexture.minFilter = THREE.LinearFilter;
        PerlinNoiseTexture.magFilter = THREE.LinearFilter;
        PerlinNoiseTexture.generateMipmaps = false;

} // end function initSceneData()



// called automatically from within initTHREEjs() function
function initPathTracingShaders() {
 
        // scene/demo-specific uniforms go here
        pathTracingUniforms = {
					
                tPreviousTexture: { type: "t", value: screenTextureRenderTarget.texture },
                t_PerlinNoise: { type: "t", value: PerlinNoiseTexture },
                
                uCameraIsMoving: { type: "b1", value: false },
                uCameraJustStartedMoving: { type: "b1", value: false },
                
                uEPS_intersect: { type: "f", value: EPS_intersect },
                uCameraUnderWater: { type: "f", value: 0.0 },
                uTime: { type: "f", value: 0.0 },
                uSampleCounter: { type: "f", value: 0.0 },
                uFrameCounter: { type: "f", value: 1.0 },
                uULen: { type: "f", value: 1.0 },
                uVLen: { type: "f", value: 1.0 },
                uApertureSize: { type: "f", value: 0.0 },
                uFocusDistance: { type: "f", value: focusDistance },
                
                uResolution: { type: "v2", value: new THREE.Vector2() },
                
                uRandomVector: { type: "v3", value: new THREE.Vector3() },
                uSunDirection: { type: "v3", value: new THREE.Vector3() },
        
                uCameraMatrix: { type: "m4", value: new THREE.Matrix4() },
                
                uShortBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
                uShortBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() },
                
                uTallBoxInvMatrix: { type: "m4", value: new THREE.Matrix4() },
                uTallBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() }

        };

        pathTracingDefines = {
        	//NUMBER_OF_TRIANGLES: total_number_of_triangles
        };

        // load vertex and fragment shader files that are used in the pathTracing material, mesh and scene
        fileLoader.load('shaders/common_PathTracing_Vertex.glsl', function (shaderText) {
                pathTracingVertexShader = shaderText;

                createPathTracingMaterial();
        });

} // end function initPathTracingShaders()


// called automatically from within initPathTracingShaders() function above
function createPathTracingMaterial() {

        fileLoader.load('shaders/Ocean_And_Sky_Rendering_Fragment.glsl', function (shaderText) {
                
                pathTracingFragmentShader = shaderText;

                pathTracingMaterial = new THREE.ShaderMaterial({
                        uniforms: pathTracingUniforms,
                        defines: pathTracingDefines,
                        vertexShader: pathTracingVertexShader,
                        fragmentShader: pathTracingFragmentShader,
                        depthTest: false,
                        depthWrite: false
                });

                pathTracingMesh = new THREE.Mesh(pathTracingGeometry, pathTracingMaterial);
                pathTracingScene.add(pathTracingMesh);

                // the following keeps the large scene ShaderMaterial quad right in front 
                //   of the camera at all times. This is necessary because without it, the scene 
                //   quad will fall out of view and get clipped when the camera rotates past 180 degrees.
                worldCamera.add(pathTracingMesh);
                
        });

} // end function createPathTracingMaterial()



// called automatically from within the animate() function
function updateVariablesAndUniforms() {
        
        // scene/demo-specific variables

        sunAngle = (elapsedTime * 0.03) % Math.PI;
        sunDirection.set(Math.cos(sunAngle) * 1.2, Math.sin(sunAngle), -Math.cos(sunAngle) * 3.0);
        sunDirection.normalize();
        
        if (cameraIsMoving) {
                sampleCounter = 1.0;
                frameCounter += 1.0;

                if (!cameraRecentlyMoving) {
                        cameraJustStartedMoving = true;
                        cameraRecentlyMoving = true;
                }
        }

        if ( !cameraIsMoving ) {
                sampleCounter += 1.0; // for progressive refinement of image
                if (sceneIsDynamic)
                        sampleCounter = 1.0; // reset for continuous updating of image
                
                frameCounter  += 1.0;
                if (cameraRecentlyMoving)
                        frameCounter = 1.0;

                cameraRecentlyMoving = false;  
        }
        
        // scene/demo-specific uniforms
        pathTracingUniforms.uSunDirection.value.copy(sunDirection);
        pathTracingUniforms.uTime.value = elapsedTime;
        pathTracingUniforms.uCameraIsMoving.value = cameraIsMoving;
        pathTracingUniforms.uCameraJustStartedMoving.value = cameraJustStartedMoving;
        pathTracingUniforms.uSampleCounter.value = sampleCounter;
        pathTracingUniforms.uFrameCounter.value = frameCounter;
        pathTracingUniforms.uRandomVector.value.copy(randomVector.set( Math.random(), Math.random(), Math.random() ));
        
        //BOXES
        pathTracingUniforms.uTallBoxInvMatrix.value.getInverse( tallBoxMesh.matrixWorld );
        pathTracingUniforms.uTallBoxNormalMatrix.value.getNormalMatrix( tallBoxMesh.matrixWorld );
        pathTracingUniforms.uShortBoxInvMatrix.value.getInverse( shortBoxMesh.matrixWorld );
        pathTracingUniforms.uShortBoxNormalMatrix.value.getNormalMatrix( shortBoxMesh.matrixWorld );
                                
        // CAMERA
        if (cameraControlsObject.position.y < 2.0)
                pathTracingUniforms.uCameraUnderWater.value = 1.0;
        else 
                pathTracingUniforms.uCameraUnderWater.value = 0.0;
        cameraControlsObject.updateMatrixWorld(true);			
        pathTracingUniforms.uCameraMatrix.value.copy( worldCamera.matrixWorld );
        screenOutputMaterial.uniforms.uOneOverSampleCounter.value = 1.0 / sampleCounter;
        
        cameraInfoElement.innerHTML = "FOV: " + worldCamera.fov + " / Aperture: " + apertureSize.toFixed(2) + " / FocusDistance: " + focusDistance + "<br>" + "Samples: " + sampleCounter;

} // end function updateUniforms()

Ammo().then(function (AmmoLib) {

        Ammo = AmmoLib;
      
        initPhysics();
        init();
      //   animate();
      
      });

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
        
//init(); // init app and start animating

/*************************************             Scene.js                         *************************************** */




// import { OrbitControls } from '../libs/three.js/examples/jsm/controls/OrbitControls.js';

// import * as GEN from './generate.js';

// import { DDSLoader } from '../libs/three.js/examples/jsm/loaders/DDSLoader.js';

// Graphics variables
// var camera, controls, scene, renderer, cubeCamera, cubeCamera2;
// var textureLoader;

// var mouseCoords = new THREE.Vector2();
// var raycaster = new THREE.Raycaster();
// var ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
// var skyBallMesh;
// var backgroundTexture;

// // Physics variables
// var gravityConstant = - 9.8;
// var collisionConfiguration;
// var dispatcher;
// var broadphase;
// var solver;
// var softBodySolver;
// var physicsWorld;
// var rigidBodies = [];
// var margin = 0.05;
// var hinge;
// var rope;
// var cloth;
// var transformAux1;

// var armMovement = 0;


// Ammo().then(function (AmmoLib) {

//   Ammo = AmmoLib;

//   init();
//   animate();

// });

// function init() {

//   initGraphics();

//   initPhysics();

//   createObjects();

//   initInput();

// }

// function initGraphics() {

//   container = document.getElementById('container');

//   camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);

//   scene = new THREE.Scene();
//   // scene.background = new THREE.Color(0xbfd1e5);
//   var r = "textures/cube/Bridge2/";
//   var urls = [r + "posx.jpg", r + "negx.jpg", r + "posy.jpg", r + "negy.jpg", r + "posz.jpg", r + "negz.jpg"];
//   backgroundTexture = new THREE.CubeTextureLoader().load(urls);
//   scene.background = backgroundTexture;

//   camera.position.set(-30, 20, 6);

//   renderer = new THREE.WebGLRenderer();
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   renderer.shadowMap.enabled = true;
//   container.appendChild(renderer.domElement);

//   controls = new OrbitControls(camera, renderer.domElement);
//   controls.target.set(0, 2, 0);
//   controls.update();

//   textureLoader = new THREE.TextureLoader();

//   var ambientLight = new THREE.AmbientLight(0x404040);
//   scene.add(ambientLight);

//   var light = new THREE.DirectionalLight(0xffffff, 1);
//   light.position.set(- 30, 30, 30);
//   light.castShadow = true;
//   var d = 30;
//   light.shadow.camera.left = - d;
//   light.shadow.camera.right = d;
//   light.shadow.camera.top = d;
//   light.shadow.camera.bottom = - d;

//   light.shadow.camera.near = 1;
//   light.shadow.camera.far = 100;

//   light.shadow.mapSize.x = 1024;
//   light.shadow.mapSize.y = 1024;

//   scene.add(light);

//   stats = new Stats();
//   stats.domElement.style.position = 'absolute';
//   stats.domElement.style.top = '0px';
//   container.appendChild(stats.domElement);

//   // cubeCamera for reflection effect

//   cubeCamera = new THREE.CubeCamera(1, 1000, 256);
//   cubeCamera.renderTarget.texture.generateMipmaps = true;
//   cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
//   // cubeCamera.renderTarget.texture.mapping = THREE.CubeReflectionMapping;

//   cubeCamera.position.set(0, 12, 0);
//   scene.add(cubeCamera);

//   window.addEventListener('resize', onWindowResize, false);

// }

// function initPhysics() {

//   // Physics configuration

//   collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
//   dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
//   broadphase = new Ammo.btDbvtBroadphase();
//   solver = new Ammo.btSequentialImpulseConstraintSolver();
//   softBodySolver = new Ammo.btDefaultSoftBodySolver();
//   physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
//   physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
//   physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0));

//   transformAux1 = new Ammo.btTransform();

// }

// function createObjects() {

//   var pos = new THREE.Vector3();
//   var quat = new THREE.Quaternion();

//   // Ground and wall =======================================================================

//   // Ground 
//   pos.set(0, - 0.5, 0);
//   quat.set(0, 0, 0, 1);

//   var loader = new DDSLoader();
//   var groundTexture = loader.load('textures/compressed/disturb_dxt1_mip.dds');
//   groundTexture.anisotropy = 4;
//   groundTexture.wrapS = THREE.RepeatWrapping;
//   groundTexture.wrapT = THREE.RepeatWrapping;
//   groundTexture.repeat.set(2, 2);
//   var material1 = new THREE.MeshBasicMaterial({ map: groundTexture });

//   var ground = createParalellepiped(40, 0.9, 40, 0, pos, quat, material1);
//   ground.castShadow = true;
//   ground.receiveShadow = true;

//   // Wall
//   var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x606060 });

//   var wall1 = createParalellepiped(40, 6, 0.5, 0, new THREE.Vector3(0, 0, -20), quat, baseMaterial);
//   wall1.castShadow = true;
//   wall1.receiveShadow = true;
//   var wall2 = createParalellepiped(40, 6, 0.5, 0, new THREE.Vector3(0, 0, 20), quat, baseMaterial);
//   wall2.castShadow = true;
//   wall2.receiveShadow = true;
//   var wall3 = createParalellepiped(0.5, 6, 40, 0, new THREE.Vector3(20, 0, 0), quat, baseMaterial);
//   wall3.castShadow = true;
//   wall3.receiveShadow = true;
//   var wall4 = createParalellepiped(0.5, 6, 40, 0, new THREE.Vector3(-20, 0, 0), quat, baseMaterial);
//   wall4.castShadow = true;
//   wall4.receiveShadow = true;

//   // The rope ball =======================================================================

//   // Ball
//   var ballMass = 1.5;
//   var ballRadius = 1.6;

//   var material3 = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: scene.background, refractionRatio: 0.1 });
//   material3.envMap.mapping = THREE.CubeRefractionMapping;
//   var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 20, 20), material3);
//   ball.castShadow = true;
//   ball.receiveShadow = true;
//   var ballShape = new Ammo.btSphereShape(ballRadius);
//   ballShape.setMargin(margin);
//   pos.set(-3, 0.0, 13);
//   quat.set(0, 0, 0, 1);
//   createRigidBody(ball, ballShape, ballMass, pos, quat);
//   ball.userData.physicsBody.setFriction(0.5);

//   // Rope graphic object
//   var ropeNumSegments = 10;
//   var ropeLength = 4;
//   var ropeMass = 1.0;
//   var ropePos = ball.position.clone();
//   ropePos.y += ballRadius;

//   var segmentLength = ropeLength / ropeNumSegments;
//   var ropeGeometry = new THREE.BufferGeometry();
//   var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
//   var ropePositions = [];
//   var ropeIndices = [];

//   for (var i = 0; i < ropeNumSegments + 1; i++) {

//     ropePositions.push(ropePos.x, ropePos.y + i * segmentLength, ropePos.z);

//   }

//   for (var i = 0; i < ropeNumSegments; i++) {

//     ropeIndices.push(i, i + 1);

//   }

//   ropeGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(ropeIndices), 1));
//   ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
//   ropeGeometry.computeBoundingSphere();
//   rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
//   rope.castShadow = true;
//   rope.receiveShadow = true;
//   scene.add(rope);

//   // Rope physic object
//   var softBodyHelpers = new Ammo.btSoftBodyHelpers();
//   var ropeStart = new Ammo.btVector3(ropePos.x, ropePos.y, ropePos.z);
//   var ropeEnd = new Ammo.btVector3(ropePos.x, ropePos.y + ropeLength, ropePos.z);
//   var ropeSoftBody = softBodyHelpers.CreateRope(physicsWorld.getWorldInfo(), ropeStart, ropeEnd, ropeNumSegments - 1, 0);
//   var sbConfig = ropeSoftBody.get_m_cfg();
//   sbConfig.set_viterations(10);
//   sbConfig.set_piterations(10);
//   ropeSoftBody.setTotalMass(ropeMass, false);
//   Ammo.castObject(ropeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
//   physicsWorld.addSoftBody(ropeSoftBody, 1, - 1);
//   rope.userData.physicsBody = ropeSoftBody;
//   // Disable deactivation
//   ropeSoftBody.setActivationState(4);

//   // The cloth =======================================================================
//   // Cloth graphic object
//   var clothWidth = 5;
//   var clothHeight = 6;
//   var clothNumSegmentsZ = clothWidth * 5;
//   var clothNumSegmentsY = clothHeight * 5;
//   var clothPos = new THREE.Vector3(ropePos.x, ropePos.y + ropeLength - 0.5 * clothHeight + 0.1, -9);

//   var clothGeometry = new THREE.PlaneBufferGeometry(clothWidth, clothHeight, clothNumSegmentsZ, clothNumSegmentsY);
//   clothGeometry.rotateY(Math.PI * 0.5);
//   clothGeometry.translate(clothPos.x, clothPos.y, clothPos.z - clothWidth * 0.5);

//   var clothMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
//   cloth = new THREE.Mesh(clothGeometry, clothMaterial);
//   cloth.castShadow = true;
//   cloth.receiveShadow = true;
//   scene.add(cloth);
//   textureLoader.load("../textures/sunflower.jpg", function (texture) {

//     texture.wrapS = THREE.RepeatWrapping;
//     texture.wrapT = THREE.RepeatWrapping;
//     // texture.repeat.set(clothNumSegmentsZ, clothNumSegmentsY);
//     texture.repeat.set(1, 2);
//     cloth.material.map = texture;
//     cloth.material.needsUpdate = true;

//   });

//   // Cloth physic object
//   var softBodyHelpers2 = new Ammo.btSoftBodyHelpers();
//   var clothCorner00 = new Ammo.btVector3(clothPos.x, clothPos.y + 0.5 * clothHeight, clothPos.z);
//   var clothCorner01 = new Ammo.btVector3(clothPos.x, clothPos.y + 0.5 * clothHeight, clothPos.z - clothWidth);
//   var clothCorner11 = new Ammo.btVector3(clothPos.x, clothPos.y - 0.5 * clothHeight, clothPos.z - clothWidth);
//   var clothCorner10 = new Ammo.btVector3(clothPos.x, clothPos.y - 0.5 * clothHeight, clothPos.z);
//   var clothSoftBody = softBodyHelpers2.CreatePatch(physicsWorld.getWorldInfo(), clothCorner00, clothCorner01, clothCorner10, clothCorner11, clothNumSegmentsZ + 1, clothNumSegmentsY + 1, 0, true);
//   var sbConfig2 = clothSoftBody.get_m_cfg();
//   sbConfig2.set_viterations(10);
//   sbConfig2.set_piterations(10);

//   clothSoftBody.setTotalMass(0.9, false);
//   Ammo.castObject(clothSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(margin * 3);
//   physicsWorld.addSoftBody(clothSoftBody, 1, - 1);
//   cloth.userData.physicsBody = clothSoftBody;
//   // Disable deactivation
//   clothSoftBody.setActivationState(4);

//   // The base =======================================================================
//   var armMass = 2;
//   var armLength = 28;
//   var pylonHeight = ropePos.y + ropeLength;

//   pos.set(ropePos.x, 0.1, 0);
//   quat.set(0, 0, 0, 1);
//   var base = createParalellepiped(1, 0.2, 1, 0, pos, quat, baseMaterial);
//   base.castShadow = true;
//   base.receiveShadow = true;

//   pos.set(ropePos.x, 0.5 * pylonHeight, 0);
//   var pylon = createParalellepiped(0.8, pylonHeight, 0.8, 0, pos, quat, baseMaterial);
//   pylon.castShadow = true;
//   pylon.receiveShadow = true;

//   pos.set(ropePos.x, pylonHeight + 0.2, 0);
//   var arm = createParalellepiped(0.4, 0.4, armLength + 0.4, armMass, pos, quat, baseMaterial);
//   arm.castShadow = true;
//   arm.receiveShadow = true;

//   // Glue the rope extremes to the ball and the arm
//   var influence = 1;
//   ropeSoftBody.appendAnchor(0, ball.userData.physicsBody, true, influence);
//   ropeSoftBody.appendAnchor(ropeNumSegments, arm.userData.physicsBody, true, influence);

//   // Glue the cloth to the arm
//   var influence2 = 0.5;
//   clothSoftBody.appendAnchor(0, arm.userData.physicsBody, false, influence2);
//   clothSoftBody.appendAnchor(clothNumSegmentsZ, arm.userData.physicsBody, false, influence2);

//   // Hinge constraint to move the arm
//   var pivotA = new Ammo.btVector3(0, pylonHeight * 0.5, 0);
//   var pivotB = new Ammo.btVector3(0, - 0.2, 0);
//   var axis = new Ammo.btVector3(0, 1, 0);
//   hinge = new Ammo.btHingeConstraint(pylon.userData.physicsBody, arm.userData.physicsBody, pivotA, pivotB, axis, axis, true);
//   physicsWorld.addConstraint(hinge, true);

//   // Sphere in the sky

//   var skyBallGeo = new THREE.SphereBufferGeometry(4, 32, 16);
//   var skyBallMat = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: cubeCamera.renderTarget.texture, refractionRatio: 0.95 });

//   skyBallMesh = new THREE.Mesh(skyBallGeo, skyBallMat);
//   skyBallMesh.position.y = 12;

//   scene.add(skyBallMesh);

//   var skyBallShape = new Ammo.btSphereShape(4);
//   ballShape.setMargin(margin);
//   pos.set(0, 12, 0);
//   quat.set(0, 0, 0, 1);
//   createRigidBody(skyBallMesh, skyBallShape, 0, pos, quat);
//   skyBallMesh.userData.physicsBody.setFriction(0.5);
// }

function createParalellepiped(sx, sy, sz, mass, pos, quat, material) {

  var threeObject = new THREE.Mesh(new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1), material);
  var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
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

//   scene.add(object);

  if (mass > 0) {

    rigidBodies.push(object);

    // Disable deactivation
    body.setActivationState(4);

  }

  physicsWorld.addRigidBody(body);

  return body;

}

function throw_ball(){

        // Creates a ball and throws it
        var ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
        var ballMass = 35;
        var ballRadius = 20;
        
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


        
}

// function createMaterial() {
//   return new THREE.MeshPhongMaterial({ color: Math.floor(Math.random() * (1 << 24)) });
// }

// function generateNewSphere() {

//   var threeObject = null;
//   var shape = null;

//   var objectSize = 2;
//   var margin = 0.05;

//   // Sphere
//   var radius = 1 + Math.random() * objectSize;
//   // threeObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 20, 20), createMaterial());

//   var material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: scene.background, refractionRatio: 0.5 });
//   material.envMap.mapping = THREE.CubeRefractionMapping;

//   threeObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 20, 20), material);
//   shape = new Ammo.btSphereShape(radius);
//   shape.setMargin(margin);


//   threeObject.position.set(Math.random() - 0.5, objectSize + 25, Math.random() - 0.5);

//   var mass = 0.1;
//   createRigidBody(threeObject, shape, mass, threeObject.position, new THREE.Quaternion(0, 0, 0, 1));

// }

// function initInput() {

//   // keyboard control of arm
//   window.addEventListener('keydown', function (event) {

//     switch (event.keyCode) {

//       // Q
//       case 81:
//         armMovement = 1;
//         break;

//       // A
//       case 65:
//         armMovement = - 1;
//         break;

//       // S
//       case 83:
//         armMovement = 0;
//         break;

//       case 87:
//         generateNewSphere();
//         console.log(GEN.test(rigidBodies));
//         break;

//     }

//   }, false);

//   window.addEventListener('keyup', function () {

//     // armMovement = 0;

//   }, false);

//   // mouse control of shooting
//   window.addEventListener('mousedown', function (event) {

//     // triggered by right button
//     if (event.which != 3) {
//       return;
//     }
//     mouseCoords.set(
//       (event.clientX / window.innerWidth) * 2 - 1,
//       - (event.clientY / window.innerHeight) * 2 + 1
//     );

//     raycaster.setFromCamera(mouseCoords, camera);

//     // Creates a ball and throws it
//     var ballMass = 35;
//     var ballRadius = 0.4;

//     var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 14, 10), ballMaterial);
//     ball.castShadow = true;
//     ball.receiveShadow = true;
//     var ballShape = new Ammo.btSphereShape(ballRadius);
//     ballShape.setMargin(margin);

//     var pos = new THREE.Vector3();
//     var quat = new THREE.Quaternion();
//     pos.copy(raycaster.ray.direction);
//     pos.add(raycaster.ray.origin);
//     quat.set(0, 0, 0, 1);
//     var ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);

//     var vel = new THREE.Vector3();
//     vel.copy(raycaster.ray.direction);
//     vel.multiplyScalar(50);
//     ballBody.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));

//   }, false);
// }

// function onWindowResize() {

//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();

//   renderer.setSize(window.innerWidth, window.innerHeight);

// }

// function animate() {

//   requestAnimationFrame(animate);

//   render();
//   stats.update();

// }

// function render() {

//   var deltaTime = clock.getDelta();

//   updatePhysics(deltaTime);

//   skyBallMesh.visible = false;
//   cubeCamera.update(renderer, scene);
//   skyBallMesh.visible = true;

//   renderer.render(scene, camera);

// }

function updatePhysics(deltaTime) {

  // Hinge control
//   hinge.enableAngularMotor(true, 1.5 * armMovement, 50);

  // Step world
  physicsWorld.stepSimulation(deltaTime, 10);

  // Update rope
//   var softBody = rope.userData.physicsBody;
//   var ropePositions = rope.geometry.attributes.position.array;
//   var numVerts = ropePositions.length / 3;
//   var nodes = softBody.get_m_nodes();
//   var indexFloat = 0;
//   for (var i = 0; i < numVerts; i++) {

//     var node = nodes.at(i);
//     var nodePos = node.get_m_x();
//     ropePositions[indexFloat++] = nodePos.x();
//     ropePositions[indexFloat++] = nodePos.y();
//     ropePositions[indexFloat++] = nodePos.z();

//   }
//   rope.geometry.attributes.position.needsUpdate = true;

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
//   softBody = cloth.userData.physicsBody;
//   var clothPositions = cloth.geometry.attributes.position.array;
//   numVerts = clothPositions.length / 3;
//   nodes = softBody.get_m_nodes();
//   indexFloat = 0;
//   for (var i = 0; i < numVerts; i++) {

//     var node = nodes.at(i);
//     var nodePos = node.get_m_x();
//     clothPositions[indexFloat++] = nodePos.x();
//     clothPositions[indexFloat++] = nodePos.y();
//     clothPositions[indexFloat++] = nodePos.z();

//   }
//   cloth.geometry.computeVertexNormals();
//   cloth.geometry.attributes.position.needsUpdate = true;
//   cloth.geometry.attributes.normal.needsUpdate = true;

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
