// iobroker prettier configuration file
import prettierConfig from '@iobroker/eslint-config/prettier.config.mjs';

export default {
    ...prettierConfig,
    "tabWidth": 2,
    //"semi": false,
    "singleQuote": false
    // uncomment next line if you prefer double quotes
    // singleQuote: false,
}