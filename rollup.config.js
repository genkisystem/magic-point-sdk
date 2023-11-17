import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from "autoprefixer";
import path from "path";
import genericNames from "generic-names";

const generateScopedNameDefault = genericNames(
  "[name]__[local]___[hash:base64:5]",
  {
    context: process.cwd(),
  }
);

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.cjs',
            format: 'cjs',
            exports: 'default'
        },
        {
            file: 'dist/index.esm.js',
            format: 'esm'
        },
        {
            file: 'dist/index.umd.js',
            format: 'umd',
            name: 'index'
        }
    ],
    watch: true,
    plugins: [
        commonjs(),
        typescript({ tsconfig: './tsconfig.json' }),
        nodeResolve(),
        postcss({
          extensions: [".scss", ".css"],
          extract: false,
          modules: {
            generateScopedName: (name, filename) => {
              const extension = path.extname(filename);
              if (extension === ".css") {
                // For .css files, return only the local name
                return name;
              } else {
                // Default
                return generateScopedNameDefault(name, filename);
              }
            },
          },
          autoModules: false,
          use: [["sass"]],
          plugins: [autoprefixer()],
        }),
    ],
}