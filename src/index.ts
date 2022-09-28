import { Plugin, ResolvedConfig } from "vite";
import { OutputAsset, OutputChunk } from "rollup";
import {
    removeLinkStyleSheets,
    generateInsertRules,
    buildInjectCode,
} from "./utils.js";

/**
 * Inject CSS via CSSStyleSheet.insertRule.
 *
 * @return {Plugin}
 */
export default function injectCSS(
    { obfuscate }: { obfuscate?: boolean } | undefined = {
        obfuscate: false,
    }
): Plugin {
    let resolvedConfig: ResolvedConfig;

    return {
        apply: "build",
        enforce: "post",
        name: "vite-inject-css",

        configResolved(config) {
            resolvedConfig = config;
        },

        async generateBundle(_, bundle) {
            const cssAssets = Object.keys(bundle).filter(
                (i) =>
                    bundle[i].type == "asset" &&
                    bundle[i].fileName.endsWith(".css")
            );

            const htmlAssets = Object.keys(bundle).filter((i) =>
                i.endsWith(".html")
            );

            const jsAssets = Object.keys(bundle).filter(
                (i) =>
                    bundle[i].type == "chunk" &&
                    bundle[i].fileName.match(/.[cm]?js$/) != null &&
                    !bundle[i].fileName.includes("polyfill")
            );

            for (const cssName of cssAssets) {
                htmlAssets.forEach((name) => {
                    const htmlChunk = bundle[name] as OutputAsset;
                    const html = htmlChunk.source as string;
                    htmlChunk.source = removeLinkStyleSheets(html, cssName);
                });

                const cssAsset = bundle[cssName] as OutputAsset;
                const cssSource = cssAsset.source as string;
                const jsAsset = bundle[jsAssets[0]] as OutputChunk;

                let outputCode = `(function() { try {`;
                outputCode += `const style = document.createElement("style");`;
                outputCode += `style.appendChild(document.createTextNode(""));`;
                outputCode += `document.head.appendChild(style);`;

                const rules = generateInsertRules(cssSource);
                if (obfuscate) {
                    const encoder = new TextEncoder();
                    outputCode += `const dec = new TextDecoder();`;
                    outputCode += `[${rules
                        .map((x) => `[${encoder.encode(x).toString()}]`)
                        .join(",")}]`;
                    outputCode += `.forEach((x) => style.sheet.insertRule(dec.decode(new Uint8Array(x))));`;
                } else {
                    outputCode += rules
                        .map(
                            (x) =>
                                `style.sheet.insertRule(${JSON.stringify(x)});`
                        )
                        .join("");
                }
                outputCode += `} catch(e) { console.log("vite-inject-css", e) } })();`;

                const injection = await buildInjectCode(
                    outputCode + jsAsset.code,
                    resolvedConfig
                );

                jsAsset.code = injection;
                delete bundle[cssName];
            }
        },
    };
}
