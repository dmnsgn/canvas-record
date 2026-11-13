import { $ as assertBlockAlignedOrigin, A as disposeTiming, C as reflectWGSL, D as debugGroupsEnabled, E as debugCounters, G as updateBuffer, H as BUFFER_USAGE_PRESETS, I as trackCollectable, J as brand, L as trackPassTiming, M as resetFrameCounters, N as resetFrameTiming, O as debugLog, P as resolveFrameTiming, Q as alignTo, R as trackResource, S as reflectStages, T as debug, U as createBuffer, V as createTimestampQuery, W as isGpuBuffer, X as objectId, Y as nextId, Z as shared, _ as PipelineCache, a as copyExternalImage, c as generateMipmaps, f as updateTexture, g as peekCommandsState, h as frameState, it as texelCopyLayout, j as recordCacheAccess, k as debugStats, l as isGpuTexture, m as commandsState, n as buildBindGroups, o as createTexture, q as assertSchema, r as pipelineLayout, rt as physicalExtent, t as resolveVertexState, v as resolveShaders, w as completeFrameTiming, z as untrackResource } from "./_chunks/vertex-layout-CGidDqgr.js";

function resolveDepthStencilFormat(options) {
	if (options.depthStencilFormat) return options.depthStencilFormat;
	if (options.depth ?? true) return options.stencil ? "depth24plus-stencil8" : "depth24plus";
	return options.stencil ? "stencil8" : void 0;
}
const contextState = shared("contextState", () => /* @__PURE__ */ new WeakMap());
const getState = (ctx) => {
	const state = contextState.get(ctx);
	if (!state) {
		assertSchema(ctx);
		throw new Error("pex-gpu: unknown or disposed context");
	}
	return state;
};
/**
* Create a WebGPU context: adapter, device, and a configured canvas. `label`
* names the device in browser error messages and tooling; `format` defaults to
* getPreferredCanvasFormat(), eg. "rgba16float" for HDR.
*
* ```js
* const ctx = await gpu.createContext({ width: 640, height: 480 });
* ```
*/
async function createContext(options = {}) {
	if (!navigator.gpu) throw new Error("pex-gpu: WebGPU is not available in this browser");
	const adapter = await navigator.gpu.requestAdapter({
		...options.powerPreference && { powerPreference: options.powerPreference },
		...options.featureLevel && { featureLevel: options.featureLevel },
		...options.forceFallbackAdapter && { forceFallbackAdapter: true },
		...options.xrCompatible && { xrCompatible: true }
	});
	if (!adapter) throw new Error("pex-gpu: no WebGPU adapter available");
	const requestedFeatures = [...options.requiredFeatures ?? []];
	const missingFeatures = requestedFeatures.filter((feature) => !adapter.features.has(feature));
	if (missingFeatures.length) console.warn(`pex-gpu: unsupported features skipped: ${missingFeatures.join(", ")}`);
	const grantedFeatures = new Set([...requestedFeatures, ...options.optionalFeatures ?? []].filter((feature) => adapter.features.has(feature)));
	const supportedLimits = adapter.limits;
	const clampedLimits = {};
	for (const [name, value] of Object.entries(options.optionalLimits ?? {})) {
		const supported = supportedLimits[name];
		if (supported === void 0 || value === void 0) continue;
		if (!Number.isFinite(value)) continue;
		clampedLimits[name] = name.startsWith("min") ? Math.max(2 ** Math.floor(Math.log2(value)), supported) : Math.min(value, supported);
	}
	const requiredLimits = {
		...clampedLimits,
		...options.requiredLimits
	};
	const device = await adapter.requestDevice({
		...options.label && { label: options.label },
		requiredFeatures: [...grantedFeatures],
		...Object.keys(requiredLimits).length > 0 && { requiredLimits },
		...options.defaultQueue && { defaultQueue: options.defaultQueue }
	});
	(async () => {
		const info = await device.lost;
		if (info.reason !== "destroyed") console.error(`pex-gpu: device lost: ${info.message}`);
	})();
	device.addEventListener("uncapturederror", (event) => {
		event.preventDefault();
		console.error(`pex-gpu: uncaptured ${event.error.constructor.name}: ${event.error.message}`);
	});
	const canvas = options.canvas ?? document.createElement("canvas");
	if (!options.canvas) document.body.append(canvas);
	const canvasContext = canvas.getContext("webgpu");
	if (!canvasContext) throw new Error("pex-gpu: could not get a webgpu canvas context");
	const format = options.format ?? navigator.gpu.getPreferredCanvasFormat();
	const alphaMode = options.alphaMode ?? "opaque";
	canvasContext.configure({
		device,
		format,
		alphaMode,
		...options.usage ? { usage: options.usage } : options.preserveDrawingBuffer && { usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST },
		...options.colorSpace && { colorSpace: options.colorSpace },
		...options.toneMapping && { toneMapping: options.toneMapping },
		...options.viewFormats && { viewFormats: options.viewFormats }
	});
	const dispose = () => {
		const state = contextState.get(ctx);
		if (state) {
			state.running = false;
			state.backbuffer?.dispose();
		}
		contextState.delete(ctx);
		const commands = peekCommandsState(ctx);
		if (commands) {
			commands.allocator?.dispose();
			commands.storageAllocator?.dispose();
			commands.canvasDepthStencil?.dispose();
			commands.bindGroupLayouts.clear();
			commands.pipelineLayouts.clear();
			commands.bindGroups.clear();
			commands.bindGroupsByResource.clear();
		}
		ctx.pipelineCache.clear();
		disposeTiming(ctx);
		canvasContext.unconfigure();
		device.destroy();
	};
	const ctx = {
		adapter,
		device,
		canvas,
		canvasContext,
		format,
		alphaMode,
		depthStencilFormat: resolveDepthStencilFormat(options),
		pipelineCache: new PipelineCache(device),
		pixelRatio: 1,
		get width() {
			return canvas.width;
		},
		get height() {
			return canvas.height;
		},
		dispose,
		[Symbol.dispose]: dispose
	};
	brand(ctx);
	contextState.set(ctx, {
		resized: false,
		running: false,
		preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
		requestedPixelRatio: 1,
		backbuffer: null
	});
	resize(ctx, options.width ?? (options.canvas ? canvas.clientWidth : window.innerWidth), options.height ?? (options.canvas ? canvas.clientHeight : window.innerHeight), options.pixelRatio ?? 1);
	console.info(`pex-gpu ✔`);
	return ctx;
}
/**
* Set the canvas CSS size and physical drawing buffer size. Size-dependent
* resources (depth textures, render targets) are the caller's to recreate — the
* next frame reports `resized: true`.
*
* `ctx.pixelRatio` reports the ratio applied: the requested one, unless the
* drawing buffer would exceed maxTextureDimension2D.
*/
function resize(ctx, width, height, pixelRatio) {
	const state = getState(ctx);
	if (pixelRatio) state.requestedPixelRatio = pixelRatio;
	const maxDimension = ctx.device.limits.maxTextureDimension2D;
	const ratio = Math.min(state.requestedPixelRatio, maxDimension / Math.max(width, height));
	if (ratio < state.requestedPixelRatio) console.warn(`pex-gpu: ${width}x${height} at pixelRatio ${state.requestedPixelRatio} exceeds maxTextureDimension2D (${maxDimension}), using pixelRatio ${ratio}`);
	ctx.pixelRatio = ratio;
	ctx.canvas.style.width = `${width}px`;
	ctx.canvas.style.height = `${height}px`;
	ctx.canvas.width = Math.max(1, Math.floor(width * ratio));
	ctx.canvas.height = Math.max(1, Math.floor(height * ratio));
	state.resized = true;
	if (!state.preserveDrawingBuffer) return;
	state.backbuffer?.dispose();
	state.backbuffer = createTexture(ctx, {
		width: ctx.width,
		height: ctx.height,
		format: ctx.format,
		usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
		label: "pex-gpu canvas backbuffer"
	});
}
/**
* Open a recording segment: creates a command encoder, acquires the canvas
* texture and resets the per-frame uniform ring allocator. submit() and other
* declarative commands are only valid between a beginFrame()/endFrame() pair.
*
* Unlike {@link frame}, this doesn't touch requestAnimationFrame — call it from
* any driving loop (a manual rAF loop, a fixed-timestep export loop, an async
* pump awaiting backpressure from something else). `frame()` is a thin
* convenience wrapper implemented on top of this pair for the common
* display-synced case; reach for beginFrame()/endFrame() directly when a
* frame's timing isn't display-refresh-driven — eg. rendering for precise video
* export, where every rendered frame must be captured regardless of vsync.
*
* Segments don't nest: call endFrame() before opening another one.
*
* ```js
* const segment = gpu.beginFrame(ctx);
* gpu.submit(ctx, drawCmd);
* gpu.endFrame(ctx);
* ```
*/
function beginFrame(ctx, label = "pex-gpu frame") {
	const state = getState(ctx);
	const commands = commandsState(ctx);
	if (commands.frame) throw new Error("pex-gpu: a frame segment is already open — call endFrame() before beginFrame() again");
	resetFrameCounters(ctx.device);
	resetFrameTiming(ctx);
	const encoder = ctx.device.createCommandEncoder({ label });
	const swapchainTexture = ctx.canvasContext.getCurrentTexture();
	const canvasTexture = state.backbuffer?.texture ?? swapchainTexture;
	const canvasView = state.backbuffer?.view ?? swapchainTexture.createView();
	if (debugGroupsEnabled(ctx.device)) encoder.pushDebugGroup(label);
	commands.allocator?.reset();
	commands.storageAllocator?.reset();
	commands.frame = {
		encoder,
		swapchainTexture,
		canvasView,
		canvasDepthStencilCleared: false,
		activePass: null,
		activeComputePass: null
	};
	return {
		encoder,
		canvasTexture,
		canvasView,
		width: ctx.width,
		height: ctx.height
	};
}
const uploadUniforms = (commands) => {
	commands.allocator?.flush();
	commands.storageAllocator?.flush();
};
/**
* Submit the open segment's commands so far and continue it in a new command
* buffer. A validation error fails only the command buffer it is in, so work
* flushed this way survives anything invalid recorded after it.
*
* Not valid inside a pass scope. Returns the new encoder: one obtained before
* the flush, eg. `FrameSegment.encoder`, is finished.
*/
function flush(ctx) {
	const commands = commandsState(ctx);
	const frame = commands.frame;
	if (!frame) throw new Error("pex-gpu: flush() called without an open frame segment");
	if (frame.activePass || frame.activeComputePass) throw new Error("pex-gpu: flush() cannot be called inside a pass scope");
	uploadUniforms(commands);
	const { label } = frame.encoder;
	const debugGroups = debugGroupsEnabled(ctx.device);
	if (debugGroups) frame.encoder.popDebugGroup();
	ctx.device.queue.submit([frame.encoder.finish()]);
	frame.encoder = ctx.device.createCommandEncoder({ label });
	if (debugGroups) frame.encoder.pushDebugGroup(label);
	return frame.encoder;
}
/**
* Close the segment opened by {@link beginFrame}: ends any pass left open,
* flushes the uniform ring allocator, blits the preserveDrawingBuffer
* backbuffer if enabled, and submits the encoder. Always submits — there's no
* discard path, so every opened segment's work reaches the GPU.
*/
function endFrame(ctx) {
	const state = getState(ctx);
	const commands = commandsState(ctx);
	const frame = commands.frame;
	if (!frame) throw new Error("pex-gpu: endFrame() called without a matching beginFrame()");
	commands.frame = null;
	if (frame.activePass) frame.activePass.encoder.end();
	if (frame.activeComputePass) frame.activeComputePass.encoder.end();
	uploadUniforms(commands);
	if (state.backbuffer) frame.encoder.copyTextureToTexture({ texture: state.backbuffer.texture }, { texture: frame.swapchainTexture }, {
		width: ctx.width,
		height: ctx.height
	});
	resolveFrameTiming(ctx, frame.encoder);
	if (debugGroupsEnabled(ctx.device)) frame.encoder.popDebugGroup();
	ctx.device.queue.submit([frame.encoder.finish()]);
	completeFrameTiming(ctx);
}
/**
* Render loop. Each frame is a {@link beginFrame}/{@link endFrame} segment synced
* to requestAnimationFrame. Return `false` from the callback to stop the loop —
* the stopping frame's work is still submitted.
*
* Paced: at most {@link FrameOptions.maxFramesInFlight} frames may be in flight,
* so a scene the GPU cannot keep up with drops frames instead of accumulating
* submissions.
*
* The callback can drive the encoder directly, submit() declarative commands,
* or mix both.
*
* The callback may be async: the segment stays open until it settles and the
* next frame is only requested then, so two ticks never share an encoder and
* everything drawn still lands in one command buffer. Await CPU work only — the
* swapchain texture is acquired when the segment opens, so yielding long enough
* for the browser to present would invalidate it.
*
* ```js
* gpu.frame(ctx, ({ time }) => {
*   gpu.submit(ctx, drawCmd);
* });
*
* gpu.frame(ctx, ({ encoder, canvasView }) => {
*   const pass = encoder.beginRenderPass({ colorAttachments: [{ view: canvasView, ... }] });
*   // ...
*   pass.end();
* });
*
* gpu.frame(ctx, async () => {
*   await renderer.render(); // one segment, one submit
*   gui.draw();
* });
* ```
*/
function frame(ctx, callback, options = {}) {
	const state = getState(ctx);
	state.running = true;
	state.resized = false;
	let startTime = -1;
	let previousTimestamp = -1;
	let frameIndex = 0;
	const maxFramesInFlight = Math.max(1, options.maxFramesInFlight ?? 2);
	const paced = Number.isFinite(maxFramesInFlight);
	const inFlight = [];
	const tick = async (timestamp) => {
		if (!state.running || !contextState.has(ctx)) return;
		while (inFlight.length >= maxFramesInFlight) {
			await inFlight.shift();
			if (!state.running || !contextState.has(ctx)) return;
		}
		if (startTime === -1) startTime = previousTimestamp = timestamp;
		const time = (timestamp - startTime) / 1e3;
		const deltaTime = (timestamp - previousTimestamp) / 1e3;
		previousTimestamp = timestamp;
		const info = {
			...beginFrame(ctx, `pex-gpu frame ${frameIndex}`),
			time,
			deltaTime,
			frame: frameIndex++,
			timestamp,
			resized: state.resized
		};
		state.resized = false;
		let result;
		try {
			result = await callback(info);
		} finally {
			endFrame(ctx);
		}
		if (paced) inFlight.push(ctx.device.queue.onSubmittedWorkDone().catch(() => {}));
		if (result === false) {
			state.running = false;
			return;
		}
		requestAnimationFrame(tick);
	};
	requestAnimationFrame(tick);
}

/**
* The context-managed canvas-sized depth/stencil texture, recreated on demand
* when the canvas size changes. Restores the WebGL-era "the canvas has a depth
* buffer" ergonomics for canvas-targeting passes.
*/
function canvasDepthStencilTexture(ctx) {
	if (!ctx.depthStencilFormat) throw new Error("pex-gpu: the canvas has no depth/stencil buffer — the context was created with depth and stencil disabled");
	const state = commandsState(ctx);
	if (state.canvasDepthStencil && (state.canvasDepthStencil.width !== ctx.width || state.canvasDepthStencil.height !== ctx.height)) {
		state.canvasDepthStencil.dispose();
		state.canvasDepthStencil = null;
	}
	state.canvasDepthStencil ??= createTexture(ctx, {
		width: ctx.width,
		height: ctx.height,
		format: ctx.depthStencilFormat,
		label: "pex-gpu canvas depth/stencil"
	});
	return state.canvasDepthStencil;
}
function beginPass(ctx, frame, pass = {}, label) {
	const colorFormats = [];
	let sampleCount = 1;
	const colors = pass.colorAttachments ?? [{}];
	const colorAttachments = colors.map((attachment, index) => {
		const clearValue = attachment.clearValue ?? (index === 0 ? pass.clearValue : void 0);
		const texture = attachment.texture;
		colorFormats.push(texture?.format ?? ctx.format);
		sampleCount = Math.max(sampleCount, texture?.sampleCount ?? 1);
		const resolveTarget = attachment.resolveTarget === "canvas" ? frame.canvasView : attachment.resolveTarget?.view;
		return {
			view: attachment.view ?? texture?.view ?? frame.canvasView,
			...resolveTarget && { resolveTarget },
			loadOp: attachment.loadOp ?? (clearValue ? "clear" : "load"),
			storeOp: attachment.storeOp ?? (resolveTarget ? "discard" : "store"),
			...clearValue && { clearValue }
		};
	});
	const hasClearShorthand = pass.depthClearValue !== void 0 || pass.stencilClearValue !== void 0;
	const targetsCanvas = colors.every((attachment) => !attachment.texture && !attachment.view);
	const depthStencilInput = pass.depthStencilAttachment ?? (targetsCanvas && (ctx.depthStencilFormat || hasClearShorthand) ? "canvas" : void 0);
	if (!depthStencilInput && hasClearShorthand) throw new Error("pex-gpu: depthClearValue/stencilClearValue on an offscreen pass requires an explicit depth/stencil attachment");
	let depthStencilAttachment;
	let depthStencilFormat;
	let depthReadOnly = false;
	if (depthStencilInput) {
		const isCanvasDepthStencil = depthStencilInput === "canvas";
		const resolved = isCanvasDepthStencil ? canvasDepthStencilTexture(ctx) : depthStencilInput;
		const depthStencil = isGpuTexture(resolved) ? { texture: resolved } : resolved;
		const depthClearValue = depthStencil.depthClearValue ?? pass.depthClearValue;
		const stencilClearValue = depthStencil.stencilClearValue ?? pass.stencilClearValue;
		depthStencilFormat = depthStencil.texture.format;
		const hasDepth = depthStencilFormat.startsWith("depth");
		depthReadOnly = hasDepth && (depthStencil.depthReadOnly ?? false);
		const autoClear = isCanvasDepthStencil && !frame.canvasDepthStencilCleared;
		frame.canvasDepthStencilCleared ||= isCanvasDepthStencil;
		sampleCount = Math.max(sampleCount, depthStencil.texture.sampleCount);
		depthStencilAttachment = {
			view: depthStencil.view ?? depthStencil.texture.view,
			...hasDepth && (depthReadOnly ? { depthReadOnly: true } : {
				depthLoadOp: depthStencil.depthLoadOp ?? (depthClearValue !== void 0 || autoClear ? "clear" : "load"),
				depthStoreOp: depthStencil.depthStoreOp ?? "store",
				depthClearValue: depthClearValue ?? 1
			}),
			...depthStencilFormat.includes("stencil") && (depthStencil.stencilReadOnly ? { stencilReadOnly: true } : {
				stencilLoadOp: depthStencil.stencilLoadOp ?? (stencilClearValue !== void 0 || autoClear ? "clear" : "load"),
				stencilStoreOp: depthStencil.stencilStoreOp ?? "store",
				stencilClearValue: stencilClearValue ?? 0
			})
		};
	}
	const key = `${colorFormats.join(",")}|${depthStencilFormat ?? ""}|${sampleCount}${depthReadOnly ? "|r" : ""}`;
	const passLabel = pass.label ?? label ?? "pex-gpu pass";
	debugCounters(ctx.device).frame.renderPasses++;
	debugLog(ctx.device, "commands", () => `beginRenderPass "${passLabel}" [${key}]`);
	const timestampWrites = trackPassTiming(ctx, passLabel, "render", pass.timestampWrites) ?? pass.timestampWrites;
	return {
		encoder: frame.encoder.beginRenderPass({
			label: passLabel,
			colorAttachments,
			...depthStencilAttachment && { depthStencilAttachment },
			...timestampWrites && { timestampWrites }
		}),
		colorFormats,
		depthStencilFormat,
		depthReadOnly,
		sampleCount,
		key
	};
}
/**
* Marks `def` failed when `create` throws, so a source reflection can't parse
* throws once rather than at every submit.
*/
function failOnThrow(state, def, create) {
	try {
		return create();
	} catch (error) {
		state.failedPipelines.add(def);
		throw error;
	}
}
function draw(ctx, active, cmd) {
	const { pipeline: def } = cmd;
	if (!def) throw new Error(`pex-gpu: render command${cmd.label ? ` "${cmd.label}"` : ""} has no pipeline`);
	const state = commandsState(ctx);
	if (state.failedPipelines.has(def)) return;
	let reflectionCreated = false;
	const cached = state.renderPipelines.getOrInsertComputed(def, () => {
		reflectionCreated = true;
		return failOnThrow(state, def, () => {
			const { vertex: vertexSource, fragment: fragmentSource } = resolveShaders(def);
			const reflection = reflectStages(ctx.device, vertexSource, fragmentSource);
			const { layout, key } = pipelineLayout(ctx, reflection);
			return {
				vertexSource,
				fragmentSource,
				reflection,
				layout,
				layoutKey: key,
				variants: /* @__PURE__ */ new Map()
			};
		});
	});
	if (!reflectionCreated) recordCacheAccess(ctx.device, "shaderReflections", null);
	const { reflection, vertexSource, fragmentSource } = cached;
	const vertexState = resolveVertexState(reflection.vertexInputs, cmd.attributes ?? {});
	const stripIndexFormat = cmd.indices && def.topology?.endsWith("strip") ? cmd.indices.indexFormat : void 0;
	const variantKey = `${active.key}|${vertexState.key}|${def.topology ?? ""},${def.cullMode ?? ""},${def.frontFace ?? ""},${stripIndexFormat ?? ""},${def.depthWriteEnabled ?? ""},${def.depthCompare ?? ""},${def.vertexEntryPoint ?? ""},${def.fragmentEntryPoint ?? ""},${def.alphaToCoverage ?? ""}` + (def.constants ? `|c${JSON.stringify(def.constants)}` : "") + (def.blend || def.writeMask !== void 0 || def.stencilFront || def.stencilBack || def.stencilReadMask !== void 0 || def.stencilWriteMask !== void 0 || def.depthBias !== void 0 || def.depthBiasSlopeScale !== void 0 || def.depthBiasClamp !== void 0 ? `|${JSON.stringify([
		def.blend,
		def.writeMask,
		def.stencilFront,
		def.stencilBack,
		def.stencilReadMask,
		def.stencilWriteMask,
		def.depthBias,
		def.depthBiasSlopeScale,
		def.depthBiasClamp
	])}` : "");
	let pipelineCreated = false;
	const pipeline = cached.variants.getOrInsertComputed(variantKey, () => {
		pipelineCreated = true;
		const hasDepth = active.depthStencilFormat?.startsWith("depth");
		const blend = def.blend;
		const writeMask = def.writeMask;
		const targets = fragmentSource ? active.colorFormats.map((format, index) => {
			if (!format) return null;
			const targetBlend = Array.isArray(blend) ? blend[index] : blend;
			const targetWriteMask = Array.isArray(writeMask) ? writeMask[index] : writeMask;
			return {
				format,
				...targetBlend && { blend: targetBlend },
				...targetWriteMask !== void 0 && { writeMask: targetWriteMask }
			};
		}) : [];
		return ctx.pipelineCache.getRenderPipeline({
			vertex: vertexSource,
			...fragmentSource && { fragment: fragmentSource },
			...def.vertexEntryPoint && { vertexEntryPoint: def.vertexEntryPoint },
			...def.fragmentEntryPoint && { fragmentEntryPoint: def.fragmentEntryPoint },
			buffers: vertexState.layouts,
			targets,
			...def.constants && { constants: def.constants },
			primitive: {
				topology: def.topology ?? "triangle-list",
				cullMode: def.cullMode ?? "none",
				frontFace: def.frontFace ?? "ccw",
				...stripIndexFormat && { stripIndexFormat }
			},
			...active.depthStencilFormat && { depthStencil: {
				format: active.depthStencilFormat,
				depthWriteEnabled: hasDepth && !active.depthReadOnly ? def.depthWriteEnabled ?? false : false,
				depthCompare: hasDepth ? def.depthCompare ?? (def.depthWriteEnabled ? "less-equal" : "always") : "always",
				...def.depthBias !== void 0 && { depthBias: def.depthBias },
				...def.depthBiasSlopeScale !== void 0 && { depthBiasSlopeScale: def.depthBiasSlopeScale },
				...def.depthBiasClamp !== void 0 && { depthBiasClamp: def.depthBiasClamp },
				...def.stencilFront && { stencilFront: def.stencilFront },
				...def.stencilBack && { stencilBack: def.stencilBack },
				...def.stencilReadMask !== void 0 && { stencilReadMask: def.stencilReadMask },
				...def.stencilWriteMask !== void 0 && { stencilWriteMask: def.stencilWriteMask }
			} },
			...active.sampleCount > 1 && { multisample: {
				count: active.sampleCount,
				...def.alphaToCoverage && { alphaToCoverageEnabled: true }
			} },
			layout: cached.layout,
			layoutKey: cached.layoutKey,
			...def.label && { label: def.label }
		});
	});
	if (!pipelineCreated) recordCacheAccess(ctx.device, "renderPipelines", null);
	if (ctx.pipelineCache.hasFailed(pipeline)) {
		state.failedPipelines.add(def);
		return;
	}
	const pass = active.encoder;
	debugCounters(ctx.device).frame.draws++;
	const group = debugGroupsEnabled(ctx.device) ? cmd.label ?? def.label : void 0;
	if (group) pass.pushDebugGroup(group);
	try {
		pass.setPipeline(pipeline);
		if (cmd.viewport) pass.setViewport(...cmd.viewport, 0, 1);
		if (cmd.scissor) pass.setScissorRect(...cmd.scissor);
		if (cmd.stencilReference !== void 0) pass.setStencilReference(cmd.stencilReference);
		for (const { index, bindGroup, dynamicOffsets } of buildBindGroups(ctx, reflection, cmd.uniforms ?? {}, cmd.bindGroups)) pass.setBindGroup(index, bindGroup, dynamicOffsets);
		for (const [slot, binding] of vertexState.bindings.entries()) pass.setVertexBuffer(slot, binding.buffer.buffer, binding.offset);
		if (cmd.indices) pass.setIndexBuffer(cmd.indices.buffer, cmd.indices.indexFormat ?? "uint16");
		if (cmd.indirect) {
			const indirect = "id" in cmd.indirect ? {
				buffer: cmd.indirect,
				offset: 0
			} : {
				offset: 0,
				...cmd.indirect
			};
			debugLog(ctx.device, "commands", () => `draw${cmd.indices ? "IndexedIndirect" : "Indirect"}${cmd.label ? ` "${cmd.label}"` : ""}`);
			if (cmd.indices) pass.drawIndexedIndirect(indirect.buffer.buffer, indirect.offset);
			else pass.drawIndirect(indirect.buffer.buffer, indirect.offset);
			return;
		}
		const count = cmd.count ?? cmd.indices?.length ?? vertexState.inferredCount;
		if (count === void 0) throw new Error(`pex-gpu: cannot infer draw count${cmd.label ? ` for "${cmd.label}"` : ""}; set count, indices or indirect`);
		debugLog(ctx.device, "commands", () => `draw${cmd.indices ? "Indexed" : ""}${cmd.label ? ` "${cmd.label}"` : ""} count=${count} instances=${cmd.instanceCount ?? 1}`);
		if (cmd.indices) pass.drawIndexed(count, cmd.instanceCount ?? 1, cmd.first ?? 0, cmd.baseVertex ?? 0, cmd.firstInstance ?? 0);
		else pass.draw(count, cmd.instanceCount ?? 1, cmd.first ?? 0, cmd.firstInstance ?? 0);
	} finally {
		if (group) pass.popDebugGroup();
	}
}
/**
* The compute counterpart of {@link beginPass}. Compute passes carry no
* descriptor state beyond a label and optional timestamp writes — no
* attachments, formats or sample count. The command label names the pass when
* the descriptor doesn't.
*/
function beginComputePass(ctx, frame, pass = {}, label) {
	const passLabel = pass.label ?? label ?? "pex-gpu compute pass";
	debugCounters(ctx.device).frame.computePasses++;
	debugLog(ctx.device, "commands", () => `beginComputePass "${passLabel}"`);
	const timestampWrites = trackPassTiming(ctx, passLabel, "compute", pass.timestampWrites) ?? pass.timestampWrites;
	return { encoder: frame.encoder.beginComputePass({
		label: passLabel,
		...timestampWrites && { timestampWrites }
	}) };
}
function dispatchCompute(ctx, active, cmd) {
	const { pipeline: def } = cmd;
	const state = commandsState(ctx);
	if (state.failedPipelines.has(def)) return;
	let reflectionCreated = false;
	const cached = state.computePipelines.getOrInsertComputed(def, () => {
		reflectionCreated = true;
		return failOnThrow(state, def, () => {
			const reflection = reflectWGSL(ctx.device, def.compute);
			const { layout, key } = pipelineLayout(ctx, reflection);
			return {
				reflection,
				layout,
				layoutKey: key,
				variants: /* @__PURE__ */ new Map()
			};
		});
	});
	if (!reflectionCreated) recordCacheAccess(ctx.device, "shaderReflections", null);
	const { reflection } = cached;
	const variantKey = `${def.entryPoint ?? ""}${def.constants ? `|${JSON.stringify(def.constants)}` : ""}`;
	let pipelineCreated = false;
	const pipeline = cached.variants.getOrInsertComputed(variantKey, () => {
		pipelineCreated = true;
		return ctx.pipelineCache.getComputePipeline({
			compute: def.compute,
			...def.entryPoint && { entryPoint: def.entryPoint },
			...def.constants && { constants: def.constants },
			layout: cached.layout,
			layoutKey: cached.layoutKey,
			...def.label && { label: def.label }
		});
	});
	if (!pipelineCreated) recordCacheAccess(ctx.device, "computePipelines", null);
	if (ctx.pipelineCache.hasFailed(pipeline)) {
		state.failedPipelines.add(def);
		return;
	}
	const pass = active.encoder;
	debugCounters(ctx.device).frame.dispatches++;
	debugLog(ctx.device, "commands", () => `dispatch${cmd.label ? ` "${cmd.label}"` : ""} ${typeof cmd.dispatch === "object" && !Array.isArray(cmd.dispatch) ? "indirect" : JSON.stringify(cmd.dispatch)}`);
	const group = debugGroupsEnabled(ctx.device) ? cmd.label ?? def.label : void 0;
	if (group) pass.pushDebugGroup(group);
	try {
		pass.setPipeline(pipeline);
		for (const { index, bindGroup, dynamicOffsets } of buildBindGroups(ctx, reflection, cmd.uniforms ?? {}, cmd.bindGroups)) pass.setBindGroup(index, bindGroup, dynamicOffsets);
		if (typeof cmd.dispatch === "number") pass.dispatchWorkgroups(cmd.dispatch);
		else if (Array.isArray(cmd.dispatch)) pass.dispatchWorkgroups(...cmd.dispatch);
		else pass.dispatchWorkgroupsIndirect(cmd.dispatch.buffer.buffer, cmd.dispatch.offset ?? 0);
	} finally {
		if (group) pass.popDebugGroup();
	}
}
/**
* Whether a pipeline object failed: its shader couldn't be reflected, or one of
* its GPU pipelines failed validation. Submits using it are skipped, so a
* fallback needs a new pipeline object. Validation failures are known
* asynchronously, after the first submits.
*/
function pipelineFailed(ctx, pipeline) {
	return commandsState(ctx).failedPipelines.has(pipeline);
}
const mergeCommand = (base, override) => ({
	...base,
	...override,
	...(base.uniforms || override.uniforms) && { uniforms: {
		...base.uniforms,
		...override.uniforms
	} }
});
/** Run a pass scope callback with the frame's active pass slot swapped in. */
const withPassScope = (frame, slot, active, scope) => {
	const previous = frame[slot];
	frame[slot] = active;
	try {
		scope();
	} finally {
		frame[slot] = previous;
	}
};
function submit(ctx, cmd, passScopeOrBatch) {
	const ownsFrame = !commandsState(ctx).frame;
	if (ownsFrame) beginFrame(ctx, cmd.label ? `pex-gpu submit "${cmd.label}"` : "pex-gpu submit");
	const frame = frameState(ctx);
	try {
		if ("dispatch" in cmd) {
			if (frame.activePass) throw new Error("pex-gpu: cannot dispatch compute inside a render pass scope");
			if (cmd.pass && frame.activeComputePass) throw new Error("pex-gpu: cannot begin a compute pass inside another compute pass scope");
			const ownsPass = !frame.activeComputePass;
			const active = frame.activeComputePass ?? beginComputePass(ctx, frame, cmd.pass, cmd.label);
			try {
				if (Array.isArray(passScopeOrBatch)) for (const override of passScopeOrBatch) dispatchCompute(ctx, active, mergeCommand(cmd, override));
				else dispatchCompute(ctx, active, cmd);
				if (typeof passScopeOrBatch === "function") withPassScope(frame, "activeComputePass", active, passScopeOrBatch);
			} finally {
				if (ownsPass) active.encoder.end();
			}
		} else {
			if (frame.activeComputePass) throw new Error("pex-gpu: cannot begin a render pass inside a compute pass scope");
			if (cmd.pass && frame.activePass) throw new Error("pex-gpu: cannot begin a render pass inside another render pass scope");
			const ownsPass = !frame.activePass;
			const active = frame.activePass ?? beginPass(ctx, frame, cmd.pass, cmd.label);
			try {
				if ("bundles" in cmd) {
					if (Array.isArray(passScopeOrBatch)) throw new TypeError("pex-gpu: bundle commands do not support batch variants");
					debugCounters(ctx.device).frame.bundles += cmd.bundles.length;
					debugLog(ctx.device, "commands", () => `executeBundles${cmd.label ? ` "${cmd.label}"` : ""} (${cmd.bundles.length})`);
					active.encoder.executeBundles(cmd.bundles);
				} else if (Array.isArray(passScopeOrBatch)) for (const override of passScopeOrBatch) draw(ctx, active, mergeCommand(cmd, override));
				else if (cmd.pipeline) draw(ctx, active, cmd);
				if (typeof passScopeOrBatch === "function") withPassScope(frame, "activePass", active, passScopeOrBatch);
			} finally {
				if (ownsPass) active.encoder.end();
			}
		}
	} finally {
		if (ownsFrame) endFrame(ctx);
	}
}

function defineCommand(cmd) {
	return cmd;
}
function definePass(pass) {
	return pass;
}
function definePipeline(pipeline) {
	return pipeline;
}

/**
* Create a sampler: a thin alias for `device.createSampler` with filtering and
* address mode shorthands. Returns a raw GPUSampler — samplers own no GPU
* memory and need no dispose.
*
* ```js
* const sampler = gpu.createSampler(ctx, {
*   filter: "linear",
*   addressMode: "repeat",
* });
* ```
*/
function createSampler(ctx, options = {}) {
	const { filter, addressMode, ...descriptor } = options;
	const sampler = ctx.device.createSampler({
		...filter && {
			magFilter: filter,
			minFilter: filter,
			mipmapFilter: filter
		},
		...addressMode && {
			addressModeU: addressMode,
			addressModeV: addressMode,
			addressModeW: addressMode
		},
		...descriptor
	});
	trackCollectable(ctx.device, "samplers", sampler, {
		id: objectId(sampler),
		...options.label && { label: options.label },
		bytes: 0
	});
	return sampler;
}

/**
* Asynchronously read pixels back from a texture (eg. for picking). The source
* needs a `usage` including COPY_SRC. Compressed formats read back as their raw
* block bytes, the region rounded out to whole blocks.
*
* ```js
* const [r, g, b, a] = await gpu.readTexture(ctx, pickingTexture, {
*   x,
*   y,
*   width: 1,
*   height: 1,
* });
* ```
*/
async function readTexture(ctx, source, options = {}) {
	const mipLevel = options.mipLevel ?? 0;
	const { x = 0, y = 0, width = Math.max(1, source.width >> mipLevel), height = Math.max(1, source.height >> mipLevel) } = options;
	const origin = [
		x,
		y,
		options.layer ?? 0
	];
	assertBlockAlignedOrigin(source.format, origin);
	const { bytesPerRow: rowBytes, rowsPerImage } = texelCopyLayout(source.format, width, height);
	const bytesPerRow = alignTo(rowBytes, 256);
	const readback = ctx.device.createBuffer({
		label: "pex-gpu readback",
		size: bytesPerRow * rowsPerImage,
		usage: BUFFER_USAGE_PRESETS.readback
	});
	const readbackId = nextId();
	trackResource(ctx.device, "buffers", {
		id: readbackId,
		label: readback.label,
		usage: readback.usage,
		bytes: readback.size
	});
	const encoder = ctx.device.createCommandEncoder({ label: "pex-gpu readTexture" });
	encoder.copyTextureToBuffer({
		texture: source.texture,
		mipLevel,
		origin
	}, {
		buffer: readback,
		bytesPerRow,
		rowsPerImage
	}, physicalExtent(source.format, width, height));
	ctx.device.queue.submit([encoder.finish()]);
	await readback.mapAsync(GPUMapMode.READ);
	const mapped = new Uint8Array(readback.getMappedRange());
	const data = new Uint8Array(rowBytes * rowsPerImage);
	for (let row = 0; row < rowsPerImage; row++) data.set(mapped.subarray(row * bytesPerRow, row * bytesPerRow + rowBytes), row * rowBytes);
	readback.unmap();
	untrackResource(ctx.device, "buffers", readbackId);
	readback.destroy();
	return data;
}
/**
* Asynchronously read a buffer back to the CPU.
*
* ```js
* const data = new Float32Array(await gpu.readBuffer(ctx, particleBuffer));
* ```
*/
async function readBuffer(ctx, source, byteOffset = 0, byteLength = source.size - byteOffset) {
	const copyLength = alignTo(byteLength, 4);
	const readback = ctx.device.createBuffer({
		label: "pex-gpu readback",
		size: copyLength,
		usage: BUFFER_USAGE_PRESETS.readback
	});
	const readbackId = nextId();
	trackResource(ctx.device, "buffers", {
		id: readbackId,
		label: readback.label,
		usage: readback.usage,
		bytes: readback.size
	});
	const encoder = ctx.device.createCommandEncoder({ label: "pex-gpu readBuffer" });
	encoder.copyBufferToBuffer(source.buffer, byteOffset, readback, 0, copyLength);
	ctx.device.queue.submit([encoder.finish()]);
	await readback.mapAsync(GPUMapMode.READ);
	const data = readback.getMappedRange().slice(0, byteLength);
	readback.unmap();
	untrackResource(ctx.device, "buffers", readbackId);
	readback.destroy();
	return data;
}

/**
* Record a reusable render bundle. The callback receives a
* GPURenderBundleEncoder supporting setPipeline/setBindGroup/draw calls;
* executing the finished bundle replays them with near-zero CPU cost.
*
* Use `ctx.format`/`ctx.depthStencilFormat` when the bundle targets the canvas.
*
* ```js
* const bundle = gpu.createRenderBundle(
*   ctx,
*   {
*     colorFormats: [ctx.format],
*     depthStencilFormat: ctx.depthStencilFormat,
*   },
*   (encoder) => {
*     encoder.setPipeline(pipeline);
*     // ...
*     encoder.drawIndexed(count);
*   },
* );
* // later, inside a matching render pass:
* pass.executeBundles([bundle]);
* ```
*/
function createRenderBundle(ctx, formats, record) {
	const label = formats.label ?? "pex-gpu bundle";
	const encoder = ctx.device.createRenderBundleEncoder({
		...formats,
		sampleCount: formats.sampleCount ?? 1,
		label
	});
	record(encoder);
	const bundle = encoder.finish({ label });
	trackCollectable(ctx.device, "renderBundles", bundle, {
		id: objectId(bundle),
		label,
		bytes: 0
	});
	return bundle;
}

export { BUFFER_USAGE_PRESETS, beginFrame, copyExternalImage, createBuffer, createContext, createRenderBundle, createSampler, createTexture, createTimestampQuery, debug, debugStats, defineCommand, definePass, definePipeline, endFrame, flush, frame, generateMipmaps, isGpuBuffer, isGpuTexture, pipelineFailed, readBuffer, readTexture, resize, submit, updateBuffer, updateTexture };