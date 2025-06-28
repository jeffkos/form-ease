// Générateur de template d’email pour FormEase
module.exports = function generateMailTemplate({ nom, langue = 'fr', logoUrl, contact, customText }) {
  const texts = {
    fr: {
      subject: 'Votre inscription a été validée',
      greeting: `Bonjour${nom ? ' ' + nom : ''},`,
      message: customText || 'Votre inscription a été validée. Merci pour votre confiance.',
      contact: 'Contact organisateur : '
    },
    en: {
      subject: 'Your registration has been approved',
      greeting: `Hello${nom ? ' ' + nom : ''},`,
      message: customText || 'Your registration has been approved. Thank you!',
      contact: 'Organizer contact: '
    }
  };
  const t = texts[langue] || texts.fr;
  return {
    subject: t.subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width:120px;display:block;margin:auto;"/>` : ''}
        <h2>${t.greeting}</h2>
        <p>${t.message}</p>
        <hr/>
        <p style="font-size:12px;color:#888;">${t.contact}${contact || ''}</p>
      </div>
    `
  };
};
