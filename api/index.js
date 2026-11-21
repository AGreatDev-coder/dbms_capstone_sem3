/**
 * Vercel Serverless Function Handler
 * Mounts the LIFE-LINK Central Express.js App onto Vercel Serverless infrastructure
 */

const app = require('../backend/server');

module.exports = (req, res) => {
  // Ensure CORS headers are present for serverless preflight
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Restore full path if rewritten by Vercel
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'] || req.headers['x-matched-path'];
  if (forwardedUri && forwardedUri !== '/api') {
    req.url = forwardedUri;
  }

  return app(req, res);
};
