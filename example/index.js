import { Recorder, RecorderStatus, Encoders } from "../index.js";

import createCanvasContext from "canvas-context";
import { Pane } from "tweakpane";

// GUI
const CONFIG = {
  extension: "mp4",
  encoder: "",
  duration: 10,
  frameRate: 30,
  target: "in-browser",
  filename: "",
  ...Object.fromEntries(new URLSearchParams(window.location.search).entries()),
};
const pane = new Pane();
pane.addInput(CONFIG, "extension", {
  options: Array.from(
    new Set(
      Object.values(Encoders)
        .map((Encoder) => Encoder.supportedExtensions)
        .flat()
    )
  ).map((value) => ({ text: value, value })),
});
pane.addInput(CONFIG, "encoder", {
  options: Object.keys(Encoders)
    .map((e) => (e === "Encoder" ? "" : e))
    .map((value) => ({ text: value, value })),
});
pane.addInput(CONFIG, "target", {
  options: Array.from(
    new Set(
      Object.values(Encoders)
        .map((Encoder) => Encoder.supportedTargets)
        .flat()
    )
  ).map((value) => ({ text: value, value })),
});
pane.addInput(CONFIG, "duration", { step: 1, min: 1, max: 30 });
pane.addInput(CONFIG, "frameRate", { step: 1, min: 1, max: 30 });
pane.addInput(CONFIG, "filename");

const startButton = pane.addButton({ title: "Start Recording" });
const stopButton = pane.addButton({ title: "Stop Recording" });

// Setup
const pixelRatio = devicePixelRatio;
const width = 512;
const height = 512;
const { context, canvas } = createCanvasContext("2d", {
  width: width * pixelRatio,
  height: height * pixelRatio,
  contextAttributes: { willReadFrequently: true },
});
Object.assign(canvas.style, { width: `${width}px`, height: `${height}px` });

const mainElement = document.querySelector("main");
mainElement.appendChild(canvas);

const detailElement = document.querySelector(".Detail");

// Animation
let rAFId;
let canvasRecorder;

const getColor = (name) =>
  `${window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)}`;

function render(canvasRecorder = {}) {
  const width = canvas.width;
  const height = canvas.height;

  // Background
  context.clearRect(0, 0, width, height);
  context.fillStyle = getColor("dark");
  context.fillRect(0, 0, width, height);

  // Interpolated element
  const t = canvasRecorder.frame / canvasRecorder.frameTotal || Number.EPSILON;
  context.save();
  context.translate(width * 0.5, height * 0.5);
  context.scale(t, t);
  context.fillStyle = getColor("accent");
  context.fillRect(-width * 0.5, -height * 0.5, width, height);
  context.restore();

  // Frame text
  const text = `Frame: ${canvasRecorder.frame || 0}`;
  const x = width * 0.02;
  const y = height * 0.025;
  const fontSize = 12 * pixelRatio;
  const lineHeight = 1.6;
  context.font = `${fontSize}px Monaco`;
  context.textBaseline = "top";
  const { width: textWidth } = context.measureText(text);

  context.fillStyle = getColor("accent");
  context.fillRect(
    0,
    y - ((lineHeight - 1) / 2) * fontSize,
    x + textWidth + x,
    fontSize * lineHeight
  );

  context.fillStyle = getColor("light");
  context.fillText(text, x, y);
}

const updateStatus = () => {
  if (canvasRecorder && canvasRecorder.stats?.detail) {
    detailElement.innerHTML = `Status: ${Object.keys(RecorderStatus).find(
      (key) => RecorderStatus[key] === canvasRecorder.status
    )}\nDetails:\n${canvasRecorder.stats.detail}`;
  }
};

const tick = async () => {
  render(canvasRecorder);

  if (canvasRecorder.status !== RecorderStatus.Recording) return;
  await canvasRecorder.step();
  updateStatus();

  if (canvasRecorder.status !== RecorderStatus.Stopped) {
    rAFId = requestAnimationFrame(() => tick());
  }
};

const reset = async () => {
  if (rAFId) {
    cancelAnimationFrame(rAFId);
    rAFId = null;
  }
  if (canvasRecorder) {
    await canvasRecorder.stop();
    await canvasRecorder.dispose();
    canvasRecorder = null;
  }

  render();
};

startButton.on("click", async () => {
  await reset();

  canvasRecorder = new Recorder(context, {
    name: `canvas-record-example-${CONFIG.encoder || "default"}`,
    ...CONFIG,
    encoder: CONFIG.encoder ? new Encoders[`${CONFIG.encoder}`]() : null,
    debug: true,
    encoderOptions: {
      corePath: new URL(
        "./assets/@ffmpeg/core/dist/ffmpeg-core.js",
        import.meta.url
      ).toString(),
    },
  });
  console.log(canvasRecorder);

  // Start and encode frame 0
  await canvasRecorder.start({ filename: CONFIG.filename });

  // Animate to encode the rest
  tick(canvasRecorder);
});

stopButton.on("click", async () => {
  reset();
});

reset();
render();
