import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import pkg from './package.json';
const input = ['index.js'];

export default [
  {
    // UMD
    input,
    external: ["d3"], // saying that you requiring d3-array
    plugins: [
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
      }),
      terser(),
    ],
    output: {
      file: `dist/${pkg.name}.min.js`,
      format: 'umd',
      name: 'datamations', // this is the name of the global object
      esModule: false,
      exports: 'named',
      sourcemap: true,
      globals: {d3: "d3"},
    },
  },
  // ESM and CJS
  {
    input,
    external: ["d3"],
    plugins: [nodeResolve()],
    output: [
      {
        dir: 'dist/esm',
        format: 'esm',
        exports: 'named',
        sourcemap: true,
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
    ],
  },
];