// Utilitaire de traduction multi-langue pour FormEase
const fs = require('fs');
const path = require('path');

const cache = {};

function loadLocale(lang) {
  if (cache[lang]) return cache[lang];
  try {
    const file = path.join(__dirname, '../locales', `${lang}.json`);
    const data = fs.readFileSync(file, 'utf-8');
    cache[lang] = JSON.parse(data);
    return cache[lang];
  } catch (e) {
    return {};
  }
}

function t(key, lang = 'fr', fallback = '') {
  const dict = loadLocale(lang);
  return dict[key] || fallback || key;
}

module.exports = { t };
