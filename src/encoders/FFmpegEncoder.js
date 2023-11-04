import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

import Encoder from "./Encoder.js";

const getFrameName = (frame) => `${String(frame).padStart(5, "0")}.png`;

/**
 * @typedef {object} FFmpegEncoderOptions
 * @property {FFmpegEncoderEncoderOptions} [encoderOptions={}]
 */
/**
 * @typedef {import("@ffmpeg/ffmpeg/dist/esm/types.js").FFMessageLoadConfig} FFmpegEncoderEncoderOptions
 * @see [FFmpeg#load]{@link https://ffmpegwasm.netlify.app/docs/api/ffmpeg/classes/FFmpeg#load}
 */

class FFmpegEncoder extends Encoder {
  static supportedExtensions = ["mp4", "webm"];

  /**
   * @param {FFmpegEncoderOptions} [options]
   */
  constructor(options) {
    super(options);
  }

  async init(options) {
    super.init(options);

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
    const codec = this.extension === "mp4" ? "libx264" : "libvpx";

    await this.encoder.exec(
      `-framerate ${this.frameRate} -pattern_type glob -i *.png -s ${this.width}x${this.height} -pix_fmt yuv420p -c:v ${codec} ${outputFilename}`.split(
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
