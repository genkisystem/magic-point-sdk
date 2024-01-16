
# Magic Point Software Developer Kit

Integrate the `magic-point-sdk` into your project to utilize its features across your entire application. This guide covers installation and setup for various JavaScript frameworks using TypeScript.

##### * Just need to initialize, everything is setted up by Magic Point.

## Installation

Install the `magic-point-sdk` using npm, run the following command:

```bash
npm install magic-point-sdk
```

## Usage
To use `magic-point-sdk` add following lines of code into your entry file (index.js/ts, main.js/ts, ...)
```javascript
/// your imports
import MagicPoint from './magic-point-sdk'

/// your code
new MagicPoint({apiKey: 'your-api-key-here'}) //Replaced `'your-api-key-here'` with your actual API key from Magic Point Management.
```

# Code Example
```javascript
import MagicPoint from './magic-point-sdk'
new MagicPoint({apiKey: 'generate-on-management-page',
                lng: "en",
                breakpoints: {
                    aKeyName: 120,
                    anotherKeyName: 576,
                    ...,
                    andSoOn: 1200
                }})
```

## Options
| <b>key</b>  | <b>type</b> | <b>default</b>                                   | <b>values</b> | <b>note</b>                                             |
| ----------- | ----------- | ------------------------------------------------ | ------------- | ------------------------------------------------------- |
| apiKey      | string      | ''                                               |               | Generate on Management Page                             |
| lng         | string      | "en"                                             | "en", "ja"    |                                                         |
| breakpoints | object:     | {sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1400} | {key: number} | Key name and value (number) is up to you, no restricted |



