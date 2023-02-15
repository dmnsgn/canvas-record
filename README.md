# canvas-record

[![npm version](https://img.shields.io/npm/v/canvas-record)](https://www.npmjs.com/package/canvas-record)
[![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)](https://www.npmjs.com/package/canvas-record)
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

canvasRecorder = new Recorder(context, { name: "canvas-record-example" });

// Start and encode frame 0
await canvasRecorder.start();

// Animate to encode the rest
tick(canvasRecorder);
```

## API

Encoder comparison:

| Encoder        | Extension              | Required Web API   | WASM                     | Speed    |
| -------------- | ---------------------- | ------------------ | ------------------------ | -------- |
| `WebCodecs`    | `mp4` / `webm` / `mkv` | WebCodecs          | ✅ (embed, only for mp4) | Fast     |
| `H264MP4`      | `mp4`                  |                    | ✅ (embed)               | Medium   |
| `FFmpeg`       | `mp4` / `webm`         | SharedArrayBuffer  | ✅ (need binary path)    | Slow     |
| `GIF`          | `gif`                  | WebWorkers (wip)   | ❌                       | Fast     |
| `Frame`        | `png` / `jpg`          | File System Access | ❌                       | Fast     |
| `MediaCapture` | `mkv` / `webm`         | MediaStream        | ❌                       | Realtime |

Note:

- WebCodecs 5-10x faster than H264MP4Encoder and 20x faster than FFmpeg (it needs to mux files after writing png to virtual FS)
- FFmpeg (mp4 and webm) and WebCodecs (mp4) have a AVC maximum frame size of 9437184 pixels. That's fine until a bit more than 4K 16:9 @ 30fps. So if you need 4K Square or 8K exports, be patient with H264MP4Encoder (which probably also has the 4GB memory limit) or use Frame encoder and mux them manually with FFmpeg CLI.
- WebCodecs is embedded from [mp4-wasm](https://github.com/mattdesl/mp4-wasm/) for ease of use (FFmpeg will require `encoderOptions.corePath`)

Roadmap:

- [ ] add debug logging
- [ ] use WebWorkers for gifenc

<!-- api-start -->

## Modules

<dl>
<dt><a href="#module_index">index</a></dt>
<dd><p>Re-export Recorder, RecorderStatus, all Encoders and utils.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#Recorder">Recorder</a></dt>
<dd><p>Base Recorder class.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#onStatusChangeCb">onStatusChangeCb(RecorderStatus)</a></dt>
<dd><p>A callback to notify on the status change. To compare with RecorderStatus enum values.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#RecorderOptions">RecorderOptions</a> : <code>Object</code></dt>
<dd><p>Options for recording. All optional.</p>
</dd>
</dl>

<a name="module_index"></a>

## index

Re-export Recorder, RecorderStatus, all Encoders and utils.

<a name="Recorder"></a>

## Recorder

Base Recorder class.

**Kind**: global class
**Properties**

| Name      | Type                 | Default           | Description                                     |
| --------- | -------------------- | ----------------- | ----------------------------------------------- |
| [enabled] | <code>boolean</code> | <code>true</code> | Enable/disable pointer interaction and drawing. |

- [Recorder](#Recorder)
  - [new Recorder(context, options)](#new_Recorder_new)
  - [.start()](#Recorder+start)
  - [.step()](#Recorder+step)
  - [.stop()](#Recorder+stop)
  - [.dispose()](#Recorder+dispose)

<a name="new_Recorder_new"></a>

### new Recorder(context, options)

| Param   | Type                                             |
| ------- | ------------------------------------------------ |
| context | <code>RenderingContext</code>                    |
| options | [<code>RecorderOptions</code>](#RecorderOptions) |

<a name="Recorder+start"></a>

### recorder.start()

Start the recording by initializing and calling the initial step.

**Kind**: instance method of [<code>Recorder</code>](#Recorder)
<a name="Recorder+step"></a>

### recorder.step()

Encode a frame and increment the time and the playhead.
Calls `await canvasRecorder.stop()` when duration is reached.

**Kind**: instance method of [<code>Recorder</code>](#Recorder)
<a name="Recorder+stop"></a>

### recorder.stop()

Stop the recording and return the recorded buffer.
If options.download is set, automatically start downloading the resulting file.
Is called when duration is reached or manually.

**Kind**: instance method of [<code>Recorder</code>](#Recorder)
<a name="Recorder+dispose"></a>

### recorder.dispose()

Clean up

**Kind**: instance method of [<code>Recorder</code>](#Recorder)
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

<a name="onStatusChangeCb"></a>

## onStatusChangeCb(RecorderStatus)

A callback to notify on the status change. To compare with RecorderStatus enum values.

**Kind**: global function

| Param          | Type                | Description |
| -------------- | ------------------- | ----------- |
| RecorderStatus | <code>number</code> | the status  |

<a name="RecorderOptions"></a>

## RecorderOptions : <code>Object</code>

Options for recording. All optional.

**Kind**: global typedef
**Properties**

| Name             | Type                                               | Default                                 | Description                                                                                                             |
| ---------------- | -------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [name]           | <code>string</code>                                | <code>&quot;\&quot;\&quot;&quot;</code> | A name for the recorder, used as prefix for the default file name.                                                      |
| [filename]       | <code>string</code>                                |                                         | Overwrite the file name completely.                                                                                     |
| [duration]       | <code>number</code>                                | <code>10</code>                         | The recording duration in seconds. If set to Infinity, `await canvasRecorder.stop()` needs to be called manually.       |
| [frameRate]      | <code>number</code>                                | <code>30</code>                         | The frame rate in frame per seconds. Use `await canvasRecorder.step();` to go to the next frame.                        |
| [download]       | <code>boolean</code>                               | <code>true</code>                       | Automatically download the recording when duration is reached or when `await canvasRecorder.stop()` is manually called. |
| [extension]      | <code>boolean</code>                               | <code>&quot;mp4&quot;</code>            | Default file extension: infers which Encoder is selected.                                                               |
| [encoder]        | <code>Object</code>                                |                                         | A specific encoder. Default encoder based on options.extension: GIF > WebCodecs > H264MP4.                              |
| [encoderOptions] | <code>Object</code>                                | <code>{}</code>                         | See `src/encoders` or individual packages for a list of options.                                                        |
| [onStatusChange] | [<code>onStatusChangeCb</code>](#onStatusChangeCb) |                                         |                                                                                                                         |

<!-- api-end -->

## License

All MIT:

- [mp4-wasm](https://github.com/mattdesl/mp4-wasm/blob/master/LICENSE.md)
- [h264-mp4-encoder](https://github.com/TrevorSundberg/h264-mp4-encoder/blob/master/LICENSE.md)
- [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/master/LICENSE)
- [gifenc](https://github.com/mattdesl/gifenc/blob/master/LICENSE.md)
- [webm-muxer](https://github.com/Vanilagy/webm-muxer/blob/main/LICENSE)

MIT. See [license file](https://github.com/dmnsgn/canvas-record/blob/main/LICENSE.md).
