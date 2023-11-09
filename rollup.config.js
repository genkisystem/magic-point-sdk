import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';

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
            extract: false,
            modules: true,
            use: ['sass'],
        })
    ],
}