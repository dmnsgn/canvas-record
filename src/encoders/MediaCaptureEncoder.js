import Encoder from "./Encoder.js";

import { Deferred } from "../utils.js";

/**
 * @typedef {object} MediaCaptureEncoderOptions
 * @property {number} [flushFrequency=10]
 * @property {MediaCaptureEncoderEncoderOptions} [encoderOptions={}]
 */

/**
 * @typedef {MediaRecorderOptions} MediaCaptureEncoderEncoderOptions
 * @see [MediaRecorder#options]{@link https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder#options}
 */

class MediaCaptureEncoder extends Encoder {
  static supportedExtensions = ["mkv", "webm"];

  static defaultOptions = {
    extension: MediaCaptureEncoder.supportedExtensions[0],
    frameMethod: "requestFrame",
    flushFrequency: 10,
  };

  /**
   * @param {MediaCaptureEncoderOptions} [options]
   */
  constructor(options) {
    super({ ...MediaCaptureEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    this.chunks = [];
    // Forces the use of requestFrame. Use canvas-record v3 for real-time capture.
    this.stream = this.canvas.captureStream(this.frameRate);

    this.recorder = new MediaRecorder(this.stream, {
      mimeType: this.mimeType, // "video/x-matroska;codecs=avc1",
      // audioBitsPerSecond: 128000, // 128 Kbit/sec
      // videoBitsPerSecond: 2500000, // 2.5 Mbit/sec
      ...this.encoderOptions,
    });
    this.recorder.ondataavailable = (event) => {
      event.data.size && this.chunks.push(event.data);

      if (this.q) this.q.resolve();
    };
  }

  async encode(frame, number) {
    if (this.recorder.state !== "recording") {
      this.chunks = [];
      this.recorder.start();
    }
    if (!this.frameRate !== 0) {
      (this.stream.getVideoTracks?.()?.[0] || this.stream).requestFrame();
    }
    if (this.flushFrequency && (number + 1) % this.flushFrequency === 0) {
      this.recorder.requestData();
    }
  }

  async stop() {
    this.q = new Deferred();

    this.recorder.stop();
    await this.q.promise;

    delete this.q;

    return this.chunks;
  }

  async dispose() {
    this.recorder = null;
    this.stream = null;
  }
}

export default MediaCaptureEncoder;
