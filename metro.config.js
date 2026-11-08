// expo-sqlite no web roda em wasm: o Metro precisa empacotar o .wasm. A API assíncrona (a única
// que o app usa) funciona sem isolamento da página; COOP/COEP só seriam exigidos pela síncrona.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) config.resolver.assetExts.push('wasm');

module.exports = config;
