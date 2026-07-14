import Encoder from "./Encoder.js";

let FFmpeg, fetchFile;

const getFrameName = (frame) => `${String(frame).padStart(5, "0")}.png`;

/**
 * @typedef {object} FFmpegEncoderOptions
 * @property {FFmpegEncoderEncoderOptions} [encoderOptions={}]
 */
/**
 * @typedef {import("@ffmpeg/ffmpeg/dist/esm/types.js").FFMessageLoadConfig & { alpha?: "keep" | "discard" }} FFmpegEncoderEncoderOptions
 * @see [FFmpeg#load]{@link https://ffmpegwasm.netlify.app/docs/api/ffmpeg/classes/FFmpeg#load}
 * `alpha: "keep"` only compatible with a `webm` extension (encoded as VP8 `yuva420p`).
 */

class FFmpegEncoder extends Encoder {
  static supportedExtensions = ["mp4", "webm"];

  static alphaCapableExtensions = ["webm"];

  /**
   * @param {FFmpegEncoderOptions} [options]
   */
  constructor(options) {
    super(options);
  }

  async init(options) {
    super.init(options);

    ({ FFmpeg } = await import("@ffmpeg/ffmpeg"));
    ({ fetchFile } = await import("@ffmpeg/util"));

    if (
      this.alpha === "keep" &&
      !FFmpegEncoder.alphaCapableExtensions.includes(this.extension)
    ) {
      throw new Error(
        `canvas-record: Transparency (alpha: "keep") requires one of the following extensions: ${FFmpegEncoder.alphaCapableExtensions
          .map((extension) => `"${extension}"`)
          .join(", ")}. Got "${this.extension}".`,
      );
    }

    this.encoder = new FFmpeg();
    this.encoder.on("log", ({ message }) => {
      console.log(message);
    });

    await this.encoder.load({ ...this.encoderOptions });

    this.frameCount = 0;
  }

  async encode(frame, frameNumber) {
    await this.encoder.writeFile(
      getFrameName(frameNumber),
      await fetchFile(frame),
    );
    this.frameCount++;
  }

  async stop() {
    const outputFilename = `output.${this.extension}`;
    const isAlpha = this.alpha === "keep";
    // Note: VP9 alpha (libvpx-vp9 + yuva420p) crashes this ffmpeg.wasm build
    // (libavcodec/decode.c AV_CODEC_CAP_DR1 assertion), so alpha uses VP8.
    const codec = this.extension === "mp4" ? "libx264" : "libvpx";
    // yuva420p keeps the alpha plane (VP8 only here); yuv420p flattens it.
    const pixelFormat = isAlpha ? "yuva420p" : "yuv420p";
    // libvpx can't use alt-ref frames when encoding transparency.
    const alphaArgs = isAlpha ? "-auto-alt-ref 0 " : "";

    await this.encoder.exec(
      `-framerate ${this.frameRate} -pattern_type glob -i *.png -s ${this.width}x${this.height} -pix_fmt ${pixelFormat} -c:v ${codec} ${alphaArgs}${outputFilename}`.split(
        " ",
      ),
    );

    const data = await this.encoder.readFile(outputFilename);

    for (let i = 0; i < this.frameCount; i++) {
      try {
        this.encoder.deleteFile(getFrameName(i));
      } catch (error) {
        console.error(error);
      }
    }

    try {
      this.encoder.deleteFile(outputFilename);
    } catch (error) {
      console.error(error);
    }

    return data;
  }

  async dispose() {
    await this.encoder.terminate();
    this.encoder = null;
  }
}

export default FFmpegEncoder;
