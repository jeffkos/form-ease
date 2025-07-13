// Mock complet et robuste de Prisma pour les tests
const mockPrisma = {
  // Modèle Contact
  contact: {
    create: jest.fn().mockResolvedValue({ id: 1, email: "test@example.com" }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, email: "test@example.com" }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, email: "test@example.com" }),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _count: 0, _sum: { amount: 0 } }),
  },

  // Modèle Feedback
  feedback: {
    create: jest.fn().mockResolvedValue({ id: 1, message: "Test feedback" }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, message: "Test feedback" }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, message: "Test feedback" }),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _count: 0, _sum: { rating: 0 } }),
  },

  // Modèle User
  user: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 1, email: "test@example.com", plan: "free" }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest
      .fn()
      .mockResolvedValue({ id: 1, email: "test@example.com", plan: "free" }),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest
      .fn()
      .mockResolvedValue({ id: 1, email: "test@example.com", plan: "premium" }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(1),
    upsert: jest.fn().mockResolvedValue({ id: 1, email: "test@example.com" }),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _count: 1, _sum: { id: 1 } }),
  },

  // Modèle Form
  form: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 1, title: "Test Form", user_id: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue({
      id: 1,
      title: "Test Form",
      user_id: 1,
      status: "active",
      user: { id: 1, plan: "free" },
      created_at: new Date(),
    }),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, title: "Updated Form" }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, title: "Test Form" }),
    groupBy: jest.fn().mockResolvedValue([]),
  },

  // Modèle Submission
  submission: {
    create: jest.fn().mockResolvedValue({ id: 1, form_id: 1, data: {} }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, form_id: 1 }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, form_id: 1 }),
    groupBy: jest.fn().mockResolvedValue([]),
  },

  // Modèle Payment
  payment: {
    create: jest.fn().mockResolvedValue({ id: 1, user_id: 1, amount: 1200 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, status: "completed" }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, user_id: 1 }),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _count: 0, _sum: { amount: 0 } }),
  },

  // Modèle EmailCampaign
  emailCampaign: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 1, user_id: 1, subject: "Test Campaign" }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, status: "sent" }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, user_id: 1 }),
    groupBy: jest.fn().mockResolvedValue([]),
  },

  // Modèle EmailTracking
  emailTracking: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 1, campaign_id: 1, contact_id: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, status: "opened" }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, campaign_id: 1 }),
    groupBy: jest.fn().mockResolvedValue([]),
  },

  // Modèle EmailTrack (si différent)
  emailTrack: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      recipientEmail: "test@example.com",
    }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, status: "delivered" }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, userId: 1 }),
    groupBy: jest.fn().mockResolvedValue([]),
  },

  // Modèle EmailTemplate
  emailTemplate: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 1, name: "Test Template", type: "validation" }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue({
      id: 1,
      type: "validation",
      subject: "Test Subject {{nom}}",
      html: "<p>Hello {{nom}}</p>",
      language: "fr",
      active: true,
    }),
    update: jest.fn().mockResolvedValue({ id: 1, active: false }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, name: "Test Template" }),
    groupBy: jest.fn().mockResolvedValue([]),
  },

  // Modèles supplémentaires pour Sprint 2
  exportLog: {
    create: jest.fn().mockResolvedValue({ id: 1, user_id: 1, type: "csv" }),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },

  emailLog: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 1, user_id: 1, recipient: "test@example.com" }),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },

  formPayment: {
    create: jest.fn().mockResolvedValue({ id: 1, form_id: 1, enabled: true }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 1, enabled: false }),
    upsert: jest
      .fn()
      .mockResolvedValue({ id: 1, form_id: 1, enabled: true, amount: 25.0 }),
  },

  formPaymentTransaction: {
    create: jest
      .fn()
      .mockResolvedValue({ id: 1, form_payment_id: 1, amount: 1000 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 }, _count: 0 }),
  },

  // Modèle Coupon
  coupon: {
    create: jest.fn().mockResolvedValue({
      id: 1,
      code: "TEST20",
      discount_type: "percentage",
      discount_value: 20,
    }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    update: jest
      .fn()
      .mockResolvedValue({ id: 1, code: "TEST20", is_active: false }),
    delete: jest.fn().mockResolvedValue({ id: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    upsert: jest.fn().mockResolvedValue({ id: 1, code: "TEST20" }),
    groupBy: jest.fn().mockResolvedValue([]),
    aggregate: jest
      .fn()
      .mockResolvedValue({ _sum: { discount_value: 0 }, _count: 0 }),
  },

  // Modèle CouponUsage
  couponUsage: {
    create: jest.fn().mockResolvedValue({ id: 1, coupon_id: 1, user_id: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({ _count: 0, _sum: { amount: 0 } }),
  },

  // Méthodes de transaction
  $transaction: jest
    .fn()
    .mockImplementation((callback) => callback(mockPrisma)),
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $queryRaw: jest.fn().mockResolvedValue([]),
  $executeRaw: jest.fn().mockResolvedValue(0),
};

// Mock du PrismaClient
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Configuration du mock global
global.mockPrisma = mockPrisma;

// Configuration par défaut des mocks
beforeEach(() => {
  // Reset des mocks
  Object.keys(mockPrisma).forEach((model) => {
    if (typeof mockPrisma[model] === "object" && mockPrisma[model] !== null) {
      Object.keys(mockPrisma[model]).forEach((method) => {
        if (jest.isMockFunction(mockPrisma[model][method])) {
          mockPrisma[model][method].mockClear();
        }
      });
    }
  });

  // Configuration par défaut des retours
  mockPrisma.contact.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.contact.create.mockImplementation((data) =>
    Promise.resolve({
      id: 1,
      ...data.data,
      created_at: new Date(),
      updated_at: new Date(),
    })
  );
  mockPrisma.contact.findMany.mockResolvedValue([]);
  mockPrisma.contact.findUnique.mockResolvedValue(null);
  mockPrisma.contact.count.mockResolvedValue(0);

  mockPrisma.feedback.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.feedback.create.mockImplementation((data) =>
    Promise.resolve({
      id: 1,
      ...data.data,
      created_at: new Date(),
      updated_at: new Date(),
    })
  );

  mockPrisma.user.findUnique.mockResolvedValue({
    id: 1,
    email: "test@formease.com",
    role: "USER",
    plan: "free",
    plan_expiration: null,
  });

  mockPrisma.$disconnect.mockResolvedValue(undefined);
});

module.exports = { mockPrisma };

console.log("📦 Mocks Prisma configurés avec succès");
