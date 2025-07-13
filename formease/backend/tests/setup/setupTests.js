// Configuration globale des mocks pour les tests
require("./prismaMocks");

// Variables de test sécurisées
global.JWT_TEST_SECRET =
  process.env.JWT_SECRET ||
  "test-jwt-secret-formease-2024-very-long-secure-key-for-testing-only";
process.env.JWT_SECRET = global.JWT_TEST_SECRET;
process.env.NODE_ENV = "test";

// Helper global pour changer l'utilisateur de test
global.setTestUser = (userData) => {
  global.testUser = userData;
};

global.resetTestUser = () => {
  global.testUser = {
    id: 1,
    email: "test@example.com",
    plan: "free",
    role: "USER",
  };
};

// Application des mocks directement
jest.mock("../../src/middleware/auth", () => {
  const mockAuth = jest.fn((req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (
      authHeader &&
      (authHeader.startsWith("Bearer ") || authHeader.length > 10)
    ) {
      req.user = global.testUser || {
        id: 1,
        email: "test@example.com",
        plan: "free",
        role: "USER",
      };
      next();
    } else {
      return res
        .status(401)
        .json({ message: "Token d'authentification manquant" });
    }
  });

  const mockRequireRole = jest.fn((requiredRole) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "Permissions insuffisantes" });
    }

    next();
  });

  return {
    __esModule: true,
    default: mockAuth,
    auth: mockAuth,
    requireRole: mockRequireRole,
  };
});

jest.mock("../../src/middleware/requireRole", () => {
  return jest.fn((requiredRole) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "Permissions insuffisantes" });
    }

    next();
  });
});

// Mock global de Winston pour éviter les logs pendant les tests
jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(), // Ajout de la méthode add manquante
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Mock global de Stripe
jest.mock("stripe", () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            payment_status: "paid",
            customer_email: "test@example.com",
            metadata: { userId: "1" },
          },
        },
      }),
    },
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
    },
  }));
});

// Mock global de SendGrid
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

// Mock global de Nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
    verify: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock global d'OpenAI
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: "Formulaire Test IA",
                    description: "Formulaire généré par IA pour test",
                    fields: [
                      { type: "text", label: "Nom", required: true },
                      { type: "email", label: "Email", required: true },
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

// Configuration globale des tests
beforeAll(async () => {
  console.log("🧪 Configuration des mocks globaux terminée");
});

afterAll(async () => {
  console.log("🧹 Nettoyage des tests terminé");
});
