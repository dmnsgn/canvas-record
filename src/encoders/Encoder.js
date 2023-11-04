/**
 * @typedef {"mp4" | "webm" | "png" | "jpg" | "gif" | "mkv"} EncoderExtensions
 */

/**
 * @typedef {"in-browser" | "file-system"} EncoderTarget
 */

class Encoder {
  /**
   * The extension the encoder supports
   * @type {Extensions[]}
   */
  static supportedExtensions = ["mp4", "webm"];
  /**
   * The target to download the file to.
   * @type {EncoderTarget[]}
   */
  static supportedTargets = ["in-browser"];

  static defaultOptions = {
    frameMethod: "blob",
    extension: Encoder.supportedExtensions[0],
    target: Encoder.supportedTargets[0],
  };

  /**
   * Base Encoder class. All Encoders extend it and its method are called by the Recorder.
   * @class Encoder
   * @param {object} options
   *
   * @property {EncoderTarget} target
   * @property {EncoderExtensions} extension
   * @property {object} [encoderOptions]
   * @property {object} [muxerOptions]
   */
  constructor(options) {
    Object.assign(this, options);
  }

  /**
   * Setup the encoder: load binary, instantiate muxers, setup file system target...
   * @param {object} options
   */
  async init(options) {
    Object.assign(this, options);
  }

  // File System API
  async getDirectory() {
    if (!("showDirectoryPicker" in window)) return;
    return await window.showDirectoryPicker();
  }

  async getDirectoryHandle(directory, name) {
    return await directory.getDirectoryHandle(name, { create: true });
  }

  async getFileHandle(name, options) {
    if (this.directoryHandle) {
      return await this.directoryHandle.getFileHandle(name, { create: true });
    }

    if (!("showSaveFilePicker" in window)) return;

    return await window.showSaveFilePicker({
      suggestedName: name,
      ...options,
    });
  }

  async getWritableFileStream(fileHandle) {
    if (
      (await fileHandle.queryPermission({ mode: "readwrite" })) === "granted"
    ) {
      return await fileHandle.createWritable();
    }
  }

  // Override methods
  /**
   * Encode a single frame. The frameNumber is usually used for GOP (Group Of Pictures).
   * @param {number} frame
   * @param {number} [frameNumber]
   */
  async encode() {}

  /**
   * Stop the encoding process and cleanup the temporary data.
   * @returns {(ArrayBuffer|Uint8Array|Blob[]|undefined)}
   */
  async stop() {}

  /**
   * Clean up the encoder
   */
  dispose() {}
}

export default Encoder;
