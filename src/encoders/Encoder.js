class Encoder {
  static supportedExtensions = ["mp4", "webm"];

  static defaultOptions = {
    frameMethod: "blob",
    extension: Encoder.supportedExtensions[0],
  };

  constructor(options) {
    Object.assign(this, options);
  }

  async init(options) {
    Object.assign(this, options);
  }

  // Override methods
  async encode(frame, frameNumber) {}
  async stop() {}
  dispose() {}
}

export default Encoder;
