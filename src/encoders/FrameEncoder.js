import Encoder from "./Encoder.js";

import { downloadBlob, formatDate } from "../utils.js";

class FrameEncoder extends Encoder {
  static supportedExtensions = ["png", "jpg"];
  static supportedTargets = ["in-browser", "file-system"];

  static defaultOptions = {
    frameMethod: "blob",
    extension: FrameEncoder.supportedExtensions[0],
  };

  constructor(options) {
    super({ ...FrameEncoder.defaultOptions, ...options });
  }

  get suggestedName() {
    return `${formatDate(new Date())}${this.paramString}`;
  }

  async init(options) {
    super.init(options);

    if (this.target === "file-system") {
      this.directoryHandle ||= await this.getDirectoryHandle(this.suggestedName);
    }
  }

  async writeFile(filename, blob) {
    try {
      if (this.directoryHandle) {
        const fileHandle = await this.getFileHandle(filename);
        const writable = await this.getWritableFileStream(fileHandle);
        await writable.write(blob);
        await writable.close();
      } else {
        downloadBlob(filename, [blob], this.mimeType);
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
      frame
    );
  }
}

export default FrameEncoder;
