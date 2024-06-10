# canvas-record

[![npm version](https://img.shields.io/npm/v/canvas-record)](https://www.npmjs.com/package/canvas-record)
[![stability-stable](https://img.shields.io/badge/stability-stable-green.svg)](https://www.npmjs.com/package/canvas-record)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/canvas-record)](https://bundlephobia.com/package/canvas-record)
[![dependencies](https://img.shields.io/librariesio/release/npm/canvas-record)](https://github.com/dmnsgn/canvas-record/blob/main/package.json)
[![types](https://img.shields.io/npm/types/canvas-record)](https://github.com/microsoft/TypeScript)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-fa6673.svg)](https://conventionalcommits.org)
[![styled with prettier](https://img.shields.io/badge/styled_with-Prettier-f8bc45.svg?logo=prettier)](https://github.com/prettier/prettier)
[![linted with eslint](https://img.shields.io/badge/linted_with-ES_Lint-4B32C3.svg?logo=eslint)](https://github.com/eslint/eslint)
[![license](https://img.shields.io/github/license/dmnsgn/canvas-record)](https://github.com/dmnsgn/canvas-record/blob/main/LICENSE.md)

Record a video in the browser or directly on the File System from a canvas (2D/WebGL/WebGPU) as MP4, WebM, MKV, GIF, PNG/JPG Sequence using WebCodecs and Wasm when available.

[![paypal](https://img.shields.io/badge/donate-paypal-informational?logo=paypal)](https://paypal.me/dmnsgn)
[![coinbase](https://img.shields.io/badge/donate-coinbase-informational?logo=coinbase)](https://commerce.coinbase.com/checkout/56cbdf28-e323-48d8-9c98-7019e72c97f3)
[![twitter](https://img.shields.io/twitter/follow/dmnsgn?style=social)](https://twitter.com/dmnsgn)

![](https://raw.githubusercontent.com/dmnsgn/canvas-record/main/screenshot.gif)

## Installation

```bash
npm install canvas-record
```

## Usage

```js
import { Recorder, RecorderStatus, Encoders } from "canvas-record";
import createCanvasContext from "canvas-context";
import { AVC } from "media-codecs";

// Setup
const pixelRatio = devicePixelRatio;
const width = 512;
const height = 512;
const { context, canvas } = createCanvasContext("2d", {
  width: width * pixelRatio,
  height: height * pixelRatio,
  contextAttributes: { willReadFrequently: true },
});
Object.assign(canvas.style, { width: `${width}px`, height: `${height}px` });

const mainElement = document.querySelector("main");
mainElement.appendChild(canvas);

// Animation
let canvasRecorder;

function render() {
  const width = canvas.width;
  const height = canvas.height;

  const t = canvasRecorder.frame / canvasRecorder.frameTotal || Number.EPSILON;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "red";
  context.fillRect(0, 0, t * width, height);
}

const tick = async () => {
  render();

  if (canvasRecorder.status !== RecorderStatus.Recording) return;
  await canvasRecorder.step();

  if (canvasRecorder.status !== RecorderStatus.Stopped) {
    requestAnimationFrame(() => tick());
  }
};

canvasRecorder = new Recorder(context, {
  name: "canvas-record-example",
  encoderOptions: {
    codec: AVC.getCodec({ profile: "Main", level: "5.2" }),
  },
});

// Start and encode frame 0
await canvasRecorder.start();

// Animate to encode the rest
tick(canvasRecorder);
```

## API

Encoder comparison:

| Encoder        | Extension              | Required Web API   | WASM                  | Speed    |
| -------------- | ---------------------- | ------------------ | --------------------- | -------- |
| `WebCodecs`    | `mp4` / `webm` / `mkv` | WebCodecs          | ❌                    | Fast     |
| `MP4Wasm`      | `mp4`                  | WebCodecs          | ✅ (embed)            | Fast     |
| `H264MP4`      | `mp4`                  |                    | ✅ (embed)            | Medium   |
| `FFmpeg`       | `mp4` / `webm`         | SharedArrayBuffer  | ✅ (need binary path) | Slow     |
| `GIF`          | `gif`                  | WebWorkers (wip)   | ❌                    | Fast     |
| `Frame`        | `png` / `jpg`          | File System Access | ❌                    | Fast     |
| `MediaCapture` | `mkv` / `webm`         | MediaStream        | ❌                    | Realtime |

Note:

- `WebCodecs` encoderOptions allow different codecs to be used: VP8/VP9/AV1/HEVC. See [media-codecs](https://github.com/dmnsgn/media-codecs) to get a codec string from human readable options and check which ones are supported in your browser with [github.io/media-codecs](https://dmnsgn.github.io/media-codecs/).
- `WebCodecs` 5-10x faster than H264MP4Encoder and 20x faster than `FFmpeg` (it needs to mux files after writing png to virtual FS)
- `FFmpeg` (mp4 and webm) and `WebCodecs` (mp4) have a AVC maximum frame size of 9437184 pixels. That's fine until a bit more than 4K 16:9 @ 30fps. So if you need 4K Square or 8K exports, be patient with `H264MP4Encoder` (which probably also has the 4GB memory limit) or use Frame encoder and mux them manually with `FFmpeg` CLI (`ffmpeg -framerate 30 -i "%05d.jpg" -b:v 60M -r 30 -profile:v baseline -pix_fmt yuv420p -movflags +faststart output.mp4`)
- `MP4Wasm` is embedded from [mp4-wasm](https://github.com/mattdesl/mp4-wasm/) for ease of use (`FFmpeg` will require `encoderOptions.corePath`)

Roadmap:

- [ ] add debug logging
- [ ] use WebWorkers for gifenc

<!-- api-start -->

## Modules

<dl>
<dt><a href="#module_canvas-record">canvas-record</a></dt>
<dd><p>Re-export Recorder, RecorderStatus, all Encoders and utils.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#Recorder">Recorder</a></dt>
<dd></dd>
<dt><a href="#Encoder">Encoder</a></dt>
<dd></dd>
<dt><a href="#FFmpegEncoder">FFmpegEncoder</a></dt>
<dd></dd>
<dt><a href="#FrameEncoder">FrameEncoder</a></dt>
<dd></dd>
<dt><a href="#GIFEncoder">GIFEncoder</a></dt>
<dd></dd>
<dt><a href="#H264MP4Encoder">H264MP4Encoder</a></dt>
<dd></dd>
<dt><a href="#MediaCaptureEncoder">MediaCaptureEncoder</a></dt>
<dd></dd>
<dt><a href="#MP4WasmEncoder">MP4WasmEncoder</a></dt>
<dd></dd>
<dt><a href="#WebCodecsEncoder">WebCodecsEncoder</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#isWebCodecsSupported">isWebCodecsSupported</a> : <code>boolean</code></dt>
<dd><p>Check for WebCodecs support on the current platform.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#estimateBitRate">estimateBitRate(width, height, frameRate, motionRank, bitrateMode)</a> ⇒ <code>number</code></dt>
<dd><p>Estimate the bit rate of a video rounded to nearest megabit.
Based on &quot;H.264 for the rest of us&quot; by Kush Amerasinghe.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#onStatusChangeCb">onStatusChangeCb</a> : <code>function</code></dt>
<dd><p>A callback to notify on the status change. To compare with RecorderStatus enum values.</p>
</dd>
<dt><a href="#RecorderOptions">RecorderOptions</a> : <code>object</code></dt>
<dd><p>Options for recording. All optional.</p>
</dd>
<dt><a href="#RecorderStartOptions">RecorderStartOptions</a> : <code>object</code></dt>
<dd><p>Options for recording initialisation. All optional.</p>
</dd>
<dt><a href="#EncoderExtensions">EncoderExtensions</a> : <code>&quot;mp4&quot;</code> | <code>&quot;webm&quot;</code> | <code>&quot;png&quot;</code> | <code>&quot;jpg&quot;</code> | <code>&quot;gif&quot;</code> | <code>&quot;mkv&quot;</code></dt>
<dd></dd>
<dt><a href="#EncoderTarget">EncoderTarget</a> : <code>&quot;in-browser&quot;</code> | <code>&quot;file-system&quot;</code></dt>
<dd></dd>
<dt><a href="#FFmpegEncoderOptions">FFmpegEncoderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#FFmpegEncoderEncoderOptions">FFmpegEncoderEncoderOptions</a> : <code>module:@ffmpeg/ffmpeg/dist/esm/types.js~FFMessageLoadConfig</code></dt>
<dd></dd>
<dt><a href="#GIFEncoderOptions">GIFEncoderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#GIFEncoderQuantizeOptions">GIFEncoderQuantizeOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#GIFEncoderEncoderOptions">GIFEncoderEncoderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#H264MP4EncoderOptions">H264MP4EncoderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#H264MP4EncoderEncoderOptions">H264MP4EncoderEncoderOptions</a> : <code>module:h264-mp4-encoder~H264MP4Encoder</code></dt>
<dd></dd>
<dt><a href="#MediaCaptureEncoderOptions">MediaCaptureEncoderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#MediaCaptureEncoderEncoderOptions">MediaCaptureEncoderEncoderOptions</a> : <code>MediaRecorderOptions</code></dt>
<dd></dd>
<dt><a href="#MP4WasmEncoderOptions">MP4WasmEncoderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#MP4WasmEncoderEncoderOptions">MP4WasmEncoderEncoderOptions</a> : <code>VideoEncoderConfig</code></dt>
<dd></dd>
<dt><a href="#WebCodecsEncoderOptions">WebCodecsEncoderOptions</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#WebCodecsEncoderEncoderOptions">WebCodecsEncoderEncoderOptions</a> : <code>VideoEncoderConfig</code></dt>
<dd></dd>
<dt><a href="#WebCodecsMuxerOptions">WebCodecsMuxerOptions</a> : <code>MuxerOptions</code></dt>
<dd></dd>
</dl>

<a name="module_canvas-record"></a>

## canvas-record

Re-export Recorder, RecorderStatus, all Encoders and utils.

<a name="Recorder"></a>

## Recorder

**Kind**: global class

- [Recorder](#Recorder)
  - [new Recorder(context, [options])](#new_Recorder_new)
  - [.defaultOptions](#Recorder+defaultOptions) : [<code>RecorderOptions</code>](#RecorderOptions)
  - [.mimeTypes](#Recorder+mimeTypes) : <code>object</code>
  - [.start([startOptions])](#Recorder+start)
  - [.step()](#Recorder+step)
  - [.stop()](#Recorder+stop) ⇒ <code>ArrayBuffer</code> \| <code>Uint8Array</code> \| <code>Array.&lt;Blob&gt;</code> \| <code>undefined</code>
  - [.dispose()](#Recorder+dispose)

<a name="new_Recorder_new"></a>

### new Recorder(context, [options])

Create a Recorder instance

| Param     | Type                                             | Default         |
| --------- | ------------------------------------------------ | --------------- |
| context   | <code>RenderingContext</code>                    |                 |
| [options] | [<code>RecorderOptions</code>](#RecorderOptions) | <code>{}</code> |

<a name="Recorder+defaultOptions"></a>

### recorder.defaultOptions : [<code>RecorderOptions</code>](#RecorderOptions)

Sensible defaults for recording so that the recorder "just works".

**Kind**: instance property of [<code>Recorder</code>](#Recorder)
<a name="Recorder+mimeTypes"></a>

### recorder.mimeTypes : <code>object</code>

A mapping of extension to their mime types

**Kind**: instance property of [<code>Recorder</code>](#Recorder)
<a name="Recorder+start"></a>

### recorder.start([startOptions])

Start the recording by initializing and optionally calling the initial step.

**Kind**: instance method of [<code>Recorder</code>](#Recorder)

| Param          | Type                                                       | Default         |
| -------------- | ---------------------------------------------------------- | --------------- |
| [startOptions] | [<code>RecorderStartOptions</code>](#RecorderStartOptions) | <code>{}</code> |

<a name="Recorder+step"></a>

### recorder.step()

Encode a frame and increment the time and the playhead.
Calls `await canvasRecorder.stop()` when duration is reached.

**Kind**: instance method of [<code>Recorder</code>](#Recorder)
<a name="Recorder+stop"></a>

### recorder.stop() ⇒ <code>ArrayBuffer</code> \| <code>Uint8Array</code> \| <code>Array.&lt;Blob&gt;</code> \| <code>undefined</code>

Stop the recording and return the recorded buffer.
If options.download is set, automatically start downloading the resulting file.
Is called when duration is reached or manually.

**Kind**: instance method of [<code>Recorder</code>](#Recorder)
<a name="Recorder+dispose"></a>

### recorder.dispose()

Clean up the recorder and encoder

**Kind**: instance method of [<code>Recorder</code>](#Recorder)
<a name="Encoder"></a>

## Encoder

**Kind**: global class
**Properties**

| Name             | Type                                                 |
| ---------------- | ---------------------------------------------------- |
| target           | [<code>EncoderTarget</code>](#EncoderTarget)         |
| extension        | [<code>EncoderExtensions</code>](#EncoderExtensions) |
| [encoderOptions] | <code>object</code>                                  |
| [muxerOptions]   | <code>object</code>                                  |

- [Encoder](#Encoder)
  - [new Encoder(options)](#new_Encoder_new)
  - [.supportedExtensions](#Encoder+supportedExtensions) : <code>Array.&lt;Extensions&gt;</code>
  - [.supportedTargets](#Encoder+supportedTargets) : [<code>Array.&lt;EncoderTarget&gt;</code>](#EncoderTarget)
  - [.init(options)](#Encoder+init)
  - [.encode(frame, [frameNumber])](#Encoder+encode)
  - [.stop()](#Encoder+stop) ⇒ <code>ArrayBuffer</code> \| <code>Uint8Array</code> \| <code>Array.&lt;Blob&gt;</code> \| <code>undefined</code>
  - [.dispose()](#Encoder+dispose)

<a name="new_Encoder_new"></a>

### new Encoder(options)

Base Encoder class. All Encoders extend it and its method are called by the Recorder.

| Param   | Type                |
| ------- | ------------------- |
| options | <code>object</code> |

<a name="Encoder+supportedExtensions"></a>

### encoder.supportedExtensions : <code>Array.&lt;Extensions&gt;</code>

The extension the encoder supports

**Kind**: instance property of [<code>Encoder</code>](#Encoder)
<a name="Encoder+supportedTargets"></a>

### encoder.supportedTargets : [<code>Array.&lt;EncoderTarget&gt;</code>](#EncoderTarget)

The target to download the file to.

**Kind**: instance property of [<code>Encoder</code>](#Encoder)
<a name="Encoder+init"></a>

### encoder.init(options)

Setup the encoder: load binary, instantiate muxers, setup file system target...

**Kind**: instance method of [<code>Encoder</code>](#Encoder)

| Param   | Type                |
| ------- | ------------------- |
| options | <code>object</code> |

<a name="Encoder+encode"></a>

### encoder.encode(frame, [frameNumber])

Encode a single frame. The frameNumber is usually used for GOP (Group Of Pictures).

**Kind**: instance method of [<code>Encoder</code>](#Encoder)

| Param         | Type                |
| ------------- | ------------------- |
| frame         | <code>number</code> |
| [frameNumber] | <code>number</code> |

<a name="Encoder+stop"></a>

### encoder.stop() ⇒ <code>ArrayBuffer</code> \| <code>Uint8Array</code> \| <code>Array.&lt;Blob&gt;</code> \| <code>undefined</code>

Stop the encoding process and cleanup the temporary data.

**Kind**: instance method of [<code>Encoder</code>](#Encoder)
<a name="Encoder+dispose"></a>

### encoder.dispose()

Clean up the encoder

**Kind**: instance method of [<code>Encoder</code>](#Encoder)
<a name="FFmpegEncoder"></a>

## FFmpegEncoder

**Kind**: global class
<a name="new_FFmpegEncoder_new"></a>

### new FFmpegEncoder([options])

| Param     | Type                                                       |
| --------- | ---------------------------------------------------------- |
| [options] | [<code>FFmpegEncoderOptions</code>](#FFmpegEncoderOptions) |

<a name="FrameEncoder"></a>

## FrameEncoder

**Kind**: global class
<a name="GIFEncoder"></a>

## GIFEncoder

**Kind**: global class
<a name="new_GIFEncoder_new"></a>

### new GIFEncoder([options])

| Param     | Type                                                 |
| --------- | ---------------------------------------------------- |
| [options] | [<code>GIFEncoderOptions</code>](#GIFEncoderOptions) |

<a name="H264MP4Encoder"></a>

## H264MP4Encoder

**Kind**: global class
<a name="new_H264MP4Encoder_new"></a>

### new H264MP4Encoder([options])

| Param     | Type                                                         |
| --------- | ------------------------------------------------------------ |
| [options] | [<code>H264MP4EncoderOptions</code>](#H264MP4EncoderOptions) |

<a name="MediaCaptureEncoder"></a>

## MediaCaptureEncoder

**Kind**: global class
<a name="new_MediaCaptureEncoder_new"></a>

### new MediaCaptureEncoder([options])

| Param     | Type                                                                   |
| --------- | ---------------------------------------------------------------------- |
| [options] | [<code>MediaCaptureEncoderOptions</code>](#MediaCaptureEncoderOptions) |

<a name="MP4WasmEncoder"></a>

## MP4WasmEncoder

**Kind**: global class
<a name="new_MP4WasmEncoder_new"></a>

### new MP4WasmEncoder([options])

| Param     | Type                                                         |
| --------- | ------------------------------------------------------------ |
| [options] | [<code>MP4WasmEncoderOptions</code>](#MP4WasmEncoderOptions) |

<a name="WebCodecsEncoder"></a>

## WebCodecsEncoder

**Kind**: global class
<a name="new_WebCodecsEncoder_new"></a>

### new WebCodecsEncoder([options])

| Param     | Type                                                             |
| --------- | ---------------------------------------------------------------- |
| [options] | [<code>WebCodecsEncoderOptions</code>](#WebCodecsEncoderOptions) |

<a name="RecorderStatus"></a>

## RecorderStatus : <code>enum</code>

Enum for recorder status

**Kind**: global enum
**Read only**: true
**Example**

```js
// Check recorder status before continuing
if (canvasRecorder.status !== RecorderStatus.Stopped) {
  rAFId = requestAnimationFrame(() => tick());
}
```

<a name="isWebCodecsSupported"></a>

## isWebCodecsSupported : <code>boolean</code>

Check for WebCodecs support on the current platform.

**Kind**: global constant
<a name="estimateBitRate"></a>

## estimateBitRate(width, height, frameRate, motionRank, bitrateMode) ⇒ <code>number</code>

Estimate the bit rate of a video rounded to nearest megabit.
Based on "H.264 for the rest of us" by Kush Amerasinghe.

**Kind**: global function
**Returns**: <code>number</code> - A bitrate value in bits per second

| Param       | Type                                                                   | Default               | Description           |
| ----------- | ---------------------------------------------------------------------- | --------------------- | --------------------- |
| width       | <code>number</code>                                                    |                       |                       |
| height      | <code>number</code>                                                    |                       |                       |
| frameRate   | <code>number</code>                                                    | <code>30</code>       |                       |
| motionRank  | <code>number</code>                                                    | <code>4</code>        | A factor of 1, 2 or 4 |
| bitrateMode | <code>&quot;variable&quot;</code> \| <code>&quot;constant&quot;</code> | <code>variable</code> |                       |

**Example**

```js
// Full HD (1080p)
const bitRate = estimateBitRate(1920, 1080, 30, "variable");
const bitRateMbps = bitRate * 1_000_000; // => 13 Mbps
```

<a name="onStatusChangeCb"></a>

## onStatusChangeCb : <code>function</code>

A callback to notify on the status change. To compare with RecorderStatus enum values.

**Kind**: global typedef

| Param          | Type                | Description |
| -------------- | ------------------- | ----------- |
| RecorderStatus | <code>number</code> | the status  |

<a name="RecorderOptions"></a>

## RecorderOptions : <code>object</code>

Options for recording. All optional.

**Kind**: global typedef
**Properties**

| Name             | Type                                               | Default                                           | Description                                                                                                             |
| ---------------- | -------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [name]           | <code>string</code>                                | <code>&quot;\&quot;\&quot;&quot;</code>           | A name for the recorder, used as prefix for the default file name.                                                      |
| [duration]       | <code>number</code>                                | <code>10</code>                                   | The recording duration in seconds. If set to Infinity, `await canvasRecorder.stop()` needs to be called manually.       |
| [frameRate]      | <code>number</code>                                | <code>30</code>                                   | The frame rate in frame per seconds. Use `await canvasRecorder.step();` to go to the next frame.                        |
| [download]       | <code>boolean</code>                               | <code>true</code>                                 | Automatically download the recording when duration is reached or when `await canvasRecorder.stop()` is manually called. |
| [extension]      | <code>string</code>                                | <code>&quot;\&quot;mp4\&quot;&quot;</code>        | Default file extension: infers which Encoder is selected.                                                               |
| [target]         | <code>string</code>                                | <code>&quot;\&quot;in-browser\&quot;&quot;</code> | Default writing target: in-browser or file-system when available.                                                       |
| [encoder]        | <code>object</code>                                |                                                   | A specific encoder. Default encoder based on options.extension: GIF > WebCodecs > H264MP4.                              |
| [encoderOptions] | <code>object</code>                                |                                                   | See `src/encoders` or individual packages for a list of options.                                                        |
| [muxerOptions]   | <code>object</code>                                |                                                   | See "mp4-muxer" and "webm-muxer" for a list of options.                                                                 |
| [onStatusChange] | [<code>onStatusChangeCb</code>](#onStatusChangeCb) |                                                   |                                                                                                                         |

<a name="RecorderStartOptions"></a>

## RecorderStartOptions : <code>object</code>

Options for recording initialisation. All optional.

**Kind**: global typedef
**Properties**

| Name       | Type                 | Description                                                                   |
| ---------- | -------------------- | ----------------------------------------------------------------------------- |
| [filename] | <code>string</code>  | Overwrite the file name completely.                                           |
| [initOnly] | <code>boolean</code> | Only initialised the recorder and don't call the first await recorder.step(). |

<a name="EncoderExtensions"></a>

## EncoderExtensions : <code>&quot;mp4&quot;</code> \| <code>&quot;webm&quot;</code> \| <code>&quot;png&quot;</code> \| <code>&quot;jpg&quot;</code> \| <code>&quot;gif&quot;</code> \| <code>&quot;mkv&quot;</code>

**Kind**: global typedef
<a name="EncoderTarget"></a>

## EncoderTarget : <code>&quot;in-browser&quot;</code> \| <code>&quot;file-system&quot;</code>

**Kind**: global typedef
<a name="FFmpegEncoderOptions"></a>

## FFmpegEncoderOptions : <code>object</code>

**Kind**: global typedef
**Properties**

| Name             | Type                                                                     | Default         |
| ---------------- | ------------------------------------------------------------------------ | --------------- |
| [encoderOptions] | [<code>FFmpegEncoderEncoderOptions</code>](#FFmpegEncoderEncoderOptions) | <code>{}</code> |

<a name="FFmpegEncoderEncoderOptions"></a>

## FFmpegEncoderEncoderOptions : <code>module:@ffmpeg/ffmpeg/dist/esm/types.js~FFMessageLoadConfig</code>

**Kind**: global typedef
**See**: [FFmpeg#load](https://ffmpegwasm.netlify.app/docs/api/ffmpeg/classes/FFmpeg#load)
<a name="GIFEncoderOptions"></a>

## GIFEncoderOptions : <code>object</code>

**Kind**: global typedef
**Properties**

| Name              | Type                                                                 | Default          |
| ----------------- | -------------------------------------------------------------------- | ---------------- |
| [maxColors]       | <code>number</code>                                                  | <code>256</code> |
| [quantizeOptions] | [<code>GIFEncoderQuantizeOptions</code>](#GIFEncoderQuantizeOptions) |                  |
| [encoderOptions]  | [<code>GIFEncoderEncoderOptions</code>](#GIFEncoderEncoderOptions)   | <code>{}</code>  |

<a name="GIFEncoderQuantizeOptions"></a>

## GIFEncoderQuantizeOptions : <code>object</code>

**Kind**: global typedef
**See**: [QuantizeOptions](https://github.com/mattdesl/gifenc#palette--quantizergba-maxcolors-options--)
**Properties**

| Name                  | Type                                                                                                    | Default                         |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [format]              | <code>&quot;rgb565&quot;</code> \| <code>&quot;rgb444&quot;</code> \| <code>&quot;rgba4444&quot;</code> | <code>&quot;rgb565&quot;</code> |
| [oneBitAlpha]         | <code>boolean</code> \| <code>number</code>                                                             | <code>false</code>              |
| [clearAlpha]          | <code>boolean</code>                                                                                    | <code>true</code>               |
| [clearAlphaThreshold] | <code>number</code>                                                                                     | <code>0</code>                  |
| [clearAlphaColor]     | <code>number</code>                                                                                     | <code>0x00</code>               |

<a name="GIFEncoderEncoderOptions"></a>

## GIFEncoderEncoderOptions : <code>object</code>

**Kind**: global typedef
**See**: [WriteFrameOpts](https://github.com/mattdesl/gifenc#gifwriteframeindex-width-height-opts--)
**Properties**

| Name               | Type                                            | Default            |
| ------------------ | ----------------------------------------------- | ------------------ |
| [palette]          | <code>Array.&lt;Array.&lt;number&gt;&gt;</code> |                    |
| [first]            | <code>boolean</code>                            | <code>false</code> |
| [transparent]      | <code>boolean</code>                            | <code>0</code>     |
| [transparentIndex] | <code>number</code>                             | <code>0</code>     |
| [delay]            | <code>number</code>                             | <code>0</code>     |
| [repeat]           | <code>number</code>                             | <code>0</code>     |
| [dispose]          | <code>number</code>                             | <code>-1</code>    |

<a name="H264MP4EncoderOptions"></a>

## H264MP4EncoderOptions : <code>object</code>

**Kind**: global typedef
**Properties**

| Name             | Type                                                                       | Default         |
| ---------------- | -------------------------------------------------------------------------- | --------------- |
| [debug]          | <code>boolean</code>                                                       |                 |
| [encoderOptions] | [<code>H264MP4EncoderEncoderOptions</code>](#H264MP4EncoderEncoderOptions) | <code>{}</code> |

<a name="H264MP4EncoderEncoderOptions"></a>

## H264MP4EncoderEncoderOptions : <code>module:h264-mp4-encoder~H264MP4Encoder</code>

**Kind**: global typedef
**See**: [h264-mp4-encoder#api](https://github.com/TrevorSundberg/h264-mp4-encoder#api)
<a name="MediaCaptureEncoderOptions"></a>

## MediaCaptureEncoderOptions : <code>object</code>

**Kind**: global typedef
**Properties**

| Name             | Type                                                                                 | Default         |
| ---------------- | ------------------------------------------------------------------------------------ | --------------- |
| [flushFrequency] | <code>number</code>                                                                  | <code>10</code> |
| [encoderOptions] | [<code>MediaCaptureEncoderEncoderOptions</code>](#MediaCaptureEncoderEncoderOptions) | <code>{}</code> |

<a name="MediaCaptureEncoderEncoderOptions"></a>

## MediaCaptureEncoderEncoderOptions : <code>MediaRecorderOptions</code>

**Kind**: global typedef
**See**: [MediaRecorder#options](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder#options)
<a name="MP4WasmEncoderOptions"></a>

## MP4WasmEncoderOptions : <code>object</code>

**Kind**: global typedef
**Properties**

| Name              | Type                                                                       | Default         |
| ----------------- | -------------------------------------------------------------------------- | --------------- |
| [groupOfPictures] | <code>number</code>                                                        | <code>20</code> |
| [flushFrequency]  | <code>number</code>                                                        | <code>10</code> |
| [encoderOptions]  | [<code>MP4WasmEncoderEncoderOptions</code>](#MP4WasmEncoderEncoderOptions) | <code>{}</code> |

<a name="MP4WasmEncoderEncoderOptions"></a>

## MP4WasmEncoderEncoderOptions : <code>VideoEncoderConfig</code>

**Kind**: global typedef
**See**: [VideoEncoder.configure](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/configure#config)
<a name="WebCodecsEncoderOptions"></a>

## WebCodecsEncoderOptions : <code>object</code>

**Kind**: global typedef
**Properties**

| Name              | Type                                                                           | Default         |
| ----------------- | ------------------------------------------------------------------------------ | --------------- |
| [groupOfPictures] | <code>number</code>                                                            | <code>20</code> |
| [flushFrequency]  | <code>number</code>                                                            | <code>10</code> |
| [encoderOptions]  | [<code>WebCodecsEncoderEncoderOptions</code>](#WebCodecsEncoderEncoderOptions) | <code>{}</code> |

<a name="WebCodecsEncoderEncoderOptions"></a>

## WebCodecsEncoderEncoderOptions : <code>VideoEncoderConfig</code>

**Kind**: global typedef
**See**: [VideoEncoder.configure](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/configure#config)
<a name="WebCodecsMuxerOptions"></a>

## WebCodecsMuxerOptions : <code>MuxerOptions</code>

**Kind**: global typedef
**See**

- [Mp4.MuxerOptions](https://github.com/Vanilagy/mp4-muxer/#usage)
- [WebM.MuxerOptions](https://github.com/Vanilagy/webm-muxer/#usage)

<!-- api-end -->

## License

All MIT:

- [mp4-wasm](https://github.com/mattdesl/mp4-wasm/blob/master/LICENSE.md)
- [h264-mp4-encoder](https://github.com/TrevorSundberg/h264-mp4-encoder/blob/master/LICENSE.md)
- [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/master/LICENSE)
- [gifenc](https://github.com/mattdesl/gifenc/blob/master/LICENSE.md)
- [webm-muxer](https://github.com/Vanilagy/webm-muxer/blob/main/LICENSE)
- [mp4-muxer](https://github.com/Vanilagy/mp4-muxer/blob/main/LICENSE)

MIT. See [license file](https://github.com/dmnsgn/canvas-record/blob/main/LICENSE.md).
