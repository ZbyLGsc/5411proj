var SCREEN_WIDTH;
var SCREEN_HEIGHT;
var canvas, context;
var container, stats;
var controls;
var textureLoader;
var raycaster;
var mouseCoords;
var pathTracingScene, screenTextureScene, screenOutputScene;
var pathTracingUniforms, screenTextureUniforms, screenOutputUniforms;
var pathTracingDefines;
var pathTracingVertexShader, pathTracingFragmentShader;
var pathTracingGeometry, pathTracingMaterial, pathTracingMesh;
var screenTextureGeometry, screenTextureMaterial, screenTextureMesh;
var screenOutputGeometry, screenOutputMaterial, screenOutputMesh;
var pathTracingRenderTarget, screenOutputRenderTarget;
var quadCamera, worldCamera;
var renderer, clock;
var frameTime, elapsedTime;
var fovScale;
var increaseFOV = false;
var decreaseFOV = false;
var dollyCameraIn = false;
var dollyCameraOut = false;
var apertureSize = 0.0;
var increaseAperture = false;
var decreaseAperture = false;
var focusDistance = 132.0;
var increaseFocusDist = false;
var decreaseFocusDist = false;
var pixelRatio = 0.5;
var windowIsBeingResized = false;
var TWO_PI = Math.PI * 2;
var randomVector = new THREE.Vector3();
var sampleCounter = 1.0;
var frameCounter = 1.0;
var keyboard = new THREEx.KeyboardState();
var cameraIsMoving = false;
var cameraJustStartedMoving = false;
var cameraRecentlyMoving = false;
var isPaused = true;
var oldYawRotation, oldPitchRotation;
var oldDeltaX = 0,
        oldDeltaY = 0;
var newDeltaX = 0,
        newDeltaY = 0;
var mobileControlsMoveX = 0;
var mobileControlsMoveY = 0;
var stillFlagX = true,
        stillFlagY = true;
var oldPinchWidthX = 0;
var oldPinchWidthY = 0;
var pinchDeltaX = 0;
var pinchDeltaY = 0;
var fontAspect;
var useGenericInput = true;

// the following variables will be used to calculate rotations and directions from the camera
var cameraDirectionVector = new THREE.Vector3(); //for moving where the camera is looking
var cameraRightVector = new THREE.Vector3(); //for strafing the camera right and left
var cameraUpVector = new THREE.Vector3(); //for moving camera up and down
var cameraWorldQuaternion = new THREE.Quaternion(); //for rotating scene objects to match camera's current rotation
var cameraControlsObject; //for positioning and moving the camera itself
var cameraControlsYawObject; //allows access to control camera's left/right movements through mobile input
var cameraControlsPitchObject; //allows access to control camera's up/down movements through mobile input

var PI_2 = Math.PI / 2; //used by controls below

var infoElement = document.getElementById('info');
infoElement.style.cursor = "default";
infoElement.style.webkitUserSelect = "none";
infoElement.style.MozUserSelect = "none";

var cameraInfoElement = document.getElementById('cameraInfo');
cameraInfoElement.style.cursor = "default";
cameraInfoElement.style.webkitUserSelect = "none";
cameraInfoElement.style.MozUserSelect = "none";

var mouseControl = true;
var fileLoader = new THREE.FileLoader();



function onMouseWheel(event) {

        //event.preventDefault();
        event.stopPropagation();

        if (event.deltaY > 0) {

                increaseFOV = true;

        } else if (event.deltaY < 0) {

                decreaseFOV = true;

        }

}


function onWindowResize(event) {

        windowIsBeingResized = true;

        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        fontAspect = (SCREEN_WIDTH / 175) * (SCREEN_HEIGHT / 200);
        if (fontAspect > 25) fontAspect = 25;
        if (fontAspect < 4) fontAspect = 4;
        fontAspect *= 2;

        pathTracingUniforms.uResolution.value.x = context.drawingBufferWidth;
        pathTracingUniforms.uResolution.value.y = context.drawingBufferHeight;

        pathTracingRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);
        screenTextureRenderTarget.setSize(context.drawingBufferWidth, context.drawingBufferHeight);

        worldCamera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
        worldCamera.updateProjectionMatrix();

        // the following scales all scene objects by the worldCamera's field of view,
        // taking into account the screen aspect ratio and multiplying the uniform uULen,
        // the x-coordinate, by this ratio
        fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
        pathTracingUniforms.uVLen.value = Math.tan(fovScale);
        pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

        if (!mouseControl) {

                button1Element.style.display = "";
                button2Element.style.display = "";
                button3Element.style.display = "";
                button4Element.style.display = "";
                button5Element.style.display = "";
                button6Element.style.display = "";
                // check if mobile device is in portrait or landscape mode and position buttons accordingly
                if (SCREEN_WIDTH < SCREEN_HEIGHT) {

                        button1Element.style.right = 36 + "%";
                        button2Element.style.right = 2 + "%";
                        button3Element.style.right = 16 + "%";
                        button4Element.style.right = 16 + "%";
                        button5Element.style.right = 3 + "%";
                        button6Element.style.right = 3 + "%";

                        button1Element.style.bottom = 5 + "%";
                        button2Element.style.bottom = 5 + "%";
                        button3Element.style.bottom = 13 + "%";
                        button4Element.style.bottom = 2 + "%";
                        button5Element.style.bottom = 25 + "%";
                        button6Element.style.bottom = 18 + "%";

                } else {

                        button1Element.style.right = 22 + "%";
                        button2Element.style.right = 3 + "%";
                        button3Element.style.right = 11 + "%";
                        button4Element.style.right = 11 + "%";
                        button5Element.style.right = 3 + "%";
                        button6Element.style.right = 3 + "%";

                        button1Element.style.bottom = 10 + "%";
                        button2Element.style.bottom = 10 + "%";
                        button3Element.style.bottom = 26 + "%";
                        button4Element.style.bottom = 4 + "%";
                        button5Element.style.bottom = 48 + "%";
                        button6Element.style.bottom = 34 + "%";

                }

        } // end if ( !mouseControl ) {

} // end function onWindowResize( event )



function init() {

        window.addEventListener('resize', onWindowResize, false);

        initTHREEjs(); // boilerplate: init necessary three.js items and scene/demo-specific objects

} // end function init()



function initTHREEjs() {

        canvas = document.createElement('canvas');

        renderer = new THREE.WebGLRenderer({ canvas: canvas, context: canvas.getContext('webgl2') });
        //suggestion: set to false for production
        renderer.debug.checkShaderErrors = true;

        raycaster = new THREE.Raycaster();
        mouseCoords = new THREE.Vector2();

        context = renderer.getContext();

        renderer.autoClear = false;
        // 1 is full resolution, 0.5 is half, 0.25 is quarter, etc. (must be > than 0.0)
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        //required by WebGL 2.0 for rendering to FLOAT textures
        context.getExtension('EXT_color_buffer_float');

        container = document.getElementById('container');
        container.appendChild(renderer.domElement);

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.cursor = "default";
        stats.domElement.style.webkitUserSelect = "none";
        stats.domElement.style.MozUserSelect = "none";
        container.appendChild(stats.domElement);


        clock = new THREE.Clock();

        textureLoader = new THREE.TextureLoader();

        pathTracingScene = new THREE.Scene();
        screenTextureScene = new THREE.Scene();
        screenOutputScene = new THREE.Scene();

        // quadCamera is simply the camera to help render the full screen quad (2 triangles),
        // hence the name.  It is an Orthographic camera that sits facing the view plane, which serves as
        // the window into our 3d world. This camera will not move or rotate for the duration of the app.
        quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        screenTextureScene.add(quadCamera);
        screenOutputScene.add(quadCamera);

        // worldCamera is the dynamic camera 3d object that will be positioned, oriented and 
        // constantly updated inside the 3d scene.  Its view will ultimately get passed back to the 
        // stationary quadCamera, which renders the scene to a fullscreen quad (made up of 2 large triangles).
        worldCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        pathTracingScene.add(worldCamera);

        controls = new FirstPersonCameraControls(worldCamera);

        cameraControlsObject = controls.getObject();
        cameraControlsYawObject = controls.getYawObject();
        cameraControlsPitchObject = controls.getPitchObject();

        pathTracingScene.add(cameraControlsObject);

        // setup render targets...
        pathTracingRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * pixelRatio), (window.innerHeight * pixelRatio), {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType,
                depthBuffer: false,
                stencilBuffer: false
        });
        pathTracingRenderTarget.texture.generateMipmaps = false;

        screenTextureRenderTarget = new THREE.WebGLRenderTarget((window.innerWidth * pixelRatio), (window.innerHeight * pixelRatio), {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
                type: THREE.FloatType,
                depthBuffer: false,
                stencilBuffer: false
        });
        screenTextureRenderTarget.texture.generateMipmaps = false;


        // setup scene/demo-specific objects, variables, and data
        initSceneData();

        // setup screen-size quad geometry and shaders....

        // this full-screen quad mesh performs the path tracing operations and produces a screen-sized image
        pathTracingGeometry = new THREE.PlaneBufferGeometry(2, 2);
        initPathTracingShaders();

        // add objects for physical simulation
        createPhysicsObjects();

        // this full-screen quad mesh copies the image output of the pathtracing shader and feeds it back in to that shader as a 'previousTexture'
        screenTextureGeometry = new THREE.PlaneBufferGeometry(2, 2);

        screenTextureMaterial = new THREE.ShaderMaterial({
                uniforms: screenTextureShader.uniforms,
                vertexShader: screenTextureShader.vertexShader,
                fragmentShader: screenTextureShader.fragmentShader,
                depthWrite: false,
                depthTest: false
        });

        screenTextureMaterial.uniforms.tPathTracedImageTexture.value = pathTracingRenderTarget.texture;

        screenTextureMesh = new THREE.Mesh(screenTextureGeometry, screenTextureMaterial);
        screenTextureScene.add(screenTextureMesh);


        // this full-screen quad mesh takes the image output of the path tracing shader (which is a continuous blend of the previous frame and current frame),
        // and applies gamma correction (which brightens the entire image), and then displays the final accumulated rendering to the screen
        screenOutputGeometry = new THREE.PlaneBufferGeometry(2, 2);

        screenOutputMaterial = new THREE.ShaderMaterial({
                uniforms: screenOutputShader.uniforms,
                vertexShader: screenOutputShader.vertexShader,
                fragmentShader: screenOutputShader.fragmentShader,
                depthWrite: false,
                depthTest: false
        });

        screenOutputMaterial.uniforms.tPathTracedImageTexture.value = pathTracingRenderTarget.texture;

        screenOutputMesh = new THREE.Mesh(screenOutputGeometry, screenOutputMaterial);
        screenOutputScene.add(screenOutputMesh);

        // this 'jumpstarts' the initial dimensions and parameters for the window and renderer
        onWindowResize();

        // everything is set up, now we can start animating
        animate();

} // end function initTHREEjs()



function animate() {

        requestAnimationFrame(animate);

        frameTime = clock.getDelta();

        updatePhysics(frameTime);

        elapsedTime = clock.getElapsedTime() % 1000;

        // reset flags
        cameraIsMoving = false;
        cameraJustStartedMoving = false;
        if (windowIsBeingResized) {
                cameraIsMoving = true;
                windowIsBeingResized = false;
        }

        // this gives us a vector in the direction that the camera is pointing,
        // which will be useful for moving the camera 'forward' and shooting projectiles in that direction
        controls.getDirection(cameraDirectionVector);
        cameraDirectionVector.normalize();
        controls.getUpVector(cameraUpVector);
        controls.getRightVector(cameraRightVector);

        // the following gives us a rotation quaternion (4D vector), which will be useful for 
        // rotating scene objects to match the camera's rotation
        worldCamera.getWorldQuaternion(cameraWorldQuaternion);

        if (useGenericInput) {

                // allow flying camera
                if ((keyboard.pressed('W') || button3Pressed) && !(keyboard.pressed('S') || button4Pressed)) {

                        cameraControlsObject.position.add(cameraDirectionVector.multiplyScalar(camFlightSpeed * frameTime));
                        cameraIsMoving = true;
                }
                if ((keyboard.pressed('S') || button4Pressed) && !(keyboard.pressed('W') || button3Pressed)) {

                        cameraControlsObject.position.sub(cameraDirectionVector.multiplyScalar(camFlightSpeed * frameTime));
                        cameraIsMoving = true;
                }
                if ((keyboard.pressed('A') || button1Pressed) && !(keyboard.pressed('D') || button2Pressed)) {

                        cameraControlsObject.position.sub(cameraRightVector.multiplyScalar(camFlightSpeed * frameTime));
                        cameraIsMoving = true;
                }
                if ((keyboard.pressed('D') || button2Pressed) && !(keyboard.pressed('A') || button1Pressed)) {

                        cameraControlsObject.position.add(cameraRightVector.multiplyScalar(camFlightSpeed * frameTime));
                        cameraIsMoving = true;
                }
                if (keyboard.pressed('Q') && !keyboard.pressed('Z')) {

                        cameraControlsObject.position.add(cameraUpVector.multiplyScalar(camFlightSpeed * frameTime));
                        cameraIsMoving = true;
                }
                if (keyboard.pressed('Z') && !keyboard.pressed('Q')) {

                        cameraControlsObject.position.sub(cameraUpVector.multiplyScalar(camFlightSpeed * frameTime));
                        cameraIsMoving = true;
                }
                if ((keyboard.pressed('up') || button5Pressed) && !(keyboard.pressed('down') || button6Pressed)) {
                        cameraControlsPitchObject.rotation.x += 0.003;
                }
                if ((keyboard.pressed('down') || button6Pressed) && !(keyboard.pressed('up') || button5Pressed)) {
                        cameraControlsPitchObject.rotation.x -= 0.003;
                }
                if (keyboard.pressed('right') && !keyboard.pressed('left')) {
                        cameraControlsYawObject.rotation.y -= 0.003;
                }
                if (keyboard.pressed('left') && !keyboard.pressed('right')) {
                        cameraControlsYawObject.rotation.y += 0.003;
                }

                if (increaseFOV) {
                        worldCamera.fov++;
                        if (worldCamera.fov > 150)
                                worldCamera.fov = 150;
                        fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
                        pathTracingUniforms.uVLen.value = Math.tan(fovScale);
                        pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

                        cameraIsMoving = true;
                        increaseFOV = false;
                }
                if (decreaseFOV) {
                        worldCamera.fov--;
                        if (worldCamera.fov < 1)
                                worldCamera.fov = 1;
                        fovScale = worldCamera.fov * 0.5 * (Math.PI / 180.0);
                        pathTracingUniforms.uVLen.value = Math.tan(fovScale);
                        pathTracingUniforms.uULen.value = pathTracingUniforms.uVLen.value * worldCamera.aspect;

                        cameraIsMoving = true;
                        decreaseFOV = false;
                }

                if (increaseFocusDist) {
                        focusDistance += 1;
                        pathTracingUniforms.uFocusDistance.value = focusDistance;
                        cameraIsMoving = true;
                        increaseFocusDist = false;
                }
                if (decreaseFocusDist) {
                        focusDistance -= 1;
                        if (focusDistance < 1)
                                focusDistance = 1;
                        pathTracingUniforms.uFocusDistance.value = focusDistance;
                        cameraIsMoving = true;
                        decreaseFocusDist = false;
                }

                if (increaseAperture) {
                        apertureSize += 0.1;
                        if (apertureSize > 100.0)
                                apertureSize = 100.0;
                        pathTracingUniforms.uApertureSize.value = apertureSize;
                        cameraIsMoving = true;
                        increaseAperture = false;
                }
                if (decreaseAperture) {
                        apertureSize -= 0.1;
                        if (apertureSize < 0.0)
                                apertureSize = 0.0;
                        pathTracingUniforms.uApertureSize.value = apertureSize;
                        cameraIsMoving = true;
                        decreaseAperture = false;
                }

        } // end if (useGenericInput)


        // update scene/demo-specific input(if custom), variables and uniforms every animation frame
        updateVariablesAndUniforms();


        // RENDERING in 3 steps

        // STEP 1
        // Perform PathTracing and Render(save) into pathTracingRenderTarget, a full-screen texture.
        // Read previous screenTextureRenderTarget(via texelFetch inside fragment shader) to use as a new starting point to blend with
        renderer.setRenderTarget(pathTracingRenderTarget);
        renderer.render(pathTracingScene, worldCamera);

        // STEP 2
        // Render(copy) the pathTracingScene output(pathTracingRenderTarget above) into screenTextureRenderTarget.
        // This will be used as a new starting point for Step 1 above (essentially creating ping-pong buffers)
        renderer.setRenderTarget(screenTextureRenderTarget);
        renderer.render(screenTextureScene, quadCamera);

        // STEP 3
        // Render full screen quad with generated pathTracingRenderTarget in STEP 1 above.
        // After the image is gamma-corrected, it will be shown on the screen as the final accumulated output
        renderer.setRenderTarget(null);
        renderer.render(screenOutputScene, quadCamera);

        stats.update();

} // end function animate()
