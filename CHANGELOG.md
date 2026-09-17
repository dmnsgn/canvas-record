# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

# [6.0.0](https://github.com/dmnsgn/canvas-record/compare/v5.5.1...v6.0.0) (2026-09-17)


### Bug Fixes

* add missing estimateBitRate argument ([73386e5](https://github.com/dmnsgn/canvas-record/commit/73386e52766548194994c456cf9ad37720c54bf3))
* add missing Initialized to RecorderStatus enum ([cb32e68](https://github.com/dmnsgn/canvas-record/commit/cb32e6887ba26da8f66239817bd7d6521ad8c9be))
* await zip chunk write in FrameEncoder ([222e48f](https://github.com/dmnsgn/canvas-record/commit/222e48fc768df54814a1b2018bfafe68ff4e1536))
* remove unused start and step methods in encoders ([29d5e3f](https://github.com/dmnsgn/canvas-record/commit/29d5e3f3bd28627937f63af640d7b7e0c1290178))


### Features

* add alpha support for WebCodecs, FFmpeg and GIF encoders ([c93ac78](https://github.com/dmnsgn/canvas-record/commit/c93ac78fc065139dc8cc1a6f3490d90da40e76f7)), closes [#31](https://github.com/dmnsgn/canvas-record/issues/31)
* add onError for non-fatal errors ([54c9839](https://github.com/dmnsgn/canvas-record/commit/54c98390be01e1db7a552833e925a61827a27363))
* add support for zip in FrameEncoder ([5110922](https://github.com/dmnsgn/canvas-record/commit/5110922f6b1e918ee67895402759170b92431c8b))
* don't rely on browser's download heuristic for filename extension ([b82e635](https://github.com/dmnsgn/canvas-record/commit/b82e6350e7b1e904fa4976b3356d7b006784ea86)), closes [#34](https://github.com/dmnsgn/canvas-record/issues/34)
* enforce one capture context per source canvas when capturing a region ([dfd3513](https://github.com/dmnsgn/canvas-record/commit/dfd35132a3f44730c89c0d62952ef5a1a5006b7c))
* handle gifenc.default import ([cbc93e1](https://github.com/dmnsgn/canvas-record/commit/cbc93e1a8a97710dc28fe2395b77da518bb7bba2))
* improve downloadBlob for more FrameEncoder safety ([44a405e](https://github.com/dmnsgn/canvas-record/commit/44a405e0b456a3e319becfde61493de777be1cab))
* make all encoders dependencies dynamic imports ([f4f9b36](https://github.com/dmnsgn/canvas-record/commit/f4f9b3607e4c990c6a858d7cb2c065d851d7db9d))
* make h264-mp4-encoder a dynamic import ([361d1cf](https://github.com/dmnsgn/canvas-record/commit/361d1cf9e9881cfcdd5bd21a030c1d5ba4e44033))
* normalize imageData in getFrame for even dimensions ([f35f580](https://github.com/dmnsgn/canvas-record/commit/f35f58010e95aaad8f66e4f1e437706015b2470d))
* reset RecorderStatus on fatal error in init ([31a5cf7](https://github.com/dmnsgn/canvas-record/commit/31a5cf7dfe2d76c8dd98f7a677bb518452dc3b61))


### Performance Improvements

* simplify isWebCodecsSupported ([4496f5d](https://github.com/dmnsgn/canvas-record/commit/4496f5d4b8a7abc9f39449f3e99d5f747e93b1a5))


### BREAKING CHANGES

* GIF now correctly multiple of two
* use mediabunny VideoSampleSource instead of WebCodecs VideoEncoder
* automatically assign gifenc alpha options
* change pixelformat for FFmpeg based on alpha



## [5.5.1](https://github.com/dmnsgn/canvas-record/compare/v5.5.0...v5.5.1) (2026-03-06)


### Bug Fixes

* handle empty rect array in Recorder imagedata getFrame ([d7bb191](https://github.com/dmnsgn/canvas-record/commit/d7bb191f3d0afc5e7fbfecff87fd1694bb7a1463)), closes [#32](https://github.com/dmnsgn/canvas-record/issues/32)



# [5.5.0](https://github.com/dmnsgn/canvas-record/compare/v5.4.3...v5.5.0) (2025-10-28)


### Features

* use video codec for EncodedVideoPacketSource based on codec string ([924603f](https://github.com/dmnsgn/canvas-record/commit/924603f88a70a1187d25f0a99f2a21f3a6c0edd3)), closes [#30](https://github.com/dmnsgn/canvas-record/issues/30)



## [5.4.3](https://github.com/dmnsgn/canvas-record/compare/v5.4.2...v5.4.3) (2025-10-28)


### Bug Fixes

* use wildcard import for gifenc ([a3dc412](https://github.com/dmnsgn/canvas-record/commit/a3dc4124cd4e2bd4111ed8e79ee2087203873f6a))



## [5.4.2](https://github.com/dmnsgn/canvas-record/compare/v5.4.1...v5.4.2) (2025-10-04)


### Bug Fixes

* handle node.js support by expanding common js dependencies imports ([a4c0919](https://github.com/dmnsgn/canvas-record/commit/a4c0919e5392a51029d4253c51e15ad55734dd71))



## [5.4.1](https://github.com/dmnsgn/canvas-record/compare/v5.4.0...v5.4.1) (2025-08-01)



# [5.4.0](https://github.com/dmnsgn/canvas-record/compare/v5.3.0...v5.4.0) (2025-08-01)


### Features

* add support for mov extension in WebCodecsEncoder ([9de1c8c](https://github.com/dmnsgn/canvas-record/commit/9de1c8c2bcbe8b499ad9e1e651fac00cf31a0c33))



# [5.3.0](https://github.com/dmnsgn/canvas-record/compare/v5.2.1...v5.3.0) (2025-05-11)


### Features

* add rect option for capturing a sub-region of the canvas ([84760b5](https://github.com/dmnsgn/canvas-record/commit/84760b53887dd9f99c2e70ece4155123289e6862)), closes [#26](https://github.com/dmnsgn/canvas-record/issues/26)



## [5.2.1](https://github.com/dmnsgn/canvas-record/compare/v5.2.0...v5.2.1) (2025-05-04)


### Bug Fixes

* handle rounding values to kilobit in estimateBitRate for small resolutions ([21e7316](https://github.com/dmnsgn/canvas-record/commit/21e7316482b89640c74374cad3ad60ca10c894b0)), closes [#27](https://github.com/dmnsgn/canvas-record/issues/27)



# [5.2.0](https://github.com/dmnsgn/canvas-record/compare/v5.1.1...v5.2.0) (2025-04-10)


### Bug Fixes

* add duration option to VideoFrame ([779d550](https://github.com/dmnsgn/canvas-record/commit/779d550b051534325b26185b071af7d2223ec00b)), closes [#25](https://github.com/dmnsgn/canvas-record/issues/25)


### Features

* add frameOptions ([c95130f](https://github.com/dmnsgn/canvas-record/commit/c95130f1ff27ceb31a3b93abd5b613060001f4ba))



## [5.1.1](https://github.com/dmnsgn/canvas-record/compare/v5.1.0...v5.1.1) (2025-02-23)



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
