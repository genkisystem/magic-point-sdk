# Magic Point SDK Integration

Integrate the `magic-point-sdk` into your project to utilize its features across your entire application. This guide covers installation and setup for various JavaScript frameworks using TypeScript.

##### * Just need to initialize, everything is setted up by Magic Point.

## System Requirements

Before installing `magic-point-sdk`, ensure that your operating system can run `canvas` applications. This is crucial for the proper functioning of the SDK, as it relies on canvas capabilities for rendering graphics and interactive elements.

For more detailed information on canvas support, compatibility, and troubleshooting, please visit the [node-canvas](https://github.com/Automattic/node-canvas) GitHub page. This page provides comprehensive guidance on setting up and resolving common issues related to canvas in various operating environments.

## Installation

Install the `magic-point-sdk` package via npm:

```bash
npm install magic-point-sdk
```

## Configuration Options

Define your configuration object before initializing the SDK:

```typescript
interface ConfigurationOptions {
  apiKey: string;
}
```

Replace `'your-api-key-here'` with your actual API key from Magic Point Management.

## Global Initialization

### Vanilla TypeScript or JavaScript Project

In your main file (e.g., `index.ts` or `app.ts`):

```typescript
import MagicPointSDK from 'magic-point-sdk';

const config: ConfigurationOptions = {
  apiKey: 'your-api-key-here'
};

const sdkInstance = new MagicPointSDK(config);
export default sdkInstance;
```

### React (Create React App)

In `src/index.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import MagicPointSDK from 'magic-point-sdk';

const config: ConfigurationOptions = {
  apiKey: 'your-api-key-here'
};

new MagicPointSDK(config);

ReactDOM.render(<App />, document.getElementById('root'));
```

### Vue 3 (Vite)

In `main.ts` (for Vite):

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import MagicPointSDK from 'magic-point-sdk';

const config: ConfigurationOptions = {
  apiKey: 'your-api-key-here'
};

const app = createApp(App);
new MagicPointSDK(config);
app.mount('#app');
```

### Vue 2 (Vue CLI)

In `main.ts` (for Vue CLI projects):

```typescript
import Vue from 'vue';
import App from './App.vue';
import MagicPointSDK from 'magic-point-sdk';

Vue.config.productionTip = false;

const config: ConfigurationOptions = {
  apiKey: 'your-api-key-here'
};

new MagicPointSDK(config);
new Vue({
  render: h => h(App),
}).$mount('#app');
```

### Vue 3 (Vue CLI)

In `main.ts` (for Vue CLI projects with Vue 3):

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import MagicPointSDK from 'magic-point-sdk';

const config: ConfigurationOptions = {
  apiKey: 'your-api-key-here'
};

const sdkInstance = new MagicPointSDK(config);
const app = createApp(App);
app.config.globalProperties.$sdkInstance = sdkInstance;
app.mount('#app');
```

## Usage

Once initialized, the `sdkInstance` can be accessed throughout your application.

## Support

For additional assistance or feedback, contact the Magic Point SDK support team.
