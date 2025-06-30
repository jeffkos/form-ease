// Tests du middleware de validation
const { validate, validateId, schemas } = require('../src/middleware/validation');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validate function', () => {
    it('should pass valid registration data', async () => {
      req.body = {
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@test.com',
        password: 'Password123!',
        language: 'FR'
      };

      const middleware = validate('register');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid email', async () => {
      req.body = {
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'invalid-email',
        password: 'Password123!',
        language: 'FR'
      };

      const middleware = validate('register');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Données invalides',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email'
            })
          ])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject weak password', async () => {
      req.body = {
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@test.com',
        password: '123456', // Pas de majuscule, minuscule, caractère spécial
        language: 'FR'
      };

      const middleware = validate('register');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Données invalides',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password'
            })
          ])
        })
      );
    });

    it('should strip unknown fields', async () => {
      req.body = {
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@test.com',
        password: 'Password123!',
        language: 'FR',
        unknown_field: 'should be removed',
        admin: true // Tentative d'élévation de privilège
      };

      const middleware = validate('register');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).not.toHaveProperty('unknown_field');
      expect(req.body).not.toHaveProperty('admin');
    });
  });

  describe('validateId function', () => {
    it('should pass valid ID', () => {
      req.params.id = '123';

      validateId(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.params.id).toBe(123);
    });

    it('should reject invalid ID', () => {
      req.params.id = 'invalid';

      validateId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'ID invalide'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject negative ID', () => {
      req.params.id = '-1';

      validateId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject zero ID', () => {
      req.params.id = '0';

      validateId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('schemas validation', () => {
    it('should validate login schema', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const { error } = schemas.login.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should validate createForm schema', () => {
      const validData = {
        title: 'Mon formulaire',
        description: 'Description du formulaire de test',
        config: { fields: [] }
      };

      const { error } = schemas.createForm.validate(validData);
      expect(error).toBeUndefined();
    });
  });
});
