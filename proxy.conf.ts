if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    console.error('TRAQ_TOKEN is not set in the environment variables.');
  }
}
const traQToken = process.env.TRAQ_TOKEN;

const PROXY_CONFIG = {
  '/traq-api': {
    target: 'https://q.trap.jp/api/v3',
    secure: true,
    changeOrigin: true,
    pathRewrite: { '^/traq-api': '' },
    headers: {
      Authorization: `Bearer ${traQToken}`,
    },
  },
  '/api': {
    target: 'http://backend:8080',
    secure: false,
    changeOrigin: true,
    headers: {
      'X-Forwarded-User': 'traP',
    },
  },
};

module.exports = PROXY_CONFIG;
