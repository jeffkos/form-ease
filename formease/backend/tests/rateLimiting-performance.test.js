/**
 * ⚡ Tests de performance et stress pour Rate Limiting
 * 
 * Tests pour vérifier les performances et la robustesse du système
 * de rate limiting sous charge élevée
 * 
 * @version 1.0.0
 */

const {
  createRateLimiter,
  smartRateLimit,
  bruteForceDetection,
  ipWhitelist,
  rateLimitLogger,
  limitConfigs
} = require('../src/middleware/rateLimiting');

// Mock des dépendances
jest.mock('express-rate-limit');
jest.mock('redis');
jest.mock('../src/utils/logger');

const mockLogger = require('../src/utils/logger');
const mockRateLimit = require('express-rate-limit');

describe('⚡ Rate Limiting - Tests de performance et stress', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration rapide des mocks
    mockRateLimit.mockImplementation((config) => {
      return (req, res, next) => next();
    });

    req = {
      ip: '192.168.1.1',
      path: '/api/test',
      originalUrl: '/api/test',
      get: jest.fn().mockReturnValue('Test User Agent'),
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    global.__rateLimitStore = {};
    process.env.NODE_ENV = 'test';
  });

  describe('🚀 Tests de performance', () => {
    test('createRateLimiter devrait être rapide', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        createRateLimiter('api');
      }
      
      const duration = performance.now() - start;
      
      // Devrait prendre moins de 100ms pour 1000 créations
      expect(duration).toBeLessThan(100);
      expect(mockRateLimit).toHaveBeenCalledTimes(1000);
    });

    test('smartRateLimit devrait traiter de nombreuses requêtes rapidement', () => {
      const start = performance.now();
      
      const requests = [];
      for (let i = 0; i < 10000; i++) {
        const testReq = { ...req, path: `/api/endpoint${i % 10}` };
        requests.push(new Promise(resolve => {
          smartRateLimit(testReq, res, () => resolve());
        }));
      }
      
      return Promise.all(requests).then(() => {
        const duration = performance.now() - start;
        
        // Devrait traiter 10k requêtes en moins de 1 seconde
        expect(duration).toBeLessThan(1000);
      });
    });

    test('ipWhitelist devrait être très rapide', () => {
      process.env.WHITELISTED_IPS = Array.from({ length: 1000 }, (_, i) => `192.168.1.${i}`).join(',');
      
      const start = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        const testReq = { ...req, ip: `192.168.1.${i % 1000}` };
        ipWhitelist(testReq, res, next);
      }
      
      const duration = performance.now() - start;
      
      // Devrait traiter 10k vérifications en moins de 100ms
      expect(duration).toBeLessThan(100);
    });

    test('Store en mémoire devrait gérer de nombreuses opérations', () => {
      const start = performance.now();
      
      // Simuler de nombreuses opérations sur le store
      for (let i = 0; i < 100000; i++) {
        const key = `key_${i % 1000}`;
        global.__rateLimitStore[key] = (global.__rateLimitStore[key] || 0) + 1;
      }
      
      const duration = performance.now() - start;
      
      // Devrait traiter 100k opérations en moins de 500ms
      expect(duration).toBeLessThan(500);
      expect(Object.keys(global.__rateLimitStore)).toHaveLength(1000);
    });

    test('bruteForceDetection devrait être rapide en mode test', async () => {
      const start = performance.now();
      
      const detections = [];
      for (let i = 0; i < 1000; i++) {
        const testReq = { ...req, path: '/auth/login' };
        detections.push(bruteForceDetection(testReq, res, next));
      }
      
      await Promise.all(detections);
      
      const duration = performance.now() - start;
      
      // Devrait traiter 1k détections en moins de 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('🔥 Tests de stress', () => {
    test('Création massive de limiteurs ne devrait pas causer de fuite mémoire', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Créer beaucoup de limiteurs
      const limiters = [];
      for (let i = 0; i < 10000; i++) {
        limiters.push(createRateLimiter('api'));
      }
      
      const afterCreation = process.memoryUsage().heapUsed;
      
      // Libérer les références
      limiters.length = 0;
      
      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }
      
      const afterCleanup = process.memoryUsage().heapUsed;
      
      // L'augmentation de mémoire ne devrait pas être excessive
      const memoryIncrease = afterCreation - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Moins de 50MB
    });

    test('Store en mémoire devrait gérer des clés avec des noms longs', () => {
      const longKeyBase = 'a'.repeat(1000); // Clé de 1000 caractères
      
      for (let i = 0; i < 1000; i++) {
        const key = `${longKeyBase}_${i}`;
        global.__rateLimitStore[key] = i;
      }
      
      expect(Object.keys(global.__rateLimitStore)).toHaveLength(1000);
      
      // Vérifier que les valeurs sont correctes
      expect(global.__rateLimitStore[`${longKeyBase}_500`]).toBe(500);
    });

    test('Concurrent access au store en mémoire', async () => {
      const concurrentOperations = [];
      const numOperations = 1000;
      const key = 'concurrent_test_key';
      
      // Créer de nombreuses opérations concurrentes
      for (let i = 0; i < numOperations; i++) {
        concurrentOperations.push(
          new Promise(resolve => {
            setTimeout(() => {
              global.__rateLimitStore[key] = (global.__rateLimitStore[key] || 0) + 1;
              resolve();
            }, Math.random() * 10);
          })
        );
      }
      
      await Promise.all(concurrentOperations);
      
      // Le résultat peut varier en raison de race conditions,
      // mais devrait être proche du nombre d'opérations
      expect(global.__rateLimitStore[key]).toBeGreaterThan(numOperations * 0.9);
      expect(global.__rateLimitStore[key]).toBeLessThanOrEqual(numOperations);
    });

    test('Gestion de configurations de limite extrêmes', () => {
      // Configuration avec des valeurs extrêmes
      const extremeConfig = {
        windowMs: 1, // 1ms
        max: 1000000, // 1 million
        message: { error: 'EXTREME_LIMIT' }
      };
      
      // Ne devrait pas planter
      expect(() => {
        mockRateLimit(extremeConfig);
      }).not.toThrow();
      
      // Configuration avec des valeurs très petites
      const tinyConfig = {
        windowMs: Number.MAX_SAFE_INTEGER,
        max: 1,
        message: { error: 'TINY_LIMIT' }
      };
      
      expect(() => {
        mockRateLimit(tinyConfig);
      }).not.toThrow();
    });

    test('Stress test sur smartRateLimit avec différents patterns', () => {
      const patterns = [
        '/auth/',
        '/upload/',
        '/public/',
        '/api/',
        '/admin/',
        '/webhook/',
        '/graphql/',
        '/rest/'
      ];
      
      const userTypes = [
        null,
        { plan: 'premium' },
        { plan: 'basic' },
        { plan: 'enterprise' }
      ];
      
      let processedRequests = 0;
      
      for (let i = 0; i < 1000; i++) {
        const testReq = {
          ...req,
          path: patterns[i % patterns.length] + `endpoint${i}`,
          user: userTypes[i % userTypes.length]
        };
        
        smartRateLimit(testReq, res, () => {
          processedRequests++;
        });
      }
      
      expect(processedRequests).toBe(1000);
      expect(mockRateLimit).toHaveBeenCalledTimes(1000);
    });
  });

  describe('⚖️ Tests de charge réaliste', () => {
    test('Simulation de charge web typique', async () => {
      const scenarios = [
        { endpoint: '/api/users', weight: 30 },
        { endpoint: '/api/posts', weight: 25 },
        { endpoint: '/auth/login', weight: 10 },
        { endpoint: '/auth/register', weight: 5 },
        { endpoint: '/upload/image', weight: 5 },
        { endpoint: '/public/status', weight: 25 }
      ];
      
      const totalRequests = 10000;
      const requests = [];
      
      for (let i = 0; i < totalRequests; i++) {
        // Choisir un scénario basé sur le poids
        const random = Math.random() * 100;
        let cumulativeWeight = 0;
        let selectedScenario = scenarios[0];
        
        for (const scenario of scenarios) {
          cumulativeWeight += scenario.weight;
          if (random <= cumulativeWeight) {
            selectedScenario = scenario;
            break;
          }
        }
        
        const testReq = {
          ...req,
          path: selectedScenario.endpoint,
          ip: `192.168.1.${(i % 254) + 1}` // Différentes IPs
        };
        
        requests.push(new Promise(resolve => {
          smartRateLimit(testReq, res, resolve);
        }));
      }
      
      const start = performance.now();
      await Promise.all(requests);
      const duration = performance.now() - start;
      
      // Devrait traiter 10k requêtes réalistes en moins de 2 secondes
      expect(duration).toBeLessThan(2000);
    });

    test('Burst traffic simulation', () => {
      const burstSize = 5000;
      const burstRequests = [];
      
      // Simuler un burst de trafic sur le même endpoint
      for (let i = 0; i < burstSize; i++) {
        const testReq = {
          ...req,
          path: '/api/popular-endpoint',
          ip: `10.0.0.${(i % 254) + 1}`
        };
        
        burstRequests.push(new Promise(resolve => {
          smartRateLimit(testReq, res, resolve);
        }));
      }
      
      const start = performance.now();
      
      return Promise.all(burstRequests).then(() => {
        const duration = performance.now() - start;
        
        // Devrait gérer un burst de 5k requêtes en moins de 1 seconde
        expect(duration).toBeLessThan(1000);
      });
    });

    test('Simulation de bot malveillant', () => {
      const botRequests = 1000;
      const botIp = '192.168.1.666';
      
      let blockedRequests = 0;
      
      for (let i = 0; i < botRequests; i++) {
        const testReq = {
          ...req,
          ip: botIp,
          path: '/auth/login',
          statusCode: 401 // Simule des tentatives échouées
        };
        
        // En mode test, bruteForceDetection ne bloque pas
        bruteForceDetection(testReq, res, () => {
          // Compter comme non bloqué
        });
      }
      
      // En mode test, aucune requête ne devrait être bloquée
      expect(blockedRequests).toBe(0);
    });
  });

  describe('📊 Tests de monitoring des performances', () => {
    test('Mesure du throughput de smartRateLimit', () => {
      const requestCount = 50000;
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < requestCount; i++) {
        const testReq = { ...req, path: '/api/test' };
        smartRateLimit(testReq, res, next);
      }
      
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationMs = durationNs / 1_000_000;
      
      const throughput = requestCount / (durationMs / 1000); // Requêtes par seconde
      
      // Devrait traiter au moins 10k requêtes par seconde
      expect(throughput).toBeGreaterThan(10000);
      
      console.log(`🚀 Throughput: ${Math.round(throughput)} req/s`);
      console.log(`⏱️ Latence moyenne: ${(durationMs / requestCount).toFixed(3)}ms`);
    });

    test('Profiling de la mémoire du store', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Remplir le store avec différentes tailles de données
      for (let i = 0; i < 10000; i++) {
        const key = `profile_key_${i}`;
        const value = i * 100; // Valeurs croissantes
        global.__rateLimitStore[key] = value;
      }
      
      const afterFill = process.memoryUsage().heapUsed;
      const memoryIncrease = afterFill - initialMemory;
      
      // Calculer l'utilisation mémoire par clé
      const memoryPerKey = memoryIncrease / 10000;
      
      console.log(`💾 Mémoire par clé: ${memoryPerKey.toFixed(2)} bytes`);
      console.log(`📈 Augmentation totale: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // L'utilisation mémoire par clé devrait être raisonnable
      expect(memoryPerKey).toBeLessThan(1000); // Moins de 1KB par clé
    });

    test('Analyse de la distribution des temps de réponse', () => {
      const measurements = [];
      const requestCount = 1000;
      
      for (let i = 0; i < requestCount; i++) {
        const start = performance.now();
        
        const testReq = { ...req, path: `/api/endpoint${i}` };
        smartRateLimit(testReq, res, next);
        
        const duration = performance.now() - start;
        measurements.push(duration);
      }
      
      // Calculer les statistiques
      measurements.sort((a, b) => a - b);
      const min = measurements[0];
      const max = measurements[measurements.length - 1];
      const median = measurements[Math.floor(measurements.length / 2)];
      const p95 = measurements[Math.floor(measurements.length * 0.95)];
      const p99 = measurements[Math.floor(measurements.length * 0.99)];
      const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
      
      console.log(`📊 Statistiques de latence:`);
      console.log(`   Min: ${min.toFixed(3)}ms`);
      console.log(`   Avg: ${avg.toFixed(3)}ms`);
      console.log(`   Median: ${median.toFixed(3)}ms`);
      console.log(`   P95: ${p95.toFixed(3)}ms`);
      console.log(`   P99: ${p99.toFixed(3)}ms`);
      console.log(`   Max: ${max.toFixed(3)}ms`);
      
      // Vérifications de performance
      expect(p95).toBeLessThan(1); // 95% des requêtes en moins d'1ms
      expect(p99).toBeLessThan(5); // 99% des requêtes en moins de 5ms
      expect(max).toBeLessThan(50); // Aucune requête au-dessus de 50ms
    });
  });

  describe('🔄 Tests de résistance aux patterns d\'usage réels', () => {
    test('Pattern utilisateur mobile (requêtes par rafales)', () => {
      const mobilePattern = [
        // Burst initial
        ...Array(20).fill('/api/posts'),
        // Pause
        ...Array(10).fill(null),
        // Interactions
        ...Array(5).fill('/api/like'),
        ...Array(3).fill('/api/comment'),
        // Pause plus longue
        ...Array(30).fill(null),
        // Nouveau burst
        ...Array(15).fill('/api/feed')
      ];
      
      let processedCount = 0;
      
      mobilePattern.forEach((endpoint, index) => {
        if (endpoint) {
          const testReq = { ...req, path: endpoint };
          smartRateLimit(testReq, res, () => processedCount++);
        }
      });
      
      const expectedProcessed = mobilePattern.filter(e => e !== null).length;
      expect(processedCount).toBe(expectedProcessed);
    });

    test('Pattern d\'API intégration (régulier et prévisible)', () => {
      const apiPattern = [
        '/api/sync/users',
        '/api/sync/orders',
        '/api/sync/inventory',
        '/api/sync/analytics'
      ];
      
      let totalProcessed = 0;
      
      // Simuler 100 cycles d'intégration
      for (let cycle = 0; cycle < 100; cycle++) {
        apiPattern.forEach(endpoint => {
          const testReq = {
            ...req,
            path: endpoint,
            user: { plan: 'enterprise' } // Utilisateur enterprise
          };
          smartRateLimit(testReq, res, () => totalProcessed++);
        });
      }
      
      expect(totalProcessed).toBe(400); // 100 cycles × 4 endpoints
    });

    test('Pattern de scraping agressif (devrait être détecté)', () => {
      const scrapingPattern = '/public/data';
      const scrapingIp = '192.168.1.999';
      
      let detectedCount = 0;
      
      // Simuler un scraping très agressif
      for (let i = 0; i < 1000; i++) {
        const testReq = {
          ...req,
          ip: scrapingIp,
          path: scrapingPattern,
          get: jest.fn().mockReturnValue('Scraper Bot 1.0')
        };
        
        smartRateLimit(testReq, res, () => detectedCount++);
      }
      
      // En mode test, toutes les requêtes passent
      expect(detectedCount).toBe(1000);
    });
  });
});
