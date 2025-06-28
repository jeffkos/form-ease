// Middleware de vérification Captcha (Google reCAPTCHA ou hCaptcha)
const axios = require('axios');

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET_KEY || '';
const CAPTCHA_PROVIDER = process.env.CAPTCHA_PROVIDER || 'recaptcha'; // 'recaptcha' ou 'hcaptcha'

// Désactivation temporaire du captcha pour les tests
function captchaMiddleware(req, res, next) {
  return next();
}
module.exports = captchaMiddleware;
