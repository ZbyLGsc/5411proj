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

        /* Boxes that needed by the pathTracingScene */
        tallBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
        tallBoxMaterial = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0.95, 0.95, 0.95), //RGB, ranging from 0.0 - 1.0
                roughness: 1.0 // ideal Diffuse material	
        });

        tallBoxMesh = new THREE.Mesh(tallBoxGeometry, tallBoxMaterial);
        pathTracingScene.add(tallBoxMesh);
        tallBoxMesh.visible = true; // disable normal Three.js rendering updates of this object: 
        // it is just a data placeholder as well as an Object3D that can be transformed/manipulated by 
        // using familiar Three.js library commands. It is then fed into the GPU path tracing renderer
        // through its 'matrixWorld' matrix. See below:
        tallBoxMesh.rotation.set(0, Math.PI * 0.1, 0);
        tallBoxMesh.position.set(180, 170, -350);
        tallBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update

        shortBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
        shortBoxMaterial = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(0.95, 0.95, 0.95), //RGB, ranging from 0.0 - 1.0
                roughness: 1.0 // ideal Diffuse material	
        });

        shortBoxMesh = new THREE.Mesh(shortBoxGeometry, shortBoxMaterial);
        pathTracingScene.add(shortBoxMesh);
        shortBoxMesh.visible = false;
        shortBoxMesh.rotation.set(0, -Math.PI * 0.09, 0);
        shortBoxMesh.position.set(370, 85, -170);
        shortBoxMesh.updateMatrixWorld(true); // 'true' forces immediate matrix update

        // set camera's field of view
        worldCamera.fov = 60;
        focusDistance = 1180.0;

        // position and orient camera
        cameraControlsObject.position.set(278, 270, 1050);
        ///cameraControlsYawObject.rotation.y = 0.0;
        // look slightly upward
        cameraControlsPitchObject.rotation.x = 0.005;

        PerlinNoiseTexture = new THREE.TextureLoader().load('textures/perlin256.png');
        PerlinNoiseTexture.wrapS = THREE.RepeatWrapping;
        PerlinNoiseTexture.wrapT = THREE.RepeatWrapping;
        PerlinNoiseTexture.flipY = false;
        PerlinNoiseTexture.minFilter = THREE.LinearFilter;
        PerlinNoiseTexture.magFilter = THREE.LinearFilter;
        PerlinNoiseTexture.generateMipmaps = false;

} // end function initSceneData()



// called automatically from within initTHREEjs() function
function initPathTracingShaders() {

        /* array of vectors */

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
                uTallBoxNormalMatrix: { type: "m3", value: new THREE.Matrix3() },
                uTestHeight: { type: "f", value: 10 },
                uMovableSpherePos: { type: "v3", value: new THREE.Vector3(0.0, 0.0, -2000.0)}
                

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

function createPhysicsObjects() {
        
        /* Add physical objects into the scene */

        // sphere
        var pos = new THREE.Vector3();
        var quat = new THREE.Quaternion();

        var ballMass = 15;
        var ballRadius = 90;
        var sphere_mat = new THREE.MeshBasicMaterial({ color: 0xffffff, refractionRatio: 0.1 });
        // sphere_mat.envMap.mapping = THREE.CubeRefractionMapping;
        var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 20, 20), sphere_mat);
        ball.castShadow = true;
        ball.receiveShadow = true;

        var ballShape = new Ammo.btSphereShape(ballRadius);
        ballShape.setMargin(margin);
        pos.set(180, 500, -350);
        quat.set(0, 0, 0, 1);
        createRigidBody(ball, ballShape, ballMass, pos, quat);
        ball.userData.physicsBody.setFriction(0.5);

        console.log("init objects for physical simulation");
}


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

        if (!cameraIsMoving) {
                sampleCounter += 1.0; // for progressive refinement of image
                if (sceneIsDynamic)
                        sampleCounter = 1.0; // reset for continuous updating of image

                frameCounter += 1.0;
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
        pathTracingUniforms.uRandomVector.value.copy(randomVector.set(Math.random(), Math.random(), Math.random()));
        pathTracingUniforms.uTestHeight.value = pathTracingUniforms.uTestHeight.value + 1;
        // console.log(pathTracingUniforms.uTestHeight.value);

        //BOXES
        pathTracingUniforms.uTallBoxInvMatrix.value.getInverse(tallBoxMesh.matrixWorld);
        pathTracingUniforms.uTallBoxNormalMatrix.value.getNormalMatrix(tallBoxMesh.matrixWorld);
        pathTracingUniforms.uShortBoxInvMatrix.value.getInverse(shortBoxMesh.matrixWorld);
        pathTracingUniforms.uShortBoxNormalMatrix.value.getNormalMatrix(shortBoxMesh.matrixWorld);

        // CAMERA
        if (cameraControlsObject.position.y < 2.0)
                pathTracingUniforms.uCameraUnderWater.value = 1.0;
        else
                pathTracingUniforms.uCameraUnderWater.value = 0.0;
        cameraControlsObject.updateMatrixWorld(true);
        pathTracingUniforms.uCameraMatrix.value.copy(worldCamera.matrixWorld);
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

function throw_ball() {

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


function updatePhysics(deltaTime) {

        // Hinge control
        //   hinge.enableAngularMotor(true, 1.5 * armMovement, 50);

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
