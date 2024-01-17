import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve, { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import autoprefixer from "autoprefixer";
import dotenv from "dotenv";
import alias from "rollup-plugin-alias";
import nativePlugin from "rollup-plugin-natives";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import postcss from "rollup-plugin-postcss";
import svg from "rollup-plugin-svg";
import typescript from "rollup-plugin-typescript2";

dotenv.config();

export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/index.cjs",
            format: "cjs",
            exports: "default",
        },
        {
            file: "dist/index.esm.js",
            format: "esm",
        },
        {
            file: "dist/index.umd.js",
            format: "umd",
            name: "index",
        },
    ],
    watch: true,
    plugins: [
        resolve({ browser: true }),
        nodeResolve(),
        commonjs({ include: /node_modules/ }),
        builtins(),
        globals(),
        typescript({ tsconfig: "./tsconfig.json" }),
        json(),
        svg(),
        postcss({
            extensions: [".scss", ".css"],
            extract: false,
            inject: false,
            use: [["sass"]],
            plugins: [autoprefixer()],
        }),
        nativePlugin({
            copyTo: "dist/libs",
            destDir: "./libs",
            dlopen: false,
            map: (modulePath) => "filename.node",
            originTransform: (path, exists) => path,
            sourcemap: true,
            targetEsm: false,
        }),
        replace({
            preventAssignment: true,
            "process.env.PORT": process.env.PORT,
            "process.env.BASE_URL": JSON.stringify(process.env.BASE_URL),
        }),
        alias({
            entries: [
                { find: "@icons", replacement: "src/assets/icons/index" },
                { find: "@utils", replacement: "src/utils/index" },
                { find: "@services", replacement: "src/services/index" },
                { find: "@screens", replacement: "src/screens/index" },
                { find: "@style", replacement: "src/styles/" },
                { find: "@components", replacement: "src/components/" },
            ],
        }),
    ],
};
