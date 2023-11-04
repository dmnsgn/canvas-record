import HME from "h264-mp4-encoder";
import Encoder from "./Encoder.js";

import { estimateBitRate, nextMultiple } from "../utils.js";

/**
 * @typedef {object} H264MP4EncoderOptions
 * @property {boolean} [debug]
 * @property {H264MP4EncoderEncoderOptions} [encoderOptions={}]
 */
/**
 * @typedef {import("h264-mp4-encoder").H264MP4Encoder} H264MP4EncoderEncoderOptions
 * @see [h264-mp4-encoder#api]{@link https://github.com/TrevorSundberg/h264-mp4-encoder#api}
 */

class H264MP4Encoder extends Encoder {
  static supportedExtensions = ["mp4"];

  static defaultOptions = {
    extension: H264MP4Encoder.supportedExtensions[0],
    frameMethod: "imageData",
  };

  /**
   * @param {H264MP4EncoderOptions} [options]
   */
  constructor(options) {
    super({ ...H264MP4Encoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    this.encoder = await HME.createH264MP4Encoder();

    Object.assign(this.encoder, {
      // outputFilename:"output.mp4"
      width: nextMultiple(this.width, 2),
      height: nextMultiple(this.height, 2),
      frameRate: this.frameRate, // 30
      kbps: estimateBitRate(this.width, this.height, this.frameRate) / 1000, // The bitrate in kbps relative to the frame_rate. Overwrites quantization_parameter if not 0.
      // speed: 0, // Speed where 0 means best quality and 10 means fastest speed [0..10].
      // quantizationParameter: 33, // Higher means better compression, and lower means better quality [10..51].
      // groupOfPictures: 20, // How often a keyframe occurs (key frame period, also known as GOP).
      // temporalDenoise: false, // Use temporal noise supression.
      // desiredNaluBytes: 0, // Each NAL unit will be approximately capped at this size (0 means unlimited).
      debug: this.debug,
      ...this.encoderOptions,
    });

    this.encoder.initialize();
  }

  async start() {
    await super.start();

    this.step();
  }

  encode(frame) {
    // TODO: addFrameYuv
    this.encoder.addFrameRgba(frame);
  }

  stop() {
    this.encoder.finalize();

    return this.encoder.FS.readFile(this.encoder.outputFilename);
  }

  dispose() {
    this.encoder.delete();
    this.encoder = null;
  }
}

export default H264MP4Encoder;
