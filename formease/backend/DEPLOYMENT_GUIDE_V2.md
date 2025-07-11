# 🚀 Guide de Déploiement - FormEase API v2.0

## 📋 Vue d'ensemble

Ce guide vous accompagne dans le déploiement de l'API FormEase v2.0 avec toutes ses fonctionnalités améliorées :

- ✅ **Sécurité Enterprise** : Rate limiting, validation XSS/SQL injection
- ✅ **Performance Optimisée** : Cache Redis, compression, pagination
- ✅ **Monitoring Complet** : Métriques Prometheus, health checks
- ✅ **Documentation Swagger** : API interactive complète

## 🛠️ Prérequis

### Infrastructure Requise

```bash
# Base de données
PostgreSQL >= 13.0
Redis >= 6.0

# Runtime
Node.js >= 18.0
npm >= 8.0

# Monitoring (optionnel)
Prometheus >= 2.40
Grafana >= 9.0
```

### Variables d'Environnement

Créez un fichier `.env` avec :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/formease"

# Redis Cache
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# JWT & Sécurité
JWT_SECRET="votre-secret-jwt-super-secure-256-bits"
CSRF_SECRET="votre-secret-csrf-128-bits"

# Rate Limiting
RATE_LIMIT_REDIS_URL="redis://localhost:6379"

# API Configuration
API_VERSION="2.0.0"
API_BASE_URL="https://api.formease.com/v2"
PORT=3001

# Monitoring
PROMETHEUS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Sécurité
HELMET_ENABLED=true
CORS_ORIGINS="https://formease.com,https://app.formease.com"

# Performance
COMPRESSION_ENABLED=true
CACHE_TTL=300
```

## 📦 Installation

### 1. Cloner et Installer

```bash
git clone https://github.com/jeffkos/form-ease.git
cd form-ease/formease/backend

# Installer les dépendances
npm install

# Installer les nouvelles dépendances v2.0
npm install express-rate-limit redis ioredis compression helmet cors
npm install prometheus-client swagger-jsdoc swagger-ui-express
npm install xss validator dompurify
```

### 2. Configuration Base de Données

```bash
# Migrations Prisma
npx prisma generate
npx prisma db push

# Données de test (optionnel)
npx prisma db seed
```

### 3. Configuration Redis

```bash
# Démarrer Redis localement
redis-server

# Ou via Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Tester la connexion
redis-cli ping
```

## 🔧 Configuration Production

### 1. Variables d'Environnement Production

```env
NODE_ENV=production
DATABASE_URL="postgresql://prod_user:secure_pass@db.formease.com:5432/formease_prod"
REDIS_URL="redis://cache.formease.com:6379"
JWT_SECRET="production-jwt-secret-256-bits-super-secure"
API_BASE_URL="https://api.formease.com/v2"
CORS_ORIGINS="https://formease.com"
```

### 2. Optimisations Production

```javascript
// pm2.config.js
module.exports = {
  apps: [{
    name: 'formease-api-v2',
    script: './src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### 3. Reverse Proxy Nginx

```nginx
# /etc/nginx/sites-available/formease-api
server {
    listen 443 ssl http2;
    server_name api.formease.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api/v2/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting au niveau Nginx (backup)
        limit_req zone=api burst=100 nodelay;
    }
}

# Rate limiting Nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
}
```

## 🚀 Déploiement

### Méthode 1 : Déploiement Manuel

```bash
# 1. Build de production
npm run build

# 2. Test complet
npm test

# 3. Démarrage avec PM2
pm2 start pm2.config.js
pm2 save
pm2 startup

# 4. Vérification
curl https://api.formease.com/v2/health
```

### Méthode 2 : Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

# Démarrer l'application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  formease-api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/formease
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: formease
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Méthode 3 : Cloud (Heroku/Railway/Vercel)

```bash
# Heroku
heroku create formease-api-v2
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
heroku config:set NODE_ENV=production
git push heroku main

# Railway
railway login
railway init
railway add postgresql redis
railway deploy

# Vercel (avec Serverless)
vercel --prod
```

## 📊 Monitoring & Observabilité

### 1. Configuration Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'formease-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/v2/metrics'
    scrape_interval: 10s
```

### 2. Dashboard Grafana

```json
{
  "dashboard": {
    "title": "FormEase API v2.0",
    "panels": [
      {
        "title": "Requests/sec",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(formease_http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.95, formease_http_duration_seconds_bucket)"
          }
        ]
      }
    ]
  }
}
```

### 3. Alerting

```yaml
# alertmanager.yml
groups:
  - name: formease-api
    rules:
      - alert: HighErrorRate
        expr: rate(formease_http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, formease_http_duration_seconds_bucket) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
```

## 🧪 Tests de Validation

### 1. Tests Automatisés

```bash
# Tests unitaires et d'intégration
npm test

# Tests de performance
npm run test:performance

# Tests de sécurité
npm run test:security

# Coverage complet
npm run test:coverage
```

### 2. Tests Manuels Post-Déploiement

```bash
# Health check
curl https://api.formease.com/v2/health

# Documentation Swagger
curl https://api.formease.com/v2/docs/

# Rate limiting
for i in {1..10}; do curl https://api.formease.com/v2/auth/login; done

# Performance
curl -H "Accept-Encoding: gzip" https://api.formease.com/v2/forms

# Métriques (nécessite admin token)
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://api.formease.com/v2/metrics
```

## 🔄 Migration depuis v1.0

### 1. Stratégie de Migration

```javascript
// Middleware de compatibilité v1/v2
app.use('/api/v1', (req, res, next) => {
  // Redirection vers v2 avec mapping
  const v2Path = mapV1ToV2(req.path);
  res.redirect(301, `/api/v2${v2Path}`);
});

// Mapping des endpoints
function mapV1ToV2(v1Path) {
  const mappings = {
    '/forms': '/forms',
    '/auth/login': '/auth/login',
    '/users/me': '/auth/profile'
  };
  return mappings[v1Path] || v1Path;
}
```

### 2. Période de Transition

- **Semaine 1-2** : Déploiement v2 en parallèle de v1
- **Semaine 3-4** : Migration progressive des clients
- **Semaine 5-6** : Dépréciation de v1 avec notifications
- **Semaine 7+** : Arrêt de v1

## 📝 Checklist de Déploiement

### Pré-déploiement
- [ ] Tests passent à 100%
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] Redis accessible
- [ ] Certificats SSL en place
- [ ] Monitoring configuré

### Déploiement
- [ ] Build de production réussi
- [ ] Application démarrée
- [ ] Health checks OK
- [ ] Documentation accessible
- [ ] Rate limiting fonctionnel
- [ ] Cache Redis opérationnel

### Post-déploiement
- [ ] Métriques collectées
- [ ] Logs monitored
- [ ] Performance validée
- [ ] Sécurité testée
- [ ] Équipe notifiée
- [ ] Documentation mise à jour

## 🆘 Troubleshooting

### Problèmes Courants

#### Redis Connection Failed
```bash
# Vérifier Redis
redis-cli ping
# Ou
docker logs redis-container
```

#### Rate Limiting Trop Strict
```javascript
// Ajuster dans rateLimiting.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Augmenter de 5 à 10
  message: 'Trop de tentatives'
});
```

#### Performance Dégradée
```bash
# Vérifier les métriques
curl /api/v2/metrics | grep formease_http_duration

# Optimiser le cache
redis-cli info memory
```

## 📞 Support

### Contacts
- **Équipe DevOps** : devops@formease.com
- **Support Technique** : support@formease.com
- **Documentation** : https://docs.formease.com/api/v2

### Logs & Debugging
```bash
# Logs applicatifs
tail -f logs/combined.log

# Logs système
journalctl -u formease-api

# Métriques en temps réel
curl /api/v2/metrics | grep -E "(requests|duration|errors)"
```

---

## 🎉 Félicitations !

Votre API FormEase v2.0 est maintenant déployée avec :
- 🔒 Sécurité enterprise-grade
- ⚡ Performance optimisée  
- 📊 Monitoring complet
- 📚 Documentation interactive

**Version déployée** : 2.0.0  
**Date** : $(date)  
**Status** : Production Ready ✅
