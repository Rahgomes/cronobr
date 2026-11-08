// expo-sqlite no web roda em wasm e precisa de SharedArrayBuffer, que só existe com a página
// isolada (COOP + COEP). Em produção os mesmos cabeçalhos vêm do plugin expo-router (EAS
// Hosting, app.config.ts) e, no E2E, do e2e/serve.json.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) config.resolver.assetExts.push('wasm');

const enhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = enhance ? enhance(middleware, server) : middleware;
  return (req, res, done) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return next(req, res, done);
  };
};

module.exports = config;
