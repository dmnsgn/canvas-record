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

A one trick pony package to record and download a video from a canvas animation.

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
import canvasRecord from "canvas-record";
import canvasContext from "canvas-context";

const width = 100;
const height = 100;
const { context, canvas } = canvasContext("2d", {
  width,
  height,
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function record() {
  // Create recorder
  const canvasRecorder = canvasRecord(canvas);
  canvasRecorder.start();

  // Start canvas animation
  animate();

  // Let it run for 2 seconds
  await sleep(2000);

  // Stop and dispose
  canvasRecorder.stop();
  canvasRecorder.dispose();
}

record();
```

## API

<!-- api-start -->

## Modules

<dl>
<dt><a href="#module_canvasRecord">canvasRecord</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#CanvasRecordOptions">CanvasRecordOptions</a> : <code>Object</code></dt>
<dd><p>Options for canvas creation. All optional.</p>
</dd>
</dl>

<a name="module_canvasRecord"></a>

## canvasRecord

- [canvasRecord](#module_canvasRecord)
  - [canvasRecord(canvas, [options])](#exp_module_canvasRecord--canvasRecord) ⇒ <code>Object</code> ⏏
    - [~filename](#module_canvasRecord--canvasRecord..filename)
    - [~stream](#module_canvasRecord--canvasRecord..stream)
    - [~recorder](#module_canvasRecord--canvasRecord..recorder)
    - [~start([timeslice])](#module_canvasRecord--canvasRecord..start)
    - [~step()](#module_canvasRecord--canvasRecord..step)
    - [~stop()](#module_canvasRecord--canvasRecord..stop) ⇒ <code>Array.&lt;Blob&gt;</code> \| <code>Array</code>
    - [~dispose()](#module_canvasRecord--canvasRecord..dispose)

<a name="exp_module_canvasRecord--canvasRecord"></a>

### canvasRecord(canvas, [options]) ⇒ <code>Object</code> ⏏

**Kind**: Exported function  
**Returns**: <code>Object</code> - The video `MimeType` is defined by `recorderOptions.mimeType` if present or is inferred from the filename extension (mkv) for `"video/x-matroska;codecs=avc1"` and default to `"video/webm"`.  
**See**: [MediaRecorder#Properties](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#Properties)

```js
// Currently supported by Chrome
MediaRecorder.isTypeSupported("video/x-matroska;codecs=avc1");
MediaRecorder.isTypeSupported("video/webm");
MediaRecorder.isTypeSupported("video/webm;codecs=vp8");
MediaRecorder.isTypeSupported("video/webm;codecs=vp9");
MediaRecorder.isTypeSupported("video/webm;codecs=vp8.0");
MediaRecorder.isTypeSupported("video/webm;codecs=vp9.0");
MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus");
MediaRecorder.isTypeSupported("video/webm;codecs=vp8,pcm");
MediaRecorder.isTypeSupported("video/WEBM;codecs=VP8,OPUS");
MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus");
MediaRecorder.isTypeSupported("video/webm;codecs=vp8,vp9,opus");
```

| Param     | Type                                                     | Default         | Description        |
| --------- | -------------------------------------------------------- | --------------- | ------------------ |
| canvas    | <code>HTMLCanvasElement</code>                           |                 | The canvas element |
| [options] | [<code>CanvasRecordOptions</code>](#CanvasRecordOptions) | <code>{}</code> |                    |

<a name="module_canvasRecord--canvasRecord..filename"></a>

#### canvasRecord~filename

Update the filename. Useful when recording several videovideos.

**Kind**: inner property of [<code>canvasRecord</code>](#exp_module_canvasRecord--canvasRecord)  
<a name="module_canvasRecord--canvasRecord..stream"></a>

#### canvasRecord~stream

A reference to the `CanvasCaptureMediaStream`

**Kind**: inner property of [<code>canvasRecord</code>](#exp_module_canvasRecord--canvasRecord)  
**See**: [MDN CanvasCaptureMediaStream](https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStream)  
<a name="module_canvasRecord--canvasRecord..recorder"></a>

#### canvasRecord~recorder

A reference to the `MediaRecorder`.

**Kind**: inner property of [<code>canvasRecord</code>](#exp_module_canvasRecord--canvasRecord)  
**See**: [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)  
<a name="module_canvasRecord--canvasRecord..start"></a>

#### canvasRecord~start([timeslice])

Start recording.

**Kind**: inner method of [<code>canvasRecord</code>](#exp_module_canvasRecord--canvasRecord)

| Param       | Type                | Description                                                                                                                                                                                                                                                                                        |
| ----------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [timeslice] | <code>number</code> | The number of milliseconds to record into each Blob. If this parameter isn't included, the entire media duration is recorded into a single Blob unless the requestData() method is called to obtain the Blob and trigger the creation of a new Blob into which the media continues to be recorded. |

<a name="module_canvasRecord--canvasRecord..step"></a>

#### canvasRecord~step()

Only needed when there is a need to exactly to capture a canvas state at an instant `t`.

**Kind**: inner method of [<code>canvasRecord</code>](#exp_module_canvasRecord--canvasRecord)  
**See**: [MDN CanvasCaptureMediaStreamTrack/requestFrame](https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStreamTrack/requestFrame)
The CanvasCaptureMediaStreamTrack method requestFrame() requests that a frame be captured from the canvas and sent to the stream. Applications that need to carefully control the timing of rendering and frame capture can use requestFrame() to directly specify when it's time to capture a frame.
To prevent automatic capture of frames, so that frames are only captured when requestFrame() is called, specify a value of 0 for the captureStream() method when creating the stream.

Notes: the technology is still a Working Draft not sure the output is guaranteed to have perfect frames.  
<a name="module_canvasRecord--canvasRecord..stop"></a>

#### canvasRecord~stop() ⇒ <code>Array.&lt;Blob&gt;</code> \| <code>Array</code>

Stop the recorder which will consecutively call the `recorder.onstop` callback and download the video if not disable in the options.

**Kind**: inner method of [<code>canvasRecord</code>](#exp_module_canvasRecord--canvasRecord)  
**Returns**: <code>Array.&lt;Blob&gt;</code> \| <code>Array</code> - Returns the Blob chunk array (or chunks if `timeslice` is specified when starting the recorder).  
<a name="module_canvasRecord--canvasRecord..dispose"></a>

#### canvasRecord~dispose()

Set `recorder` and `stream` to `null` for GC.

**Kind**: inner method of [<code>canvasRecord</code>](#exp_module_canvasRecord--canvasRecord)  
<a name="CanvasRecordOptions"></a>

## CanvasRecordOptions : <code>Object</code>

Options for canvas creation. All optional.

**Kind**: global typedef  
**Properties**

| Name              | Type                 | Default                                                                 | Description                                 |
| ----------------- | -------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| [filename]        | <code>string</code>  | <code>&quot;Recording YYYY-MM-DD at HH.MM.SS.png&quot;</code>           | File name.                                  |
| [frameRate]       | <code>number</code>  | <code>25</code>                                                         | The frame rate used by the `MediaRecorder`. |
| [download]        | <code>boolean</code> | <code>true</code>                                                       | Automatically download the recording.       |
| [recorderOptions] | <code>Object</code>  | <code>{audioBitsPerSecond: 128000, videoBitsPerSecond: 2500000 }</code> | The `MediaRecorder` options.                |

<!-- api-end -->

## License

MIT. See [license file](https://github.com/dmnsgn/canvas-record/blob/main/LICENSE.md).
