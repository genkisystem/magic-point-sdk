import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve, { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import autoprefixer from "autoprefixer";
import dotenv from "dotenv";
import genericNames from "generic-names";
import path from "path";
import nativePlugin from "rollup-plugin-natives";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import postcss from "rollup-plugin-postcss";
import svg from "rollup-plugin-svg";
import typescript from "rollup-plugin-typescript2";
dotenv.config();

const generateScopedNameDefault = genericNames(
    "[name]__[local]___[hash:base64:5]",
    {
        context: process.cwd(),
    }
);

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
        svg({}),
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
        }),
    ],
};
