import Encoder from "./Encoder.js";

import { formatDate } from "../utils.js";

class FrameEncoder extends Encoder {
  static supportedExtensions = ["png", "jpg"];

  static defaultOptions = {
    frameMethod: "blob",
    extension: FrameEncoder.supportedExtensions[0],
  };

  constructor(options) {
    super({ ...FrameEncoder.defaultOptions, ...options });
  }

  get folderName() {
    return `${formatDate(new Date())}${this.paramString}`;
  }

  async init(options) {
    super.init(options);

    // Capture frame
    if (!this.directoryHandle) {
      const directory = await window.showDirectoryPicker();
      this.directoryHandle = await directory.getDirectoryHandle(
        this.folderName,
        {
          create: true,
        }
      );
    }
  }

  async writeFile(filename, blob) {
    try {
      const fileHandle = await this.directoryHandle.getFileHandle(filename, {
        create: true,
      });

      if (
        (await fileHandle.queryPermission({ mode: "readwrite" })) === "granted"
      ) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
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
