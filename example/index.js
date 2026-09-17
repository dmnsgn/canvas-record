import { Recorder, RecorderStatus, Encoders } from "../index.js";

import createCanvasContext from "canvas-context";
import createPexContext from "pex-context";
import * as gpu from "pex-gpu";
import { create as createColor, fromHex } from "pex-color";
import { Pane } from "tweakpane";
import { toBlobURL } from "@ffmpeg/util";

import {
  drawSchotter2d,
  vert,
  debugGLSL,
  schotterFragGLSL,
  debugWGSL,
  schotterWGSL,
} from "./render.js";

const params = new URLSearchParams(location.search);

const pixelRatio = devicePixelRatio;
const width = 512;
const height = 512;
const drawWidth = width * pixelRatio;
const drawHeight = height * pixelRatio;

// GUI
const CONFIG = {
  extension: "mp4",
  encoder: "",
  duration: 10,
  frameRate: 30,
  target: "in-browser",
  filename: "",
  rect: { x: 0, y: 0, z: drawWidth, w: drawHeight },
  contextType: "webgl",
  transparent: false,
  ...Object.fromEntries(params),
};
const pane = new Pane();
pane.addBinding(CONFIG, "extension", {
  options: Array.from(
    new Set(
      Object.values(Encoders).flatMap((Encoder) => Encoder.supportedExtensions),
    ),
    (value) => ({ text: value, value }),
  ),
});
pane.addBinding(CONFIG, "encoder", {
  options: Object.keys(Encoders)
    .map((e) => (e === "Encoder" ? "" : e))
    .map((value) => ({ text: value, value })),
});
pane.addBinding(CONFIG, "target", {
  options: Array.from(
    new Set(
      Object.values(Encoders).flatMap((Encoder) => Encoder.supportedTargets),
    ),
    (value) => ({ text: value, value }),
  ),
});
pane.addBinding(CONFIG, "duration", { step: 1, min: 1, max: 30 });
pane.addBinding(CONFIG, "frameRate", { step: 1, min: 1, max: 60 });
pane.addBinding(CONFIG, "filename");
pane.addBinding(CONFIG, "rect", {
  x: { step: 1, min: 0, max: drawWidth - 1 },
  y: { step: 1, min: 0, max: drawHeight - 1 },
  z: { step: 1, min: 1, max: drawWidth },
  w: { step: 1, min: 1, max: drawHeight },
});

pane.addBinding(CONFIG, "contextType", {
  options: ["2d", "webgl", "webgpu"].map((value) => ({ text: value, value })),
});
pane.addBinding(CONFIG, "transparent").on("change", () => render());

const startButton = pane.addButton({ title: "Start Recording" });
const stopButton = pane.addButton({ title: "Stop Recording" });

// Utils
const getColor = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(
    `--color-${name}`,
  );
const getPexColor = (name) => fromHex(createColor(), getColor(name));

// Setup
const { context, canvas } = createCanvasContext("2d", {
  width: drawWidth,
  height: drawHeight,
  contextAttributes: { willReadFrequently: true, alpha: true },
});
Object.assign(canvas.style, { width: `${width}px`, height: `${height}px` });
document.querySelector(".Canvas-wrapper--2d").prepend(canvas);

const ctxWebGL = createPexContext({ width, height, pixelRatio, alpha: true });
document.querySelector(".Canvas-wrapper--webgl").prepend(ctxWebGL.gl.canvas);

const clearWebGLCmd = {
  pass: ctxWebGL.pass({ clearColor: [0, 0, 0, 0] }),
};
const drawWebGLCmd = {
  pipeline: ctxWebGL.pipeline({
    vert,
    frag: params.has("debug") ? debugGLSL : schotterFragGLSL,
  }),
  attributes: {
    aPosition: ctxWebGL.vertexBuffer(Float32Array.of(-1, -1, 3, -1, -1, 3)), // Fullscreen triangle
  },
  uniforms: {
    uColor: getPexColor("accent"),
    uBackgroundColor: getPexColor("dark"),
  },
  count: 3,
};

const ctxWebGPU = await gpu.createContext({
  width,
  height,
  pixelRatio,
  alphaMode: "premultiplied",
});
document.querySelector(".Canvas-wrapper--webgpu").prepend(ctxWebGPU.canvas);

const drawWebGPUCmd = gpu.defineCommand({
  label: "draw",
  pass: { clearValue: [0, 0, 0, 0], depthClearValue: 1 },
  pipeline: {
    vertex: params.has("debug") ? debugWGSL : schotterWGSL,
    fragment: params.has("debug") ? debugWGSL : schotterWGSL,
  },
  attributes: {
    aPosition: gpu.createBuffer(ctxWebGPU, {
      usage: "vertex",
      data: Float32Array.of(-1, -1, 3, -1, -1, 3),
    }),
  },
  uniforms: {
    uColor: getPexColor("accent"),
    uBackgroundColor: getPexColor("dark"),
  },
  count: 3,
});

const detailElement = document.querySelector(".Detail");

// Animation
let rAFId;
let canvasRecorder;

function render(canvasRecorder = {}) {
  const currentFrame = canvasRecorder.frame || 0;

  const t = currentFrame / (canvasRecorder.frameTotal - 1) || Number.EPSILON;

  const width = canvas.width;
  const height = canvas.height;
  const x = width * 0.02;
  const y = height * 0.025;
  const fontSize = 12 * pixelRatio;

  // 2D
  {
    // Background
    context.clearRect(0, 0, width, height);
    context.fillStyle = getColor("dark");
    if (CONFIG.transparent) {
      context.fillRect(0, 0, width / 2, height / 2);
      context.fillRect(width / 2, height / 2, width / 2, height / 2);
    } else {
      context.fillRect(0, 0, width, height);
    }

    // Interpolated element
    context.save();
    if (params.has("debug")) {
      context.fillStyle = getColor("accent");
      context.translate(width * 0.5, height * 0.5);
      context.scale(t, t);
      context.fillRect(-width * 0.5, -height * 0.5, width, height);
    } else {
      context.strokeStyle = getColor("accent");
      drawSchotter2d(context, width, t);
    }
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
    ctxWebGL.submit(clearWebGLCmd);
    ctxWebGL.submit(drawWebGLCmd, {
      uniforms: {
        uProgress: t,
        uTextValue: currentFrame,
        uTextPosition: [x, height - y - fontSize],
        uTransparent: CONFIG.transparent,
        uResolution: width,
      },
    });
  }

  // WebGPU
  {
    Object.assign(drawWebGPUCmd.uniforms, {
      uProgress: t,
      uTextValue: currentFrame,
      uTextPosition: [x, y],
      uTransparent: CONFIG.transparent,
      uResolution: width,
    });
    gpu.submit(ctxWebGPU, drawWebGPUCmd);
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

  const alpha = CONFIG.transparent ? "keep" : "discard";

  let encoderOptions = { alpha };
  if (encoderName === "FFmpegEncoder") {
    encoderOptions = {
      ...encoderOptions,
      // FFmpeg requires more effort...
      coreURL: new URL("../web_modules/@ffmpeg/core.js", import.meta.url).href,
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

  let ctx;

  switch (contextType) {
    case "2d":
      ctx = context;
      break;
    case "webgl":
      ctx = ctxWebGL.gl;
      break;

    default:
      ctx = ctxWebGPU.canvasContext;
      break;
  }

  canvasRecorder = new Recorder(ctx, {
    name: `canvas-record-example-${encoderName || "default"}-${contextType}`,
    ...configOptions,
    rect: [rect.x, rect.y, rect.z, rect.w],
    encoder: encoderName ? new Encoders[encoderName]() : null,
    debug: true,
    encoderOptions,
  });

  console.log(canvasRecorder);
};

const start = async (encoderName) => {
  await initRecorder(encoderName);

  try {
    // Start and initialize
    await canvasRecorder.start({ filename: CONFIG.filename, initOnly: true });
  } catch (error) {
    // Fatal setup error (unsupported/invalid encoder config, cancelled file picker...).
    detailElement.innerHTML = `Error: ${error.message}`;
    console.error(error);
    return;
  }

  // Animate to start encoding
  tick();
};

startButton.on("click", async () => {
  if (canvasRecorder?.status !== RecorderStatus.Recording) {
    await start(CONFIG.encoder);
  }
});

stopButton.on("click", async () => {
  reset();
});

await reset();
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
