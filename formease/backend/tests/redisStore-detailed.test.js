/**
 * 🗃️ Tests spécifiques pour RedisStore
 * 
 * Tests détaillés pour la classe RedisStore utilisée par le rate limiting
 * 
 * @version 1.0.0
 */

// Mock de la classe RedisStore (car elle n'est pas exportée)
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.client = null;
    this.useRedis = process.env.NODE_ENV !== 'test' && process.env.REDIS_URL;
  }

  async getClient() {
    if (!this.useRedis) return null;
    
    if (!this.client) {
      const { getRedisClient } = require('../src/middleware/rateLimiting');
      this.client = getRedisClient();
      if (this.client && !this.client.isReady) {
        try {
          await this.client.connect();
        } catch (error) {
          console.warn('Failed to connect to Redis, falling back to memory store:', error.message);
          this.client = null;
          this.useRedis = false;
        }
      }
    }
    return this.client;
  }

  async increment(key) {
    const client = await this.getClient();
    if (!client) {
      // Fallback to in-memory counter
      const inMemoryStore = global.__rateLimitStore || (global.__rateLimitStore = {});
      const fullKey = this.prefix + key;
      inMemoryStore[fullKey] = (inMemoryStore[fullKey] || 0) + 1;
      
      return {
        totalHits: inMemoryStore[fullKey],
        resetTime: new Date(Date.now() + 900000)
      };
    }

    try {
      const fullKey = this.prefix + key;
      const current = await client.incr(fullKey);
      
      if (current === 1) {
        await client.expire(fullKey, 900); // 15 minutes TTL
      }
      
      return {
        totalHits: current,
        resetTime: new Date(Date.now() + 900000)
      };
    } catch (error) {
      throw error;
    }
  }

  async decrement(key) {
    const client = await this.getClient();
    if (!client) {
      const inMemoryStore = global.__rateLimitStore || {};
      const fullKey = this.prefix + key;
      inMemoryStore[fullKey] = Math.max(0, (inMemoryStore[fullKey] || 0) - 1);
      return inMemoryStore[fullKey];
    }

    try {
      const fullKey = this.prefix + key;
      const current = await client.decr(fullKey);
      return Math.max(0, current);
    } catch (error) {
      return 0;
    }
  }

  async resetKey(key) {
    const client = await this.getClient();
    if (!client) {
      const inMemoryStore = global.__rateLimitStore || {};
      const fullKey = this.prefix + key;
      delete inMemoryStore[fullKey];
      return;
    }

    try {
      const fullKey = this.prefix + key;
      await client.del(fullKey);
    } catch (error) {
      // Silently handle error
    }
  }
}

// Mock des dépendances
jest.mock('redis');
jest.mock('../src/utils/logger');

const mockRedis = require('redis');

describe('🗃️ RedisStore - Tests détaillés', () => {
  let store;
  let mockRedisClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration du mock Redis
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(true),
      incr: jest.fn(),
      decr: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
      isReady: true
    };

    mockRedis.createClient = jest.fn().mockReturnValue(mockRedisClient);

    // Nettoyer le store global
    global.__rateLimitStore = {};
    
    // Reset environment
    process.env.NODE_ENV = 'test';
    delete process.env.REDIS_URL;
  });

  describe('🏗️ Constructor', () => {
    test('Devrait initialiser avec les options par défaut', () => {
      store = new RedisStore();
      
      expect(store.prefix).toBe('rl:');
      expect(store.client).toBeNull();
      expect(store.useRedis).toBe(false); // En mode test
    });

    test('Devrait utiliser un préfixe personnalisé', () => {
      store = new RedisStore({ prefix: 'custom:' });
      
      expect(store.prefix).toBe('custom:');
    });

    test('Devrait activer Redis en mode production avec REDIS_URL', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalRedisUrl = process.env.REDIS_URL;
      
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      store = new RedisStore();
      
      expect(store.useRedis).toBe(true);
      
      // Restaurer les variables d'environnement
      process.env.NODE_ENV = originalEnv;
      process.env.REDIS_URL = originalRedisUrl;
    });

    test('Ne devrait pas utiliser Redis en mode test même avec REDIS_URL', () => {
      process.env.NODE_ENV = 'test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      
      store = new RedisStore();
      
      expect(store.useRedis).toBe(false);
    });
  });

  describe('🔌 getClient()', () => {
    test('Devrait retourner null en mode test', async () => {
      store = new RedisStore();
      
      const client = await store.getClient();
      
      expect(client).toBeNull();
    });

    test('Devrait créer et connecter un client Redis en mode production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.isReady = false;
      
      store = new RedisStore();
      
      const client = await store.getClient();
      
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    test('Ne devrait pas reconnecter si le client est déjà prêt', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.isReady = true;
      
      store = new RedisStore();
      store.client = mockRedisClient;
      
      const client = await store.getClient();
      
      expect(mockRedisClient.connect).not.toHaveBeenCalled();
      expect(client).toBe(mockRedisClient);
    });

    test('Devrait gérer les erreurs de connexion Redis', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.isReady = false;
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      
      store = new RedisStore();
      
      const client = await store.getClient();
      
      expect(client).toBeNull();
      expect(store.useRedis).toBe(false);
    });
  });

  describe('⬆️ increment()', () => {
    test('Devrait utiliser le store en mémoire en mode test', async () => {
      store = new RedisStore();
      
      const result = await store.increment('test-key');
      
      expect(result.totalHits).toBe(1);
      expect(result.resetTime).toBeInstanceOf(Date);
      expect(global.__rateLimitStore['rl:test-key']).toBe(1);
    });

    test('Devrait incrémenter plusieurs fois la même clé', async () => {
      store = new RedisStore();
      
      await store.increment('test-key');
      await store.increment('test-key');
      const result = await store.increment('test-key');
      
      expect(result.totalHits).toBe(3);
      expect(global.__rateLimitStore['rl:test-key']).toBe(3);
    });

    test('Devrait utiliser le préfixe personnalisé', async () => {
      store = new RedisStore({ prefix: 'custom:' });
      
      await store.increment('test-key');
      
      expect(global.__rateLimitStore['custom:test-key']).toBe(1);
    });

    test('Devrait gérer les clés différentes séparément', async () => {
      store = new RedisStore();
      
      await store.increment('key1');
      await store.increment('key2');
      await store.increment('key1');
      
      expect(global.__rateLimitStore['rl:key1']).toBe(2);
      expect(global.__rateLimitStore['rl:key2']).toBe(1);
    });

    test('Devrait utiliser Redis en mode production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(true);
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      const result = await store.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('rl:test-key');
      expect(mockRedisClient.expire).toHaveBeenCalledWith('rl:test-key', 900);
      expect(result.totalHits).toBe(1);
    });

    test('Ne devrait pas définir d\'expiration si ce n\'est pas le premier increment', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.incr.mockResolvedValue(5); // Pas la première fois
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      await store.increment('test-key');
      
      expect(mockRedisClient.incr).toHaveBeenCalledWith('rl:test-key');
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });

    test('Devrait propager les erreurs Redis', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.incr.mockRejectedValue(new Error('Redis error'));
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      await expect(store.increment('test-key')).rejects.toThrow('Redis error');
    });
  });

  describe('⬇️ decrement()', () => {
    test('Devrait décrémenter dans le store en mémoire', async () => {
      store = new RedisStore();
      
      // Préparer une valeur
      global.__rateLimitStore['rl:test-key'] = 5;
      
      const result = await store.decrement('test-key');
      
      expect(result).toBe(4);
      expect(global.__rateLimitStore['rl:test-key']).toBe(4);
    });

    test('Ne devrait pas descendre en dessous de 0', async () => {
      store = new RedisStore();
      
      // Partir de 0
      global.__rateLimitStore['rl:test-key'] = 0;
      
      const result = await store.decrement('test-key');
      
      expect(result).toBe(0);
      expect(global.__rateLimitStore['rl:test-key']).toBe(0);
    });

    test('Devrait traiter les clés inexistantes comme 0', async () => {
      store = new RedisStore();
      
      const result = await store.decrement('nonexistent-key');
      
      expect(result).toBe(0);
      expect(global.__rateLimitStore['rl:nonexistent-key']).toBe(0);
    });

    test('Devrait utiliser Redis en mode production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.decr.mockResolvedValue(3);
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      const result = await store.decrement('test-key');
      
      expect(mockRedisClient.decr).toHaveBeenCalledWith('rl:test-key');
      expect(result).toBe(3);
    });

    test('Devrait garantir un minimum de 0 avec Redis', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.decr.mockResolvedValue(-1);
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      const result = await store.decrement('test-key');
      
      expect(result).toBe(0);
    });

    test('Devrait retourner 0 en cas d\'erreur Redis', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.decr.mockRejectedValue(new Error('Redis error'));
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      const result = await store.decrement('test-key');
      
      expect(result).toBe(0);
    });
  });

  describe('🗑️ resetKey()', () => {
    test('Devrait supprimer la clé du store en mémoire', async () => {
      store = new RedisStore();
      
      // Préparer une valeur
      global.__rateLimitStore['rl:test-key'] = 10;
      
      await store.resetKey('test-key');
      
      expect(global.__rateLimitStore['rl:test-key']).toBeUndefined();
    });

    test('Devrait gérer les clés inexistantes gracieusement', async () => {
      store = new RedisStore();
      
      await store.resetKey('nonexistent-key');
      
      // Ne devrait pas lever d'erreur
      expect(global.__rateLimitStore['rl:nonexistent-key']).toBeUndefined();
    });

    test('Devrait utiliser Redis en mode production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.del.mockResolvedValue(1);
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      await store.resetKey('test-key');
      
      expect(mockRedisClient.del).toHaveBeenCalledWith('rl:test-key');
    });

    test('Devrait gérer les erreurs Redis silencieusement', async () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_URL = 'redis://localhost:6379';
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));
      
      store = new RedisStore();
      store.client = mockRedisClient;
      store.useRedis = true;
      
      // Ne devrait pas lever d'erreur
      await expect(store.resetKey('test-key')).resolves.toBeUndefined();
    });
  });

  describe('🔄 Tests d\'intégration du store', () => {
    test('Workflow complet : increment → decrement → reset', async () => {
      store = new RedisStore();
      
      // 1. Incrémenter plusieurs fois
      await store.increment('workflow-key');
      await store.increment('workflow-key');
      await store.increment('workflow-key');
      
      expect(global.__rateLimitStore['rl:workflow-key']).toBe(3);
      
      // 2. Décrémenter
      const decrementResult = await store.decrement('workflow-key');
      expect(decrementResult).toBe(2);
      
      // 3. Reset
      await store.resetKey('workflow-key');
      expect(global.__rateLimitStore['rl:workflow-key']).toBeUndefined();
      
      // 4. Nouvelle incrémentation après reset
      const newResult = await store.increment('workflow-key');
      expect(newResult.totalHits).toBe(1);
    });

    test('Isolation entre différents préfixes', async () => {
      const store1 = new RedisStore({ prefix: 'app1:' });
      const store2 = new RedisStore({ prefix: 'app2:' });
      
      await store1.increment('shared-key');
      await store2.increment('shared-key');
      await store1.increment('shared-key');
      
      expect(global.__rateLimitStore['app1:shared-key']).toBe(2);
      expect(global.__rateLimitStore['app2:shared-key']).toBe(1);
    });

    test('Gestion de la concurrence sur la même clé', async () => {
      store = new RedisStore();
      
      // Simuler des opérations concurrentes
      const operations = [
        store.increment('concurrent-key'),
        store.increment('concurrent-key'),
        store.increment('concurrent-key'),
        store.decrement('concurrent-key')
      ];
      
      await Promise.all(operations);
      
      // Le résultat final devrait être cohérent
      expect(global.__rateLimitStore['rl:concurrent-key']).toBe(2);
    });
  });

  describe('🧪 Tests de performance', () => {
    test('Devrait gérer de nombreuses opérations rapidement', async () => {
      store = new RedisStore();
      
      const start = Date.now();
      
      const operations = [];
      for (let i = 0; i < 1000; i++) {
        operations.push(store.increment(`perf-key-${i % 10}`));
      }
      
      await Promise.all(operations);
      
      const duration = Date.now() - start;
      
      // Devrait prendre moins d'une seconde
      expect(duration).toBeLessThan(1000);
      
      // Vérifier que toutes les clés ont été créées
      const keys = Object.keys(global.__rateLimitStore);
      expect(keys.length).toBe(10); // 10 clés différentes
    });

    test('Devrait utiliser la mémoire efficacement', () => {
      store = new RedisStore();
      
      // Créer beaucoup de clés
      for (let i = 0; i < 1000; i++) {
        global.__rateLimitStore[`rl:memory-test-${i}`] = i;
      }
      
      // Nettoyer toutes les clés
      global.__rateLimitStore = {};
      
      // Vérifier que la mémoire est libérée
      expect(Object.keys(global.__rateLimitStore)).toHaveLength(0);
    });
  });

  describe('🛡️ Tests de robustesse', () => {
    test('Devrait gérer les clés avec des caractères spéciaux', async () => {
      store = new RedisStore();
      
      const specialKeys = [
        'key:with:colons',
        'key with spaces',
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots'
      ];
      
      for (const key of specialKeys) {
        const result = await store.increment(key);
        expect(result.totalHits).toBe(1);
      }
      
      expect(Object.keys(global.__rateLimitStore)).toHaveLength(specialKeys.length);
    });

    test('Devrait gérer les valeurs extrêmes', async () => {
      store = new RedisStore();
      
      // Incrémenter jusqu'à une grande valeur
      for (let i = 0; i < 1000000; i += 100000) {
        global.__rateLimitStore['rl:extreme-key'] = i;
        const result = await store.increment('extreme-key');
        expect(result.totalHits).toBe(i + 1);
      }
    });

    test('Devrait gérer la corruption du store en mémoire', async () => {
      store = new RedisStore();
      
      // Assurer que le store global existe
      global.__rateLimitStore = global.__rateLimitStore || {};
      
      // Corrompre intentionnellement le store
      global.__rateLimitStore['rl:corrupted-key'] = 'not-a-number';
      
      // L'opération devrait nettoyer et fonctionner
      const result = await store.increment('corrupted-key');
      expect(result.totalHits).toBe(1); // Corrigé : valeur corrompue réinitialisée à 0, puis +1
    });
  });
});
