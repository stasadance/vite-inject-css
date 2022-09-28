import { Plugin, ResolvedConfig, build } from "vite";
import { RollupOutput, OutputChunk } from "rollup";

const injectId = "\0vite/all-css";

export async function buildInjectCode(
    outputCode: string,
    resolvedConfig: ResolvedConfig
) {
    const res = await build({
        root: "",
        configFile: false,
        logLevel: "error",
        plugins: [buildPlugin(outputCode), ...resolvedConfig.plugins],
        build: {
            ...resolvedConfig.build,
            write: false,
            assetsDir: "",
            rollupOptions: {
                ...resolvedConfig.build.rollupOptions,
                input: {
                    ["all-css"]: injectId,
                },
            },
        },
    });

    const result = res as RollupOutput;
    const output = result.output as OutputChunk[];
    return output[0].code;
}

function buildPlugin(injectCode: string): Plugin {
    return {
        name: "vite:all-css",
        resolveId(id: string) {
            if (id == injectId) {
                return id;
            }
        },
        load(id: string) {
            if (id == injectId) {
                return injectCode;
            }
        },
    };
}

export function removeLinkStyleSheets(
    html: string,
    cssFileName: string
): string {
    const removeCSS = new RegExp(
        `<link rel=".*"[^>]*?href=".*/?${cssFileName}"[^>]*?>`
    );
    return html.replace(removeCSS, "");
}

export function generateInsertRules(css: string): string[] {
    return css
        .trim()
        .split("}")
        .map((e) => (e += "}"))
        .slice(0, -1)
        .map((x) =>
            x
                .trim()
                .replace(/\s\s+/g, "")
                .replace(/(\r\n|\n|\r)/gm, "")
        );
}
