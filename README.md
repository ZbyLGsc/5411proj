# 5411 final project

## System Requirement
Desktop of Windows, MacOS or Ubuntu, with Google Chrome browser installed, meanwhile enabling WebGL 2.0.
## Usage

Start a local server to host the page:

```
cd PATH_OF_5411PROJ

python -m SimpleHTTPServer (on Ubuntu and MacOS)
python -m http.server (on Windows)
```

Then in a browser (Chrome) open the url:
```
http://localhost:8000/index.html
```

Then you should see the scene.

Press "Q", "W", "A", "S","D","Z" to move the position of the camera upward, forward, left, backward, right and downward respectively.

To change the viewing direction of the camera, use "up", "down" to change the pitch angle, and use "left", "right"
to change the yaw angle.

Click the left mouse button to shoot the ball. There can be at most 2 moving balls inside the scene. 
Clicking when there are already two balls in the scene will be ignored.