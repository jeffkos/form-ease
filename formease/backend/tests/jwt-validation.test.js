const JWTTestHelper = require("./helpers/jwtTestHelper");
const jwt = require("jsonwebtoken");

describe("JWT Test Helper Validation", () => {
  test("génère un token valide", () => {
    const token = JWTTestHelper.generateValidToken();
    const decoded = jwt.verify(
      token,
      global.JWT_TEST_SECRET || process.env.JWT_SECRET
    );

    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe("test@formease.com");
    expect(decoded.role).toBe("USER");
  });

  test("génère un token admin", () => {
    const token = JWTTestHelper.generateAdminToken();
    const decoded = jwt.verify(
      token,
      global.JWT_TEST_SECRET || process.env.JWT_SECRET
    );

    expect(decoded.role).toBe("ADMIN");
  });

  test("génère un token premium", () => {
    const token = JWTTestHelper.generatePremiumToken();
    const decoded = jwt.verify(
      token,
      global.JWT_TEST_SECRET || process.env.JWT_SECRET
    );

    expect(decoded.plan).toBe("premium");
    expect(decoded.plan_expiration).toBeDefined();
  });

  test("format correct pour headers", () => {
    const token = JWTTestHelper.generateValidToken();
    const header = JWTTestHelper.formatAuthHeader(token);

    expect(header).toMatch(/^Bearer .+/);
  });

  test("token expiré détecté", () => {
    const expiredToken = JWTTestHelper.generateExpiredToken();

    expect(() => {
      jwt.verify(
        expiredToken,
        global.JWT_TEST_SECRET || process.env.JWT_SECRET
      );
    }).toThrow("jwt expired");
  });

  test("génère des utilisateurs mock corrects", () => {
    const user = JWTTestHelper.getMockUser();
    const admin = JWTTestHelper.getMockAdminUser();
    const premium = JWTTestHelper.getMockPremiumUser();

    expect(user.role).toBe("USER");
    expect(admin.role).toBe("SUPERADMIN");
    expect(premium.plan).toBe("premium");
  });
});
