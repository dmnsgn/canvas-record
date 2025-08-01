import {
  Output,
  Mp4OutputFormat,
  MovOutputFormat,
  WebMOutputFormat,
  MkvOutputFormat,
  BufferTarget,
  EncodedVideoPacketSource,
  EncodedPacket,
  StreamTarget,
} from "mediabunny";

import { AVC, VP } from "media-codecs";

import Encoder from "./Encoder.js";
import { estimateBitRate } from "../utils.js";

const extensionToOutputFormat = {
  mp4: Mp4OutputFormat,
  mov: MovOutputFormat,
  webm: WebMOutputFormat,
  mkv: MkvOutputFormat,
};

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
 * @typedef {import("mediabunny").OutputOptions} WebCodecsMuxerOptions
 * @see [mediabunny#output-formats]{@link https://mediabunny.dev/guide/output-formats}
 */

class WebCodecsEncoder extends Encoder {
  static supportedExtensions = ["mp4", "mov", "webm", "mkv"];
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
            accept: { [this.mimeType.split(";")[0]]: [`.${this.extension}`] },
          },
        ],
      });

      this.writableFileStream = await this.getWritableFileStream(fileHandle);
    }

    const format = new extensionToOutputFormat[this.extension]({
      fastStart: this.writableFileStream ? false : "in-memory",
    });

    const isISOBMFF = ["mp4", "mov"].includes(this.extension);

    // TODO: use format.getSupportedVideoCodecs();
    const codec =
      this.encoderOptions?.codec ||
      (isISOBMFF
        ? AVC.getCodec({ profile: "High", level: "5.2" }) // avc1.640034
        : VP.getCodec({ name: "VP9", profile: 0, level: "1", bitDepth: 8 })); // vp09.00.10.08

    const CCCC = codec.split(".")[0];

    this.muxer = new Output({
      format,
      target: this.writableFileStream
        ? new StreamTarget(this.writableFileStream)
        : new BufferTarget(),
      ...this.muxerOptions,
    });

    const videoCodec = isISOBMFF
      ? // Supported: "avc" | "hevc"
        CCCC.startsWith("hev") || CCCC.startsWith("hvc") // https://www.w3.org/TR/webcodecs-hevc-codec-registration/#fully-qualified-codec-strings
        ? "hevc"
        : "avc"
      : // Supported: "vp8" | "vp9" | "av1"
        CCCC.startsWith("av01")
        ? "av1"
        : VP.VP_CODECS.find((codec) => codec.cccc === CCCC).name.toLowerCase();

    const videoSource = new EncodedVideoPacketSource(videoCodec);
    this.muxer.addVideoTrack(videoSource, { frameRate: this.frameRate });

    this.encoder = new VideoEncoder({
      output: async (chunk, meta) => {
        await videoSource.add(EncodedPacket.fromEncodedChunk(chunk), meta);
      },
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
    if (number === 0) await this.muxer.start();

    const keyFrame = number % this.groupOfPictures === 0;

    this.encoder.encode(frame, { keyFrame });
    frame.close();
    if (this.flushFrequency && (number + 1) % this.flushFrequency === 0) {
      await this.encoder.flush();
    }
  }

  async stop() {
    await this.encoder.flush();
    await this.muxer.finalize();

    return this.muxer.target?.buffer;
  }

  async dispose() {
    this.encoder = null;
  }
}

export default WebCodecsEncoder;
