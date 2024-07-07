import { copyFile } from "node:fs/promises";
import { rollup } from "rollup";
import { importMetaAssets } from "@web/rollup-plugin-import-meta-assets";

try {
  await copyFile(
    "./node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm",
    "./example/ffmpeg-core.wasm",
  );
  // await copyFile(
  //   "./node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.wasm",
  //   "./example/ffmpeg-core-mt.wasm"
  // );
  // await copyFile(
  //   "./node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.worker.js",
  //   "./example/ffmpeg-core-mt.worker.js"
  // );
} catch (error) {
  console.error(error);
}

export default {
  eslint: [
    {
      ignores: ["src/encoders/mp4.embed.js"],
    },
  ],
  dependencies: [
    "@ffmpeg/ffmpeg",
    "@ffmpeg/core",
    "@ffmpeg/core-mt",
    "@ffmpeg/util",
    "canvas-screenshot",
    "gifenc",
    "h264-mp4-encoder",
    "media-codecs",
    "mp4-muxer",
    "webm-muxer",

    "canvas-context",
    "es-module-shims",
    "tweakpane",
  ],
  // resolve: {
  //   exclude: [
  //     "**/rollup/dist/**",
  //     "**/@web/rollup-plugin-import-meta-assets/**",
  //   ],
  // },
  crossOriginIsolation: true,
  rollup: {
    extraPlugins: [
      importMetaAssets({
        include: ["**/@ffmpeg/ffmpeg/**"],
        async transform(_, assetPath) {
          // Bundle worker
          // https://github.com/rollup/rollup/issues/3842
          if (assetPath.endsWith("worker.js")) {
            const bundle = await rollup({ input: assetPath });
            const { output } = await bundle.generate({
              format: "iife",
              manualChunks: () => "_",
            });

            await bundle.close();
            return output[0].code;
          }

          return null;
        },
      }),
    ],
  },
};
