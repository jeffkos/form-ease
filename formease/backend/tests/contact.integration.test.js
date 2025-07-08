const request = require('supertest');
const app = require('../src/app');
const JWTTestHelper = require('./helpers/jwtTestHelper');
const { mockPrisma } = require('./setup/prismaMocks');

describe('API /api/contacts', () => {
  let contactId;
  let authToken;
  let adminToken;

  beforeAll(async () => {
    // Générer des tokens valides
    authToken = JWTTestHelper.formatAuthHeader(
      JWTTestHelper.generateValidToken({ id: 1, role: 'USER' })
    );
    
    adminToken = JWTTestHelper.formatAuthHeader(
      JWTTestHelper.generateAdminToken({ id: 2, role: 'ADMIN' })
    );
  });

  beforeEach(() => {
    // Configuration spécifique des mocks pour chaque test
    mockPrisma.contact.create.mockImplementation(({ data }) => 
      Promise.resolve({ 
        id: 1, 
        ...data, 
        created_at: new Date(), 
        updated_at: new Date() 
      })
    );
  });

  it('crée un contact', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', authToken)
      .send({
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        city: 'Paris',
        country: 'France',
        tags: ['VIP', 'newsletter']
      });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('john.doe@example.com');
    contactId = res.body.id;
  });

  it('liste les contacts', async () => {
    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', authToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('met à jour un contact', async () => {
    const res = await request(app)
      .put(`/api/contacts/${contactId}`)
      .set('Authorization', authToken)
      .send({ city: 'Lyon' });
    expect(res.status).toBe(200);
    expect(res.body.city).toBe('Lyon');
  });

  it('supprime un contact', async () => {
    const res = await request(app)
      .delete(`/api/contacts/${contactId}`)
      .set('Authorization', authToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('échoue si email déjà utilisé', async () => {
    // Mock contact already exists
    mockPrisma.contact.findFirst.mockResolvedValue({
      id: 1,
      email: 'duplicate@example.com',
      first_name: 'Dup',
      last_name: 'Licate'
    });
    
    // Tentative de doublon
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', authToken)
      .send({
        email: 'duplicate@example.com',
        first_name: 'Dup',
        last_name: 'Licate',
        city: 'Paris',
        country: 'France',
        tags: ['VIP']
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('échoue si champs obligatoires manquants', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', authToken)
      .send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('échoue si email invalide', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', authToken)
      .send({
        email: 'not-an-email',
        first_name: 'Test',
        last_name: 'User',
        city: 'Paris',
        country: 'France',
        tags: ['VIP']
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('récupère un contact par ID', async () => {
    // Mock contact exists
    const mockContact = {
      id: 123,
      email: 'uniqueid@example.com',
      first_name: 'Unique',
      last_name: 'Id',
      city: 'Paris',
      country: 'France',
      tags: ['Test']
    };
    mockPrisma.contact.findUnique.mockResolvedValue(mockContact);
    
    const res = await request(app)
      .get(`/api/contacts/${mockContact.id}`)
      .set('Authorization', authToken);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('uniqueid@example.com');
  });

  it('échoue à récupérer un contact inexistant', async () => {
    const res = await request(app)
      .get('/api/contacts/999999')
      .set('Authorization', authToken);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('échoue à mettre à jour un contact inexistant', async () => {
    const res = await request(app)
      .put('/api/contacts/999999')
      .set('Authorization', authToken)
      .send({ city: 'Nowhere' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('échoue à mettre à jour un contact avec données invalides', async () => {
    // Mock contact exists
    const mockContact = {
      id: 456,
      email: 'updateinvalid@example.com',
      first_name: 'Update',
      last_name: 'Invalid',
      city: 'Paris',
      country: 'France',
      tags: ['Test']
    };
    mockPrisma.contact.findUnique.mockResolvedValue(mockContact);
    
    // Email invalide
    const res = await request(app)
      .put(`/api/contacts/${mockContact.id}`)
      .set('Authorization', authToken)
      .send({ email: 'not-an-email' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('échoue à supprimer un contact inexistant', async () => {
    const res = await request(app)
      .delete('/api/contacts/999999')
      .set('Authorization', authToken);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('refuse l’accès sans authentification (création)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({
        email: 'unauth@example.com',
        first_name: 'No',
        last_name: 'Auth',
        city: 'Paris',
        country: 'France',
        tags: ['Test']
      });
    expect(res.status).toBe(401);
  });

  it('refuse l’accès sans authentification (lecture)', async () => {
    const res = await request(app)
      .get('/api/contacts')
    expect(res.status).toBe(401);
  });

  it('refuse l’accès sans authentification (mise à jour)', async () => {
    const res = await request(app)
      .put('/api/contacts/1')
      .send({ city: 'Paris' });
    expect(res.status).toBe(401);
  });

  it('refuse l’accès sans authentification (suppression)', async () => {
    const res = await request(app)
      .delete('/api/contacts/1');
    expect(res.status).toBe(401);
  });

  it('échoue si tags n’est pas un tableau', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', authToken)
      .send({
        email: 'tagsnotarray@example.com',
        first_name: 'Tag',
        last_name: 'Error',
        city: 'Paris',
        country: 'France',
        tags: 'VIP' // Doit être un tableau
      });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('accepte la création sans champs optionnels', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('Authorization', authToken)
      .send({
        email: 'nooptionals@example.com',
        first_name: 'No',
        last_name: 'Optionals',
        tags: ['Test']
      });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('nooptionals@example.com');
  });

  it('refuse la suppression à un utilisateur non-admin', async () => {
    // Mock contact exists
    const mockContact = {
      id: 789,
      email: 'notadmin@example.com',
      first_name: 'Not',
      last_name: 'Admin',
      city: 'Paris',
      country: 'France',
      tags: ['Test']
    };
    mockPrisma.contact.findUnique.mockResolvedValue(mockContact);
    
    // Génère un token JWT simulant un utilisateur USER
    const jwt = require('jsonwebtoken');
    const userToken = 'Bearer ' + jwt.sign({ id: 123, role: 'USER' }, process.env.JWT_SECRET || 'test', { expiresIn: '1h' });
    const res = await request(app)
      .delete(`/api/contacts/${mockContact.id}`)
      .set('Authorization', userToken);
    expect(res.status).toBe(403);
  });

  it('autorise la suppression à un utilisateur admin', async () => {
    // Mock contact exists
    const mockContact = {
      id: 999,
      email: 'admincanremove@example.com',
      first_name: 'Admin',
      last_name: 'CanRemove',
      city: 'Paris',
      country: 'France',
      tags: ['Test']
    };
    mockPrisma.contact.findUnique.mockResolvedValue(mockContact);
    mockPrisma.contact.delete.mockResolvedValue(mockContact);
    
    // Génère un token JWT simulant un utilisateur ADMIN
    const jwt = require('jsonwebtoken');
    const adminToken = 'Bearer ' + jwt.sign({ id: 1, role: 'ADMIN' }, process.env.JWT_SECRET || 'test', { expiresIn: '1h' });
    const res = await request(app)
      .delete(`/api/contacts/${mockContact.id}`)
      .set('Authorization', adminToken);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
