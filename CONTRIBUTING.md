# 🤝 Guide de Contribution - FormEase

Merci de votre intérêt pour contribuer à FormEase ! Ce guide vous aidera à commencer.

## 📋 Comment Contribuer

### Types de Contributions Recherchées

- 🐛 **Corrections de bugs**
- ✨ **Nouvelles fonctionnalités**
- 📚 **Améliorations de documentation**
- 🧪 **Tests supplémentaires**
- 🎨 **Améliorations UI/UX**
- 🔧 **Optimisations de performance**

## 🚀 Processus de Contribution

### 1. Préparer l'Environnement

```bash
# Fork le repository
git clone https://github.com/VOTRE-USERNAME/FormEase.git
cd FormEase

# Installer les dépendances
cd formease/backend && npm install
cd ../frontend && npm install

# Configurer l'environnement de développement
cp formease/backend/.env.example formease/backend/.env
# Éditer les variables d'environnement
```

### 2. Créer une Branche

```bash
# Créer une branche pour votre fonctionnalité
git checkout -b feature/nom-de-votre-fonctionnalite

# Ou pour un bug fix
git checkout -b fix/description-du-bug
```

### 3. Développer

#### Standards de Code

**Frontend (TypeScript/React)**
```typescript
// ✅ Bon exemple
interface UserProfile {
  id: number;
  email: string;
  name: string;
}

const UserCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  return (
    <Card>
      <Title>{user.name}</Title>
      <Text>{user.email}</Text>
    </Card>
  );
};
```

**Backend (JavaScript/Node.js)**
```javascript
// ✅ Bon exemple
const { validate } = require('../middleware/validation');
const { loginSchema } = require('../schemas/auth');

exports.login = [
  validate(loginSchema),
  async (req, res) => {
    try {
      // Logique d'authentification
      const { email, password } = req.body;
      // ...
      logger.info('User login successful', { email, ip: req.ip });
      res.status(200).json({ message: 'Success', token, user });
    } catch (error) {
      logger.error('Login failed', { error: error.message, email: req.body.email });
      res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }
  }
];
```

### 4. Tests

```bash
# Tests backend
cd formease/backend
npm test

# Tests frontend
cd formease/frontend
npm run lint
npm run build

# Tests E2E (optionnel)
npm run test:e2e
```

### 5. Commit

Utilisez des messages de commit conventionnels :

```bash
# Exemples de bons commits
git commit -m "feat: add AI form generation endpoint"
git commit -m "fix: resolve JWT token validation issue"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for auth controller"
git commit -m "style: improve dashboard mobile layout"
```

### 6. Pull Request

1. **Push** votre branche
2. **Créez** une Pull Request sur GitHub
3. **Remplissez** le template de PR
4. **Attendez** la review

## 📝 Template de Pull Request

```markdown
## 📋 Description
Brève description des changements apportés.

## 🔗 Issue Liée
Fixes #(numéro de l'issue)

## 🧪 Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests E2E passent
- [ ] Build frontend réussi
- [ ] Linting passé

## 📸 Screenshots (si applicable)
Ajoutez des captures d'écran des changements UI.

## ✅ Checklist
- [ ] Code self-reviewed
- [ ] Documentation mise à jour
- [ ] Pas de console.log oubliés
- [ ] Variables d'environnement documentées
```

## 🎯 Standards et Guidelines

### Architecture

**Frontend**
- Utiliser Tremor UI pour les composants
- Typage TypeScript strict
- Hooks React pour la logique
- Context pour l'état global

**Backend**
- Architecture MVC claire
- Middleware pour la logique transversale
- Validation Joi pour les entrées
- Logging structuré avec Winston

### Sécurité

```javascript
// ❌ Éviter
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  // Requête directe sans validation
  const user = await prisma.user.findUnique({ where: { id: userId } });
  res.json(user);
});

// ✅ Correct
app.get('/user/:id', auth, validateId, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true } // Pas de mot de passe
    });
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    res.json(user);
  } catch (error) {
    logger.error('User fetch failed', { error, userId: req.params.id });
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
```

### Performance

- Utiliser `React.memo` pour les composants coûteux
- Lazy loading pour les routes
- Pagination pour les listes longues
- Cache approprié côté backend

## 🐛 Reporting de Bugs

### Template d'Issue Bug

```markdown
**🐛 Description du Bug**
Description claire et concise du problème.

**📋 Étapes pour Reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Faire défiler vers '...'
4. Voir l'erreur

**✅ Comportement Attendu**
Description de ce qui devrait se passer.

**📸 Screenshots**
Ajoutez des captures d'écran si applicable.

**💻 Environnement**
- OS: [e.g. Windows 10, macOS]
- Navigateur: [e.g. Chrome 91, Firefox 89]
- Version Node.js: [e.g. 18.16.0]
```

## ✨ Suggestions de Fonctionnalités

### Template d'Issue Feature

```markdown
**🚀 Fonctionnalité Souhaitée**
Description claire de la fonctionnalité.

**💡 Motivation**
Pourquoi cette fonctionnalité serait utile ?

**📋 Solution Proposée**
Comment imagineriez-vous cette fonctionnalité ?

**🔄 Alternatives Considérées**
Autres approches envisagées.

**📎 Contexte Additionnel**
Informations supplémentaires, mockups, références.
```

## 👥 Code Review

### Checklist Reviewer

- [ ] **Fonctionnalité** : Le code fait ce qu'il est censé faire
- [ ] **Tests** : Tests appropriés et complets
- [ ] **Sécurité** : Pas de failles de sécurité
- [ ] **Performance** : Code optimisé
- [ ] **Style** : Respect des conventions
- [ ] **Documentation** : Code bien documenté

### Feedback Constructif

```markdown
# ✅ Bon feedback
Suggestion : Il serait mieux d'utiliser `useMemo` ici pour éviter les re-renders inutiles :

```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

# ❌ Feedback à éviter
"Ce code est nul"
```

## 🎖️ Reconnaissance

Les contributeurs seront reconnus dans :
- Le fichier [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Les release notes
- Le README principal

## 📞 Support

- 💬 **Discord** : [Serveur FormEase](https://discord.gg/formease)
- 📧 **Email** : contrib@formease.app
- 🐛 **Issues** : [GitHub Issues](https://github.com/informagenie/FormEase/issues)

---

**Merci de contribuer à FormEase !** 🙏

Chaque contribution, petite ou grande, fait la différence.
