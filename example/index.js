import { Recorder, RecorderStatus, Encoders } from "../index.js";

import createCanvasContext from "canvas-context";
import createPexContext from "pex-context";
import { create as createColor, fromHex } from "pex-color";
import { Pane } from "tweakpane";
import { toBlobURL } from "@ffmpeg/util";

import { vert, frag } from "./shaders.js";

const params = new URLSearchParams(window.location.search);

const pixelRatio = devicePixelRatio;
const width = 512;
const height = 512;

// GUI
const CONFIG = {
  extension: "mp4",
  encoder: "",
  duration: 10,
  frameRate: 30,
  target: "in-browser",
  filename: "",
  rect: { x: 0, y: 0, z: width, w: height },
  contextType: "gl",
  ...Object.fromEntries(params.entries()),
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
pane.addBinding(CONFIG, "rect", {
  x: { step: 1, min: 0, max: width - 1 },
  y: { step: 1, min: 0, max: height - 1 },
  z: { step: 1, min: 1, max: width },
  w: { step: 1, min: 1, max: height },
});

pane.addBinding(CONFIG, "contextType", {
  options: ["2d", "gl"].map((value) => ({ text: value, value })),
});

const startButton = pane.addButton({ title: "Start Recording" });
const stopButton = pane.addButton({ title: "Stop Recording" });

// Utils
const getColor = (name) =>
  `${window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)}`;
const getPexColor = (name) => fromHex(createColor(), getColor(name));

// Setup
const { context, canvas } = createCanvasContext("2d", {
  width: width * pixelRatio,
  height: height * pixelRatio,
  contextAttributes: { willReadFrequently: true },
});
Object.assign(canvas.style, { width: `${width}px`, height: `${height}px` });

const element = document.querySelector(".Canvases");
element.appendChild(canvas);

const ctx = createPexContext({ width, height, pixelRatio, element });
const clearCmd = {
  pass: ctx.pass({ clearColor: getPexColor("dark") }),
};
const drawCmd = {
  pipeline: ctx.pipeline({ vert, frag }),
  attributes: {
    aPosition: ctx.vertexBuffer(Float32Array.of(-1, -1, 3, -1, -1, 3)), // Fullscreen triangle
  },
  uniforms: { uColor: getPexColor("accent") },
  count: 3,
};

const detailElement = document.querySelector(".Detail");

// Animation
let rAFId;
let canvasRecorder;

function render(canvasRecorder = {}) {
  const currentFrame = canvasRecorder.frame || 0;

  const t = currentFrame / canvasRecorder.frameTotal || Number.EPSILON;

  const width = canvas.width;
  const height = canvas.height;
  const x = width * 0.02;
  const y = height * 0.025;
  const fontSize = 12 * pixelRatio;
  const lineHeight = 1.6;

  // 2D
  {
    // Background
    context.clearRect(0, 0, width, height);
    context.fillStyle = getColor("dark");
    context.fillRect(0, 0, width, height);

    // Interpolated element
    context.save();
    context.translate(width * 0.5, height * 0.5);
    context.scale(t, t);
    context.fillStyle = getColor("accent");
    context.fillRect(-width * 0.5, -height * 0.5, width, height);
    context.restore();

    // Frame text
    const text = currentFrame;
    context.font = `${fontSize}px Monaco`;
    context.textBaseline = "top";
    context.fillStyle = getColor("light");
    context.fillText(text, x, y);
  }

  // WebGL
  {
    ctx.submit(clearCmd);
    ctx.submit(drawCmd, {
      uniforms: {
        uProgress: t,
        uTextValue: currentFrame,
        uTextPosition: [x, height - y - (fontSize / 2) * lineHeight],
      },
    });
  }
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

const initRecorder = async (encoderName) => {
  await reset();

  // const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.4/dist/esm";

  let encoderOptions = {};
  if (encoderName === "FFmpegEncoder") {
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

  const { contextType, rect, ...configOptions } = CONFIG;

  canvasRecorder = new Recorder(contextType === "2d" ? context : ctx.gl, {
    name: `canvas-record-example-${encoderName || "default"}-${contextType}`,
    ...configOptions,
    rect: [rect.x, rect.y, rect.z, rect.w],
    encoder: encoderName ? new Encoders[`${encoderName}`]() : null,
    debug: true,
    encoderOptions,
  });

  console.log(canvasRecorder);
};

const start = async (encoderName) => {
  await initRecorder(encoderName);

  // Start and initialize
  await canvasRecorder.start({ filename: CONFIG.filename, initOnly: true });

  // Animate to start encoding
  tick(canvasRecorder);
};

startButton.on("click", async () => {
  await start(CONFIG.encoder);
});

stopButton.on("click", async () => {
  reset();
});

reset();
render();

// Test
const id = params.get("id");

if (id === "test") {
  for (let Encoder of Object.values(Encoders)) {
    const extensions = Encoder.supportedExtensions;

    const encoderName = Encoder.name;

    if (encoderName === "Encoder" || encoderName === "FrameEncoder") continue;

    for (let extension of extensions) {
      CONFIG.extension = extension;

      await start(encoderName);

      // Await for recording
      await new Promise(async (resolve) => {
        while (canvasRecorder.status !== RecorderStatus.Stopped) {
          await new Promise((r) => setTimeout(r, 1));
        }
        resolve();
      });
    }
  }
}
