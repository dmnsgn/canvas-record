import Encoder from "./Encoder.js";

import { downloadBlob } from "../utils.js";

/** @class */
class FrameEncoder extends Encoder {
  static supportedExtensions = ["png", "jpg"];
  static supportedTargets = ["in-browser", "file-system"];

  static defaultOptions = {
    extension: FrameEncoder.supportedExtensions[0],
    frameMethod: "blob",
  };

  constructor(options) {
    super({ ...FrameEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    if (this.target === "file-system") {
      this.directory ||= await this.getDirectory();
      this.directoryHandle = await this.getDirectoryHandle(
        this.directory,
        this.filename,
      );
    }
  }

  async writeFile(frameFileName, blob) {
    try {
      if (this.directoryHandle) {
        const fileHandle = await this.getFileHandle(frameFileName);
        const writable = await this.getWritableFileStream(fileHandle);
        await writable.write(blob);
        await writable.close();
      } else {
        downloadBlob(frameFileName, [blob], this.mimeType);
        // Ugh. Required otherwise frames are skipped
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (error) {
      console.error(error);
    }
  }

  async encode(frame, frameNumber) {
    await this.writeFile(
      `${`${frameNumber}`.padStart(5, "0")}.${this.extension}`,
      frame,
    );
  }
}

export default FrameEncoder;
