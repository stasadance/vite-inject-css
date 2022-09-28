# vite-inject-css

A Vite plugin that takes the CSS and injects it via JS using CSSStyleSheet.insertRule()

This was inspired by React Native's StyleSheet, the `<style>` tag injected to the header doesn't have anything inside when viewed through inspect element

## Installation

```
yarn add -D vite-inject-css
```

## Usage

```ts
import injectCSS from "vite-inject-css";

export default {
    plugins: [injectCSS()],
};
```

## Config

When you add the plugin, you can provide an optional config object.

**obfuscate**

If you want extra obfuscation of the CSS rules, with the downside of a bigger bundle size, set `obfuscate` to `true`

```ts
import injectCSS from "vite-inject-css";

export default {
    plugins: [injectCSS({ obfuscate: true })],
};
```
