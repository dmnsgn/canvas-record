const createCanvasRecorder = require("./");
const createCanvasContext = require("canvas-context");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const width = 100;
const height = 100;
const { context, canvas } = createCanvasContext("2d", {
  width,
  height
});

document.body.appendChild(canvas);
document.body.style.display = "flex";
document.body.style.flexDirection = "column";
document.body.style.alignItems = "center";

context.fillRect(0, 0, width, height);

const button = document.createElement("button");
button.style.marginTop = "10px";
button.innerText = "Takes videos";
document.body.appendChild(button);

// Animation
const DURATION = 3000;
let rAFId;
let currentFrame;
let rotation;

function render() {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "white";
  context.fillText(`Frame: ${currentFrame}`, 10, 20);

  context.save();
  context.translate(width * 0.5, height * 0.5);
  context.rotate(rotation * Math.PI * 2);
  context.fillStyle = "salmon";
  context.fillRect(-10, -10, 20, 20);
  context.restore();
}

function animate(idealFPS = 60, canvasRecorder = null, onComplete) {
  if (canvasRecorder) {
    canvasRecorder.step();
  }

  currentFrame++;
  rotation += 0.001;

  render(currentFrame, rotation);

  const dt = currentFrame / ((DURATION / 1000) * idealFPS);

  if (dt >= 1) {
    if (onComplete) onComplete();
  } else {
    rAFId = requestAnimationFrame(() =>
      animate(idealFPS, canvasRecorder, onComplete)
    );
  }
}

function reset() {
  currentFrame = 0;
  rotation = 0;
  render(currentFrame, rotation);
}

// Tests
async function recordRafDefaultFrameRate() {
  const canvasRecorder = createCanvasRecorder(canvas, {
    filename: "canvas-record-default-fps.mkv"
  });

  rAFId = requestAnimationFrame(() => {
    canvasRecorder.start();
    animate();
  });
  await sleep(DURATION);
  cancelAnimationFrame(rAFId);

  canvasRecorder.stop();
  canvasRecorder.dispose();
}

async function recordRafStep() {
  const canvasRecorder = createCanvasRecorder(canvas, {
    filename: "canvas-record-raf-step.mkv",
    frameRate: 0
  });

  return new Promise(resolve => {
    rAFId = requestAnimationFrame(() => {
      canvasRecorder.start();
      animate(60, canvasRecorder, () => {
        cancelAnimationFrame(rAFId);

        canvasRecorder.stop();
        canvasRecorder.dispose();
        resolve();
      });
    });
  });
}

async function recordRafLowFPS() {
  const canvasRecorder = createCanvasRecorder(canvas, {
    filename: "canvas-record-low-fps.mkv",
    frameRate: 10
  });

  return new Promise(resolve => {
    rAFId = requestAnimationFrame(() => {
      canvasRecorder.start();
      animate(10, null, () => {
        cancelAnimationFrame(rAFId);

        canvasRecorder.stop();
        canvasRecorder.dispose();
        resolve();
      });
    });
  });
}

async function recordDefaultWebM() {
  const canvasRecorder = createCanvasRecorder(canvas, {
    filename: "canvas-record-default-webm.webm"
  });

  rAFId = requestAnimationFrame(() => {
    canvasRecorder.start();
    animate();
  });
  await sleep(DURATION);
  cancelAnimationFrame(rAFId);

  canvasRecorder.stop();
  canvasRecorder.dispose();
}

button.addEventListener("click", async () => {
  await recordRafDefaultFrameRate();
  reset();
  await recordRafStep();
  reset();
  await recordRafLowFPS();
  reset();
  await recordDefaultWebM();
});

reset();
render();
