import Encoder from "./Encoder.js";

import { downloadBlob, Deferred } from "../utils.js";

let Zip, ZipPassThrough;

/** @class */
class FrameEncoder extends Encoder {
  static supportedExtensions = ["png", "jpg", "zip"];
  static supportedTargets = ["in-browser", "file-system"];

  static defaultOptions = {
    extension: FrameEncoder.supportedExtensions[0],
    frameMethod: "blob",
    frameExtension: "png",
  };

  constructor(options) {
    super({ ...FrameEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    if (this.extension === "zip") {
      this.q = new Deferred();

      if (this.target === "file-system") {
        const fileHandle = await this.getFileHandle(this.filename, {
          types: [
            {
              description: "Zip File",
              accept: {
                [this.mimeType]: [`.${this.extension}`],
              },
            },
          ],
        });
        this.writableFileStream = await this.getWritableFileStream(fileHandle);
      } else {
        this.chunks = [];
      }

      ({ Zip, ZipPassThrough } = await import("fflate"));

      this.zip = new Zip(async (error, chunk, final) => {
        if (error) {
          this.q.reject(error);
          console.error(error);
        } else {
          if (this.writableFileStream) {
            this.writableFileStream.write(chunk);
            if (final) {
              await this.writableFileStream.close();
              this.q.resolve();
            }
          } else {
            this.chunks.push(chunk);
            if (final) {
              this.q.resolve(new Blob(this.chunks, { type: this.mimeType }));
            }
          }
        }
      });
    } else {
      if (this.target === "file-system") {
        this.directory ||= await this.getDirectory();
        this.directoryHandle = await this.getDirectoryHandle(
          this.directory,
          this.filename,
        );
      }
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
    const name = String(frameNumber).padStart(5, "0");

    if (this.extension === "zip") {
      const entry = new ZipPassThrough(`${name}.${this.frameExtension}`);
      this.zip.add(entry);
      entry.push(new Uint8Array(await frame.arrayBuffer()), true);
    } else {
      await this.writeFile(`${name}.${this.extension}`, frame);
    }
  }

  async stop() {
    if (this.extension !== "zip") return;

    this.zip.end();
    return await this.q.promise;
  }
}

export default FrameEncoder;
