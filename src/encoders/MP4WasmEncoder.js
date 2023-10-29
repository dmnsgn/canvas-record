import MP4Wasm from "./mp4.embed.js"; // mp4-wasm

import Encoder from "./Encoder.js";
import { estimateBitRate } from "../utils.js";

let mp4wasm;

class MP4WasmEncoder extends Encoder {
  static supportedExtensions = ["mp4"];
  static supportedTargets = ["in-browser"];

  static defaultOptions = {
    extension: MP4WasmEncoder.supportedExtensions[0],
    groupOfPictures: 20,
    flushFrequency: 10,
  };

  get frameMethod() {
    return "bitmap";
  }

  constructor(options) {
    super({ ...MP4WasmEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    mp4wasm ||= await MP4Wasm(); // { wasmBinary }

    this.encoder = mp4wasm.createWebCodecsEncoder({
      // codec: "avc1.420034", // Baseline 4.2
      codec: "avc1.4d0034", // Main 5.2
      width: this.width,
      height: this.height,
      fps: this.frameRate,
      encoderOptions: {
        framerate: this.frameRate,
        bitrate: estimateBitRate(
          this.width,
          this.height,
          this.frameRate,
          this.encoderOptions.bitrateMode
        ),
        ...this.encoderOptions,
      },
    });
  }

  async encode(frame) {
    await this.encoder.addFrame(frame);
  }

  async stop() {
    let buffer = await this.encoder.end();

    return buffer;
  }

  async dispose() {
    this.encoder = null;
  }
}

export default MP4WasmEncoder;
