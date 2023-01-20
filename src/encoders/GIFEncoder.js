import { GIFEncoder as GIFEnc, quantize, applyPalette } from "gifenc";
import Encoder from "./Encoder.js";

class GIFEncoder extends Encoder {
  static supportedExtensions = ["gif"];

  static defaultOptions = {
    extension: GIFEncoder.supportedExtensions[0],
    frameMethod: "imageData",
    maxColors: 256,
    quantizeOptions: {
      format: "rgb565", // rgb444 or rgba4444
      oneBitAlpha: false,
      clearAlpha: true,
      clearAlphaThreshold: 0,
      clearAlphaColor: 0x00,
    },
  };

  constructor(options) {
    super({ ...GIFEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    this.encoder = GIFEnc();
  }

  async start() {
    await super.start();

    this.step();
  }

  encode(frame) {
    const palette = quantize(frame, this.maxColors, this.quantizeOptions);

    const index = applyPalette(frame, palette, this.quantizeOptions.format);

    this.encoder.writeFrame(index, this.width, this.height, {
      palette,
      delay: (1 / this.frameRate) * 1000,
      ...this.encoderOptions,
    });
  }

  stop() {
    this.encoder.finish();

    const data = this.encoder.bytes();
    this.encoder.reset();
    return data;
  }

  dispose() {
    this.encoder = null;
  }
}

export default GIFEncoder;
