import {
  Muxer,
  ArrayBufferTarget,
  FileSystemWritableFileStreamTarget,
} from "mp4-muxer";
import WebMMuxer from "webm-muxer";

import Encoder from "./Encoder.js";

class WebCodecsEncoder extends Encoder {
  static supportedExtensions = ["mp4", "webm", "mkv"];
  static supportedTargets = ["in-browser", "file-system"];

  static defaultOptions = {
    extension: WebCodecsEncoder.supportedExtensions[0],
    groupOfPictures: 20,
    flushFrequency: 10,
  };

  get frameMethod() {
    return "videoFrame";
  }

  constructor(options) {
    super({ ...WebCodecsEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    let target = "buffer";
    if (this.target === "file-system") {
      const fileHandle = await this.getFileHandle(this.filename, {
        types: [
          {
            description: "Video File",
            accept: { [this.mimeType]: [`.${this.extension}`] },
          },
        ],
      });

      this.writableFileStream = target = await this.getWritableFileStream(
        fileHandle
      );
      if (this.extension === "mp4") {
        target = new FileSystemWritableFileStreamTarget(target);
      }
    }

    if (this.extension === "mp4") {
      this.muxer = new Muxer({
        target: target === "buffer" ? new ArrayBufferTarget() : target,
        video: {
          codec: "avc", // Supported: "avc" | "hevc"
          width: this.width,
          height: this.height,
        },
        firstTimestampBehavior: "offset", // "strict" | "offset" | "permissive"
        ...this.muxerOptions,
      });
    } else {
      this.muxer = new WebMMuxer({
        target,
        type: this.extension === "mkv" ? "matroska" : "webm",
        video: {
          codec: "V_VP9", // Supported: V_VP8, V_VP9, V_AV1, A_OPUS and A_VORBIS
          width: this.width,
          height: this.height,
          frameRate: this.frameRate,
        },
        ...this.muxerOptions,
      });
    }

    this.encoder = new VideoEncoder({
      output: (chunk, meta) => {
        console.log(chunk, meta);
        return this.muxer.addVideoChunk(chunk, meta);
      },
      error: (e) => console.error(e),
    });

    const config = {
      codec: this.extension === "mp4" ? "avc1.640028" : "vp09.00.10.08",
      width: this.width,
      height: this.height,
      frameRate: this.frameRate,
      bitrate: 1e6,
      // alpha: "discard", // "keep"
      // bitrateMode: "variable", // "constant"
      // latencyMode: "quality", // "realtime" (faster encoding)
      // hardwareAcceleration: "no-preference", // "prefer-hardware" "prefer-software"
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
  }

  async encode(frame, number) {
    const keyFrame = number % this.groupOfPictures === 0;

    this.encoder.encode(frame, { keyFrame });
    frame.close();
    if (this.flushFrequency && (number + 1) % this.flushFrequency === 0) {
      await this.encoder.flush();
    }
  }

  async stop() {
    await this.encoder.flush();

    let buffer;
    if (this.extension === "mp4") {
      this.muxer.finalize();
      buffer = this.muxer.target?.buffer;
    } else {
      buffer = this.muxer.finalize();
    }

    if (this.writableFileStream) {
      await this.writableFileStream.close();
    }

    return buffer;
  }

  async dispose() {
    this.encoder = null;
  }
}

export default WebCodecsEncoder;
