import { Recorder, RecorderStatus, Encoders } from "../index.js";

import createCanvasContext from "canvas-context";
import { Pane } from "tweakpane";
import { toBlobURL } from "@ffmpeg/util";

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
pane.addBinding(CONFIG, "extension", {
  options: Array.from(
    new Set(
      Object.values(Encoders)
        .map((Encoder) => Encoder.supportedExtensions)
        .flat(),
    ),
  ).map((value) => ({ text: value, value })),
});
pane.addBinding(CONFIG, "encoder", {
  options: Object.keys(Encoders)
    .map((e) => (e === "Encoder" ? "" : e))
    .map((value) => ({ text: value, value })),
});
pane.addBinding(CONFIG, "target", {
  options: Array.from(
    new Set(
      Object.values(Encoders)
        .map((Encoder) => Encoder.supportedTargets)
        .flat(),
    ),
  ).map((value) => ({ text: value, value })),
});
pane.addBinding(CONFIG, "duration", { step: 1, min: 1, max: 30 });
pane.addBinding(CONFIG, "frameRate", { step: 1, min: 1, max: 60 });
pane.addBinding(CONFIG, "filename");

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
    fontSize * lineHeight,
  );

  context.fillStyle = getColor("light");
  context.fillText(text, x, y);
}

const updateStatus = () => {
  if (canvasRecorder && canvasRecorder.stats?.detail) {
    detailElement.innerHTML = `Status: ${Object.keys(RecorderStatus).find(
      (key) => RecorderStatus[key] === canvasRecorder.status,
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

  // const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.4/dist/esm";

  let encoderOptions = {};
  console.log(CONFIG.encoder);
  if (CONFIG.encoder === "FFmpegEncoder") {
    encoderOptions = {
      // FFmpeg requires more effort...
      coreURL: new URL(
        "../web_modules/@ffmpeg/core.js",
        import.meta.url,
      ).toString(),
      // ...and 32MB of wasm to be fetch so maybe let's keep fetching from unpkg.
      // wasmURL: new URL("./ffmpeg-core.wasm", import.meta.url).toString(),

      // Defaults values are...
      // coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      // wasmURL: await toBlobURL(
      //   `${baseURL}/ffmpeg-core.wasm`,
      //   "application/wasm"
      // ),
      // workerURL: await toBlobURL(
      //   `${baseURL}/ffmpeg-core.worker.js`,
      //   "text/javascript"
      // ),

      // ...but need older version because it doesn't work in Chromium as Multi Threading is unstable.
      // coreURL: await toBlobURL(
      //   "https://unpkg.com/@ffmpeg/core@0.12.3/dist/esm/ffmpeg-core.js",
      //   "text/javascript"
      // ),
      wasmURL: await toBlobURL(
        "https://unpkg.com/@ffmpeg/core@0.12.3/dist/esm/ffmpeg-core.wasm",
        "application/wasm",
      ),
      // workerURL: await toBlobURL(
      //   "https://unpkg.com/@ffmpeg/ffmpeg@0.12.3/dist/esm/worker.js",
      //   "text/javascript"
      // ),
      // Good luck: https://github.com/ffmpegwasm/ffmpeg.wasm/issues
    };
  }

  canvasRecorder = new Recorder(context, {
    name: `canvas-record-example-${CONFIG.encoder || "default"}`,
    ...CONFIG,
    encoder: CONFIG.encoder ? new Encoders[`${CONFIG.encoder}`]() : null,
    debug: true,
    encoderOptions,
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
