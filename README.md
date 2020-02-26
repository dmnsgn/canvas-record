# canvas-record [![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

[![npm version](https://badge.fury.io/js/canvas-record.svg)](https://www.npmjs.com/package/canvas-record)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A one trick pony package to record and download a video from a canvas animation.

![](https://raw.githubusercontent.com/dmnsgn/canvas-record/master/screenshot.gif)

## Installation

```bash
npm install canvas-record
```

[![NPM](https://nodei.co/npm/canvas-record.png)](https://nodei.co/npm/canvas-record/)

## Usage

```js
const createCanvasRecorder = require("canvas-record");
const createCanvasContext = require("canvas-context");

const width = 100;
const height = 100;
const { context, canvas } = createCanvasContext("2d", {
  width,
  height
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function record() {
  // Create recorder
  const canvasRecorder = createCanvasRecorder(canvas);
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

### `createCanvasRecorder(canvas, options): DOMString | Promise<Blob>`

| Option                      | Type                                                                                                                                                        | Default                                | Description                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| **canvas**                  | HTMLCanvasElement                                                                                                                                           |                                        | The canvas element                         |
| **options.filename**        | string?                                                                                                                                                     | `Recording YYYY-MM-DD at HH.MM.SS.png` | File name                                  |
| **options.frameRate**       | number?                                                                                                                                                     | 25                                     | The frame rate used by the `MediaRecorder` |
| **options.download**        | boolean?                                                                                                                                                    | true                                   | Automatically download the recording       |
| **options.recorderOptions** | See [https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#Properties](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#Properties)? | true                                   | The `MediaRecorder` options.               |

The video `MimeType` is defined by `recorderOptions.mimeType` if present or is inferred from the filename extension (mkv) for `"video/x-matroska;codecs=avc1"` and default to `"video/webm"`.

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

### `canvasRecorder.start(timeslice?: number): void`

| Option        | Type   | Default | Description                                                                                                                                                                                                                                                                                        |
| ------------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **timeslice** | number |         | The number of milliseconds to record into each Blob. If this parameter isn't included, the entire media duration is recorded into a single Blob unless the requestData() method is called to obtain the Blob and trigger the creation of a new Blob into which the media continues to be recorded. |

### `canvasRecorder.step(): void`

Only needed when there is a need to exactly to capture a canvas state at an instant `t`.

See [https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStreamTrack/requestFrame](https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStreamTrack/requestFrame).
The CanvasCaptureMediaStreamTrack method requestFrame() requests that a frame be captured from the canvas and sent to the stream. Applications that need to carefully control the timing of rendering and frame capture can use requestFrame() to directly specify when it's time to capture a frame.

To prevent automatic capture of frames, so that frames are only captured when requestFrame() is called, specify a value of 0 for the captureStream() method when creating the stream.

Notes: the technology is still a Working Draft not sure the output is guaranteed to have perfect frames.

### `canvasRecorder.stop(): Blob[] | []`

Stop the recorder which will consecutively call the `recorder.onstop` callback and download the video if not disable in the options.
Returns the Blob chunk array (or chunks if `timeslice` is specified when starting the recorder).

### `canvasRecorder.dispose(): void`

Set `recorder` and `stream` to `null` for GC.

### `canvasRecorder.recorder`

A reference to the `MediaRecorder` (see [https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)).

### `canvasRecorder.stream`

A reference to the `CanvasCaptureMediaStream` (see [https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStream](https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStream)).

## License

MIT. See [license file](https://github.com/dmnsgn/canvas-record/blob/master/LICENSE.md).
