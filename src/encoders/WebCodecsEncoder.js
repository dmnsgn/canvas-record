import * as MP4Muxer from "mp4-muxer";
import * as WebMMuxer from "webm-muxer";
import { AVC, VP } from "media-codecs";

import Encoder from "./Encoder.js";
import { estimateBitRate } from "../utils.js";

/**
 * @typedef {object} WebCodecsEncoderOptions
 * @property {number} [groupOfPictures=20]
 * @property {number} [flushFrequency=10]
 * @property {WebCodecsEncoderEncoderOptions} [encoderOptions={}]
 */
/**
 * @typedef {VideoEncoderConfig} WebCodecsEncoderEncoderOptions
 * @see [VideoEncoder.configure]{@link https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/configure#config}
 */
/**
 * @typedef {MuxerOptions} WebCodecsMuxerOptions
 * @see [Mp4.MuxerOptions]{@link https://github.com/Vanilagy/mp4-muxer/#usage}
 * @see [WebM.MuxerOptions]{@link https://github.com/Vanilagy/webm-muxer/#usage}
 */

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

  /**
   * @param {WebCodecsEncoderOptions} [options]
   */
  constructor(options) {
    super({ ...WebCodecsEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    if (this.target === "file-system") {
      const fileHandle = await this.getFileHandle(this.filename, {
        types: [
          {
            description: "Video File",
            accept: { [this.mimeType]: [`.${this.extension}`] },
          },
        ],
      });

      this.writableFileStream = await this.getWritableFileStream(fileHandle);
    }

    const codec =
      this.encoderOptions?.codec ||
      (this.extension === "mp4"
        ? AVC.getCodec({ profile: "High", level: "5.2" }) // avc1.640034
        : VP.getCodec({ name: "VP9", profile: 0, level: "1", bitDepth: 8 })); // vp09.00.10.08

    const CCCC = codec.split(".")[0];

    const muxer = this.extension === "mp4" ? MP4Muxer : WebMMuxer;

    this.muxer = new muxer.Muxer({
      target: this.writableFileStream
        ? new muxer.FileSystemWritableFileStreamTarget(this.writableFileStream)
        : new muxer.ArrayBufferTarget(),
      type: this.extension === "mkv" ? "matroska" : "webm",
      video: {
        codec:
          this.extension === "mp4"
            ? // Supported: "avc" | "hevc"
              CCCC.startsWith("hev") || CCCC.startsWith("hvc") // https://www.w3.org/TR/webcodecs-hevc-codec-registration/#fully-qualified-codec-strings
              ? "hevc"
              : "avc"
            : // Supported: "V_VP8" | "V_VP9" | "V_AV1"
              `V_${
                CCCC.startsWith("av01")
                  ? "AV1"
                  : VP.VP_CODECS.find((codec) => codec.cccc === CCCC).name
              }`,
        width: this.width,
        height: this.height,
      },
      firstTimestampBehavior: "offset", // "strict" | "offset" | "permissive"
      fastStart: this.writableFileStream ? false : "in-memory",
      ...this.muxerOptions,
    });

    this.encoder = new VideoEncoder({
      output: (chunk, meta) => this.muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error(e),
    });

    const config = {
      width: this.width,
      height: this.height,
      framerate: this.frameRate,
      bitrate: estimateBitRate(
        this.width,
        this.height,
        this.frameRate,
        this.encoderOptions.bitrateMode,
      ),
      // bitrate: 1e6,
      // alpha: "discard", // "keep"
      // bitrateMode: "variable", // "constant"
      // latencyMode: "quality", // "realtime" (faster encoding)
      // hardwareAcceleration: "no-preference", // "prefer-hardware" "prefer-software"
      ...this.encoderOptions,
      codec,
    };

    this.encoder.configure(config);
    if (!(await VideoEncoder.isConfigSupported(config)).supported) {
      throw new Error(
        `canvas-record: Unsupported VideoEncoder config\n ${JSON.stringify(
          config,
        )}`,
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
    this.muxer.finalize();

    const buffer = this.muxer.target?.buffer;

    if (this.writableFileStream) await this.writableFileStream.close();

    return buffer;
  }

  async dispose() {
    this.encoder = null;
  }
}

export default WebCodecsEncoder;
