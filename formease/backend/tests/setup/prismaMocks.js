// Mock complet de Prisma pour les tests
const mockPrisma = {
  contact: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  
  feedback: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  
  form: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  
  $disconnect: jest.fn(),
  $connect: jest.fn()
};

// Mock du PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// Configuration par défaut des mocks
beforeEach(() => {
  // Reset des mocks
  Object.keys(mockPrisma).forEach(model => {
    if (typeof mockPrisma[model] === 'object' && mockPrisma[model] !== null) {
      Object.keys(mockPrisma[model]).forEach(method => {
        if (jest.isMockFunction(mockPrisma[model][method])) {
          mockPrisma[model][method].mockClear();
        }
      });
    }
  });

  // Configuration par défaut des retours
  mockPrisma.contact.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.contact.create.mockImplementation((data) => 
    Promise.resolve({ id: 1, ...data.data, created_at: new Date(), updated_at: new Date() })
  );
  mockPrisma.contact.findMany.mockResolvedValue([]);
  mockPrisma.contact.findUnique.mockResolvedValue(null);
  mockPrisma.contact.count.mockResolvedValue(0);
  
  mockPrisma.feedback.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.feedback.create.mockImplementation((data) => 
    Promise.resolve({ id: 1, ...data.data, created_at: new Date(), updated_at: new Date() })
  );
  
  mockPrisma.user.findUnique.mockResolvedValue({
    id: 1,
    email: 'test@formease.com',
    role: 'USER',
    plan: 'free',
    plan_expiration: null
  });
  
  mockPrisma.$disconnect.mockResolvedValue(undefined);
});

module.exports = { mockPrisma };
