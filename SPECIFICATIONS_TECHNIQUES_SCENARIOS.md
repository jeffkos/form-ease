# 🔧 SPÉCIFICATIONS TECHNIQUES - Implementation Scenarios FormEase

## 📋 ARCHITECTURE MODIFICATIONS REQUISES

### 1. 🗄️ EXTENSIONS BASE DE DONNÉES

```sql
-- Extensions pour les nouveaux besoins

-- Table pour formulaires payants
ALTER TABLE forms ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE forms ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE forms ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR';
ALTER TABLE forms ADD COLUMN payment_required BOOLEAN DEFAULT FALSE;

-- Table contacts centralisée  
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  city VARCHAR(100),
  country VARCHAR(100),
  tags TEXT[],
  source_form_id INTEGER REFERENCES forms(id),
  submission_id INTEGER REFERENCES submissions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Table campagnes email
CREATE TABLE email_campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  template_id INTEGER,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sending', 'sent', 'paused'
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table tracking emails
CREATE TABLE email_tracking (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES email_campaigns(id),
  contact_id INTEGER REFERENCES contacts(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'
  tracking_id UUID UNIQUE,
  ip_address INET,
  user_agent TEXT,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  failed_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table paiements formulaires
CREATE TABLE form_payments (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES forms(id),
  submission_id INTEGER REFERENCES submissions(id),
  user_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  payment_method VARCHAR(50), -- 'stripe', 'paypal', etc.
  payment_id VARCHAR(255), -- ID externe du processeur
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table tickets support
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  category VARCHAR(100), -- 'bug', 'feature', 'billing', 'general'
  assigned_to INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_contacts_user_email ON contacts(user_id, email);
CREATE INDEX idx_email_tracking_campaign ON email_tracking(campaign_id);
CREATE INDEX idx_email_tracking_contact ON email_tracking(contact_id);
CREATE INDEX idx_form_payments_form ON form_payments(form_id);
CREATE INDEX idx_form_payments_status ON form_payments(status);
```

### 2. 🎛️ MODIFICATIONS BACKEND

#### **2.1 Nouveaux Controllers**

```javascript
// controllers/contactController.js
exports.getContacts = async (req, res) => {
  const { city, country, formId, tags } = req.query;
  const where = { user_id: req.user.id };
  
  if (city) where.city = city;
  if (country) where.country = country;
  if (formId) where.source_form_id = parseInt(formId);
  if (tags) where.tags = { hasAny: tags.split(',') };
  
  const contacts = await prisma.contact.findMany({ where });
  res.json(contacts);
};

exports.exportContacts = async (req, res) => {
  // Export CSV/Excel des contacts filtrés
};

// controllers/emailCampaignController.js
exports.createCampaign = async (req, res) => {
  const { name, subject, content, recipientIds } = req.body;
  
  const campaign = await prisma.emailCampaign.create({
    data: {
      user_id: req.user.id,
      name,
      subject,
      content,
      recipients_count: recipientIds.length
    }
  });
  
  res.json(campaign);
};

exports.sendCampaign = async (req, res) => {
  const { campaignId } = req.params;
  // Logique d'envoi avec tracking
  await sendEmailCampaign(campaignId);
  res.json({ message: 'Campagne envoyée' });
};

// controllers/formPaymentController.js
exports.createPaymentForm = async (req, res) => {
  const { formId, amount, currency = 'EUR' } = req.body;
  
  await prisma.form.update({
    where: { id: formId },
    data: { 
      is_paid: true, 
      price: amount,
      currency,
      payment_required: true 
    }
  });
  
  res.json({ message: 'Formulaire payant configuré' });
};

exports.processPayment = async (req, res) => {
  // Intégration Stripe pour traitement paiement
};
```

#### **2.2 Modifications Middleware Quotas**

```javascript
// middleware/quota.js - Extensions
const QUOTAS = {
  free: {
    forms: 1,
    submissionsPerForm: 100,
    exportsPerDay: 5,
    emailsPerMonth: 50,
    fileUpload: false,
    aiAccess: false,
    validityDays: 18
  },
  premium: {
    forms: -1, // illimité
    submissionsPerForm: -1,
    exportsPerDay: -1,
    emailsPerMonth: -1,
    fileUpload: true,
    aiAccess: true,
    validityDays: -1
  }
};

// Nouveau middleware pour vérifier expiration
exports.checkFormExpiration = async (req, res, next) => {
  if (req.user.plan === 'free') {
    const expiredForms = await prisma.form.findMany({
      where: {
        user_id: req.user.id,
        created_at: {
          lt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) // 18 jours
        }
      }
    });
    
    // Supprimer formulaires expirés
    if (expiredForms.length > 0) {
      await prisma.form.deleteMany({
        where: { id: { in: expiredForms.map(f => f.id) } }
      });
    }
  }
  next();
};

// Middleware quota emails
exports.checkEmailQuota = async (req, res, next) => {
  if (req.user.plan === 'free') {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const emailsSent = await prisma.emailTracking.count({
      where: {
        campaign: {
          user_id: req.user.id
        },
        created_at: { gte: currentMonth }
      }
    });
    
    if (emailsSent >= 50) {
      return res.status(429).json({ 
        message: 'Quota emails mensuel atteint (50/mois en plan gratuit)' 
      });
    }
  }
  next();
};
```

#### **2.3 Services Email**

```javascript
// services/emailService.js
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      // Configuration SMTP
    });
  }
  
  async sendCampaign(campaignId) {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { user: true }
    });
    
    const contacts = await this.getCampaignRecipients(campaignId);
    
    for (const contact of contacts) {
      const trackingId = uuidv4();
      
      // Créer entrée tracking
      await prisma.emailTracking.create({
        data: {
          campaign_id: campaignId,
          contact_id: contact.id,
          email: contact.email,
          status: 'sent',
          tracking_id: trackingId
        }
      });
      
      // Enrichir contenu avec pixels de tracking
      const enrichedContent = this.addTrackingPixels(
        campaign.content, 
        trackingId
      );
      
      // Envoyer email
      try {
        await this.transporter.sendMail({
          from: campaign.user.email,
          to: contact.email,
          subject: campaign.subject,
          html: enrichedContent
        });
        
        await this.updateTrackingStatus(trackingId, 'delivered');
      } catch (error) {
        await this.updateTrackingStatus(trackingId, 'failed', error.message);
      }
    }
  }
  
  addTrackingPixels(content, trackingId) {
    // Ajouter pixel de tracking pour ouverture
    const trackingPixel = `<img src="${process.env.APP_URL}/api/email/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
    
    // Remplacer liens par versions trackées
    const trackedContent = content.replace(
      /<a href="([^"]+)"/g, 
      `<a href="${process.env.APP_URL}/api/email/track/click/${trackingId}?url=$1"`
    );
    
    return trackedContent + trackingPixel;
  }
}
```

### 3. 🎨 MODIFICATIONS FRONTEND

#### **3.1 Nouveaux Composants**

```tsx
// components/ContactManager.tsx
interface Contact {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  tags: string[];
  sourceFormId: number;
}

export default function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filters, setFilters] = useState({
    city: '',
    country: '',
    formId: '',
    tags: []
  });
  
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  
  // Filtrage géographique
  const filterByLocation = (city: string, country: string) => {
    setFilters({ ...filters, city, country });
    loadContacts();
  };
  
  // Envoi email groupé
  const sendGroupEmail = async () => {
    const emailData = {
      subject: emailSubject,
      content: emailContent,
      recipients: selectedContacts
    };
    
    await fetch('/api/email/send-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Filtres géographiques */}
      <Card>
        <Title>Filtrer les contacts</Title>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Select value={filters.city} onValueChange={(city) => filterByLocation(city, filters.country)}>
            <SelectItem value="kinshasa">Kinshasa</SelectItem>
            <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
            {/* ... autres villes */}
          </Select>
          
          <Select value={filters.country} onValueChange={(country) => filterByLocation(filters.city, country)}>
            <SelectItem value="cd">RD Congo</SelectItem>
            <SelectItem value="fr">France</SelectItem>
            {/* ... autres pays */}
          </Select>
          
          <Button onClick={() => exportContacts(selectedContacts)}>
            Exporter sélection
          </Button>
        </div>
      </Card>
      
      {/* Table contacts avec sélection */}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>
                <Checkbox 
                  checked={selectedContacts.length === contacts.length}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedContacts(contacts.map(c => c.id));
                    } else {
                      setSelectedContacts([]);
                    }
                  }}
                />
              </TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Nom</TableHeaderCell>
              <TableHeaderCell>Ville</TableHeaderCell>
              <TableHeaderCell>Source</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedContacts.includes(contact.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedContacts([...selectedContacts, contact.id]);
                      } else {
                        setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.firstName} {contact.lastName}</TableCell>
                <TableCell>{contact.city}</TableCell>
                <TableCell>Formulaire #{contact.sourceFormId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {/* Actions groupées */}
      {selectedContacts.length > 0 && (
        <Card className="bg-blue-50">
          <Flex justifyContent="between" alignItems="center">
            <Text>{selectedContacts.length} contacts sélectionnés</Text>
            <div className="space-x-2">
              <Button variant="secondary" onClick={() => exportSelectedContacts()}>
                Exporter
              </Button>
              <Button onClick={() => setShowEmailModal(true)}>
                Envoyer email
              </Button>
            </div>
          </Flex>
        </Card>
      )}
    </div>
  );
}
```

```tsx
// components/EmailCampaignBuilder.tsx
export default function EmailCampaignBuilder() {
  const [campaign, setCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    recipients: []
  });
  
  const [emailStats, setEmailStats] = useState({
    sent: 0,
    opened: 0,
    clicked: 0,
    failed: 0
  });
  
  return (
    <div className="space-y-6">
      {/* Éditeur campagne */}
      <Card>
        <Title>Nouvelle campagne email</Title>
        <div className="space-y-4 mt-4">
          <TextInput
            placeholder="Nom de la campagne"
            value={campaign.name}
            onChange={(e) => setCampaign({...campaign, name: e.target.value})}
          />
          
          <TextInput
            placeholder="Objet de l'email"
            value={campaign.subject}
            onChange={(e) => setCampaign({...campaign, subject: e.target.value})}
          />
          
          <Textarea
            placeholder="Contenu de l'email (HTML supporté)"
            rows={10}
            value={campaign.content}
            onChange={(e) => setCampaign({...campaign, content: e.target.value})}
          />
          
          <Button onClick={() => saveCampaign()}>
            Enregistrer campagne
          </Button>
        </div>
      </Card>
      
      {/* Statistiques temps réel */}
      <Card>
        <Title>Statistiques de la campagne</Title>
        <Grid numItems={4} className="gap-4 mt-4">
          <Metric
            title="Envoyés"
            metric={emailStats.sent}
            color="blue"
          />
          <Metric
            title="Ouverts"
            metric={`${emailStats.opened} (${((emailStats.opened/emailStats.sent)*100).toFixed(1)}%)`}
            color="green"
          />
          <Metric
            title="Cliqués"
            metric={`${emailStats.clicked} (${((emailStats.clicked/emailStats.sent)*100).toFixed(1)}%)`}
            color="purple"
          />
          <Metric
            title="Échecs"
            metric={emailStats.failed}
            color="red"
          />
        </Grid>
      </Card>
    </div>
  );
}
```

```tsx
// components/PaymentFormSetup.tsx
export default function PaymentFormSetup({ formId }: { formId: number }) {
  const [paymentConfig, setPaymentConfig] = useState({
    enabled: false,
    amount: 0,
    currency: 'EUR',
    description: ''
  });
  
  const enablePayment = async () => {
    await fetch(`/api/forms/${formId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentConfig)
    });
  };
  
  return (
    <Card>
      <Title>Configuration paiement</Title>
      <div className="space-y-4 mt-4">
        <Switch
          checked={paymentConfig.enabled}
          onChange={(enabled) => setPaymentConfig({...paymentConfig, enabled})}
        />
        <Text>Rendre ce formulaire payant</Text>
        
        {paymentConfig.enabled && (
          <>
            <NumberInput
              placeholder="Montant"
              value={paymentConfig.amount}
              onValueChange={(amount) => setPaymentConfig({...paymentConfig, amount})}
            />
            
            <Select value={paymentConfig.currency} onValueChange={(currency) => setPaymentConfig({...paymentConfig, currency})}>
              <SelectItem value="EUR">Euro (€)</SelectItem>
              <SelectItem value="USD">Dollar ($)</SelectItem>
              <SelectItem value="XAF">Franc CFA</SelectItem>
            </Select>
            
            <Button onClick={enablePayment}>
              Activer le paiement
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
```

#### **3.2 Pages Nouvelles**

```tsx
// pages/dashboard/contacts/page.tsx
export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title>Gestion des contacts</Title>
        <Button onClick={() => setShowImportModal(true)}>
          Importer contacts
        </Button>
      </div>
      
      <ContactManager />
    </div>
  );
}

// pages/dashboard/campaigns/page.tsx 
export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title>Campagnes email</Title>
        <Button onClick={() => router.push('/dashboard/campaigns/new')}>
          Nouvelle campagne
        </Button>
      </div>
      
      <EmailCampaignList />
    </div>
  );
}

// pages/admin/support/page.tsx
export default function AdminSupportPage() {
  return (
    <div className="space-y-6">
      <Title>Tickets de support</Title>
      <SupportTicketManager />
    </div>
  );
}
```

### 4. 🔗 INTÉGRATIONS TIERCES

#### **4.1 Stripe Integration**

```javascript
// services/stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (amount, currency, formId) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe utilise les centimes
    currency,
    metadata: {
      form_id: formId
    }
  });
  
  return paymentIntent;
};

exports.confirmPayment = async (paymentIntentId) => {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === 'succeeded') {
    // Débloquer accès au formulaire
    await prisma.formPayment.create({
      data: {
        form_id: paymentIntent.metadata.form_id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        payment_id: paymentIntentId,
        status: 'completed',
        paid_at: new Date()
      }
    });
  }
  
  return paymentIntent;
};
```

### 5. 📱 NOUVELLES ROUTES API

```javascript
// routes/contacts.js
router.get('/', auth, contactController.getContacts);
router.post('/import', auth, contactController.importContacts);
router.get('/export', auth, contactController.exportContacts);
router.delete('/:id', auth, contactController.deleteContact);

// routes/campaigns.js  
router.post('/', auth, checkEmailQuota, campaignController.createCampaign);
router.post('/:id/send', auth, campaignController.sendCampaign);
router.get('/:id/stats', auth, campaignController.getCampaignStats);

// routes/payments.js
router.post('/forms/:formId/setup', auth, paymentController.setupFormPayment);
router.post('/process', paymentController.processPayment);
router.post('/webhook', paymentController.stripeWebhook);

// routes/support.js
router.post('/tickets', auth, supportController.createTicket);
router.get('/tickets', auth, supportController.getUserTickets);
router.put('/tickets/:id', auth, supportController.updateTicket);
```

## 🚀 PLAN D'IMPLÉMENTATION

### **Semaine 1-2 : Fondations**
1. ✅ Modifications base de données
2. ✅ Ajustement pricing (12€/mois)
3. ✅ Middleware quotas avancés
4. ✅ Intégration Stripe basique

### **Semaine 3-4 : Contacts & Emails**
1. ✅ Système contacts centralisé
2. ✅ Interface filtrage géographique
3. ✅ Envoi emails groupés
4. ✅ Tracking ouvertures/clics

### **Semaine 5-6 : Campagnes**
1. ✅ Builder campagnes email
2. ✅ Templates responsive
3. ✅ Analytics détaillées
4. ✅ Newsletter automatisée

### **Semaine 7-8 : Administration**
1. ✅ Système tickets support
2. ✅ Monitoring erreurs
3. ✅ Archivage automatique
4. ✅ Dashboard admin avancé

## 📊 MÉTRIQUES SUCCESS

### **KPIs Techniques**
- ✅ Temps réponse < 200ms pour filtres
- ✅ Délivrabilité emails > 95%
- ✅ Uptime > 99.9%
- ✅ Taux erreur < 0.1%

### **KPIs Business**  
- ✅ Conversion Free → Premium : 15%+
- ✅ Rétention Premium : 90%+
- ✅ NPS Score : 50+
- ✅ ARR target : 180K€ année 2

Cette architecture permettra de répondre parfaitement à vos 3 scenarios d'usage tout en maintenant la scalabilité et la performance de FormEase.
