/** @module createCanvasContext */
const contextTypeList = [
	"2d",
	"webgl",
	"experimental-webgl",
	"webgl2",
	"webgl2-compute",
	"bitmaprenderer",
	"gpupresent",
	"webgpu"
];
/**
* Create a RenderingContext (2d, webgl, webgl2, bitmaprenderer, webgpu), optionally offscreen for possible use in a Worker.
*
* @alias module:createCanvasContext
* @param {import("./types.js").ContextType} [contextType="2d"]
* @param {import("./types.js").CanvasContextOptions} [options={}]
* @returns {import("./types.js").CanvasContextReturnValue}
*/
function createCanvasContext(contextType = "2d", options = {}) {
	const { width, height, offscreen = false, worker = false, contextAttributes = {} } = { ...options };
	if (!worker && !contextTypeList.includes(contextType)) throw new TypeError(`Unknown contextType: "${contextType}"`);
	if (typeof window === "undefined" && !options.canvas) return null;
	const canvasEl = options.canvas || document.createElement("canvas");
	const canvas = (offscreen || worker) && "OffscreenCanvas" in window ? canvasEl.transferControlToOffscreen() : canvasEl;
	if (Number.isInteger(width) && width >= 0) canvas.width = width;
	if (Number.isInteger(height) && height >= 0) canvas.height = height;
	if (worker) return { canvas };
	let context;
	try {
		context = canvas.getContext(contextType, contextAttributes) || (contextType === "webgl" ? canvas.getContext("experimental-webgl", contextAttributes) : null);
	} catch (error) {
		console.error(error);
		context = null;
	}
	return {
		canvas,
		context
	};
}

export { createCanvasContext as default };