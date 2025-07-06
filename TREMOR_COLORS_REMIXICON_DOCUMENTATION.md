# Documentation des Couleurs Tremor et RemixIcon

## Couleurs Tremor Adaptées

### Palette Bleue Principale
```css
tremor-blue-50: #eff6ff
tremor-blue-100: #dbeafe
tremor-blue-200: #bfdbfe
tremor-blue-300: #93c5fd
tremor-blue-400: #60a5fa
tremor-blue-500: #3b82f6
tremor-blue-600: #2563eb
tremor-blue-700: #1d4ed8
tremor-blue-800: #1e40af
tremor-blue-900: #1e3a8a
```

### Palette Verte
```css
tremor-green-50: #f0fdf4
tremor-green-100: #dcfce7
tremor-green-200: #bbf7d0
tremor-green-300: #86efac
tremor-green-400: #4ade80
tremor-green-500: #22c55e
tremor-green-600: #16a34a
tremor-green-700: #15803d
tremor-green-800: #166534
tremor-green-900: #14532d
```

### Palette Violette
```css
tremor-purple-50: #faf5ff
tremor-purple-100: #f3e8ff
tremor-purple-200: #e9d5ff
tremor-purple-300: #d8b4fe
tremor-purple-400: #c084fc
tremor-purple-500: #a855f7
tremor-purple-600: #9333ea
tremor-purple-700: #7c3aed
tremor-purple-800: #6b21a8
tremor-purple-900: #581c87
```

### Palette Orange
```css
tremor-orange-50: #fff7ed
tremor-orange-100: #ffedd5
tremor-orange-200: #fed7aa
tremor-orange-300: #fdba74
tremor-orange-400: #fb923c
tremor-orange-500: #f97316
tremor-orange-600: #ea580c
tremor-orange-700: #c2410c
tremor-orange-800: #9a3412
tremor-orange-900: #7c2d12
```

## Utilisation des Couleurs

### Classes CSS Tremor
- `text-tremor-blue-600` - Texte bleu principal
- `bg-tremor-green-100` - Arrière-plan vert clair
- `border-tremor-purple-300` - Bordure violette
- `hover:bg-tremor-orange-50` - Survol orange très clair

### Boutons Tremor avec Gradients
```css
.tremor-Button-primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
}

.tremor-Button-success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
    box-shadow: 0 1px 3px rgba(34, 197, 94, 0.3);
}

.tremor-Button-purple {
    background: linear-gradient(135deg, #a855f7, #9333ea);
    color: white;
    box-shadow: 0 1px 3px rgba(168, 85, 247, 0.3);
}

.tremor-Button-warning {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: white;
    box-shadow: 0 1px 3px rgba(249, 115, 22, 0.3);
}
```

## RemixIcon - Icônes Utilisées

### Icônes Principales
- `ri-robot-line` - IA / Automatisation
- `ri-magic-line` - Assistant / Magie
- `ri-sparkle-line` - Nouveauté / Premium
- `ri-save-line` - Sauvegarde
- `ri-eye-line` - Aperçu
- `ri-file-list-3-line` - Formulaires
- `ri-settings-3-line` - Configuration

### Icônes de Champs
- `ri-input-method-line` - Champs de base
- `ri-text` - Texte court
- `ri-file-text-line` - Texte long
- `ri-mail-line` - Email
- `ri-phone-line` - Téléphone
- `ri-hashtag` - Nombre
- `ri-calendar-line` - Date
- `ri-upload-line` - Fichier
- `ri-star-line` - Notation

### Icônes de Sélection
- `ri-checkbox-line` - Cases à cocher
- `ri-radio-button-line` - Boutons radio
- `ri-arrow-down-s-line` - Liste déroulante

### Icônes de Mise en Page
- `ri-layout-line` - Mise en page
- `ri-layout-row-line` - Ligne
- `ri-separator` - Séparateur
- `ri-page-separator` - Saut de page

### Icônes d'Actions
- `ri-add-line` - Ajouter
- `ri-edit-line` - Éditer
- `ri-file-copy-line` - Dupliquer
- `ri-arrow-up-line` - Monter
- `ri-arrow-down-line` - Descendre
- `ri-close-line` - Fermer
- `ri-drag-drop-line` - Glisser-déposer

### Icônes de Navigation
- `ri-arrow-left-line` - Retour
- `ri-arrow-right-line` - Suivant
- `ri-external-link-line` - Lien externe
- `ri-refresh-line` - Actualiser

### Icônes de Status
- `ri-check-line` - Succès / Validation
- `ri-time-line` - Temps / Horloge
- `ri-bar-chart-line` - Statistiques
- `ri-information-line` - Information
- `ri-lightbulb-line` - Idée / Conseil

## Correspondances Couleurs par Catégorie

### Champs de Base (Bleu)
- Icônes: `text-tremor-blue-600`
- Arrière-plans: `bg-tremor-blue-100`
- Bordures: `border-tremor-blue-300`
- Hover: `hover:bg-tremor-blue-50`

### Sélection (Vert)
- Icônes: `text-tremor-green-600`
- Arrière-plans: `bg-tremor-green-100`
- Bordures: `border-tremor-green-300`
- Hover: `hover:bg-tremor-green-50`

### Avancé (Violet)
- Icônes: `text-tremor-purple-600`
- Arrière-plans: `bg-tremor-purple-100`
- Bordures: `border-tremor-purple-300`
- Hover: `hover:bg-tremor-purple-50`

### Mise en Page (Orange)
- Icônes: `text-tremor-orange-600`
- Arrière-plans: `bg-tremor-orange-100`
- Bordures: `border-tremor-orange-300`
- Hover: `hover:bg-tremor-orange-50`

## Badges Tremor
```css
.tremor-Badge-blue {
    background-color: #dbeafe;
    color: #1e40af;
    border: 1px solid #93c5fd;
}

.tremor-Badge-green {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
}

.tremor-Badge-purple {
    background-color: #f3e8ff;
    color: #6b21a8;
    border: 1px solid #d8b4fe;
}

.tremor-Badge-orange {
    background-color: #ffedd5;
    color: #9a3412;
    border: 1px solid #fdba74;
}
```

## Métriques Dashboard
- **Champs totaux**: Bleu (ri-input-method-line)
- **Réponses**: Vert (ri-bar-chart-line)
- **Validation**: Violet (ri-check-line)
- **Temps**: Orange (ri-time-line)

## Wizard / Assistant
- **Contact**: Bleu (ri-phone-line)
- **Sondage**: Vert (ri-questionnaire-line)
- **Inscription**: Violet (ri-user-add-line)
- **Feedback**: Orange (ri-feedback-line)

Cette documentation assure une cohérence visuelle dans toute l'application FormEase avec les couleurs Tremor officielles et les icônes RemixIcon.
