import Encoder from "./Encoder.js";
import { estimateBitRate } from "../utils.js";

let VideoSample;

/**
 * @typedef {object} WebCodecsEncoderOptions
 * @property {number} [groupOfPictures=20] Used to derive mediabunny's `keyFrameInterval` (in seconds).
 * @property {WebCodecsEncoderEncoderOptions} [encoderOptions={}]
 */
/**
 * @typedef {VideoEncoderConfig} WebCodecsEncoderEncoderOptions
 * @see [VideoEncoder.configure]{@link https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/configure#config}
 * `alpha: "keep"` only compatible with a `webm`/`mkv` extension
 */
/**
 * @typedef {import("mediabunny").OutputOptions} WebCodecsMuxerOptions
 * @see [mediabunny#output-formats]{@link https://mediabunny.dev/guide/output-formats}
 */

class WebCodecsEncoder extends Encoder {
  static supportedExtensions = ["mp4", "mov", "webm", "mkv"];
  static supportedTargets = ["in-browser", "file-system"];

  static alphaCapableExtensions = ["webm", "mkv"];

  static defaultOptions = {
    extension: WebCodecsEncoder.supportedExtensions[0],
    groupOfPictures: 20,
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

    const {
      Output,
      Mp4OutputFormat,
      MovOutputFormat,
      WebMOutputFormat,
      MkvOutputFormat,
      BufferTarget,
      VideoSampleSource,
      StreamTarget,
    } = await import("mediabunny");
    ({ VideoSample } = await import("mediabunny"));
    const { AVC, VP } = await import("media-codecs");

    const extensionToOutputFormat = {
      mp4: Mp4OutputFormat,
      mov: MovOutputFormat,
      webm: WebMOutputFormat,
      mkv: MkvOutputFormat,
    };

    if (
      this.alpha === "keep" &&
      !WebCodecsEncoder.alphaCapableExtensions.includes(this.extension)
    ) {
      throw new Error(
        `canvas-record: Transparency (alpha: "keep") requires one of the following extensions: ${WebCodecsEncoder.alphaCapableExtensions
          .map((extension) => `"${extension}"`)
          .join(", ")}. Got "${this.extension}".`,
      );
    }

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

    // TODO: use format.getSupportedVideoCodecs();
    const codec =
      this.encoderOptions?.codec ||
      (["mp4", "mov"].includes(this.extension)
        ? AVC.getCodec({ profile: "High", level: "5.2" }) // avc1.640034
        : VP.getCodec({ name: "VP9", profile: 0, level: "1", bitDepth: 8 })); // vp09.00.10.08

    const [CCCC] = codec.split(".");

    this.muxer = new Output({
      format,
      target: this.writableFileStream
        ? new StreamTarget(this.writableFileStream)
        : new BufferTarget(),
      ...this.muxerOptions,
    });

    let videoCodec; // Supported: "avc" | "hevc" | "av1" | "vp8" | "vp9"
    // https://www.w3.org/TR/webcodecs-hevc-codec-registration/#fully-qualified-codec-strings
    if (CCCC.startsWith("hev") || CCCC.startsWith("hvc")) {
      videoCodec = "hevc";
    } else if (CCCC.startsWith("avc1")) {
      videoCodec = "avc";
    } else if (CCCC.startsWith("av01")) {
      videoCodec = "av1";
    } else if (CCCC.startsWith("vp")) {
      videoCodec = VP.VP_CODECS.find(
        (codec) => codec.cccc === CCCC,
      ).name.toLowerCase();
    }

    const videoSource = new VideoSampleSource({
      bitrate: estimateBitRate(
        this.width,
        this.height,
        this.frameRate,
        this.encoderOptions.bitrateMode,
      ),
      // bitrate: 1e6,
      // bitrateMode: "variable", // "constant"
      // latencyMode: "quality", // "realtime" (faster encoding)
      // hardwareAcceleration: "no-preference", // "prefer-hardware" "prefer-software"
      keyFrameInterval: this.groupOfPictures / this.frameRate,
      alpha: this.alpha,
      ...this.encoderOptions,
      codec: videoCodec,
      fullCodecString: codec,
    });
    this.muxer.addVideoTrack(videoSource, { frameRate: this.frameRate });
    this.videoSource = videoSource;
  }

  async encode(frame, number) {
    if (number === 0) await this.muxer.start();

    const sample = new VideoSample(frame);
    await this.videoSource.add(sample);
    sample.close();
  }

  async stop() {
    await this.muxer.finalize();

    return this.muxer.target?.buffer;
  }

  async dispose() {
    this.videoSource = null;
    this.muxer = null;
  }
}

export default WebCodecsEncoder;
