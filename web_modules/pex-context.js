/** @module pex-gl */ /**
 * Context fallbacks map
 * @constant
 */ const FALLBACKS = {
    "2d": [],
    bitmaprenderer: [],
    webgl: [
        "experimental-webgl"
    ],
    webgl2: [
        "webgl",
        "experimental-webgl"
    ],
    webgpu: []
};
/**
 * Creates a rendering context.
 * @alias module:pex-gl.default
 * @param {import("./types.js").PexGLOptions} [opts={}]
 * @returns {RenderingContext}
 */ function createRenderingContext(opts = {}) {
    // Get options and set defaults
    const { width = window.innerWidth, height = window.innerHeight, pixelRatio = 1, fullscreen = !opts.width && !opts.height, type = "webgl", element = document.body, ...contextAttributes } = {
        ...opts
    };
    const canvas = opts.canvas || document.createElement("canvas");
    if (!opts.canvas) {
        if (fullscreen) {
            const meta = document.createElement("meta");
            meta.setAttribute("name", "viewport");
            meta.setAttribute("content", "width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=0.0");
            document.head.appendChild(meta);
        }
        const appendCanvas = ()=>{
            if (fullscreen) {
                Object.assign(document.body.style, {
                    margin: 0,
                    overflow: "hidden",
                    backgroundColor: "#000"
                });
            }
            element.appendChild(canvas);
        };
        if (pixelRatio !== 1) {
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
        } else {
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
        }
        if (document.body) {
            appendCanvas();
        } else {
            document.addEventListener("DOMContentLoaded", appendCanvas);
        }
    }
    const contexts = [
        type,
        ...FALLBACKS[type] || []
    ];
    for(let i = 0; i < contexts.length; i++){
        try {
            const context = canvas.getContext(contexts[i], contextAttributes);
            if (!context) throw `canvas.getContext() returned "null".`;
            console.info(`pex-gl: ${contexts[i]} ✔`);
            return context;
        } catch (error) {
            console.warn(`pex-gl: ${contexts[i]} failed ⚠`, error);
        }
    }
    console.error(`pex-gl: ${type} failed ✖`);
    return null;
}

// Debug
const NAMESPACE = "pex-context";
const checkProps = (allowedProps, obj)=>Object.keys(obj).forEach((prop)=>{
        if (!allowedProps.includes(prop)) throw new Error(`Unknown prop "${prop}"`);
    });
const isWebGL2 = (gl)=>typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
const isObject = (obj)=>Object.prototype.toString.call(obj) === "[object Object]";
const is2DArray = (arr)=>arr[0]?.length;
// State and gl
function compareFBOAttachments(framebuffer, passOpts) {
    const fboDepthAttachment = framebuffer.depth?.texture;
    const passDepthAttachment = passOpts.depth?.texture || passOpts.depth;
    if (fboDepthAttachment != passDepthAttachment) return false;
    if (framebuffer.color.length != passOpts.color?.length) return false;
    for(let i = 0; i < framebuffer.color.length; i++){
        const fboColorAttachment = framebuffer.color[i]?.texture;
        const passColorAttachment = passOpts.color[i]?.texture || passOpts.color[i];
        if (fboColorAttachment != passColorAttachment) return false;
    }
    return true;
}
const getUniformLocation = (gl, program, name)=>gl.getUniformLocation(program.handle, name);
function enableVertexData(ctx, vertexLayout, cmd, updateState) {
    const gl = ctx.gl;
    const { attributes = {}, indices } = cmd;
    for(let i = vertexLayout.length; i < ctx.capabilities.maxVertexAttribs; i++){
        if (ctx.state.activeAttributes[i]) {
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.vertexAttribPointer(i, 4, ctx.DataType.Float32, false, 0, 0);
            gl.disableVertexAttribArray(i);
            ctx.state.activeAttributes[i] = null;
        }
    }
    for(let i = 0; i < vertexLayout.length; i++){
        const [name, location, size] = vertexLayout[i];
        // TODO: is attributes array valid?
        const attrib = attributes[i] || attributes[name];
        if (!attrib) {
            console.debug(NAMESPACE, "invalid command", cmd, "doesn't satisfy vertex layout", vertexLayout);
            throw new Error(`Command is missing attribute "${name}" at location ${location} with ${attrib}`);
        }
        let buffer = attrib.buffer;
        if (!buffer && attrib.class === "vertexBuffer") {
            buffer = attrib;
        }
        if (!buffer || !buffer.target) {
            throw new Error(`Trying to draw arrays with invalid buffer for attribute : ${name}`);
        }
        gl.bindBuffer(buffer.target, buffer.handle);
        if (size === 16) {
            gl.enableVertexAttribArray(location + 0);
            gl.enableVertexAttribArray(location + 1);
            gl.enableVertexAttribArray(location + 2);
            gl.enableVertexAttribArray(location + 3);
            if (updateState) {
                ctx.state.activeAttributes[location + 0] = buffer;
                ctx.state.activeAttributes[location + 1] = buffer;
                ctx.state.activeAttributes[location + 2] = buffer;
                ctx.state.activeAttributes[location + 3] = buffer;
            }
            // TODO: is this still valid?
            // we still check for buffer type because while e.g. pex-renderer would copy buffer type to attrib, a raw pex-context example probably would not
            gl.vertexAttribPointer(location, 4, attrib.type || buffer.type, attrib.normalized || false, attrib.stride || 64, attrib.offset || 0);
            gl.vertexAttribPointer(location + 1, 4, attrib.type || buffer.type, attrib.normalized || false, attrib.stride || 64, attrib.offset || 16);
            gl.vertexAttribPointer(location + 2, 4, attrib.type || buffer.type, attrib.normalized || false, attrib.stride || 64, attrib.offset || 32);
            gl.vertexAttribPointer(location + 3, 4, attrib.type || buffer.type, attrib.normalized || false, attrib.stride || 64, attrib.offset || 48);
            const divisor = attrib.divisor || 0;
            gl.vertexAttribDivisor(location + 0, divisor);
            gl.vertexAttribDivisor(location + 1, divisor);
            gl.vertexAttribDivisor(location + 2, divisor);
            gl.vertexAttribDivisor(location + 3, divisor);
        } else {
            gl.enableVertexAttribArray(location);
            if (updateState) ctx.state.activeAttributes[location] = buffer;
            let offset = attrib.offset || 0;
            const type = attrib.type || buffer.type;
            // Instanced Base fallback
            if (!ctx.capabilities.drawInstancedBase && (cmd.baseInstance || cmd.baseVertex)) {
                if (indices) {
                    offset += (attrib.divisor ? cmd.baseInstance : cmd.baseVertex) * size * ctx.DataTypeConstructor[type].BYTES_PER_ELEMENT;
                } else {
                    if (attrib.divisor) offset += cmd.count * cmd.baseInstance / size;
                }
            }
            gl.vertexAttribPointer(location, size, type, attrib.normalized || false, attrib.stride || 0, offset);
            gl.vertexAttribDivisor(location, attrib.divisor || 0);
        }
    // TODO: how to match index with vertexLayout location?
    }
    if (indices) {
        let indexBuffer = indices.buffer;
        if (!indexBuffer && indices.class === "indexBuffer") {
            indexBuffer = indices;
        }
        if (!indexBuffer || !indexBuffer.target) {
            console.debug(NAMESPACE, "invalid command", cmd, "buffer", indexBuffer);
            throw new Error(`Trying to draw arrays with invalid buffer for elements`);
        }
        if (updateState) ctx.state.indexBuffer = indexBuffer;
        gl.bindBuffer(indexBuffer.target, indexBuffer.handle);
    }
}
function drawElements(ctx, cmd, instanced, primitive) {
    const gl = ctx.gl;
    // TODO: is that always correct
    const count = cmd.count || ctx.state.indexBuffer.length;
    const offset = cmd.indices?.offset || cmd.vertexArray?.indices?.offset || 0;
    const type = cmd.indices?.type || cmd.vertexArray?.indices?.offset || ctx.state.indexBuffer.type;
    // Instanced drawing
    if (instanced) {
        if (cmd.multiDraw) {
            if (ctx.capabilities.multiDraw) {
                // Multidraw elements instanced base
                if (ctx.capabilities.multiDrawInstancedBase && (cmd.multiDraw.baseVertices || cmd.multiDraw.baseInstances)) {
                    const ext = gl.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance");
                    ext.multiDrawElementsInstancedBaseVertexBaseInstanceWEBGL(primitive, cmd.multiDraw.counts, cmd.multiDraw.countsOffset || 0, type, cmd.multiDraw.offsets, cmd.multiDraw.offsetsOffset || 0, cmd.multiDraw.instanceCounts, cmd.multiDraw.instanceCountsOffset || 0, cmd.multiDraw.baseVertices || [], cmd.multiDraw.baseVerticesOffset || 0, cmd.multiDraw.baseInstances || [], cmd.multiDraw.baseInstancesOffset || 0, cmd.multiDraw.drawCount || cmd.multiDraw.counts.length);
                } else {
                    // Multidraw elements instanced (or multidraw base fallback with offset from enableVertexData)
                    const ext = gl.getExtension("WEBGL_multi_draw");
                    // TODO: fallback
                    if (cmd.multiDraw.baseVertices || cmd.multiDraw.baseInstances) {
                        console.error("Unsupported multiDrawInstancedBase. No fallback.");
                    }
                    ext.multiDrawElementsInstancedWEBGL(primitive, cmd.multiDraw.counts, cmd.multiDraw.countsOffset || 0, type, cmd.multiDraw.offsets, cmd.multiDraw.offsetsOffset || 0, cmd.multiDraw.instanceCounts, cmd.multiDraw.instanceCountsOffset || 0, cmd.multiDraw.drawCount || cmd.multiDraw.counts.length);
                }
            } else {
                // Multi draw elements instanced fallback
                // TODO: fallback
                console.error("Unsupported multidraw. No fallback.");
            }
        } else {
            // Non-multi drawing
            if (ctx.capabilities.drawInstancedBase && (Number.isFinite(cmd.baseVertex) || Number.isFinite(cmd.baseInstance))) {
                // Draw elements instanced base
                const ext = gl.getExtension("WEBGL_draw_instanced_base_vertex_base_instance");
                ext.drawElementsInstancedBaseVertexBaseInstanceWEBGL(primitive, count, type, offset, cmd.instances, cmd.baseVertex || 0, cmd.baseInstance || 0);
            } else {
                // Draw elements instanced (or base fallback with offset from enableVertexData)
                gl.drawElementsInstanced(primitive, count, type, offset, cmd.instances);
            }
        }
    } else {
        // Non instanced drawing
        if (cmd.multiDraw) {
            if (ctx.capabilities.multiDraw) {
                // Multidraw elements
                const ext = gl.getExtension("WEBGL_multi_draw");
                ext.multiDrawElementsWEBGL(primitive, cmd.multiDraw.counts, cmd.multiDraw.countsOffset || 0, type, cmd.multiDraw.offsets, cmd.multiDraw.offsetsOffset || 0, cmd.multiDraw.drawCount || cmd.multiDraw.counts.length);
            } else {
                // Multidraw elements fallback
                const countsOffset = cmd.multiDraw.countsOffset || 0;
                const offsetsOffset = cmd.multiDraw.offsetsOffset || 0;
                const drawCount = cmd.multiDraw.drawCount || cmd.multiDraw.counts.length;
                for(let i = 0; i < drawCount; i++){
                    gl.drawElements(primitive, cmd.multiDraw.counts[i + countsOffset], type, cmd.multiDraw.offsets[i + offsetsOffset]);
                }
            }
        } else {
            // Draw elements
            gl.drawElements(primitive, count, type, offset);
        }
    }
}
function drawArrays(ctx, cmd, instanced, primitive) {
    const gl = ctx.gl;
    if (instanced) {
        if (cmd.multiDraw && ctx.capabilities.multiDraw) {
            if (cmd.multiDraw.baseInstances && ctx.capabilities.multiDrawInstancedBase) {
                const ext = gl.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance");
                ext.multiDrawArraysInstancedBaseInstanceWEBGL(primitive, cmd.multiDraw.firsts, cmd.multiDraw.firstsOffset || 0, cmd.multiDraw.counts, cmd.multiDraw.countsOffset || 0, cmd.multiDraw.instanceCounts, cmd.multiDraw.instanceCountsOffset || 0, cmd.multiDraw.baseInstances, cmd.multiDraw.baseInstancesOffset || 0, cmd.multiDraw.drawCount || cmd.multiDraw.firsts.length);
            } else {
                const ext = gl.getExtension("WEBGL_multi_draw");
                ext.multiDrawArraysInstancedWEBGL(primitive, cmd.multiDraw.firsts, cmd.multiDraw.firstsOffset || 0, cmd.multiDraw.counts, cmd.multiDraw.countsOffset || 0, cmd.multiDraw.instanceCounts, cmd.multiDraw.instanceCountsOffset || 0, cmd.multiDraw.drawCount || cmd.multiDraw.firsts.length);
            }
        } else {
            // Non-multi drawing
            if (ctx.capabilities.drawInstancedBase && Number.isFinite(cmd.baseInstance)) {
                // Draw arrays instanced with base instance
                const ext = gl.getExtension("WEBGL_draw_instanced_base_vertex_base_instance");
                ext.drawArraysInstancedBaseInstanceWEBGL(primitive, cmd.first || 0, cmd.count, cmd.instances, cmd.baseInstance);
            } else {
                // Draw arrays instanced (or base instance fallback)
                gl.drawArraysInstanced(primitive, cmd.first || 0, cmd.count, cmd.instances);
            }
        }
    } else {
        // Non instanced drawing
        if (cmd.multiDraw) {
            // Multidraw arrays
            if (ctx.capabilities.multiDraw) {
                const ext = gl.getExtension("WEBGL_multi_draw");
                ext.multiDrawArraysWEBGL(primitive, cmd.multiDraw.firsts, cmd.multiDraw.firstsOffset || 0, cmd.multiDraw.counts, cmd.multiDraw.countsOffset || 0, cmd.multiDraw.drawCount || cmd.multiDraw.firsts.length);
            } else {
                // Multidraw arrays fallback
                const firstsOffset = cmd.multiDraw.firstsOffset || 0;
                const countsOffset = cmd.multiDraw.countsOffset || 0;
                const drawCount = cmd.multiDraw.drawCount || cmd.multiDraw.firsts.length;
                for(let i = 0; i < drawCount; i++){
                    gl.drawArrays(primitive, cmd.multiDraw.firsts[i + firstsOffset], cmd.multiDraw.counts[i + countsOffset]);
                }
            }
        } else {
            // Draw arrays
            gl.drawArrays(primitive, cmd.first || 0, cmd.count);
        }
    }
}
function draw(ctx, cmd) {
    const instanced = Object.values(cmd.attributes || cmd.vertexArray.attributes).some((attrib)=>attrib.divisor);
    const primitive = cmd.pipeline.primitive;
    // Draw elements/arrays: instanced, base, multi-draw
    if (cmd.indices || cmd.vertexArray?.indices) {
        drawElements(ctx, cmd, instanced, primitive);
    } else if (cmd.count || cmd.multiDraw?.counts) {
        drawArrays(ctx, cmd, instanced, primitive);
    } else {
        throw new Error("Vertex arrays requires elements, count or multiDraw");
    }
}

/**
 * @typedef {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement} TextureOptionsData
 * @property {Array | import("./types.js").TypedArray} data
 * @property {number} width
 * @property {number} height
 */ /**
 * @typedef {WebGLRenderingContext.TEXTURE_2D | WebGLRenderingContext.TEXTURE_CUBE_MAP | WebGL2RenderingContext.TEXTURE_2D_ARRAY | WebGL2RenderingContext.TEXTURE_3D} TextureTarget
 */ /**
 * @typedef {import("./types.js").PexResource} TextureOptions
 * @property {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | Array | import("./types.js").TypedArray | TextureOptionsData} [data]
 * @property {number} [width]
 * @property {number} [height]
 * @property {ctx.PixelFormat} [pixelFormat=ctx.PixelFormat.RGBA8]
 * @property {ctx.TextureFormat} [internalFormat=ctx.TextureFormat.RGBA]
 * @property {ctx.DataType} [type=ctx.TextureFormat[opts.pixelFormat]]
 * @property {ctx.Wrap} [wrapS=ctx.Wrap.ClampToEdge]
 * @property {ctx.Wrap} [wrapT=ctx.Wrap.ClampToEdge]
 * @property {ctx.Wrap} [wrap=ctx.Wrap.ClampToEdge]
 * @property {ctx.Filter} [min=ctx.Filter.Nearest]
 * @property {ctx.Filter} [mag=ctx.Filter.Nearest]
 * @property {number} [aniso=0] requires [EXT_texture_filter_anisotropic](https://www.khronos.org/registry/webgl/extensions/EXT_texture_filter_anisotropic/)
 * @property {boolean} [mipmap=true] requires `min` to be set to `ctx.Filter.LinearMipmapLinear` or similar
 * @property {boolean} [premultiplyAlpha=false]
 * @property {boolean} [flipY=false]
 * @property {boolean} [colorspaceConversion=gl.NONE]
 * @property {boolean} [compressed=false]
 * @property {TextureTarget} [target]
 * @property {number} [offset]
 */ /**
 * @typedef {import("./types.js").PexResource} Texture2DArrayOptions
 * @augments TextureOptions
 * @property {HTMLImageElement[] | TextureOptionsData[] | Array[] | import("./types.js").TypedArray[]} [data]
 */ /**
 * @typedef {import("./types.js").PexResource} TextureCubeOptions
 * @augments TextureOptions
 * @property {HTMLImageElement[] | import("./types.js").TypedArray[]} [data] 6 images, one for each face +X, -X, +Y, -Y, +Z, -Z
 */ const allowedProps$5 = [
    "name",
    "data",
    "width",
    "height",
    "pixelFormat",
    "internalFormat",
    "type",
    "flipY",
    "colorspaceConversion",
    "mipmap",
    "target",
    "min",
    "mag",
    "wrap",
    "wrapS",
    "wrapT",
    "aniso",
    "premultiplyAlpha",
    "compressed",
    "offset"
];
function createTexture(ctx, opts) {
    if (isObject(opts)) checkProps(allowedProps$5, opts);
    const gl = ctx.gl;
    const texture = {
        class: "texture",
        handle: gl.createTexture(),
        target: opts.target,
        width: 0,
        height: 0,
        _update: updateTexture,
        _dispose () {
            gl.deleteTexture(this.handle);
            this.handle = null;
        }
    };
    updateTexture(ctx, texture, opts);
    return texture;
}
const isElement = (element)=>element && element instanceof Element;
const isBuffer = (object)=>[
        "vertexBuffer",
        "indexBuffer"
    ].includes(object?.class);
const arrayToTypedArray = (ctx, type, array)=>{
    const TypedArray = ctx.DataTypeConstructor[type];
    console.assert(TypedArray, `Unknown texture data type: ${type}`);
    return new TypedArray(array);
};
function updateTexture(ctx, texture, opts) {
    // checkProps(allowedProps, opts)
    const gl = ctx.gl;
    let data = null;
    let width = opts.width;
    let height = opts.height;
    const flipY = opts.flipY ?? texture.flipY ?? false;
    const target = opts.target || texture.target;
    let pixelFormat = opts.pixelFormat || texture.pixelFormat || ctx.PixelFormat.RGBA8;
    const min = opts.min || texture.min || gl.NEAREST;
    const mag = opts.mag || texture.mag || gl.NEAREST;
    const wrapS = opts.wrapS || opts.wrap || texture.wrapS || texture.wrap || gl.CLAMP_TO_EDGE;
    const wrapT = opts.wrapT || opts.wrap || texture.wrapT || texture.wrap || gl.CLAMP_TO_EDGE;
    const aniso = opts.aniso || texture.aniso || 0;
    const premultiplyAlpha = opts.premultiplyAlpha ?? texture.premultiplyAlpha ?? false;
    const colorspaceConversion = opts.colorspaceConversion ?? opts.colorspaceConversion ?? gl.NONE;
    const compressed = opts.compressed || texture.compressed;
    let internalFormat;
    // Get internalFormat (format the GPU use internally) from opts.internalFormat (mainly for compressed texture) or pixelFormat
    if (opts.internalFormat) {
        internalFormat = opts.internalFormat;
    } else {
        if (opts.pixelFormat) {
            internalFormat = gl[pixelFormat];
        } else {
            internalFormat = texture.internalFormat ?? gl[pixelFormat];
        }
    }
    let type;
    let format;
    // Bind
    const textureUnit = 0;
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(target, texture.handle);
    ctx.state.activeTextures[textureUnit] = texture;
    // Pixel storage mode
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, colorspaceConversion);
    // Parameters
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrapT);
    if (ctx.capabilities.textureFilterAnisotropic && aniso > 0) {
        const anisoExt = gl.getExtension("EXT_texture_filter_anisotropic");
        gl.texParameterf(target, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, aniso);
    }
    if (!internalFormat || opts.internalFormat) {
        internalFormat = opts.internalFormat || gl[pixelFormat];
        // WebGL1
        if (ctx.gl instanceof WebGLRenderingContext) {
            // WEBGL_depth_texture (WebGL1 only) just adds DEPTH_COMPONENT and DEPTH_STENCIL
            if (ctx.capabilities.depthTexture && [
                "DEPTH_COMPONENT16",
                "DEPTH_COMPONENT24"
            ].includes(pixelFormat)) {
                internalFormat = gl["DEPTH_COMPONENT"];
            }
            // Handle legacy types
            if (!internalFormat) {
                if (pixelFormat === ctx.PixelFormat.R16F) {
                    pixelFormat = "R16FLegacy";
                    internalFormat = gl.ALPHA;
                } else if (pixelFormat === ctx.PixelFormat.R32F) {
                    pixelFormat = "R32FLegacy";
                    internalFormat = gl.ALPHA;
                } else if (pixelFormat === ctx.PixelFormat.RGBA8) {
                    pixelFormat = ctx.PixelFormat.RGBA;
                    internalFormat = gl.RGBA;
                } else if (pixelFormat === ctx.PixelFormat.RGBA16F || pixelFormat === ctx.PixelFormat.RGBA32F) {
                    internalFormat = gl.RGBA;
                }
            }
        }
        console.assert(internalFormat, `Texture2D.update Unknown internalFormat "${internalFormat}" for pixelFormat "${pixelFormat}".`);
    }
    // Get actual format and type (data supplied), allowing type override
    [format, type] = ctx.TextureFormat[pixelFormat];
    type = opts.type || type;
    console.assert(type, `Texture2D.update Unknown type ${type}.`);
    texture.internalFormat = internalFormat;
    texture.format = format;
    texture.type = type;
    texture.target = target;
    // Data provided as element or ImageBitmap:
    // - width/height are retrieved from the element
    // - format/type are set to defaults
    const element = opts.data || opts;
    if (isElement(element) || !ctx.capabilities.isWebGL2 && element instanceof ImageBitmap) {
        console.assert(element instanceof HTMLImageElement || element instanceof HTMLVideoElement || element instanceof HTMLCanvasElement || element instanceof ImageBitmap, "Texture2D.update opts has to be HTMLImageElement, HTMLVideoElement, HTMLCanvasElement or ImageBitmap");
        texture.compressed = false;
        texture.width = element.videoWidth ?? element.width;
        texture.height = element.videoHeight ?? element.height;
        // Allowed internal formats: RGB, RGBA, LUMINANCE, LUMINANCE_ALPHA, ALPHA, R8, RG8, RGB8, RGBA8, SRGB8, SRGB8_ALPHA8
        gl.texImage2D(target, 0, internalFormat, format, type, element);
    } else if (typeof opts === "object") {
        // Check data type
        console.assert(!data || Array.isArray(opts.data) || Object.values(ctx.DataTypeConstructor).some((TypedArray)=>opts.data instanceof TypedArray), "Texture2D.update opts.data has to be null, an Array or a TypedArray");
        const isTexture2DArray = target === gl.TEXTURE_2D_ARRAY;
        const isTextureCube = target === gl.TEXTURE_CUBE_MAP;
        if (isTexture2DArray || isTextureCube) {
            data = Array.isArray(opts) && opts.length ? opts : opts.data ?? null;
            width ||= data?.[0]?.data?.width || data?.[0]?.width;
            height ||= data?.[0]?.data?.height || data?.[0]?.height;
        } else {
            // Handle pixel data with flags
            data = opts.data ? opts.data.data || opts.data : null;
            // Update can be called without width/height (for flags only changes)
            width ||= data?.width;
            height ||= data?.height;
        }
        console.assert(!data || width !== undefined && height !== undefined, "Texture2D.update opts.width and opts.height are required when providing opts.data");
        texture.compressed = compressed;
        if (target === gl.TEXTURE_2D) {
            // Prepare data for mipmaps
            data = Array.isArray(data) && data[0].data ? data : [
                {
                    data,
                    width,
                    height
                }
            ];
            if (data[0].width) texture.width = data[0].width;
            if (data[0].height) texture.height = data[0].height;
            updateTexture2D(ctx, texture, data, opts);
        } else if (isTexture2DArray) {
            texture.width = width;
            texture.height = height;
            if (data?.length) updateTexture2DArray(ctx, texture, data);
        } else if (isTextureCube) {
            texture.width = width;
            texture.height = height;
            updateTextureCube(ctx, texture, data);
        }
    } else {
        // TODO: should i assert of throw new Error(msg)?
        throw new Error("Texture2D.update opts has to be a HTMLElement, ImageBitmap or Object");
    }
    if (opts.mipmap) gl.generateMipmap(texture.target);
    texture.pixelFormat = pixelFormat;
    texture.min = min;
    texture.mag = mag;
    texture.wrapS = wrapS;
    texture.wrapT = wrapT;
    texture.flipY = flipY;
    texture.colorspaceConversion = colorspaceConversion;
    texture.mipmap = opts.mipmap;
    return texture;
}
function updateTexture2D(ctx, texture, data, { offset } = {}) {
    const gl = ctx.gl;
    const { internalFormat, format, type, target, compressed } = texture;
    for(let level = 0; level < data.length; level++){
        let { data: levelData, width, height } = data[level];
        if (Array.isArray(levelData)) {
            levelData = arrayToTypedArray(ctx, type, levelData);
        }
        if (compressed) {
            gl.compressedTexImage2D(target, level, internalFormat, width, height, 0, levelData);
        } else if (width && height) {
            const fromBuffer = isBuffer(levelData);
            if (fromBuffer) gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, levelData.handle);
            gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, fromBuffer ? offset ?? 0 : levelData);
            if (fromBuffer) gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
        }
    }
}
function updateTexture2DArray(ctx, texture, data) {
    const gl = ctx.gl;
    const { internalFormat, format, type, target, width, height } = texture;
    const depth = data.length;
    // TODO: compressed and lod
    const lod = 0;
    for(let i = 0; i < depth; i++){
        const pixels = data[i].data || data[i];
        const w = pixels.width ?? width;
        const h = pixels.height ?? height;
        if (i === 0) gl.texStorage3D(target, 1, internalFormat, w, h, depth);
        gl.texSubImage3D(target, lod, 0, 0, i, w, h, 1, format, type, pixels);
    }
}
function updateTextureCube(ctx, texture, data) {
    console.assert(!data || Array.isArray(data) && data.length === 6, "TextureCube requires data for 6 faces");
    const gl = ctx.gl;
    const { internalFormat, format, type, width, height } = texture;
    // TODO: gl.compressedTexImage2D, manual mimaps
    const lod = 0;
    for(let i = 0; i < 6; i++){
        let faceData = data ? data[i].data || data[i] : null;
        const faceTarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
        if (isElement(faceData)) {
            gl.texImage2D(faceTarget, lod, internalFormat, format, type, faceData);
        } else {
            if (Array.isArray(faceData)) {
                faceData = arrayToTypedArray(ctx, type, faceData);
            }
            gl.texImage2D(faceTarget, lod, internalFormat, width, height, 0, format, type, faceData);
        }
    }
}

/**
 * @typedef {object} Attachment
 * @property {import("./types.js").PexResource} texture
 * @property {WebGLRenderingContext.FRAMEBUFFER} target
 */ function createFramebuffer(ctx, opts) {
    const gl = ctx.gl;
    const framebuffer = {
        class: "framebuffer",
        handle: gl.createFramebuffer(),
        target: gl.FRAMEBUFFER,
        name: `framebuffer${opts.name ? `_${opts.name}` : ""}`,
        drawBuffers: [],
        color: [],
        depth: null,
        width: 0,
        height: 0,
        refCount: 0,
        _update: updateFramebuffer,
        _dispose () {
            gl.deleteFramebuffer(this.handle);
            this.color = null;
            this.depth = null;
        }
    };
    if (opts.color || opts.depth) {
        updateFramebuffer(ctx, framebuffer, opts);
    }
    return framebuffer;
}
// opts = { color: [texture] }
// opts = { color: [texture], depth }
// opts = { color: [{texture, target}], depth }
function updateFramebuffer(ctx, framebuffer, opts) {
    const gl = ctx.gl;
    // TODO: if color.length > 1 check for WebGL2 or gl.getExtension('WEBGL_draw_buffers')
    framebuffer.color = opts.color ? opts.color.map((attachment)=>{
        const colorAttachment = attachment.texture ? attachment : {
            texture: attachment
        };
        colorAttachment.level = 0; // we can't render to mipmap level other than 0 in webgl
        if (!colorAttachment.target) {
            colorAttachment.target = colorAttachment.texture.target;
        }
        return colorAttachment;
    }) : [];
    framebuffer.depth = opts.depth ? opts.depth.texture ? opts.depth : {
        texture: opts.depth
    } : null;
    framebuffer.width = (framebuffer.color[0] || framebuffer.depth).texture.width;
    framebuffer.height = (framebuffer.color[0] || framebuffer.depth).texture.height;
    // TODO: ctx push framebuffer
    gl.bindFramebuffer(framebuffer.target, framebuffer.handle);
    framebuffer.drawBuffers.length = 0;
    framebuffer.color.forEach((colorAttachment, i)=>{
        framebuffer.drawBuffers.push(gl.COLOR_ATTACHMENT0 + i);
        if (colorAttachment.target === gl.RENDERBUFFER) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, //TODO: can we make this not the case?
            colorAttachment.handle || colorAttachment.texture.handle);
        } else {
            gl.framebufferTexture2D(framebuffer.target, gl.COLOR_ATTACHMENT0 + i, colorAttachment.target, colorAttachment.texture.handle, colorAttachment.level);
        }
    });
    //unbind any unused attachments
    for(let i = framebuffer.color.length; i < ctx.capabilities.maxColorAttachments; i++){
        gl.framebufferTexture2D(framebuffer.target, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0);
    }
    if (framebuffer.depth) {
        if (ctx.debugMode) {
            console.debug(NAMESPACE, "fbo attaching depth", framebuffer.depth);
        }
        const depthAttachment = framebuffer.depth;
        if (depthAttachment.texture.target === gl.RENDERBUFFER) {
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthAttachment.texture.handle);
        } else {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, depthAttachment.texture.target, depthAttachment.texture.handle, depthAttachment.level);
        }
    } else {
        if (ctx.debugMode) console.debug(NAMESPACE, "fbo deattaching depth");
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
        gl.framebufferTexture2D(framebuffer.target, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
    }
    if (ctx.debugMode) {
        const fboStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        console.assert(fboStatus === gl.FRAMEBUFFER_COMPLETE, `FBO incomplete ${ctx.getGLString(fboStatus)}`);
    }
    // TODO: ctx. pop framebuffer
    gl.bindFramebuffer(framebuffer.target, null);
}

/**
 * @typedef {import("./types.js").PexResource} RenderbufferOptions
 * @property {number} width
 * @property {number} height
 * @property {ctx.PixelFormat} [pixelFormat=ctx.PixelFormat.DEPTH_COMPONENT16] only `PixelFormat.DEPTH_COMPONENT16` is currently supported for use as render pass depth storage (e.g. `ctx.pass({ depth: renderbuffer })`) for platforms with no `WEBGL_depth_texture` support.
 */ function createRenderbuffer(ctx, opts) {
    const gl = ctx.gl;
    const renderbuffer = {
        class: "renderbuffer",
        handle: gl.createRenderbuffer(),
        target: gl.RENDERBUFFER,
        width: 0,
        height: 0,
        _update: updateRenderbuffer,
        _dispose () {
            gl.deleteRenderbuffer(this.handle);
            this.color = null;
            this.depth = null;
        }
    };
    updateRenderbuffer(ctx, renderbuffer, opts);
    return renderbuffer;
}
function updateRenderbuffer(ctx, renderbuffer, opts) {
    Object.assign(renderbuffer, opts);
    const gl = ctx.gl;
    const internalFormat = opts.internalFormat || (Object.keys(ctx.RenderbufferFloatFormat).includes(renderbuffer.pixelFormat) ? ctx.RenderbufferFloatFormat[renderbuffer.pixelFormat] : gl[renderbuffer.pixelFormat]);
    console.assert(internalFormat, `Unsupported float renderable format ${renderbuffer.pixelFormat}`);
    renderbuffer.format = internalFormat;
    gl.bindRenderbuffer(renderbuffer.target, renderbuffer.handle);
    if (opts.sampleCount) {
        gl.renderbufferStorageMultisample(renderbuffer.target, Math.min(opts.sampleCount, ctx.capabilities.maxSamples), renderbuffer.format, renderbuffer.width, renderbuffer.height);
    } else {
        gl.renderbufferStorage(renderbuffer.target, renderbuffer.format, renderbuffer.width, renderbuffer.height);
    }
    gl.bindRenderbuffer(renderbuffer.target, null);
}

/**
 * @typedef {import("./types.js").PexResource} PassOptions
 * @property {import("./types.js").PexTexture2D[] | import("./framebuffer.js").Attachment[]} [color] render target
 * @property {import("./types.js").PexTexture2D} [depth] render target
 * @property {import("./types.js").Color} [clearColor]
 * @property {number} [clearDepth]
 */ const allowedProps$4 = [
    "name",
    "framebuffer",
    "color",
    "depth",
    "clearColor",
    "clearDepth"
];
function createPass(ctx, opts) {
    checkProps(allowedProps$4, opts);
    const pass = {
        class: "pass",
        opts,
        clearColor: opts.clearColor,
        clearDepth: opts.clearDepth,
        _dispose () {
            this.opts = null;
            this.clearColor = null;
            this.clearDepth = null;
            if (this.framebuffer) {
                ctx.dispose(this.framebuffer);
                this.framebuffer = null;
            }
        }
    };
    // Inherits framebuffer from parent command or screen, if no target specified
    if (opts.color || opts.depth) {
        pass.framebuffer = ctx.framebuffer(opts);
        const colorsToResolve = opts.color ? opts.color.map((attachment, index)=>{
            if (attachment.resolveTarget) {
                return {
                    texture: attachment.resolveTarget,
                    sourceIndex: index
                };
            }
        }).filter((a)=>a) : [];
        const depthToResolve = opts.depth?.resolveTarget;
        if (colorsToResolve.length || depthToResolve) {
            const resolveOpts = {
                name: `${opts.name ? `${opts.name}_` : ""}resolve`,
                color: colorsToResolve,
                depth: depthToResolve
            };
            pass.resolveFramebuffer = ctx.framebuffer(resolveOpts);
        }
    }
    return pass;
}

/**
 * @typedef {import("./types.js").PexResource} PipelineOptions
 * @property {string} [vert=null] Vertex shader code
 * @property {string} [frag=null] Fragment shader code
 * @property {boolean} [depthWrite=true] Depth write mask
 * @property {boolean} [depthTest=false] Depth test on/off
 * @property {ctx.DepthFunc} [depthFunc=ctx.DepthFunc.LessEqual] Depth test function
 * @property {boolean} [blend=false] Blending on/off
 * @property {ctx.BlendFactor} [blendSrcRGBFactor=ctx.BlendFactor.One] Blending source color factor
 * @property {ctx.BlendFactor} [blendSrcAlphaFactor=ctx.BlendFactor.One] Blending source alpha factor
 * @property {ctx.BlendFactor} [blendDstRGBFactor=ctx.BlendFactor.One] Blending destination color factor
 * @property {ctx.BlendFactor} [blendDstAlphaFactor=ctx.BlendFactor.One] Blending destination alpha factor
 * @property {boolean} [cullFace=false] Face culling on/off
 * @property {ctx.Face} [cullFaceMode=ctx.Face.Back] Face culling mode
 * @property {boolean[]} [colorMask=[true, true, true, true]] Color write mask for [r, g, b, a]
 * @property {ctx.Primitive} [primitive=ctx.Primitive.Triangles] Geometry primitive
 */ const allowedProps$3 = [
    "vert",
    "frag",
    "program",
    "depthWrite",
    "depthTest",
    "depthFunc",
    "blend",
    "blendSrcRGBFactor",
    "blendSrcAlphaFactor",
    "blendDstRGBFactor",
    "blendDstAlphaFactor",
    "cullFace",
    "cullFaceMode",
    "colorMask",
    "primitive",
    "vertexLayout"
];
function createPipeline(ctx, opts) {
    checkProps(allowedProps$3, opts);
    const pipeline = Object.assign({
        class: "pipeline",
        program: null,
        depthWrite: true,
        depthTest: false,
        depthFunc: ctx.DepthFunc.LessEqual,
        blend: false,
        blendSrcRGBFactor: ctx.BlendFactor.One,
        blendSrcAlphaFactor: ctx.BlendFactor.One,
        blendDstRGBFactor: ctx.BlendFactor.One,
        blendDstAlphaFactor: ctx.BlendFactor.One,
        cullFace: false,
        cullFaceMode: ctx.Face.Back,
        colorMask: [
            true,
            true,
            true,
            true
        ],
        primitive: ctx.Primitive.Triangles,
        _dispose () {
            this.vert = null;
            this.frag = null;
            if (this.program && --this.program.refCount === 0 && this.program.handle) {
                ctx.dispose(this.program);
            }
            this.program = null;
        }
    }, opts);
    if (opts.vert && opts.frag) {
        pipeline.program = ctx.program({
            vert: opts.vert,
            frag: opts.frag,
            vertexLayout: opts.vertexLayout
        });
    }
    if (pipeline.program && !pipeline.vertexLayout) {
        pipeline.program.refCount++;
        const attributesPerLocation = pipeline.program.attributesPerLocation;
        pipeline.vertexLayout = Object.keys(attributesPerLocation).map((location)=>{
            const attribute = attributesPerLocation[location];
            return [
                attribute.name,
                parseInt(location, 10),
                attribute.size
            ];
        });
    }
    return pipeline;
}

/**
 * @typedef {import("./types.js").PexResource} VertexArrayOptions
 * @property {object} vertexLayout
 * @property {object} [attributes]
 * @property {object} [indices]
 */ function createVertexArray(ctx, opts) {
    const gl = ctx.gl;
    const vertexArray = {
        class: "vertexArray",
        handle: gl.createVertexArray(),
        _update: updateVertexArray,
        _dispose () {
            gl.deleteVertexArray(this.handle);
            this.handle = null;
        },
        ...opts
    };
    updateVertexArray(ctx, vertexArray, opts);
    return vertexArray;
}
const TYPE_TO_SIZE = {
    float: 1,
    vec2: 2,
    vec3: 3,
    vec4: 4,
    mat3: 12,
    mat4: 16
};
// TODO: can't update attributes/indices as they're in vertexArray
function updateVertexArray(ctx, vertexArray, { vertexLayout }) {
    const gl = ctx.gl;
    gl.bindVertexArray(vertexArray.handle);
    enableVertexData(ctx, Object.entries(vertexLayout).map(([name, { location, type, size }])=>[
            name,
            location,
            size ?? TYPE_TO_SIZE[type]
        ]), vertexArray);
    gl.bindVertexArray(null);
}

/**
 * @typedef {import("./types.js").PexResource} TransformFeedbackOptions
 * @property {object} varyings
 * @property {number} bufferMode
 * @property {number} primitiveMode
 */ const allowedProps$2 = [
    "varyings",
    "bufferMode",
    "primitiveMode"
];
function createTransformFeedback(ctx, opts) {
    const gl = ctx.gl;
    const transformFeedback = {
        class: "transformFeedback",
        handle: gl.createTransformFeedback(),
        bufferMode: gl.SEPARATE_ATTRIBS,
        primitiveMode: gl.POINTS,
        _update: updateTransformFeedback,
        _dispose () {
            gl.deleteTransformFeedback(this.handle);
            this.handle = null;
        },
        ...opts
    };
    updateTransformFeedback(ctx, transformFeedback, opts);
    return transformFeedback;
}
function updateTransformFeedback(ctx, transformFeedback, opts) {
    checkProps(allowedProps$2, opts);
    const gl = ctx.gl;
    gl.bindVertexArray(null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback.handle);
    let index = 0;
    for(let varyingName in opts.varyings){
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, index++, opts.varyings[varyingName].handle);
    }
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
}

const builtInAttributes = [
    "gl_VertexID",
    "gl_InstanceID",
    "gl_DrawID",
    "gl_BaseVertex",
    "gl_BaseInstance"
];
function createProgram(ctx, opts) {
    const gl = ctx.gl;
    const program = {
        class: "program",
        handle: gl.createProgram(),
        attributes: [],
        attributesPerLocation: {},
        uniforms: {},
        varyings: null,
        refCount: 0,
        _update: updateProgram,
        _dispose () {
            gl.deleteProgram(this.handle);
            this.handle = null;
            this.attributes = null;
            this.attributesPerLocation = null;
            this.uniforms = null;
            this.varyings = null;
        },
        setUniform (name, value) {
            const uniform = this.uniforms[name];
            if (uniform === undefined) {
                throw new Error(`Uniform ${name} is not defined`);
            }
            const gl = ctx.gl;
            const type = uniform.type;
            const location = uniform.location;
            const uniformMethod = ctx.UniformMethod[uniform.type];
            if (!uniformMethod) {
                throw new Error(`Invalid uniform type ${type} : ${ctx.getGLString(type)}`);
            } else if (uniformMethod.includes("Matrix")) {
                gl[uniformMethod](location, false, value);
            } else {
                gl[uniformMethod](location, value);
            }
        }
    };
    updateProgram(ctx, program, opts);
    return program;
}
function updateProgram(ctx, program, { vert, frag, vertexLayout }) {
    console.assert(typeof vert === "string", "Vertex shader source must be a string");
    console.assert(typeof frag === "string", "Fragment shader source must be a string");
    const gl = ctx.gl;
    const vertShader = compileSource(ctx, gl.VERTEX_SHADER, vert);
    const fragShader = compileSource(ctx, gl.FRAGMENT_SHADER, frag);
    // TODO: implement custom vertex layouts
    // gl.bindAttribLocation(program, location, attributeName)
    if (vertexLayout) {
        for (let [name, attribute] of Object.entries(vertexLayout)){
            gl.bindAttribLocation(program.handle, attribute.location, name);
        }
    }
    gl.attachShader(program.handle, vertShader);
    gl.attachShader(program.handle, fragShader);
    gl.linkProgram(program.handle);
    if (!gl.getProgramParameter(program.handle, gl.LINK_STATUS)) {
        throw new Error(`Program: ${gl.getProgramInfoLog(program.handle)}`);
    }
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    updateUniforms(ctx, program);
    updateAttributes(ctx, program);
}
function compileSource(ctx, type, src) {
    const gl = ctx.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, `${src}\n`);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const shaderType = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment";
        if (ctx.debugMode) {
            console.debug(NAMESPACE, `${shaderType} shader compilation failed`, src);
        }
        throw new Error(`${shaderType} shader error: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
}
function updateUniforms(ctx, program) {
    const gl = ctx.gl;
    program.uniforms = {};
    const numUniforms = gl.getProgramParameter(program.handle, gl.ACTIVE_UNIFORMS);
    for(let i = 0; i < numUniforms; ++i){
        const info = gl.getActiveUniform(program.handle, i);
        const name = info.name;
        const size = ctx.UniformSize[info.type];
        if (size === undefined) {
            throw new Error(`Unknwon uniform type ${info.type} : ${ctx.getGLString(info.type)}`);
        }
        program.uniforms[name] = {
            name,
            type: info.type,
            size,
            location: getUniformLocation(gl, program, name)
        };
        if (info.size > 1) {
            for(let j = 1; j < info.size; j++){
                const indexedName = `${info.name.substr(0, info.name.indexOf("[") + 1) + j}]`;
                program.uniforms[indexedName] = {
                    type: info.type,
                    location: getUniformLocation(gl, program, indexedName)
                };
            }
        }
    }
}
function updateAttributes(ctx, program) {
    const gl = ctx.gl;
    program.attributes = {};
    program.attributesPerLocation = {};
    const numAttributes = gl.getProgramParameter(program.handle, gl.ACTIVE_ATTRIBUTES);
    for(let i = 0; i < numAttributes; ++i){
        const info = gl.getActiveAttrib(program.handle, i);
        const name = info.name;
        const size = ctx.AttributeSize[info.type];
        if (builtInAttributes.includes(name)) {
            continue;
        }
        if (size === undefined) {
            throw new Error(`Unknwon uniform type ${info.type} : ${ctx.getGLString(info.type)}`);
        }
        const attrib = {
            name,
            type: info.type,
            size,
            location: gl.getAttribLocation(program.handle, name)
        };
        program.attributes[name] = attrib;
        program.attributesPerLocation[attrib.location] = attrib;
    }
}

/**
 * @typedef {import("./types.js").PexResource} BufferOptions
 * @property {Array | import("./types.js").TypedArray | ArrayBuffer} data
 * @property {ctx.DataType} [type]
 * @property {ctx.Usage} [usage=ctx.Usage.StaticDraw]
 * @property {number} offset
 */ const allowedProps$1 = [
    "target",
    "data",
    "usage",
    "type",
    "offset"
];
function createBuffer(ctx, opts) {
    checkProps(allowedProps$1, opts);
    const gl = ctx.gl;
    console.assert(opts.target === gl.ARRAY_BUFFER || opts.target === gl.ELEMENT_ARRAY_BUFFER, "Invalid buffer target");
    const buffer = {
        class: opts.target === gl.ARRAY_BUFFER ? "vertexBuffer" : "indexBuffer",
        handle: gl.createBuffer(),
        target: opts.target,
        usage: opts.usage || gl.STATIC_DRAW,
        _update: updateBuffer,
        _dispose () {
            gl.deleteBuffer(this.handle);
            this.handle = null;
        }
    };
    updateBuffer(ctx, buffer, opts);
    return buffer;
}
function updateBuffer(ctx, buffer, opts) {
    checkProps(allowedProps$1, opts);
    const gl = ctx.gl;
    let data = opts.data || opts;
    let type = opts.type;
    let offset = opts.offset || 0;
    if (Array.isArray(data)) {
        if (!type) {
            if (buffer.target === gl.ARRAY_BUFFER) {
                type = ctx.DataType.Float32;
            } else if (buffer.target === gl.ELEMENT_ARRAY_BUFFER) {
                type = ctx.DataType.Uint16;
            }
        }
        const sourceData = data;
        const elemSize = Array.isArray(sourceData[0]) ? sourceData[0].length : 1;
        const size = elemSize * sourceData.length;
        if (type === ctx.DataType.Float32) {
            data = new Float32Array(elemSize === 1 ? sourceData : size);
        } else if (type === ctx.DataType.Uint8) {
            data = new Uint8Array(elemSize === 1 ? sourceData : size);
        } else if (type === ctx.DataType.Uint16) {
            data = new Uint16Array(elemSize === 1 ? sourceData : size);
        } else if (type === ctx.DataType.Uint32) {
            data = new Uint32Array(elemSize === 1 ? sourceData : size);
        } else if (type === ctx.DataType.Int8) {
            data = new Int8Array(elemSize === 1 ? sourceData : size);
        }
        if (elemSize > 1) {
            for(let i = 0; i < sourceData.length; i++){
                for(let j = 0; j < elemSize; j++){
                    const index = i * elemSize + j;
                    data[index] = sourceData[i][j];
                }
            }
        }
    } else if (data instanceof Float32Array) {
        type = ctx.DataType.Float32;
    } else if (data instanceof Uint8Array) {
        type = ctx.DataType.Uint8;
    } else if (data instanceof Uint16Array) {
        type = ctx.DataType.Uint16;
    } else if (data instanceof Uint32Array) {
        type = ctx.DataType.Uint32;
    } else if (data instanceof Int8Array) {
        type = ctx.DataType.Int8;
    } else if (data instanceof ArrayBuffer) {
        // assuming type was provided
        if (!type) {
            if (buffer.target === gl.ARRAY_BUFFER) {
                type = ctx.DataType.Float32;
            } else if (buffer.target === gl.ELEMENT_ARRAY_BUFFER) {
                type = ctx.DataType.Uint16;
            }
        }
    } else {
        throw new Error(`Unknown buffer data type: ${data.constructor}`);
    }
    buffer.type = type;
    // TODO: is this a valid guess?
    buffer.length = data.length ?? data.byteLength / ctx.DataTypeConstructor[type].BYTES_PER_ELEMENT;
    if (ctx.state.vertexArray) {
        ctx.state.vertexArray = undefined;
        gl.bindVertexArray(null);
    }
    // TODO: push state, and pop as this can modify existing VBO?
    gl.bindBuffer(buffer.target, buffer.handle);
    if (offset) {
        gl.bufferSubData(buffer.target, offset, data);
    } else {
        gl.bufferData(buffer.target, data, buffer.usage);
    }
}

/**
 * @typedef {import("./types.js").PexResource} QueryOptions
 * @property {ctx.QueryTarget} [target=ctx.QueryTarget.TimeElapsed] query type
 */ /**
 * @typedef {QueryOptions} PexQuery
 * @property {ctx.QueryState} [state=ctx.QueryState.Ready]
 * @property {number} [result] result of the measurement
 */ const allowedProps = [
    "target"
];
function createQuery(ctx, opts = {}) {
    checkProps(allowedProps, opts);
    const gl = ctx.gl;
    const query = Object.assign({
        class: "query",
        handle: gl.createQuery(),
        target: null,
        state: ctx.QueryState.Ready,
        result: null,
        _begin: begin,
        _end: end,
        _available: available,
        _dispose () {
            gl.deleteQuery(this.handle);
            this.handle = null;
        }
    }, opts);
    if (!query.target) {
        query.target = ctx.capabilities.disjointTimerQuery ? ctx.QueryTarget.TimeElapsed : ctx.QueryTarget.AnySamplesPassed;
    }
    return query;
}
function begin({ QueryState, gl }, q) {
    if (q.state !== QueryState.Ready) return false;
    gl.beginQuery(q.target, q.handle);
    q.state = QueryState.Active;
    q.result = null;
    return true;
}
function end({ QueryState, gl }, q) {
    if (q.state !== QueryState.Active) return false;
    gl.endQuery(q.target);
    q.state = QueryState.Pending;
    return true;
}
function available({ gl, QueryState }, q) {
    const available = gl.getQueryParameter(q.handle, gl.QUERY_RESULT_AVAILABLE);
    if (available) {
        q.result = gl.getQueryParameter(q.handle, gl.QUERY_RESULT);
        q.state = QueryState.Ready;
        return true;
    } else {
        return false;
    }
}

function polyfill(ctx) {
    const { gl, capabilities } = ctx;
    if (!gl.HALF_FLOAT) {
        const ext = gl.getExtension("OES_texture_half_float");
        if (ext) gl.HALF_FLOAT = ext.HALF_FLOAT_OES;
    }
    if (!gl.createVertexArray) {
        const ext = gl.getExtension("OES_vertex_array_object");
        gl.createVertexArray = ext.createVertexArrayOES.bind(ext);
        gl.bindVertexArray = ext.bindVertexArrayOES.bind(ext);
    }
    if (!gl.drawElementsInstanced) {
        const ext = gl.getExtension("ANGLE_instanced_arrays");
        gl.drawElementsInstanced = ext.drawElementsInstancedANGLE.bind(ext);
        gl.drawArraysInstanced = ext.drawArraysInstancedANGLE.bind(ext);
        gl.vertexAttribDivisor = ext.vertexAttribDivisorANGLE.bind(ext);
    }
    if (!gl.drawBuffers) {
        const ext = gl.getExtension("WEBGL_draw_buffers");
        if (!ext) {
            gl.drawBuffers = ()=>{
                throw new Error("WEBGL_draw_buffers not supported");
            };
        } else {
            gl.drawBuffers = ext.drawBuffersWEBGL.bind(ext);
            capabilities.maxColorAttachments = gl.getParameter(ext.MAX_COLOR_ATTACHMENTS_WEBGL);
        }
    } else {
        capabilities.maxColorAttachments = gl.getParameter(gl.MAX_COLOR_ATTACHMENTS);
    }
    if (!capabilities.disjointTimerQuery) {
        gl.TIME_ELAPSED ||= "TIME_ELAPSED";
        gl.GPU_DISJOINT ||= "GPU_DISJOINT";
        gl.QUERY_RESULT ||= "QUERY_RESULT";
        gl.QUERY_RESULT_AVAILABLE ||= "QUERY_RESULT_AVAILABLE";
        gl.createQuery ||= ()=>({});
        gl.deleteQuery ||= ()=>{};
        gl.beginQuery ||= ()=>{};
        gl.endQuery ||= ()=>{};
        gl.getQueryParameter = (q, param)=>{
            if (param === gl.QUERY_RESULT_AVAILABLE) return true;
            if (param === gl.QUERY_RESULT) return 0;
            return undefined;
        };
        gl.getQueryObject = gl.getQueryParameter;
    } else {
        const extDTQ = gl.getExtension("EXT_disjoint_timer_query_webgl2") || gl.getExtension("EXT_disjoint_timer_query");
        gl.TIME_ELAPSED = extDTQ.TIME_ELAPSED_EXT;
        gl.GPU_DISJOINT = extDTQ.GPU_DISJOINT_EXT;
        gl.QUERY_RESULT ||= extDTQ.QUERY_RESULT_EXT;
        gl.QUERY_RESULT_AVAILABLE ||= extDTQ.QUERY_RESULT_AVAILABLE_EXT;
        gl.createQuery ||= extDTQ.createQueryEXT.bind(extDTQ);
        gl.deleteQuery ||= extDTQ.deleteQueryEXT.bind(extDTQ);
        gl.beginQuery ||= extDTQ.beginQueryEXT.bind(extDTQ);
        gl.endQuery ||= extDTQ.endQueryEXT.bind(extDTQ);
        gl.getQueryParameter ||= extDTQ.getQueryObjectEXT.bind(extDTQ);
    }
    if (!capabilities.isWebGL2) {
        gl.getExtension("OES_element_index_uint");
        gl.getExtension("OES_standard_derivatives");
        const extsRGB = gl.getExtension("EXT_sRGB");
        if (extsRGB) {
            gl.SRGB ||= extsRGB.SRGB_EXT;
            gl.SRGB8 ||= extsRGB.SRGB_EXT;
            gl.SRGB8_ALPHA8 ||= extsRGB.SRGB8_ALPHA8_EXT;
        }
    }
}

/**
 * @typedef {object} PexContextOptions
 * @property {WebGLRenderingContext | WebGL2RenderingContext} [gl=WebGL2RenderingContext]
 * @property {number} [width=window.innerWidth]
 * @property {number} [height=window.innerHeight]
 * @property {number} [pixelRatio=1]
 * @property {"webgl" | "webgl2"} [type="webgl2"]
 * @property {boolean} [debug=false]
 */ /**
 * @typedef {object} PexResource
 * All resources are plain js object and once constructed their properties can be accessed directly.
 * Please note those props are read only. To set new values or upload new data to GPU see [updating resources]{@link ctx.update}.
 * @property {string} name
 */ /**
 * @typedef {object} PexTexture2D
 */ /**
 * @typedef {object} PexAttribute
 * @property {object} buffer ctx.vertexBuffer() or ctx.indexBuffer()
 * @property {number} [offset]
 * @property {number} [stride]
 * @property {number} [divisor]
 * @property {boolean} [normalized]
 */ /**
 * @typedef {object} PexCommand
 * @property {import("./pass.js").PassOptions} pass
 * @property {import("./pipeline.js").PipelineOptions} pipeline
 * @property {object} [attributes] vertex attributes, map of `attributeName: ctx.vertexBuffer()`  or [`attributeName: PexAttribute`]{@link PexAttribute}
 * @property {object} [indices] indices, `ctx.indexBuffer()` or [`PexAttribute`]{@link PexAttribute}
 * @property {number} [count] number of vertices to draw
 * @property {number} [instances] number instances to draw
 * @property {object} [uniforms] shader uniforms, map of `name: value`
 * @property {Viewport} [viewport] drawing viewport bounds
 * @property {Viewport} [scissor] scissor test bounds
 * @property {MultiDrawOptions} [multiDraw]
 * @property {number} [baseVertex]
 * @property {number} [baseInstance]
 */ /**
 * @typedef {object} MultiDrawOptions
 * @see [WEBGL_multi_draw extension]{@link https://registry.khronos.org/webgl/extensions/WEBGL_multi_draw/}
 * @see [WEBGL_draw_instanced_base_vertex_base_instance extension]{@link https://registry.khronos.org/webgl/extensions/WEBGL_draw_instanced_base_vertex_base_instance/}
 * @see [WEBGL_multi_draw_instanced_base_vertex_base_instance extension]{@link https://registry.khronos.org/webgl/extensions/WEBGL_multi_draw_instanced_base_vertex_base_instance/}
 *
 * @property {(Int32Array|Array)} counts
 * @property {number} [countsOffset]
 * @property {(Int32Array|Array)} offsets
 * @property {number} [offsetsOffset]
 * @property {(Int32Array|Array)} firsts
 * @property {number} [firstsOffset]
 * @property {(Int32Array|Array)} instanceCounts
 * @property {number} [instanceCountsOffset]
 *
 * @property {(Int32Array|Array)} baseVertices
 * @property {number} [baseVerticesOffset]
 * @property {(UInt32Array|Array)} baseInstances
 * @property {number} [baseInstancesOffset]
 * @property {number} [drawCount]
 */ /**
 * @typedef {object} PexContextSetOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [pixelRatio]
 */ /**
 * @typedef {number[]} Viewport [x, y, w, h]
 */ /**
 * @typedef {number[]} Color [r, g, b, a]
 */ /**
 * @typedef {(Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|BigInt64Array|BigUint64Array)} TypedArray
 */ const addEnums = (ctx)=>{
    const { gl, capabilities } = ctx;
    /** @enum */ ctx.BlendFactor = {
        One: gl.ONE,
        Zero: gl.ZERO,
        SrcAlpha: gl.SRC_ALPHA,
        OneMinusSrcAlpha: gl.ONE_MINUS_SRC_ALPHA,
        DstAlpha: gl.DST_ALPHA,
        OneMinusDstAlpha: gl.ONE_MINUS_DST_ALPHA,
        SrcColor: gl.SRC_COLOR,
        OneMinusSrcColor: gl.ONE_MINUS_SRC_COLOR,
        DstColor: gl.DST_COLOR,
        OneMinusDstColor: gl.ONE_MINUS_DST_COLOR
    };
    /** @enum */ ctx.CubemapFace = {
        PositiveX: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        NegativeX: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        PositiveY: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        NegativeY: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        PositiveZ: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        NegativeZ: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    };
    /** @enum */ ctx.DepthFunc = {
        Never: gl.NEVER,
        Less: gl.LESS,
        Equal: gl.EQUAL,
        LessEqual: gl.LEQUAL,
        Greater: gl.GREATER,
        NotEqual: gl.NOTEQUAL,
        GreaterEqual: gl.GEQUAL,
        Always: gl.ALWAYS
    };
    /**
   * @enum
   * @private
   */ ctx.DataType = {
        Float16: gl.HALF_FLOAT,
        Float32: gl.FLOAT,
        Int8: gl.BYTE,
        Int16: gl.SHORT,
        Int32: gl.INT,
        Uint8: gl.UNSIGNED_BYTE,
        Uint16: gl.UNSIGNED_SHORT,
        Uint32: gl.UNSIGNED_INT
    };
    /**
   * @enum
   * @private
   */ ctx.DataTypeConstructor = {
        [ctx.DataType.Float16]: Float32Array,
        [ctx.DataType.Float32]: Float32Array,
        [ctx.DataType.Int8]: Int8Array,
        [ctx.DataType.Int16]: Int16Array,
        [ctx.DataType.Int32]: Int32Array,
        [ctx.DataType.Uint8]: Uint8Array,
        [ctx.DataType.Uint16]: Uint16Array,
        [ctx.DataType.Uint32]: Uint32Array
    };
    /**
   * @enum
   * @private
   */ ctx.UniformMethod = {
        [gl.BOOL]: "uniform1i",
        [gl.INT]: "uniform1i",
        [gl.SAMPLER_2D]: "uniform1i",
        [gl.INT_SAMPLER_2D]: "uniform1i",
        [gl.UNSIGNED_INT_SAMPLER_2D]: "uniform1i",
        [gl.SAMPLER_2D_SHADOW]: "uniform1i",
        [gl.SAMPLER_2D_ARRAY]: "uniform1i",
        [gl.INT_SAMPLER_2D_ARRAY]: "uniform1i",
        [gl.UNSIGNED_INT_SAMPLER_2D_ARRAY]: "uniform1i",
        [gl.SAMPLER_2D_ARRAY_SHADOW]: "uniform1i",
        [gl.SAMPLER_CUBE]: "uniform1i",
        [gl.INT_SAMPLER_CUBE]: "uniform1i",
        [gl.UNSIGNED_INT_SAMPLER_CUBE]: "uniform1i",
        [gl.SAMPLER_CUBE_SHADOW]: "uniform1i",
        [gl.SAMPLER_3D]: "uniform1i",
        [gl.INT_SAMPLER_3D]: "uniform1i",
        [gl.UNSIGNED_INT_SAMPLER_3D]: "uniform1i",
        [gl.UNSIGNED_INT]: "uniform1ui",
        [gl.FLOAT]: "uniform1f",
        [gl.FLOAT_VEC2]: "uniform2fv",
        [gl.FLOAT_VEC3]: "uniform3fv",
        [gl.FLOAT_VEC4]: "uniform4fv",
        [gl.INT_VEC2]: "uniform2iv",
        [gl.INT_VEC3]: "uniform3iv",
        [gl.INT_VEC4]: "uniform4iv",
        [gl.UNSIGNED_INT_VEC2]: "uniform2uiv",
        [gl.UNSIGNED_INT_VEC3]: "uniform3uiv",
        [gl.UNSIGNED_INT_VEC4]: "uniform4uiv",
        [gl.BOOL_VEC2]: "uniform2iv",
        [gl.BOOL_VEC3]: "uniform3iv",
        [gl.BOOL_VEC4]: "uniform4iv",
        [gl.FLOAT_MAT2]: "uniformMatrix2fv",
        [gl.FLOAT_MAT3]: "uniformMatrix3fv",
        [gl.FLOAT_MAT4]: "uniformMatrix4fv",
        [gl.FLOAT_MAT2x3]: "uniformMatrix2x3fv",
        [gl.FLOAT_MAT2x4]: "uniformMatrix2x4fv",
        [gl.FLOAT_MAT3x2]: "uniformMatrix3x2fv",
        [gl.FLOAT_MAT3x4]: "uniformMatrix3x4fv",
        [gl.FLOAT_MAT4x2]: "uniformMatrix4x2fv",
        [gl.FLOAT_MAT4x3]: "uniformMatrix4x3fv"
    };
    /**
   * @enum
   * @private
   */ ctx.UniformSize = {
        [gl.BOOL]: 1,
        [gl.INT]: 1,
        [gl.SAMPLER_2D]: 1,
        [gl.INT_SAMPLER_2D]: 1,
        [gl.UNSIGNED_INT_SAMPLER_2D]: 1,
        [gl.SAMPLER_2D_SHADOW]: 1,
        [gl.SAMPLER_2D_ARRAY]: 1,
        [gl.INT_SAMPLER_2D_ARRAY]: 1,
        [gl.UNSIGNED_INT_SAMPLER_2D_ARRAY]: 1,
        [gl.SAMPLER_2D_ARRAY_SHADOW]: 1,
        [gl.SAMPLER_CUBE]: 1,
        [gl.INT_SAMPLER_CUBE]: 1,
        [gl.UNSIGNED_INT_SAMPLER_CUBE]: 1,
        [gl.SAMPLER_CUBE_SHADOW]: 1,
        [gl.SAMPLER_3D]: 1,
        [gl.INT_SAMPLER_3D]: 1,
        [gl.UNSIGNED_INT_SAMPLER_3D]: 1,
        [gl.UNSIGNED_INT]: 1,
        [gl.FLOAT]: 1,
        [gl.FLOAT_VEC2]: 2,
        [gl.FLOAT_VEC3]: 3,
        [gl.FLOAT_VEC4]: 4,
        [gl.INT_VEC2]: 2,
        [gl.INT_VEC3]: 3,
        [gl.INT_VEC4]: 4,
        [gl.UNSIGNED_INT_VEC2]: 2,
        [gl.UNSIGNED_INT_VEC3]: 3,
        [gl.UNSIGNED_INT_VEC4]: 4,
        [gl.BOOL_VEC2]: 2,
        [gl.BOOL_VEC3]: 3,
        [gl.BOOL_VEC4]: 4,
        [gl.FLOAT_MAT2]: 4,
        [gl.FLOAT_MAT3]: 9,
        [gl.FLOAT_MAT4]: 16,
        [gl.FLOAT_MAT2x3]: 6,
        [gl.FLOAT_MAT2x4]: 8,
        [gl.FLOAT_MAT3x2]: 6,
        [gl.FLOAT_MAT3x4]: 12,
        [gl.FLOAT_MAT4x2]: 8,
        [gl.FLOAT_MAT4x3]: 12
    };
    /**
   * @enum
   * @private
   */ ctx.AttributeSize = {
        [gl.INT]: 1,
        [gl.UNSIGNED_INT]: 1,
        [gl.FLOAT]: 1,
        [gl.FLOAT_VEC2]: 2,
        [gl.FLOAT_VEC3]: 3,
        [gl.FLOAT_VEC4]: 4,
        [gl.INT_VEC2]: 2,
        [gl.INT_VEC3]: 3,
        [gl.INT_VEC4]: 4,
        [gl.UNSIGNED_INT_VEC2]: 2,
        [gl.UNSIGNED_INT_VEC3]: 3,
        [gl.UNSIGNED_INT_VEC4]: 4,
        [gl.FLOAT_MAT2]: 4,
        [gl.FLOAT_MAT3]: 9,
        [gl.FLOAT_MAT4]: 16
    };
    /** @enum */ ctx.Face = {
        Front: gl.FRONT,
        Back: gl.BACK,
        FrontAndBack: gl.FRONT_AND_BACK
    };
    /** @enum */ ctx.Filter = {
        Nearest: gl.NEAREST,
        Linear: gl.LINEAR,
        NearestMipmapNearest: gl.NEAREST_MIPMAP_NEAREST,
        NearestMipmapLinear: gl.NEAREST_MIPMAP_LINEAR,
        LinearMipmapNearest: gl.LINEAR_MIPMAP_NEAREST,
        LinearMipmapLinear: gl.LINEAR_MIPMAP_LINEAR
    };
    /**
   * @enum
   * @private
   * @description
   * Mapping of format and type (with alternative types).
   */ ctx.TextureFormat = {
        // Unsized internal formats
        RGB: [
            gl.RGB,
            ctx.DataType.Uint8
        ],
        RGBA: [
            gl.RGBA,
            ctx.DataType.Uint8
        ],
        LUMINANCE_ALPHA: [
            gl.LUMINANCE_ALPHA,
            ctx.DataType.Uint8
        ],
        LUMINANCE: [
            gl.LUMINANCE,
            ctx.DataType.Uint8
        ],
        ALPHA: [
            gl.ALPHA,
            ctx.DataType.Uint8
        ],
        // Sized internal formats
        ...Object.fromEntries([
            "R",
            "RG",
            "RGB",
            "RGBA"
        ].flatMap((format)=>Object.entries({
                8: "Uint8",
                "8_SNORM": "Int8",
                "16F": "Float16",
                "32F": "Float32",
                "8UI": "Uint8",
                "8I": "Int8",
                "16UI": "Uint16",
                "16I": "Int16",
                "32UI": "Uint32",
                "32I": "Int32"
            }).map(([type, DataType])=>[
                    [
                        `${format}${type}`
                    ],
                    [
                        gl[`${format === "R" ? "RED" : format}${type.endsWith("I") ? "_INTEGER" : ""}`],
                        ctx.DataType[DataType]
                    ]
                ]))),
        // Special
        SRGB8: [
            gl.RGB,
            ctx.DataType.Uint8
        ],
        RGB565: [
            gl.RGB,
            gl.UNSIGNED_SHORT_5_6_5
        ],
        R11F_G11F_B10F: [
            gl.RGB,
            gl.UNSIGNED_INT_10F_11F_11F_REV
        ],
        RGB9_E5: [
            gl.RGB,
            gl.UNSIGNED_INT_5_9_9_9_REV
        ],
        SRGB8_ALPHA8: [
            gl.RGBA,
            ctx.DataType.Uint8
        ],
        RGB5_A1: [
            gl.RGBA,
            gl.UNSIGNED_SHORT_5_5_5_1
        ],
        RGBA4: [
            gl.RGBA,
            gl.UNSIGNED_SHORT_4_4_4_4
        ],
        RGB10_A2: [
            gl.RGBA,
            gl.UNSIGNED_INT_2_10_10_10_REV
        ],
        RGB10_A2UI: [
            gl.RGBA_INTEGER,
            gl.UNSIGNED_INT_2_10_10_10_REV
        ],
        // Depth and stencil
        DEPTH_COMPONENT16: [
            gl.DEPTH_COMPONENT,
            ctx.DataType.Uint16
        ],
        DEPTH_COMPONENT24: [
            gl.DEPTH_COMPONENT,
            ctx.DataType.Uint32
        ],
        DEPTH_COMPONENT32F: [
            gl.DEPTH_COMPONENT,
            ctx.DataType.Float32
        ],
        DEPTH24_STENCIL8: [
            gl.DEPTH_STENCIL,
            gl.UNSIGNED_INT_24_8
        ],
        DEPTH32F_STENCIL8: [
            gl.DEPTH_STENCIL,
            gl.FLOAT_32_UNSIGNED_INT_24_8_REV
        ]
    };
    if (gl instanceof WebGLRenderingContext) {
        if (capabilities.depthTexture) {
            ctx.TextureFormat.DEPTH_COMPONENT = [
                gl.DEPTH_COMPONENT,
                ctx.DataType.Uint16
            ];
            ctx.TextureFormat.DEPTH_STENCIL = [
                gl.DEPTH_STENCIL,
                ctx.DataType.Uint16
            ];
        }
        ctx.TextureFormat.R16FLegacy = [
            gl.ALPHA,
            ctx.DataType.Float16
        ];
        ctx.TextureFormat.R32FLegacy = [
            gl.ALPHA,
            ctx.DataType.Float32
        ];
    }
    const legacyPixelFormat = {
        Depth: "DEPTH_COMPONENT16",
        Depth16: "DEPTH_COMPONENT16",
        Depth24: "DEPTH_COMPONENT24"
    };
    /**
   * @enum
   * @description
   * Mapping of {@link #ctx.TextureFormat|ctx.TextureFormat} keys to their string values and legacy depth formats
   *
   * One of:
   * - Unsized: RGB, RGBA, LUMINANCE_ALPHA, LUMINANCE, ALPHA
   * - Sized 1 component: R8, R8_SNORM, R16F, R32F, R8UI, R8I, R16UI, R16I, R32UI, R32I
   * - Sized 2 components: RG8, RG8_SNORM, RG16F, RG32F, RG8UI, RG8I, RG16UI, RG16I, RG32UI, RG32I
   * - Sized 3 components: RGB8, RGB8_SNORM, RGB16F, RGB32F, RGB8UI, RGB8I, RGB16UI, RGB16I, RGB32UI, RGB32I
   * - Sized 4 components: RGBA8, RGBA8_SNORM, RGBA16F, RGBA32F, RGBA8UI, RGBA8I, RGBA16UI, RGBA16I, RGBA32UI, RGBA32I
   * - Sized special: SRGB8, RGB565, R11F_G11F_B10F, RGB9_E5, SRGB8_ALPHA8, RGB5_A1, RGBA4, RGB10_A2, RGB10_A2UI
   * - Sized depth/stencil: DEPTH_COMPONENT16, DEPTH_COMPONENT24, DEPTH_COMPONENT32F, DEPTH24_STENCIL8, DEPTH32F_STENCIL8
   */ ctx.PixelFormat = {
        ...Object.fromEntries(Object.keys(ctx.TextureFormat).map((internalFormat)=>[
                internalFormat,
                internalFormat
            ])),
        ...legacyPixelFormat
    };
    const extColorBufferFloat = !!gl.getExtension("EXT_color_buffer_float"); // WebGL2 only
    /** @enum */ ctx.RenderbufferFloatFormat = {
        // With EXT_color_buffer_float, types just become color-renderable
        // With EXT_color_buffer_half_float and WEBGL_color_buffer_float,
        // they come from the extension and need _EXT suffix
        RGBA32F: extColorBufferFloat && gl.RGBA32F || gl.getExtension("WEBGL_color_buffer_float")?.RGBA32F_EXT,
        RGBA16F: extColorBufferFloat && gl.RGBA16F || gl.getExtension("EXT_color_buffer_half_float")?.RGBA16F_EXT,
        R16F: extColorBufferFloat && gl.R16F,
        RG16F: extColorBufferFloat && gl.RG16F,
        R32F: extColorBufferFloat && gl.R32F,
        RG32F: extColorBufferFloat && gl.RG32F,
        R11F_G11F_B10F: extColorBufferFloat && gl.R11F_G11F_B10F
    };
    /** @enum */ ctx.Primitive = {
        Points: gl.POINTS,
        Lines: gl.LINES,
        LineStrip: gl.LINE_STRIP,
        Triangles: gl.TRIANGLES,
        TriangleStrip: gl.TRIANGLE_STRIP
    };
    /** @enum */ ctx.Usage = {
        StaticDraw: gl.STATIC_DRAW,
        DynamicDraw: gl.DYNAMIC_DRAW,
        StreamDraw: gl.STREAM_DRAW
    };
    /** @enum */ ctx.Wrap = {
        ClampToEdge: gl.CLAMP_TO_EDGE,
        Repeat: gl.REPEAT,
        MirroredRepeat: gl.MIRRORED_REPEAT
    };
    /** @enum */ ctx.QueryTarget = {
        TimeElapsed: gl.TIME_ELAPSED,
        // webgl2
        AnySamplesPassed: gl.ANY_SAMPLES_PASSED,
        AnySamplesPassedConservative: gl.ANY_SAMPLES_PASSED_CONSERVATIVE,
        TransformFeedbackPrimitivesWritten: gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN
    };
    /** @enum */ ctx.QueryState = {
        Ready: "ready",
        Active: "active",
        Pending: "pending"
    };
};

let ID = 0;
const allowedCommandProps = [
    "name",
    "pass",
    "pipeline",
    "uniforms",
    "attributes",
    "indices",
    "count",
    "first",
    "baseVertex",
    "baseInstance",
    "multiDraw",
    "instances",
    "vertexArray",
    "transformFeedback",
    "viewport",
    "scissor"
];
/**
 * Create a context object
 * @param {import("./types.js").PexContextOptions & import("pex-gl").Options} [options]
 * @returns {ctx}
 */ function createContext(options = {}) {
    const opts = {
        pixelRatio: 1,
        type: "webgl2",
        ...options
    };
    if (options.pixelRatio) {
        opts.pixelRatio = Math.min(opts.pixelRatio, window.devicePixelRatio);
    }
    const gl = opts.gl || createRenderingContext(opts);
    console.assert(gl, "pex-context: createContext failed");
    const isWebGL2$1 = isWebGL2(gl);
    /**
   * @namespace ctx
   */ const ctx = {
        /**
     * The `RenderingContext` returned by `pex-gl`
     * @memberof ctx
     */ gl,
        /**
     * Max capabilities and extensions availability. See {@link #capabilitiesTable|Capabilities Table}.
     * @memberof ctx
     */ capabilities: {
            isWebGL2: isWebGL2$1,
            maxColorAttachments: 1,
            maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            maxSamples: isWebGL2$1 ? gl.getParameter(gl.MAX_SAMPLES) : 0,
            maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            depthTexture: isWebGL2$1 || !!gl.getExtension("WEBGL_depth_texture"),
            shaderTextureLod: isWebGL2$1 || !!gl.getExtension("EXT_shader_texture_lod"),
            textureFloat: isWebGL2$1 || !!gl.getExtension("OES_texture_float"),
            textureFloatLinear: !!gl.getExtension("OES_texture_float_linear"),
            textureHalfFloat: isWebGL2$1 || !!gl.getExtension("OES_texture_half_float"),
            textureHalfFloatLinear: isWebGL2$1 || !!gl.getExtension("OES_texture_half_float_linear"),
            textureFilterAnisotropic: !!gl.getExtension("EXT_texture_filter_anisotropic"),
            sRGB: isWebGL2$1 || !!gl.getExtension("EXT_sRGB"),
            disjointTimerQuery: !!(gl.getExtension("EXT_disjoint_timer_query_webgl2") || gl.getExtension("EXT_disjoint_timer_query")),
            // Note: supported color buffer types vary
            colorBufferFloat: isWebGL2$1 ? !!gl.getExtension("EXT_color_buffer_float") : !!gl.getExtension("WEBGL_color_buffer_float"),
            colorBufferHalfFloat: !!gl.getExtension("EXT_color_buffer_half_float"),
            floatBlend: !!gl.getExtension("EXT_float_blend"),
            multiDraw: !!gl.getExtension("WEBGL_multi_draw"),
            drawInstancedBase: !!gl.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"),
            multiDrawInstancedBase: !!gl.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance")
        },
        /**
     * Getter for `gl.drawingBufferWidth`
     * @memberof ctx
     * @returns {number}
     */ get width () {
            return gl.drawingBufferWidth;
        },
        /**
     * Getter for `gl.drawingBufferHeight`
     * @memberof ctx
     * @returns {number}
     */ get height () {
            return gl.drawingBufferHeight;
        }
    };
    polyfill(ctx);
    addEnums(ctx);
    const defaultState = {
        pass: {
            framebuffer: {
                id: `framebuffer_${ID++}`,
                target: gl.FRAMEBUFFER,
                handle: null,
                width: gl.drawingBufferWidth,
                height: gl.drawingBufferHeight
            },
            clearColor: [
                0,
                0,
                0,
                1
            ],
            clearDepth: 1
        },
        pipeline: createPipeline(ctx, {}),
        viewport: [
            0,
            0,
            gl.drawingBufferWidth,
            gl.drawingBufferHeight
        ],
        scissor: null,
        count: 0,
        framebuffer: undefined,
        indexBuffer: undefined,
        activeAttributes: undefined,
        activeTextures: undefined,
        vertexArray: undefined,
        vertexLayout: undefined,
        program: undefined,
        cullFace: undefined,
        cullFaceMode: undefined,
        blend: undefined,
        blendSrcRGBFactor: undefined,
        blendSrcAlphaFactor: undefined,
        blendDstRGBFactor: undefined,
        blendDstAlphaFactor: undefined,
        depthFunc: undefined,
        depthTest: undefined,
        depthWrite: undefined
    };
    Object.assign(ctx, {
        isDisposed: false,
        debugMode: false,
        debugCommands: [],
        resources: [],
        stats: {},
        queries: [],
        stack: [
            defaultState
        ],
        defaultState,
        pixelRatio: opts.pixelRatio,
        state: {
            framebuffer: defaultState.pass.framebuffer,
            pipeline: createPipeline(ctx, {}),
            activeTextures: [],
            activeAttributes: []
        },
        getGLString (glEnum) {
            let str = "UNDEFINED";
            for(let key in gl){
                if (gl[key] === glEnum) {
                    str = key;
                    break;
                }
            }
            return str;
        },
        checkError () {
            if (this.debugMode) {
                const error = gl.getError();
                if (error) {
                    this.debugMode = false; // prevents rolling errors
                    console.debug(NAMESPACE, "state", this.state);
                    throw new Error(`GL error ${error}: ${this.getGLString(error)}`);
                }
            }
        },
        resource (res) {
            res.id = `${res.class}_${ID++}`;
            this.stats[res.class] ||= {
                alive: 0,
                total: 0
            };
            this.stats[res.class].alive++;
            this.stats[res.class].total++;
            this.resources.push(res);
            this.checkError();
            return res;
        },
        // Public API
        /**
     * Set the context size and pixelRatio
     * The new size and resolution will not be applied immediately but before drawing the next frame to avoid flickering.
     * Context's canvas doesn't resize automatically, even if you don't pass width/height on init and the canvas is assigned the dimensions of the window. To handle resizing use the following code:
     * ```js
     * window.addEventListener('resize', () => {
     *   ctx.set({ width: window.innerWidth, height: window.innerHeight });
     * })
     * ```
     * @memberof ctx
     * @param {import("./types.js").PexContextSetOptions} options
     */ set ({ pixelRatio, width, height }) {
            if (pixelRatio) {
                this.updatePixelRatio = Math.min(pixelRatio, window.devicePixelRatio);
            }
            if (width) {
                this.updateWidth = width;
            }
            if (height) {
                this.updateHeight = height;
            }
        },
        /**
     * Enable debug mode
     * @param {boolean} [enabled]
     * @memberof ctx
     */ debug (enabled) {
            this.debugMode = enabled;
            if (enabled) this.debugCommands = [];
        },
        /**
     * Render Loop
     * @memberof ctx
     * @param {Function} cb Request Animation Frame callback
     */ frame (cb) {
            requestAnimationFrame((function frame() {
                if (this.updatePixelRatio) {
                    this.pixelRatio = this.updatePixelRatio;
                    // we need to reaply width/height and update styles
                    if (!this.updateWidth) {
                        this.updateWidth = parseInt(gl.canvas.style.width) || gl.canvas.width;
                    }
                    if (!this.updateHeight) {
                        this.updateHeight = parseInt(gl.canvas.style.height) || gl.canvas.height;
                    }
                    this.updatePixelRatio = 0;
                }
                if (this.updateWidth) {
                    gl.canvas.style.width = `${this.updateWidth}px`;
                    gl.canvas.width = this.updateWidth * this.pixelRatio;
                    this.updateWidth = 0;
                }
                if (this.updateHeight) {
                    gl.canvas.style.height = `${this.updateHeight}px`;
                    gl.canvas.height = this.updateHeight * this.pixelRatio;
                    this.updateHeight = 0;
                }
                if (this.defaultState.viewport[2] !== gl.drawingBufferWidth || this.defaultState.viewport[3] !== gl.drawingBufferHeight) {
                    this.defaultState.viewport[2] = gl.drawingBufferWidth;
                    this.defaultState.viewport[3] = gl.drawingBufferHeight;
                    this.defaultState.pass.framebuffer.width = gl.drawingBufferWidth;
                    this.defaultState.pass.framebuffer.height = gl.drawingBufferHeight;
                    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                }
                if (this.isDisposed || cb() === false) return; // interrupt render loop
                if (this.queries.length) {
                    this.queries = this.queries.filter((q)=>!q._available(this, q));
                }
                requestAnimationFrame(frame.bind(this));
            }).bind(this));
        },
        /**
     * Submit a command to the GPU.
     * Commands are plain js objects with GPU resources needed to complete a draw call.
     *
     * ```js
     * const cmd = {
     *   pass: Pass
     *   pipeline: Pipeline,
     *   attributes: { name:  VertexBuffer | { buffer: VertexBuffer, offset: number, stride: number } },
     *   indices: IndexBuffer | { buffer: IndexBuffer, offset: number, count: number },
     *   // or
     *   count: number,
     *   instances: number,
     *   uniforms: { name: number, name: Array, name: Texture2D },
     *   viewport: [0, 0, 1920, 1080],
     *   scissor: [0, 0, 1920, 1080]
     * }
     * ```
     *
     * _Note: Either indices or count need to be specified when drawing geometry._
     * _Note: Scissor region is by default set to null and scissor test disabled._
     *
     * @example
     *
     * - `ctx.submit(cmd, opts)`: submit partially updated command without modifying the original one.
     * ```js
     * // Draw mesh with custom color
     * ctx.submit(cmd, {
     *   uniforms: {
     *     uColor: [1, 0, 0, 0]
     *   }
     * })
     * ```
     *
     * - `ctx.submit(cmd, [opts1, opts2, opts3...])`: submit a batch of commands differences in opts.
     * ```js
     * // Draw same mesh twice with different material and position
     * ctx.submit(cmd, [
     *   { pipeline: material1, uniforms: { uModelMatrix: position1 },
     *   { pipeline: material2, uniforms: { uModelMatrix: position2 }
     * ])
     * ```
     *
     * - `ctx.submit(cmd, cb)`: submit command while preserving state from another command. This approach allows to simulate state stack with automatic cleanup at the end of callback.
     * ```js
     * // Render to texture
     * ctx.submit(renderToFboCmd, () => {
     *   ctx.submit(drawMeshCmd)
     * })
     * ```
     *
     * @memberof ctx
     * @param {import("./types.js").PexCommand} cmd
     * @param {import("./types.js").PexCommand | import("./types.js").PexCommand[]} [batches]
     * @param {import("./types.js").PexCommand} [subCommand]
     */ submit (cmd, batches, subCommand) {
            const prevFramebufferId = this.state.framebuffer?.id;
            if (this.debugMode) {
                checkProps(allowedCommandProps, cmd);
                console.debug(NAMESPACE, "submit", cmd.name || cmd.id, {
                    depth: this.stack.length,
                    cmd,
                    batches,
                    subCommand,
                    state: this.state,
                    stack: this.stack
                });
            }
            if (batches) {
                if (Array.isArray(batches)) {
                    // TODO: quick hack
                    for (const batch of batches){
                        this.submit(this.mergeCommands(cmd, batch, true), subCommand);
                    }
                    return;
                } else if (typeof batches === "object") {
                    this.submit(this.mergeCommands(cmd, batches, true), subCommand);
                    return;
                } else {
                    subCommand = batches; // shift argument
                }
            }
            const parentState = this.stack[this.stack.length - 1];
            const cmdState = this.mergeCommands(parentState, cmd, false);
            this.apply(cmdState);
            if (this.debugMode) {
                const currFramebufferId = this.state.framebuffer?.id;
                const framebufferCanged = prevFramebufferId != currFramebufferId;
                console.debug(NAMESPACE, "fbo-state", "  ".repeat(this.stack.length), cmd.name, framebufferCanged ? `${prevFramebufferId} -> ${currFramebufferId}` : currFramebufferId, [
                    ...this.state.viewport
                ], this.state.scissor ? [
                    ...this.state.scissor
                ] : "[]");
                cmdState.debugId = this.debugCommands.length;
                this.debugCommands.push({
                    cmd,
                    cmdState,
                    parentState
                });
            }
            if (subCommand) {
                this.stack.push(cmdState);
                subCommand();
                this.stack.pop();
            }
            if (cmd.pass?.resolveFramebuffer) {
                this.resolvePass(cmd.pass);
            }
            this.checkError();
        },
        program (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "program", opts);
            return this.resource(createProgram(this, opts));
        },
        /**
     * Passes are responsible for setting render targets (textures) and their clearing values.
     * FBOs are created internally and automatically.
     * @memberof ctx
     * @param {import("./pass.js").PassOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const pass = ctx.pass({
     *   color: [Texture2D, ...]
     *   color: [{ texture: Texture2D | TextureCube, target: CubemapFace }, ...]
     *   depth: Texture2D
     *   clearColor: Array | Array[],
     *   clearDepth: number,
     * })
     * ```
     */ pass (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "pass", opts);
            return this.resource(createPass(this, opts));
        },
        /**
     * Pipelines represent the state of the GPU rendering pipeline (shaders, blending, depth test etc).
     * @memberof ctx
     * @param {import("./pipeline.js").PipelineOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     *  @example
     * ```js
     * const pipeline = ctx.pipeline({
     *   vert: string,
     *   frag: string,
     *   depthWrite: boolean,
     *   depthTest: boolean,
     *   depthFunc: DepthFunc,
     *   blend: boolean,
     *   blendSrcRGBFactor: BlendFactor,
     *   blendSrcAlphaFactor: BlendFactor,
     *   blendDstRGBFactor: BlendFactor,
     *   blendDstAlphaFactor: BlendFactor,
     *   cullFace: boolean,
     *   cullFaceMode: Face,
     *   colorMask: Array,
     *   primitive: Primitive
     * })
     * ```
     */ pipeline (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "pipeline", opts);
            return this.resource(createPipeline(this, opts));
        },
        /**
     * Create a VAO resource.
     * @memberof ctx
     * @param {import("./vertex-array.js").VertexArrayOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const vertexLayout = {
     *   aPosition: { location: 0, type: "vec3" },
     *   aNormal: { location: 1, type: "vec3" },
     * };
     *
     * const drawCmd = {
     *   pipeline: ctx.pipeline({
     *     vertexLayout,
     *     // ...
     *   }),
     *   vertexArray: ctx.vertexArray({
     *     vertexLayout,
     *     attributes: {
     *       aPosition: ctx.vertexBuffer(geom.positions),
     *       aNormal: { buffer: ctx.vertexBuffer(geom.normals) },
     *     },
     *     indices: ctx.indexBuffer(geom.cells),
     *   }),
     *   // ...
     * };
     * ```
     */ vertexArray (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "vertexArray", opts);
            return this.resource(createVertexArray(this, opts));
        },
        /**
     * Create a transform feedback
     * @memberof ctx
     * @param {import("./transform-feedback.js").TransformFeedbackOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const tex = ctx.transformFeedback({
     *   varyings: {
     *     outPosition: positionsBuf,
     *   },
     * })
     * ```
     */ transformFeedback (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "transformFeedback", opts);
            return this.resource(createTransformFeedback(this, opts));
        },
        /**
     * Create a 2D Texture resource.
     * @memberof ctx
     * @param {HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | import("./texture.js").TextureOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const tex = ctx.texture2D({
     *   data: [255, 255, 255, 255, 0, 0, 0, 255],
     *   width: 2,
     *   height: 1,
     *   pixelFormat: ctx.PixelFormat.RGBA8,
     *   wrap: ctx.Wrap.Repeat
     * })
     * ```
     */ texture2D (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "texture2D", opts);
            opts.target = gl.TEXTURE_2D;
            return this.resource(createTexture(this, opts));
        },
        /**
     * Create a 2D Texture Array resource.
     * @memberof ctx
     * @param {HTMLImageElement[] | HTMLVideoElement[] | HTMLCanvasElement[] | import("./texture.js").TextureOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const tex = ctx.texture2DArray({
     *   data: [img, img, img],
     * })
     * ```
     */ texture2DArray (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "texture2DArray", opts);
            opts.target = gl.TEXTURE_2D_ARRAY;
            return this.resource(createTexture(this, opts));
        },
        /**
     * Create a 2D Texture cube resource.
     * @memberof ctx
     * @param {import("./texture.js").TextureCubeOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const tex = ctx.textureCube({
     *   data: [posx, negx, posy, negy, posz, negz],
     *   width: 64,
     *   height: 64
     * ])
     * ```
     */ textureCube (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "textureCube", opts);
            opts.target = gl.TEXTURE_CUBE_MAP;
            return this.resource(createTexture(this, opts));
        },
        // framebuffer({ color: [ Texture2D, .. ], depth: Texture2D }
        // framebuffer({ color: [ { texture: Texture2D, target: Enum, level: int }, .. ], depth: { texture: Texture2D }})
        framebuffer (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "framebuffer", opts);
            return this.resource(createFramebuffer(this, opts));
        },
        /**
     * Renderbuffers represent pixel data store for rendering operations.
     * @memberof ctx
     * @param {import("./renderbuffer.js").RenderbufferOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const tex = ctx.renderbuffer({
     *   width: 1280,
     *   height: 720,
     *   pixelFormat: ctx.PixelFormat.DEPTH_COMPONENT16
     * })
     * ```
     */ renderbuffer (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "renderbuffer", opts);
            return this.resource(createRenderbuffer(this, opts));
        },
        // TODO: Should we have named versions or generic 'ctx.buffer' command?
        // In regl buffer() is ARRAY_BUFFER (aka VertexBuffer) and elements() is ELEMENT_ARRAY_BUFFER
        // Now in WebGL2 we get more types Uniform, TransformFeedback, Copy
        // Possible options: {
        //    data: Array or ArrayBuffer
        //    type: 'float', 'uint16' etc
        // }
        /**
     * Create an attribute buffer (ARRAY_BUFFER) resource. Stores vertex data in the GPU memory.
     * @memberof ctx
     * @param {import("./buffer.js").BufferOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const vertexBuffer = ctx.vertexBuffer({ data: Array|TypedArray|ArrayBuffer })
     * ```
     */ vertexBuffer (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "vertexBuffer", opts);
            if (opts.length) opts = {
                data: opts
            };
            opts.target = gl.ARRAY_BUFFER;
            return this.resource(createBuffer(this, opts));
        },
        /**
     * Create an index buffer (ELEMENT_ARRAY_BUFFER) resource. Stores index data in the GPU memory.
     * @memberof ctx
     * @param {import("./buffer.js").BufferOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const indexBuffer = ctx.vertexBuffer({ data: Array|TypedArray|ArrayBuffer })
     * ```
     */ indexBuffer (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "indexBuffer", opts);
            if (opts.length) opts = {
                data: opts
            };
            opts.target = gl.ELEMENT_ARRAY_BUFFER;
            return this.resource(createBuffer(this, opts));
        },
        /**
     * Queries can be used for GPU timers.
     * @memberof ctx
     * @param {import("./query.js").QueryOptions} opts
     * @returns {import("./types.js").PexResource}
     *
     * @example
     * ```js
     * const query = ctx.query({
     *   target: QueryTarget
     * })
     * ```
     */ query (opts) {
            if (this.debugMode) console.debug(NAMESPACE, "query", opts);
            return this.resource(createQuery(this, opts));
        },
        /**
     * Begin the query measurement.
     * @memberof ctx
     * @param {import("./query.js").PexQuery} query
     * _Note: There can be only one query running at the time._
     */ beginQuery (query) {
            console.assert(!this.activeQuery, "Only one query can be active at the time");
            if (query._begin(this, query)) {
                this.activeQuery = query;
            }
        },
        /**
     * End the query measurement.
     * @memberof ctx
     * @param {import("./query.js").PexQuery} query
     * _Note: The result is not available immediately and will be `null` until the state changes from `ctx.QueryState.Pending` to `ctx.QueryState.Ready`._
     */ endQuery (query) {
            if (query._end(this, query)) {
                this.queries.push(query);
                this.activeQuery = null;
            }
        },
        /**
     * Helper to read a block of pixels from a specified rectangle of the current color framebuffer.
     * @memberof ctx
     * @param {{ x: number, y: number, width: number, height: number }} viewport
     * @returns {Uint8Array}
     */ readPixels ({ x = 0, y = 0, width, height }) {
            const pixels = new Uint8Array(width * height * 4);
            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            return pixels;
        },
        /**
     * Update a resource.
     * @memberof ctx
     * @param {import("./types.js").PexResource} resource
     * @param {object} opts
     *
     * @example
     * ```js
     * ctx.update(buffer, { data: [] })
     *
     * ctx.update(texture, {
     *   width: 1,
     *   height: 1,
     *   data: new Uint8Array([255, 0, 0, 255])
     * })
     * ```
     */ update (resource, opts) {
            if (this.debugMode) {
                console.debug(NAMESPACE, "update", {
                    resource,
                    opts
                });
            }
            resource._update(this, resource, opts);
        },
        /**
     * Delete one or all resource(s). Disposed resources are no longer valid for use.
     * @memberof ctx
     * @param {import("./types.js").PexResource} [resource]
     *
     * @example
     *
     * Delete all allocated resources:
     * ```js
     * ctx.dispose()
     * ```
     *
     * Delete a single resource:
     * ```js
     * ctx.dispose(texture)
     * ```
     * _Note: Framebuffers are ref counted and released by Pass. Programs are also ref counted and released by Pipeline._
     */ dispose (resource) {
            if (this.debugMode) console.debug(NAMESPACE, "dispose", resource);
            console.assert(resource || arguments.length === 0, "Trying to dispose undefined resource");
            if (resource) {
                if (!resource._dispose) {
                    console.assert(resource._dispose, "Trying to dispose non resource");
                }
                const idx = this.resources.indexOf(resource);
                console.assert(idx !== -1, "Trying to dispose resource from another context");
                this.resources.splice(idx, 1);
                this.stats[resource.class].alive--;
                resource._dispose();
            } else {
                this.isDisposed = true;
                while(this.resources.length){
                    this.dispose(this.resources[0]);
                }
                this.gl.canvas.width = 1;
                this.gl.canvas.height = 1;
            }
        },
        // Private API
        // TODO: i don't like this inherit flag
        mergeCommands (parent, cmd, inherit) {
            // copy old state so we don't modify it's internals
            const newCmd = Object.assign({}, parent);
            if (!inherit) {
                // clear values are not merged as they are applied only in the parent command
                newCmd.pass = Object.assign({}, parent.pass);
                newCmd.pass.clearColor = undefined;
                newCmd.pass.clearDepth = undefined;
            }
            // overwrite properties from new command
            Object.assign(newCmd, cmd);
            // set viewport to FBO sizes when rendering to a texture
            if (!cmd.viewport && cmd.pass && cmd.pass.opts.color) {
                let tex = null;
                if (cmd.pass.opts.color[0]) {
                    tex = cmd.pass.opts.color[0].texture || cmd.pass.opts.color[0];
                }
                if (cmd.pass.opts.depth) {
                    tex = cmd.pass.opts.depth.texture || cmd.pass.opts.depth;
                }
                if (tex) {
                    newCmd.viewport = [
                        0,
                        0,
                        tex.width,
                        tex.height
                    ];
                }
            }
            // merge uniforms
            newCmd.uniforms = parent.uniforms || cmd.uniforms ? Object.assign({}, parent.uniforms, cmd.uniforms) : null;
            return newCmd;
        },
        applyPass (pass) {
            const state = this.state;
            // Need to find reliable way of deciding if i should update framebuffer
            // 1. If pass has fbo, bind it
            // 3. Else if there is another framebuffer on stack (currently bound) leave it
            // 3. Else if there is only screen framebuffer on the stack and currently bound fbo is different, change it
            // 4. TODO: If there is pass with fbo and another fbo on stack throw error (no interleaved passes are allowed)
            if (pass.framebuffer) {
                let framebuffer = pass.framebuffer;
                if (framebuffer.id !== state.framebuffer.id) {
                    if (this.debugMode) {
                        console.debug(NAMESPACE, "change framebuffer", state.framebuffer, "->", framebuffer);
                    }
                    if (framebuffer._update && !compareFBOAttachments(framebuffer, pass.opts)) {
                        this.update(pass.framebuffer, pass.opts);
                    }
                    ctx.state.framebuffer = framebuffer;
                    gl.bindFramebuffer(framebuffer.target, framebuffer.handle);
                    if (framebuffer.drawBuffers && framebuffer.drawBuffers.length > 1) {
                        gl.drawBuffers(framebuffer.drawBuffers);
                    }
                }
            } else {
                // inherit framebuffer from parent command
                // if pass doesn't specify color or depth attachments
                // and therefore doesn't have own framebuffer assigned
                let framebuffer;
                let i = ctx.stack.length - 1;
                while(!framebuffer && i >= 0){
                    if (ctx.stack[i].pass) {
                        framebuffer = ctx.stack[i].pass.framebuffer;
                    }
                    --i;
                }
                if (framebuffer == ctx.defaultState.pass.framebuffer && ctx.state.framebuffer !== framebuffer) {
                    ctx.state.framebuffer = framebuffer;
                    gl.bindFramebuffer(framebuffer.target, framebuffer.handle);
                }
            }
            this.checkError();
        },
        resolvePass: (pass)=>{
            const resolveFramebuffer = pass.resolveFramebuffer;
            ctx.state.framebuffer = resolveFramebuffer;
            // bind buffer for writing to
            gl.bindFramebuffer(resolveFramebuffer.target, resolveFramebuffer.handle);
            // bind buffer for reading from
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, pass.framebuffer.handle);
            let drawBuffers = resolveFramebuffer.color ? resolveFramebuffer.color.map(()=>gl.NONE) : null;
            // i = -1 is depth buffer, doing it so we can have only one for loop
            const startIndex = resolveFramebuffer.depth ? -1 : 0;
            for(let i = startIndex; i < resolveFramebuffer.color.length; i++){
                const isDepth = i == -1;
                const attachment = isDepth ? resolveFramebuffer.depth?.texture : resolveFramebuffer.color[i].texture;
                const mask = isDepth ? gl.DEPTH_BUFFER_BIT : gl.COLOR_BUFFER_BIT;
                const filter = isDepth ? gl.NEAREST : gl.LINEAR;
                if (i >= 0) {
                    // attachment we writing to, only one
                    drawBuffers[i] = gl.COLOR_ATTACHMENT0 + i;
                    gl.drawBuffers(drawBuffers);
                    // attachment we are reading from
                    gl.readBuffer(gl.COLOR_ATTACHMENT0 + resolveFramebuffer.color[i].sourceIndex);
                }
                gl.blitFramebuffer(0, 0, attachment.width, attachment.height, 0, 0, attachment.width, attachment.height, mask, filter);
                if (i >= 0) {
                    // skip already written buffer on next write as we can only blit one attachment at the time
                    drawBuffers[i] = gl.NONE;
                    if (resolveFramebuffer.color[i].texture.mipmap) {
                        ctx.update(pass.resolveFramebuffer.color[i].texture, {
                            mipmap: true
                        });
                    }
                }
            }
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        },
        applyViewport (viewport) {
            if (viewport && viewport !== this.state.viewport) {
                this.state.viewport = viewport;
                gl.viewport(this.state.viewport[0], this.state.viewport[1], this.state.viewport[2], this.state.viewport[3]);
            }
            this.checkError();
        },
        applyScissor (scissor) {
            if (scissor) {
                if (scissor !== this.state.scissor) {
                    this.state.scissor = scissor;
                    gl.enable(gl.SCISSOR_TEST);
                    gl.scissor(this.state.scissor[0], this.state.scissor[1], this.state.scissor[2], this.state.scissor[3]);
                }
            } else {
                if (scissor !== this.state.scissor) {
                    this.state.scissor = scissor;
                    gl.disable(gl.SCISSOR_TEST);
                }
            }
            this.checkError();
        },
        applyClear (pass) {
            let clearBits = 0;
            if (pass.clearColor !== undefined) {
                if (this.debugMode) {
                    console.debug(NAMESPACE, "clearing color", pass.clearColor);
                }
                const clearValues = pass.clearColor;
                const isClearBufferArray = is2DArray(clearValues);
                if (isWebGL2$1 && isClearBufferArray) {
                    for(let i = 0; i < clearValues.length; i++){
                        const color = clearValues[i];
                        if (color) gl.clearBufferfv(gl.COLOR, i, color);
                    }
                } else {
                    clearBits |= gl.COLOR_BUFFER_BIT;
                    // TODO this might be unnecesary but we don't know because we don't store the clearColor in state
                    gl.clearColor(...isClearBufferArray ? clearValues[0] : clearValues); // Fallback in WebGL1 clearing all buffers
                }
            }
            if (pass.clearDepth !== undefined) {
                if (this.debugMode) {
                    console.debug(NAMESPACE, "clearing depth", pass.clearDepth);
                }
                clearBits |= gl.DEPTH_BUFFER_BIT;
                if (!this.state.depthWrite) {
                    this.state.depthWrite = true;
                    gl.depthMask(true);
                }
                // TODO this might be unnecesary but we don't know because we don't store the clearDepth in state
                gl.clearDepth(pass.clearDepth);
            }
            if (clearBits) gl.clear(clearBits);
            this.checkError();
        },
        applyPipeline (pipeline) {
            const state = this.state;
            if (pipeline.depthWrite !== state.depthWrite) {
                state.depthWrite = pipeline.depthWrite;
                gl.depthMask(state.depthWrite);
            }
            if (pipeline.depthTest !== state.depthTest) {
                state.depthTest = pipeline.depthTest;
                state.depthTest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST);
            }
            if (pipeline.depthFunc !== state.depthFunc) {
                state.depthFunc = pipeline.depthFunc;
                gl.depthFunc(state.depthFunc);
            }
            if (pipeline.blend !== state.blend || pipeline.blendSrcRGBFactor !== state.blendSrcRGBFactor || pipeline.blendSrcAlphaFactor !== state.blendSrcAlphaFactor || pipeline.blendDstRGBFactor !== state.blendDstRGBFactor || pipeline.blendDstAlphaFactor !== state.blendDstAlphaFactor) {
                state.blend = pipeline.blend;
                state.blendSrcRGBFactor = pipeline.blendSrcRGBFactor;
                state.blendSrcAlphaFactor = pipeline.blendSrcAlphaFactor;
                state.blendDstRGBFactor = pipeline.blendDstRGBFactor;
                state.blendDstAlphaFactor = pipeline.blendDstAlphaFactor;
                state.blend ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND);
                gl.blendFuncSeparate(state.blendSrcRGBFactor, state.blendDstRGBFactor, state.blendSrcAlphaFactor, state.blendDstAlphaFactor);
            }
            if (pipeline.cullFace !== state.cullFace || pipeline.cullFaceMode !== state.cullFaceMode) {
                state.cullFace = pipeline.cullFace;
                state.cullFaceMode = pipeline.cullFaceMode;
                state.cullFace ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE);
                if (state.cullFace) {
                    gl.cullFace(state.cullFaceMode);
                }
            }
            if (pipeline.colorMask[0] !== state.pipeline.colorMask[0] || pipeline.colorMask[1] !== state.pipeline.colorMask[1] || pipeline.colorMask[2] !== state.pipeline.colorMask[2] || pipeline.colorMask[3] !== state.pipeline.colorMask[3]) {
                state.pipeline.colorMask[0] = pipeline.colorMask[0];
                state.pipeline.colorMask[1] = pipeline.colorMask[1];
                state.pipeline.colorMask[2] = pipeline.colorMask[2];
                state.pipeline.colorMask[3] = pipeline.colorMask[3];
                gl.colorMask(pipeline.colorMask[0], pipeline.colorMask[1], pipeline.colorMask[2], pipeline.colorMask[3]);
            }
            if (pipeline.program !== state.program) {
                state.program = pipeline.program;
                if (state.program) {
                    gl.useProgram(state.program.handle);
                }
            }
            if (pipeline.vertexLayout) state.vertexLayout = pipeline.vertexLayout;
            this.checkError();
        },
        checkActiveProgram () {
            if (!this.state.program) {
                throw new Error("Trying to draw without an active program");
            }
        },
        applyUniforms (uniforms, cmd) {
            this.checkActiveProgram();
            const { program, activeTextures } = this.state;
            let numTextures = 0;
            const requiredUniforms = this.debugMode ? Object.keys(program.uniforms) : null;
            for(const name in uniforms){
                let value = uniforms[name];
                // TODO: find a better way to not trying to set unused uniforms that might have been inherited
                if (!program.uniforms[name] && !program.uniforms[`${name}[0]`]) {
                    continue;
                }
                if (value === null || value === undefined) {
                    if (this.debugMode) console.debug(NAMESPACE, "invalid command", cmd);
                    throw new Error(`Can't set uniform "${name}" with a null value`);
                }
                // FIXME: uniform array hack
                if (Array.isArray(value) && !program.uniforms[name]) {
                    if (this.debugMode) {
                        console.debug(NAMESPACE, "unknown uniform", name, Object.keys(program.uniforms));
                    }
                    for(let i = 0; i < value.length; i++){
                        const nameIndex = `${name}[${i}]`;
                        program.setUniform(nameIndex, value[i]);
                        if (this.debugMode) {
                            requiredUniforms.splice(requiredUniforms.indexOf(nameIndex), 1);
                        }
                    }
                } else if (value.target) {
                    // assuming texture
                    // FIXME: texture binding hack
                    const slot = numTextures++;
                    gl.activeTexture(gl.TEXTURE0 + slot);
                    if (activeTextures[slot] !== value) {
                        gl.bindTexture(value.target, value.handle);
                        activeTextures[slot] = value;
                    }
                    program.setUniform(name, slot);
                    if (this.debugMode) {
                        requiredUniforms.splice(requiredUniforms.indexOf(name), 1);
                    }
                } else if (!value.length && typeof value === "object") {
                    if (this.debugMode) console.debug(NAMESPACE, "invalid command", cmd);
                    throw new Error(`Can't set uniform "${name}" with an Object value`);
                } else {
                    program.setUniform(name, value);
                    if (this.debugMode) {
                        requiredUniforms.splice(requiredUniforms.indexOf(name), 1);
                    }
                }
            }
            if (this.debugMode && requiredUniforms.length > 0) {
                console.debug(NAMESPACE, "invalid command", cmd);
                throw new Error(`Trying to draw with missing uniforms: ${requiredUniforms.join(", ")}`);
            }
            this.checkError();
        },
        applyTransformFeedback (transformFeedback) {
            const { program } = this.state;
            if (!program.varyings) {
                program.varyings = Object.keys(transformFeedback.varyings);
                gl.transformFeedbackVaryings(program.handle, program.varyings, transformFeedback.bufferMode);
                gl.linkProgram(program.handle);
                Object.keys(program.uniforms).forEach((name)=>{
                    program.uniforms[name].location = getUniformLocation(gl, program, name);
                });
                this.checkError();
            }
        },
        drawVertexData (cmd) {
            this.checkActiveProgram();
            const { vertexLayout, program, vertexArray } = this.state;
            if (this.debugMode) {
                // TODO: can vertex layout be ever different if it's derived from pipeline's shader?
                if (Object.keys(vertexLayout).length !== Object.keys(program.attributes).length) {
                    console.debug(NAMESPACE, "Invalid vertex layout not matching the shader", vertexLayout, program.attributes, cmd);
                    throw new Error("Invalid vertex layout not matching the shader. Is any attribute not used in the shader?");
                }
            }
            if (cmd.vertexArray) {
                //TODO: verify vertex layout
                for(let i = 0; i < vertexLayout.length; i++){
                    const [name, location] = vertexLayout[i];
                    if (!cmd.vertexArray.attributes[name] || !cmd.vertexArray.attributes[name].location === location) {
                        if (this.debugMode) {
                            console.debug(NAMESPACE, "invalid command", cmd, "vertex array doesn't satisfy vertex layout", vertexLayout);
                        }
                        throw new Error(`Command is missing attribute "${name}" at location ${location}`);
                    }
                }
                if (vertexArray !== cmd.vertexArray.handle) {
                    this.state.vertexArray = cmd.vertexArray.handle;
                    gl.bindVertexArray(cmd.vertexArray.handle);
                }
                if (cmd.vertexArray.indices) {
                    let indexBuffer = cmd.vertexArray.indices.buffer;
                    if (!indexBuffer && cmd.vertexArray.indices.class === "indexBuffer") {
                        indexBuffer = cmd.vertexArray.indices;
                    }
                    this.state.indexBuffer = indexBuffer;
                }
            } else {
                if (this.state.vertexArray !== undefined) {
                    this.state.vertexArray = undefined;
                    gl.bindVertexArray(null);
                }
                // Sets ctx.state.indexBuffer and ctx.state.activeAttributes
                enableVertexData(ctx, vertexLayout, cmd, true);
            }
            if (cmd.transformFeedback) {
                gl.enable(gl.RASTERIZER_DISCARD);
                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, cmd.transformFeedback.handle);
                gl.beginTransformFeedback(cmd.transformFeedback.primitiveMode);
            }
            draw(ctx, cmd);
            if (cmd.transformFeedback) {
                gl.endTransformFeedback();
                gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
                gl.disable(gl.RASTERIZER_DISCARD);
            }
            this.checkError();
        },
        // TODO: switching to lightweight resources would allow to just clone state
        // and use commands as state modifiers?
        apply (cmd) {
            if (this.debugMode) {
                console.debug(NAMESPACE, "apply", cmd.name || cmd.id, {
                    cmd,
                    state: JSON.parse(JSON.stringify(this.state))
                });
            }
            this.checkError();
            if (cmd.pass) this.applyPass(cmd.pass);
            this.applyViewport(cmd.viewport);
            this.applyScissor(cmd.scissor);
            if (cmd.pass) this.applyClear(cmd.pass);
            if (cmd.pipeline) this.applyPipeline(cmd.pipeline);
            if (cmd.transformFeedback) {
                this.applyTransformFeedback(cmd.transformFeedback);
            }
            if (cmd.uniforms) this.applyUniforms(cmd.uniforms);
            if (cmd.attributes || cmd.vertexArray) this.drawVertexData(cmd);
        }
    });
    if (opts.debug) ctx.debug(true);
    console.debug(NAMESPACE, "capabilities", ctx.capabilities);
    ctx.apply(defaultState);
    return ctx;
}

export { createContext as default };
