// scene/demo-specific variables go here
var EPS_intersect;
var sceneIsDynamic = true;
var camFlightSpeed = 300;
var sunAngle = 0;
var sunDirection = new THREE.Vector3();
var tallBoxGeometry, tallBoxMaterial, tallBoxMesh;
var shortBoxGeometry, shortBoxMaterial, shortBoxMesh;

// Physics variables
var gravityConstant = - 980;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var softBodySolver;
var physicsWorld;
var rigidBodies = [];
var margin = 0.05;
var transformAux1;
var shootSphere1;
var shootSphere2;

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
        shortBoxMesh.position.set(0, 300, -2500);
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
                uMovableSpherePos1: { type: "v3", value: new THREE.Vector3(0.0, -2000.0, -500.0) },
                uMovableSpherePos2: { type: "v3", value: new THREE.Vector3(0.0, -2000.0, -500.0) }
                // uMovableSpherePos: { type: "v3", value: new THREE.Vector3(0.0, 200.0, -500.0) }
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

function createSphere(radius, mass, pos, quat, material) {
        var threeObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 20, 20), material);
        var shape = new Ammo.btSphereShape(radius);
        shape.setMargin(margin);
        createRigidBody(threeObject, shape, mass, pos, quat);
        return threeObject;
}

function createCone(radius, height, mass, pos, quat, material) {
        var threeObject = new THREE.Mesh(new THREE.ConeBufferGeometry(radius, height, 20, 2), material);
        var shape = new Ammo.btConeShape(radius, height);
        shape.setMargin(margin);
        createRigidBody(threeObject, shape, mass, pos, quat);
        return threeObject;
}

function createCylinder(radius, height, mass, pos, quat, material) {
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
        body.setFriction(0.0);
        body.setRestitution(0.9);

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


function createPhysicsObjects() {

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
        var top = createParalellepiped(3000, 20, 3500, 0, new THREE.Vector3(0, 500, -3100 * 0.5), quat, baseMaterialRed);

        // boxes of the glsl's boxes
        var box0 = createParalellepiped(164, 340, 160, 0, new THREE.Vector3(180, 170, -350), new THREE.Quaternion(0, Math.sin(Math.PI * 0.1), 0, Math.cos(Math.PI * 0.1)), baseMaterialYel);
        var box1 = createParalellepiped(172, 170, 160, 0, new THREE.Vector3(0, 300, -2500), new THREE.Quaternion(0, Math.sin(-Math.PI * 0.05), 0, Math.cos(-Math.PI * 0.05)), baseMaterialGreen);

        // spheres
        var sphere0 = createSphere(80, 0, new THREE.Vector3(500, 270, -2000), quat, baseMaterialRed);
        var sphere1 = createSphere(100, 0, new THREE.Vector3(-400, 190, -1000), quat, baseMaterialGreen);
        var sphere2 = createSphere(70, 0, new THREE.Vector3(-700, 100, -300), quat, baseMaterialYel);

        // cones 
        var cone0 = createCone(150, 280, 0, new THREE.Vector3(-500, 360, -2300), new THREE.Quaternion(Math.sin(Math.PI * 0.5), 0, 0, Math.cos(Math.PI * 0.5)), baseMaterialRed);
        var cone1 = createCone(400, 250, 0, new THREE.Vector3(500, 175, -1200), quat, baseMaterialRed);
        var cone1 = createCone(150, 120, 0, new THREE.Vector3(600, 340, -2700), new THREE.Quaternion(Math.sin(Math.PI * 0.5), 0, 0, Math.cos(Math.PI * 0.5)), baseMaterialRed);

        // cylinders
        createCylinder(50.0, 510, 0, new THREE.Vector3(-400, 245, -1800), quat, baseMaterialRed);
        createCylinder(50.0, 510, 0, new THREE.Vector3(0, 245, -1500), quat, baseMaterialRed);
        createCylinder(50.0, 510, 0, new THREE.Vector3(50, 245, -700), quat, baseMaterialRed);
        createCylinder(50.0, 510, 0, new THREE.Vector3(500, 245, -700), quat, baseMaterialRed);

        // allocate two spheres for shooting
        shootSphere1 = createSphere(40, 35, new THREE.Vector3(0, -2000, 0), quat, baseMaterialRed);
        shootSphere2 = createSphere(40, 35, new THREE.Vector3(0, -2000, 0), quat, baseMaterialRed);

        window.addEventListener('mousedown', function (event) {

                // var cur_height = pathTracingUniforms.uMovableSpherePos.value.y;
                // if (cur_height < -100) {
                //         // triggered by right button
                //         if (event.which != 1) {
                //                 return;
                //         }
                //         mouseCoords.set(
                //                 (event.clientX / window.innerWidth) * 2 - 1,
                //                 - (event.clientY / window.innerHeight) * 2 + 1
                //         );
                //         raycaster.setFromCamera(mouseCoords, worldCamera);

                //         // Creates a ball and throws it
                //         var ballMass = 35;
                //         var ballRadius = 40;
                //         var ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius, 14, 10), new THREE.MeshPhongMaterial({ color: 0x202020 }));
                //         var ballShape = new Ammo.btSphereShape(ballRadius);
                //         ballShape.setMargin(margin);

                //         var pos = new THREE.Vector3();
                //         var quat = new THREE.Quaternion();
                //         pos.copy(raycaster.ray.direction);
                //         pos.add(raycaster.ray.origin);
                //         quat.set(0, 0, 0, 1);
                //         var ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);
                //         var vel = new THREE.Vector3();
                //         vel.copy(raycaster.ray.direction);
                //         vel.multiplyScalar(3000);
                //         ballBody.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));

                //         console.log("change9");
                // }

                // get the shooting direction and velocity
                if (event.which != 1) {
                        return;
                }
                mouseCoords.set(
                        (event.clientX / window.innerWidth) * 2 - 1,
                        - (event.clientY / window.innerHeight) * 2 + 1
                );
                raycaster.setFromCamera(mouseCoords, worldCamera);
                var pos = new THREE.Vector3();
                var quat = new THREE.Quaternion();
                pos.copy(raycaster.ray.direction);
                pos.add(raycaster.ray.origin);
                var vel = new THREE.Vector3();
                vel.copy(raycaster.ray.direction);
                vel.multiplyScalar(3000);

                var spherePhys1 = shootSphere1.userData.physicsBody;
                var ms = spherePhys1.getMotionState();
                if (ms) {
                        ms.getWorldTransform(transformAux1);
                        var p = transformAux1.getOrigin();
                        if (p.y() < -100) {
                                var transform = new Ammo.btTransform();
                                transform.setIdentity();
                                transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
                                transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
                                var motionState = new Ammo.btDefaultMotionState(transform);
                                spherePhys1.setMotionState(motionState);
                                spherePhys1.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
                                shootSphere1.userData.physicsBody = spherePhys1;
                        } else {
                                var spherePhys2 = shootSphere2.userData.physicsBody;
                                ms = spherePhys2.getMotionState();
                                if (ms) {
                                        ms.getWorldTransform(transformAux1);
                                        p = transformAux1.getOrigin();
                                        if (p.y() < -100) {
                                                var transform = new Ammo.btTransform();
                                                transform.setIdentity();
                                                transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
                                                transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
                                                var motionState = new Ammo.btDefaultMotionState(transform);
                                                spherePhys2.setMotionState(motionState);
                                                spherePhys2.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
                                                shootSphere2.userData.physicsBody = spherePhys2;
                                        }
                                }
                        }
                }



        }, false);

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
                        if (i >= il - 1) {
                                pathTracingUniforms.uMovableSpherePos.value.x = p.x();
                                pathTracingUniforms.uMovableSpherePos.value.y = p.y();
                                pathTracingUniforms.uMovableSpherePos.value.z = p.z();
                        }
                }
        }

        var objPhys = shootSphere1.userData.physicsBody;
        var ms = objPhys.getMotionState();
        if (ms) {
                ms.getWorldTransform(transformAux1);
                var p = transformAux1.getOrigin();
                pathTracingUniforms.uMovableSpherePos1.value.x = p.x();
                pathTracingUniforms.uMovableSpherePos1.value.y = p.y();
                pathTracingUniforms.uMovableSpherePos1.value.z = p.z();
        }

        objPhys = shootSphere2.userData.physicsBody;
        ms = objPhys.getMotionState();
        if (ms) {
                ms.getWorldTransform(transformAux1);
                var p = transformAux1.getOrigin();
                pathTracingUniforms.uMovableSpherePos2.value.x = p.x();
                pathTracingUniforms.uMovableSpherePos2.value.y = p.y();
                pathTracingUniforms.uMovableSpherePos2.value.z = p.z();
        }
}
