import FFmpeg from "@ffmpeg/ffmpeg";

import Encoder from "./Encoder.js";

const getFrameName = (frame) => `${String(frame).padStart(5, "0")}.png`;

class FFmpegEncoder extends Encoder {
  static supportedExtensions = ["mp4", "webm"];

  async init(options) {
    super.init(options);

    this.encoder = FFmpeg.createFFmpeg({
      corePath: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
      log: this.debug,
      ...this.encoderOptions,
    });
    await this.encoder.load();

    this.frameCount = 0;
  }

  async encode(frame, frameNumber) {
    this.encoder.FS(
      "writeFile",
      getFrameName(frameNumber),
      await FFmpeg.fetchFile(frame)
    );
    this.frameCount++;
  }

  async stop() {
    const outputFilename = `output.${this.extension}`;
    const codec = this.extension === "mp4" ? "libx264" : "libvpx";
    await this.encoder.run(
      ...`-framerate ${this.frameRate} -pattern_type glob -i *.png -s ${this.width}x${this.height} -pix_fmt yuv420p -c:v ${codec} ${outputFilename}`.split(
        " "
      )
    );

    const data = await this.encoder.FS("readFile", outputFilename);

    for (let i = 0; i < this.frameCount; i++) {
      try {
        this.encoder.FS("unlink", getFrameName(i));
      } catch (error) {
        console.error(error);
      }
    }

    try {
      this.encoder.FS("unlink", outputFilename);
    } catch (error) {
      console.error(error);
    }

    return data;
  }

  dispose() {
    this.encoder.exit();
    this.encoder = null;
  }
}

export default FFmpegEncoder;
