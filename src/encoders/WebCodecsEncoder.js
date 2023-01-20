import WebMMuxer from "webm-muxer";
import MP4Wasm from "./mp4.embed.js"; // mp4-wasm

import Encoder from "./Encoder.js";

let mp4wasm;

class WebCodecsEncoder extends Encoder {
  static supportedExtensions = ["mp4", "webm"];

  static defaultOptions = {
    extension: WebCodecsEncoder.supportedExtensions[0],
    groupOfPictures: 20,
    flushFrequency: 10,
  };

  get frameMethod() {
    return this.extension === "mp4" ? "bitmap" : "videoFrame";
  }

  constructor(options) {
    super({ ...WebCodecsEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    if (this.extension === "webm") {
      this.muxer = new WebMMuxer({
        target: "buffer",
        video: {
          codec: "V_VP9", // Supported: V_VP8, V_VP9, V_AV1, A_OPUS and A_VORBIS
          width: this.width,
          height: this.height,
          frameRate: this.frameRate,
        },
      });
      this.encoder = new VideoEncoder({
        output: (chunk, meta) => this.muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error(e),
      });

      const config = {
        codec: "vp09.00.10.08",
        width: this.width,
        height: this.height,
        frameRate: this.frameRate,
        bitrate: 20_000_000,
        alpha: "discard", // "keep"
        bitrateMode: "variable", // "constant"
        latencyMode: "realtime", // "quality"
        hardwareAcceleration: "no-preference", // "prefer-hardware" "prefer-software"
        ...this.encoderOptions,
      };

      this.encoder.configure(config);
      if (!(await VideoEncoder.isConfigSupported(config)).supported) {
        throw new Error(
          `canvas-record: Unsupported VideoEncoder config\n ${JSON.stringify(
            config
          )}`
        );
      }
    } else {
      mp4wasm ||= await MP4Wasm(); // { wasmBinary }

      this.encoder = mp4wasm.createWebCodecsEncoder({
        // codec: "avc1.420034", // Baseline 4.2
        codec: "avc1.4d0034", // Main 5.2
        width: this.width,
        height: this.height,
        fps: this.frameRate,
        encoderOptions: {
          framerate: this.frameRate,
          ...this.encoderOptions,
        },
      });
    }
  }

  async encode(frame, number) {
    if (this.extension === "webm") {
      const keyFrame = number % this.groupOfPictures === 0;

      this.encoder.encode(frame, { keyFrame });
      frame.close();
      if (this.flushFrequency && (number + 1) % this.flushFrequency === 0) {
        await this.encoder.flush();
      }
    } else {
      await this.encoder.addFrame(frame);
    }
  }

  async stop() {
    let buffer;
    if (this.extension === "webm") {
      await this.encoder.flush();
      buffer = this.muxer.finalize();
    } else {
      buffer = await this.encoder.end();
    }

    return buffer;
  }

  async dispose() {
    this.encoder = null;
  }
}

export default WebCodecsEncoder;
