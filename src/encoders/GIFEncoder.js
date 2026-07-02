import * as gifenc from "gifenc";
import Encoder from "./Encoder.js";

const { GIFEncoder: GIFEnc, quantize, applyPalette } = gifenc;

/**
 * @typedef {object} GIFEncoderOptions
 * @property {number} [maxColors=256]
 * @property {GIFEncoderQuantizeOptions} [quantizeOptions]
 * @property {GIFEncoderEncoderOptions} [encoderOptions={}]
 */

/**
 * @typedef {object} GIFEncoderQuantizeOptions
 * @property {"rgb565" | "rgb444" | "rgba4444"} [format="rgb565"]
 * @property {boolean | number} [oneBitAlpha=false]
 * @property {boolean} [clearAlpha=true]
 * @property {number} [clearAlphaThreshold=0]
 * @property {number} [clearAlphaColor=0x00]
 * @see [QuantizeOptions]{@link https://github.com/mattdesl/gifenc#palette--quantizergba-maxcolors-options--}
 */
/**
 * @typedef {object} GIFEncoderEncoderOptions
 * @property {number[][]} [palette]
 * @property {boolean} [first=false]
 * @property {boolean} [transparent=0]
 * @property {number} [transparentIndex=0]
 * @property {number} [delay=0]
 * @property {number} [repeat=0]
 * @property {number} [dispose=-1]
 * @property {"keep" | "discard"} [alpha] `alpha: "keep"` enables GIF's 1-bit transparency (auto-configures quantization and per-frame transparent index).
 * @see [WriteFrameOpts]{@link https://github.com/mattdesl/gifenc#gifwriteframeindex-width-height-opts--}
 */

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

  /**
   * @param {GIFEncoderOptions} [options]
   */
  constructor(options) {
    super({ ...GIFEncoder.defaultOptions, ...options });
  }

  async init(options) {
    super.init(options);

    // GIF only supports 1-bit transparency: quantize with an alpha-aware format
    // and collapse alpha to fully transparent/opaque so a palette entry can be
    // flagged as the transparent color per frame.
    if (this.alpha === "keep") {
      this.quantizeOptions = {
        ...this.quantizeOptions,
        format: "rgba4444",
        // Keep a custom threshold if provided, otherwise force it on.
        oneBitAlpha:
          typeof this.quantizeOptions.oneBitAlpha === "number"
            ? this.quantizeOptions.oneBitAlpha
            : true,
      };
    }

    this.encoder = GIFEnc();
  }

  async start() {
    await super.start();

    this.step();
  }

  encode(frame) {
    const palette = quantize(frame, this.maxColors, this.quantizeOptions);

    const index = applyPalette(frame, palette, this.quantizeOptions.format);

    const frameOptions = {
      palette,
      delay: (1 / this.frameRate) * 1000,
    };

    if (this.alpha === "keep") {
      // The oneBitAlpha pass yields a fully transparent palette entry (alpha 0);
      // flag it so GIF renders those pixels as see-through.
      const transparentIndex = palette.findIndex((color) => color[3] === 0);

      if (transparentIndex !== -1) {
        frameOptions.transparent = true;
        frameOptions.transparentIndex = transparentIndex;
        frameOptions.dispose = 2; // Restore to background so frames don't bleed.
      }
    }

    this.encoder.writeFrame(index, this.width, this.height, {
      ...frameOptions,
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
