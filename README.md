# canvas-record

[![npm version](https://img.shields.io/npm/v/canvas-record)](https://www.npmjs.com/package/canvas-record)
[![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)](https://www.npmjs.com/package/canvas-record)
[![npm minzipped size](https://img.shields.io/bundlephobia/minzip/canvas-record)](https://www.npmjs.com/package/canvas-record)
[![dependencies](https://img.shields.io/david/dmnsgn/canvas-record)](https://github.com/dmnsgn/canvas-record/blob/main/package.json)
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

Auto-generated API content.

<!-- api-end -->

## License

MIT. See [license file](https://github.com/dmnsgn/canvas-record/blob/main/LICENSE.md).
