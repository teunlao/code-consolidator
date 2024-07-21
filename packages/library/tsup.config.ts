import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/generator.ts'],
  esbuildOptions(options) {
    options.assetNames = 'assets/[name]';
  },
  loader: {
    '.svg': 'file',
  },
  format: ['cjs', 'esm'],
  splitting: true,
  dts: true,
  sourcemap: true,
  clean: true,
});
