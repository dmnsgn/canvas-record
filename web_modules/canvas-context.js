/**
 * @module createCanvasContext
 */
const contextTypeList = ["2d", "webgl", "experimental-webgl", "webgl2", "webgl2-compute", "bitmaprenderer", "gpupresent"];
/**
 * Create a RenderingContext (2d, webgl, webgl2, bitmaprenderer, gpupresent), optionally offscreen for possible use in a Worker.
 *
 * @alias module:createCanvasContext
 * @param {import("./types.js").ContextType} [contextType="2d"]
 * @param {import("./types.js").CanvasContextOptions} [options={}]
 * @returns {import("./types.js").CanvasContextReturnValue}
 */

function createCanvasContext(contextType = "2d", options = {}) {
  // Get options and set defaults
  const {
    width,
    height,
    offscreen = false,
    worker = false,
    contextAttributes = {}
  } = { ...options
  }; // Check contextType is valid

  if (!worker && !contextTypeList.includes(contextType)) {
    throw new TypeError(`Unknown contextType: "${contextType}"`);
  } // Return in Node or in a Worker unless a canvas is provided
  // See https://github.com/Automattic/node-canvas for an example


  if (typeof window === "undefined" && !options.canvas) {
    return null;
  } // Get offscreen canvas if requested and available


  const canvasEl = options.canvas || document.createElement("canvas");
  const canvas = (offscreen || worker) && "OffscreenCanvas" in window ? canvasEl.transferControlToOffscreen() : canvasEl; // Set canvas dimensions (default to 300 in browsers)

  if (Number.isInteger(width) && width >= 0) canvas.width = width;
  if (Number.isInteger(height) && height >= 0) canvas.height = height;
  if (worker) return {
    canvas
  }; // Get the context with specified attributes and handle experimental-webgl

  let context;

  try {
    context = canvas.getContext(contextType, contextAttributes) || (contextType === "webgl" ? canvas.getContext("experimental-webgl", contextAttributes) : null);
  } catch (error) {
    context = null;
  }

  return {
    canvas,
    context
  };
}

export default createCanvasContext;
