import { build, Plugin } from 'vite';
import { OutputChunk } from 'rollup';

const cssInjectedByJsId = '\0vite/all-css';

export async function buildCSSInjectionCode(cssToInject: string, styleId?: string): Promise<OutputChunk | null> {
    const res = await build({
        root: '',
        configFile: false,
        logLevel: 'error',
        plugins: [injectionCSSCodePlugin(cssToInject, styleId)],
        build: {
            write: false,
            target: 'es2015',
            minify: 'esbuild',
            assetsDir: '',
            rollupOptions: {
                input: {
                    ['all-css']: cssInjectedByJsId,
                },
                output: {
                    format: 'iife',
                    manualChunks: undefined,
                },
            },
        },
    });
    const _cssChunk = Array.isArray(res) ? res[0] : res;
    if (!('output' in _cssChunk)) return null;

    return _cssChunk.output[0];
}

/**
 * @param {string} cssToInject
 * @param {string|null} styleId
 * @return {Plugin}
 */
function injectionCSSCodePlugin(cssToInject: string, styleId?: string): Plugin {
    return {
        name: 'vite:inject-css',
        resolveId(id: string) {
            if (id == cssInjectedByJsId) {
                return id;
            }
        },
        load(id: string) {
            if (id == cssInjectedByJsId) {
                let cssCode = '';
                cssToInject
                    .trim()
                    .split('}')
                    .map((e) => (e += '}'))
                    .slice(0, -1)
                    .forEach((x) => {
                        cssCode += `elementStyle.sheet.insertRule(${JSON.stringify(x)});`;
                    });

                return `try{if(typeof document != 'undefined'){var elementStyle = document.createElement('style');${
                    typeof styleId == 'string' && styleId.length > 0 ? `elementStyle.id = '${styleId}';` : ''
                }elementStyle.appendChild(document.createTextNode(''));document.head.appendChild(elementStyle);${cssCode}}}catch(e){console.error('vite-inject-css', e);}`;
            }
        },
    };
}

export function removeLinkStyleSheets(html: string, cssFileName: string): string {
    const removeCSS = new RegExp(`<link rel=".*"[^>]*?href=".*/?${cssFileName}"[^>]*?>`);
    return html.replace(removeCSS, '');
}
