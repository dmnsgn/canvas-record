# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

# [5.1.0](https://github.com/dmnsgn/canvas-record/compare/v5.0.1...v5.1.0) (2024-07-07)



## [5.0.1](https://github.com/dmnsgn/canvas-record/compare/v5.0.0...v5.0.1) (2024-06-10)


### Bug Fixes

* actually allow encoding to be passed by encoderOptions.codec ([16b338e](https://github.com/dmnsgn/canvas-record/commit/16b338e254974e0e7e25c6c34694caf86ccd00af))



# [5.0.0](https://github.com/dmnsgn/canvas-record/compare/v5.0.0-beta.0...v5.0.0) (2024-01-08)



# [5.0.0-beta.0](https://github.com/dmnsgn/canvas-record/compare/v4.2.0...v5.0.0-beta.0) (2023-11-04)


### Bug Fixes

* correct RecorderOptions extension type ([084a155](https://github.com/dmnsgn/canvas-record/commit/084a155f515fcff5a27b0cde73fdef40a173b96d)), closes [#12](https://github.com/dmnsgn/canvas-record/issues/12)
* framerate spelling is not following camelcase in VideoEncoder config ([f9c2662](https://github.com/dmnsgn/canvas-record/commit/f9c2662aced88880e40bff8c8ea0b690938b3235))


### Build System

* update dependencies ([66defa1](https://github.com/dmnsgn/canvas-record/commit/66defa1d1ba1acb8428f10ab4d43f556bf538b23))


### Features

* educated guess for bitrate from resolution and framerate ([acb38c5](https://github.com/dmnsgn/canvas-record/commit/acb38c56994a76263c3a66e714763ea96ef3a050)), closes [#13](https://github.com/dmnsgn/canvas-record/issues/13)


### BREAKING CHANGES

* ffmpeg has different binaries and likely to break



# [4.2.0](https://github.com/dmnsgn/canvas-record/compare/v4.1.0...v4.2.0) (2023-05-20)


### Bug Fixes

* add missing default options ([fc7c13f](https://github.com/dmnsgn/canvas-record/commit/fc7c13f9840d64691b337e4b32d36d21b10b9842))



# [4.1.0](https://github.com/dmnsgn/canvas-record/compare/v4.0.0...v4.1.0) (2023-04-30)



# [4.0.0](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-beta.0...v4.0.0) (2023-04-28)



# [4.0.0-beta.0](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.7...v4.0.0-beta.0) (2023-04-20)


### Features

* add initOnly option to startOptions ([69e0ab1](https://github.com/dmnsgn/canvas-record/commit/69e0ab1212bbf095532b7694a5fbc788a0c9f0a6))
* default avc codec to level 5.2 to allow record of at least 4096x2048@60fps ([8f956ed](https://github.com/dmnsgn/canvas-record/commit/8f956edecda9852bea54b7c28033f88a9927283b))



# [4.0.0-alpha.7](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.6...v4.0.0-alpha.7) (2023-04-19)


### Bug Fixes

* accept hvc codec identifier for hevc ([d88431d](https://github.com/dmnsgn/canvas-record/commit/d88431d7cd6ab75ac62780b19e76bac85769b338))



# [4.0.0-alpha.6](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.5...v4.0.0-alpha.6) (2023-04-16)


### Bug Fixes

* make isWebCodecsSupported return a boolean ([e8420b9](https://github.com/dmnsgn/canvas-record/commit/e8420b98da74d77449040d06af3380a78716339c))


### Features

* add mp4-muxer and move mp4-wasm to its own encoder ([0693ad0](https://github.com/dmnsgn/canvas-record/commit/0693ad0750303f51da23efe950bf68faa98b7d47))
* add support for codecs in WebCodecs encoder ([3b80a80](https://github.com/dmnsgn/canvas-record/commit/3b80a8088914fd3f0020a2f1212a9099d9c896f8))



# [4.0.0-alpha.5](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.4...v4.0.0-alpha.5) (2023-03-02)


### Features

* make frame/webcodecs encoder inherit recorder filename + keep directory reference ([d820f29](https://github.com/dmnsgn/canvas-record/commit/d820f29d6f791384828a4a9b5e717ab1968a9746))



# [4.0.0-alpha.4](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.3...v4.0.0-alpha.4) (2023-02-24)


### Features

* move filename overwrite to start options ([7f09aa5](https://github.com/dmnsgn/canvas-record/commit/7f09aa5385145802d54649777a17aa8073c23895))



# [4.0.0-alpha.3](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.2...v4.0.0-alpha.3) (2023-02-15)


### Features

* add target options to allow File System API where possible ([a98e233](https://github.com/dmnsgn/canvas-record/commit/a98e2336ae51c58db26cb2d4a19a613e03d08816))



# [4.0.0-alpha.2](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.1...v4.0.0-alpha.2) (2023-02-14)


### Features

* add support for mkv in WebCodecsEncoder ([5ea3352](https://github.com/dmnsgn/canvas-record/commit/5ea3352f74246ca07ecd2e39ad49de65cb6148e3))



# [4.0.0-alpha.1](https://github.com/dmnsgn/canvas-record/compare/v4.0.0-alpha.0...v4.0.0-alpha.1) (2023-01-20)



# [4.0.0-alpha.0](https://github.com/dmnsgn/canvas-record/compare/v3.1.0...v4.0.0-alpha.0) (2023-01-20)


### Features

* abstract into Recorder and add WebCodecs, H264MP4, GIF, Frame, MediaCapture and FFmpeg encoders ([8c8335d](https://github.com/dmnsgn/canvas-record/commit/8c8335d5cdeb6654be667e8eab3faf8e61e4f0ec))


### BREAKING CHANGES

* add encoders and refactor



# [3.1.0](https://github.com/dmnsgn/canvas-record/compare/v3.0.0...v3.1.0) (2021-10-02)


### Features

* add exports field to package.json ([f97205d](https://github.com/dmnsgn/canvas-record/commit/f97205d4338cad12ec3bdfb6e4a62525378bc037))
* add sideEffects false ([2304078](https://github.com/dmnsgn/canvas-record/commit/230407860c67cf8f0b70a4d19ac2b2ff914fe27d))



# [3.0.0](https://github.com/dmnsgn/canvas-record/compare/v2.1.0...v3.0.0) (2021-04-16)


### Code Refactoring

* use ES modules ([c2b7252](https://github.com/dmnsgn/canvas-record/commit/c2b7252e52bf6a04fcf7c9c3f8502dded74d34e1))


### BREAKING CHANGES

* switch to type module
