/**
 * 🎨 FormBuilderUI.js - FormEase Sprint 5 Phase 2
 * 
 * Interface utilisateur pour le constructeur de formulaires drag & drop
 * Éditeur visuel de templates avec prévisualisation en temps réel
 * 
 * @version 5.0.0
 * @author FormEase UI Team
 * @since Sprint 5 Phase 2
 */

class FormBuilderUI {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            mode: 'builder', // 'builder' | 'template-selector' | 'preview'
            allowSave: true,
            allowExport: true,
            showPreview: true,
            theme: 'modern',
            ...options
        };
        
        this.currentTemplate = null;
        this.formBuilder = null;
        this.draggedElement = null;
        this.isDragging = false;
        
        this.components = {
            sidebar: null,
            canvas: null,
            properties: null,
            preview: null,
            toolbar: null
        };
        
        this.init();
    }
    
    init() {
        this.createLayout();
        this.setupDragAndDrop();
        this.loadTemplateSelector();
        
        console.log('🎨 FormBuilderUI initialisé');
    }
    
    createLayout() {
        this.container.innerHTML = '';
        this.container.className = 'formease-builder h-screen bg-gray-50 dark:bg-gray-900 flex flex-col';
        
        // Toolbar
        this.components.toolbar = this.createToolbar();
        this.container.appendChild(this.components.toolbar);
        
        // Main content
        const mainContent = document.createElement('div');
        mainContent.className = 'flex-1 flex overflow-hidden';
        
        // Sidebar
        this.components.sidebar = this.createSidebar();
        mainContent.appendChild(this.components.sidebar);
        
        // Canvas area
        const canvasArea = document.createElement('div');
        canvasArea.className = 'flex-1 flex flex-col';
        
        this.components.canvas = this.createCanvas();
        canvasArea.appendChild(this.components.canvas);
        
        mainContent.appendChild(canvasArea);
        
        // Properties panel
        this.components.properties = this.createPropertiesPanel();
        mainContent.appendChild(this.components.properties);
        
        this.container.appendChild(mainContent);
        
        // Preview modal (hidden by default)
        if (this.options.showPreview) {
            this.components.preview = this.createPreviewModal();
            document.body.appendChild(this.components.preview);
        }
    }
    
    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4';
        
        const content = document.createElement('div');
        content.className = 'flex items-center justify-between';
        
        // Left side - Logo and title
        const leftSide = document.createElement('div');
        leftSide.className = 'flex items-center gap-4';
        
        const logo = document.createElement('div');
        logo.className = 'flex items-center gap-2';
        logo.innerHTML = `
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold">F</span>
            </div>
            <span class="text-xl font-bold text-gray-900 dark:text-white">FormEase Builder</span>
        `;
        
        const templateInfo = document.createElement('div');
        templateInfo.className = 'text-sm text-gray-500 dark:text-gray-400';
        templateInfo.id = 'template-info';
        templateInfo.textContent = 'Nouveau formulaire';
        
        leftSide.appendChild(logo);
        leftSide.appendChild(templateInfo);
        
        // Center - Mode selector
        const modeSelector = document.createElement('div');
        modeSelector.className = 'flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1';
        
        const modes = [
            { id: 'builder', label: 'Constructeur', icon: '🏗️' },
            { id: 'template-selector', label: 'Templates', icon: '📋' },
            { id: 'preview', label: 'Aperçu', icon: '👁️' }
        ];
        
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                this.options.mode === mode.id 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`;
            btn.innerHTML = `${mode.icon} ${mode.label}`;
            btn.addEventListener('click', () => this.switchMode(mode.id));
            modeSelector.appendChild(btn);
        });
        
        // Right side - Actions
        const rightSide = document.createElement('div');
        rightSide.className = 'flex items-center gap-3';
        
        const actions = [
            { id: 'save', label: 'Sauvegarder', icon: '💾', variant: 'ghost' },
            { id: 'export', label: 'Exporter', icon: '📤', variant: 'ghost' },
            { id: 'publish', label: 'Publier', icon: '🚀', variant: 'primary' }
        ];
        
        actions.forEach(action => {
            const btn = this.createButton(action.label, action.variant, action.icon);
            btn.addEventListener('click', () => this.handleToolbarAction(action.id));
            rightSide.appendChild(btn);
        });
        
        content.appendChild(leftSide);
        content.appendChild(modeSelector);
        content.appendChild(rightSide);
        toolbar.appendChild(content);
        
        return toolbar;
    }
    
    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col';
        
        // Header
        const header = document.createElement('div');
        header.className = 'p-4 border-b border-gray-200 dark:border-gray-700';
        
        const title = document.createElement('h3');
        title.className = 'text-lg font-semibold text-gray-900 dark:text-white';
        title.textContent = 'Composants';
        
        header.appendChild(title);
        
        // Search
        const searchContainer = document.createElement('div');
        searchContainer.className = 'p-4 border-b border-gray-200 dark:border-gray-700';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Rechercher un composant...';
        searchInput.className = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white';
        searchInput.addEventListener('input', (e) => this.filterComponents(e.target.value));
        
        searchContainer.appendChild(searchInput);
        
        // Components list
        const componentsList = document.createElement('div');
        componentsList.className = 'flex-1 overflow-y-auto p-4';
        componentsList.id = 'components-list';
        
        this.loadComponentsList(componentsList);
        
        sidebar.appendChild(header);
        sidebar.appendChild(searchContainer);
        sidebar.appendChild(componentsList);
        
        return sidebar;
    }
    
    loadComponentsList(container) {
        const categories = [
            {
                name: 'Champs de base',
                components: [
                    { type: 'input', label: 'Champ texte', icon: '📝', description: 'Saisie de texte simple' },
                    { type: 'textarea', label: 'Zone de texte', icon: '📄', description: 'Texte multi-lignes' },
                    { type: 'select', label: 'Liste déroulante', icon: '📋', description: 'Sélection d\'options' },
                    { type: 'checkbox', label: 'Case à cocher', icon: '☑️', description: 'Choix binaire' },
                    { type: 'radio', label: 'Bouton radio', icon: '🔘', description: 'Choix unique' }
                ]
            },
            {
                name: 'Champs avancés',
                components: [
                    { type: 'datePicker', label: 'Sélecteur de date', icon: '📅', description: 'Calendrier interactif' },
                    { type: 'fileUpload', label: 'Upload de fichier', icon: '📎', description: 'Téléchargement de fichiers' },
                    { type: 'rating', label: 'Notation', icon: '⭐', description: 'Système d\'étoiles' },
                    { type: 'slider', label: 'Curseur', icon: '🎚️', description: 'Valeur numérique' },
                    { type: 'signature', label: 'Signature', icon: '✍️', description: 'Signature électronique' }
                ]
            },
            {
                name: 'Mise en page',
                components: [
                    { type: 'section', label: 'Section', icon: '📖', description: 'Titre de section' },
                    { type: 'divider', label: 'Séparateur', icon: '➖', description: 'Ligne de séparation' },
                    { type: 'spacer', label: 'Espace', icon: '⬜', description: 'Espace vertical' },
                    { type: 'column', label: 'Colonnes', icon: '🏛️', description: 'Disposition en colonnes' }
                ]
            }
        ];
        
        categories.forEach(category => {
            // Titre de catégorie
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 mt-6 first:mt-0';
            categoryTitle.textContent = category.name;
            
            container.appendChild(categoryTitle);
            
            // Composants de la catégorie
            category.components.forEach(component => {
                const componentElement = this.createComponentItem(component);
                container.appendChild(componentElement);
            });
        });
    }
    
    createComponentItem(component) {
        const item = document.createElement('div');
        item.className = 'group relative p-3 mb-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 cursor-grab transition-colors';
        item.draggable = true;
        item.dataset.componentType = component.type;
        
        const content = document.createElement('div');
        content.className = 'flex items-start gap-3';
        
        const icon = document.createElement('div');
        icon.className = 'text-2xl flex-shrink-0';
        icon.textContent = component.icon;
        
        const info = document.createElement('div');
        info.className = 'flex-1 min-w-0';
        
        const label = document.createElement('div');
        label.className = 'font-medium text-gray-900 dark:text-white text-sm';
        label.textContent = component.label;
        
        const description = document.createElement('div');
        description.className = 'text-xs text-gray-500 dark:text-gray-400 mt-1';
        description.textContent = component.description;
        
        info.appendChild(label);
        info.appendChild(description);
        
        content.appendChild(icon);
        content.appendChild(info);
        item.appendChild(content);
        
        // Drag events
        item.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, component);
        });
        
        item.addEventListener('dragend', () => {
            this.handleDragEnd();
        });
        
        return item;
    }
    
    createCanvas() {
        const canvas = document.createElement('div');
        canvas.className = 'flex-1 bg-gray-100 dark:bg-gray-900 p-6 overflow-auto';
        
        const canvasContent = document.createElement('div');
        canvasContent.className = 'max-w-4xl mx-auto';
        canvasContent.id = 'canvas-content';
        
        // Mode initial
        this.loadCanvasContent(canvasContent);
        
        canvas.appendChild(canvasContent);
        
        return canvas;
    }
    
    loadCanvasContent(container) {
        switch (this.options.mode) {
            case 'builder':
                this.loadFormBuilder(container);
                break;
            case 'template-selector':
                this.loadTemplateSelector(container);
                break;
            case 'preview':
                this.loadPreview(container);
                break;
        }
    }
    
    loadFormBuilder(container) {
        container.innerHTML = '';
        
        // Drop zone
        const dropZone = document.createElement('div');
        dropZone.className = 'min-h-96 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center transition-colors';
        dropZone.id = 'form-drop-zone';
        
        if (!this.currentTemplate || !this.currentTemplate.fields || this.currentTemplate.fields.length === 0) {
            // État vide
            const emptyState = document.createElement('div');
            emptyState.className = 'flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400';
            
            emptyState.innerHTML = `
                <div class="text-6xl mb-4">🏗️</div>
                <h3 class="text-xl font-semibold mb-2">Commencez à construire</h3>
                <p class="text-sm mb-4">Glissez et déposez des composants depuis la barre latérale</p>
                <p class="text-xs">ou sélectionnez un template pour commencer</p>
            `;
            
            dropZone.appendChild(emptyState);
        } else {
            // Afficher le formulaire existant
            this.renderFormFields(dropZone);
        }
        
        // Setup drop zone
        this.setupDropZone(dropZone);
        
        container.appendChild(dropZone);
    }
    
    loadTemplateSelector(container) {
        container.innerHTML = '';
        
        const header = document.createElement('div');
        header.className = 'text-center mb-8';
        
        header.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choisir un template</h2>
            <p class="text-lg text-gray-600 dark:text-gray-400">Commencez avec un template prêt à l'emploi ou créez le vôtre</p>
        `;
        
        container.appendChild(header);
        
        // Catégories de templates
        if (window.advancedFormTemplates) {
            const categories = window.advancedFormTemplates.categories;
            
            categories.forEach((categoryInfo, categoryId) => {
                const categorySection = this.createTemplateCategorySection(categoryId, categoryInfo);
                container.appendChild(categorySection);
            });
        }
        
        // Bouton pour créer un template vierge
        const createBlankSection = document.createElement('div');
        createBlankSection.className = 'mt-12 text-center';
        
        const createBlankBtn = this.createButton('Créer un formulaire vierge', 'outline', '➕');
        createBlankBtn.className += ' px-8 py-4 text-lg';
        createBlankBtn.addEventListener('click', () => this.createBlankForm());
        
        createBlankSection.appendChild(createBlankBtn);
        container.appendChild(createBlankSection);
    }
    
    createTemplateCategorySection(categoryId, categoryInfo) {
        const section = document.createElement('div');
        section.className = 'mb-12';
        
        // En-tête de catégorie
        const header = document.createElement('div');
        header.className = 'flex items-center gap-3 mb-6';
        
        const icon = document.createElement('span');
        icon.className = 'text-3xl';
        icon.textContent = categoryInfo.icon;
        
        const title = document.createElement('h3');
        title.className = 'text-2xl font-bold text-gray-900 dark:text-white';
        title.textContent = categoryInfo.name;
        
        const description = document.createElement('p');
        description.className = 'text-gray-600 dark:text-gray-400 ml-auto';
        description.textContent = categoryInfo.description;
        
        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(description);
        
        // Templates de la catégorie
        const templatesGrid = document.createElement('div');
        templatesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        
        if (window.advancedFormTemplates) {
            const templates = window.advancedFormTemplates.getTemplatesByCategory(categoryId);
            
            templates.forEach(template => {
                const templateCard = this.createTemplateCard(template);
                templatesGrid.appendChild(templateCard);
            });
        }
        
        section.appendChild(header);
        section.appendChild(templatesGrid);
        
        return section;
    }
    
    createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer group';
        
        const cardContent = document.createElement('div');
        cardContent.className = 'p-6';
        
        // Header
        const cardHeader = document.createElement('div');
        cardHeader.className = 'flex items-start justify-between mb-4';
        
        const title = document.createElement('h4');
        title.className = 'text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400';
        title.textContent = template.name;
        
        const difficulty = document.createElement('span');
        difficulty.className = `px-2 py-1 text-xs rounded-full ${this.getDifficultyClasses(template.difficulty)}`;
        difficulty.textContent = template.difficulty || 'easy';
        
        cardHeader.appendChild(title);
        cardHeader.appendChild(difficulty);
        
        // Description
        const description = document.createElement('p');
        description.className = 'text-sm text-gray-600 dark:text-gray-400 mb-4';
        description.textContent = template.description;
        
        // Metadata
        const metadata = document.createElement('div');
        metadata.className = 'flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4';
        
        metadata.innerHTML = `
            <span>⏱️ ${template.estimatedTime || '5 min'}</span>
            <span>📝 ${template.fields?.length || 0} champs</span>
            <span>🎯 ${template.usage || 0} utilisations</span>
        `;
        
        // Tags
        const tags = document.createElement('div');
        tags.className = 'flex flex-wrap gap-2 mb-4';
        
        template.tags?.slice(0, 3).forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded';
            tagElement.textContent = tag;
            tags.appendChild(tagElement);
        });
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'flex gap-2';
        
        const useBtn = this.createButton('Utiliser', 'primary', '🚀');
        useBtn.className = 'flex-1 text-sm';
        useBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.useTemplate(template.id);
        });
        
        const previewBtn = this.createButton('Aperçu', 'ghost', '👁️');
        previewBtn.className = 'px-3 text-sm';
        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.previewTemplate(template.id);
        });
        
        actions.appendChild(useBtn);
        actions.appendChild(previewBtn);
        
        cardContent.appendChild(cardHeader);
        cardContent.appendChild(description);
        cardContent.appendChild(metadata);
        cardContent.appendChild(tags);
        cardContent.appendChild(actions);
        
        card.appendChild(cardContent);
        
        // Click handler pour la carte entière
        card.addEventListener('click', () => {
            this.useTemplate(template.id);
        });
        
        return card;
    }
    
    getDifficultyClasses(difficulty) {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'hard':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    }
    
    createPropertiesPanel() {
        const panel = document.createElement('div');
        panel.className = 'w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col';
        
        const header = document.createElement('div');
        header.className = 'p-4 border-b border-gray-200 dark:border-gray-700';
        
        const title = document.createElement('h3');
        title.className = 'text-lg font-semibold text-gray-900 dark:text-white';
        title.textContent = 'Propriétés';
        
        header.appendChild(title);
        
        const content = document.createElement('div');
        content.className = 'flex-1 overflow-y-auto p-4';
        content.id = 'properties-content';
        
        // État initial
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center text-gray-500 dark:text-gray-400 mt-8';
        emptyState.innerHTML = `
            <div class="text-4xl mb-4">⚙️</div>
            <p class="text-sm">Sélectionnez un élément pour modifier ses propriétés</p>
        `;
        
        content.appendChild(emptyState);
        
        panel.appendChild(header);
        panel.appendChild(content);
        
        return panel;
    }
    
    createPreviewModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 hidden bg-black bg-opacity-50 flex items-center justify-center p-4';
        modal.id = 'preview-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-full overflow-hidden flex flex-col';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700';
        
        const modalTitle = document.createElement('h3');
        modalTitle.className = 'text-lg font-semibold text-gray-900 dark:text-white';
        modalTitle.textContent = 'Aperçu du formulaire';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200';
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', () => this.closePreview());
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeBtn);
        
        const modalBody = document.createElement('div');
        modalBody.className = 'flex-1 overflow-y-auto p-6';
        modalBody.id = 'preview-content';
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modal.appendChild(modalContent);
        
        // Fermer au clic sur l'overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePreview();
            }
        });
        
        return modal;
    }
    
    // Drag & Drop
    setupDragAndDrop() {
        // Déjà configuré dans createComponentItem et setupDropZone
    }
    
    handleDragStart(e, component) {
        this.draggedElement = component;
        this.isDragging = true;
        
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify(component));
        
        // Feedback visuel
        const dropZone = document.getElementById('form-drop-zone');
        if (dropZone) {
            dropZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        }
    }
    
    handleDragEnd() {
        this.draggedElement = null;
        this.isDragging = false;
        
        // Nettoyer le feedback visuel
        const dropZone = document.getElementById('form-drop-zone');
        if (dropZone) {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        }
    }
    
    setupDropZone(dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.draggedElement) {
                this.addFieldToForm(this.draggedElement);
            }
        });
    }
    
    addFieldToForm(component) {
        if (!this.currentTemplate) {
            this.currentTemplate = {
                id: 'custom-form',
                name: 'Nouveau formulaire',
                description: 'Formulaire personnalisé',
                category: 'custom',
                fields: [],
                styling: {
                    layout: 'vertical',
                    spacing: 'comfortable',
                    theme: 'modern'
                },
                actions: [
                    {
                        type: 'submit',
                        text: 'Envoyer',
                        variant: 'primary'
                    }
                ]
            };
        }
        
        // Créer la configuration du champ
        const fieldId = `field_${Date.now()}`;
        const fieldConfig = this.createFieldConfig(component, fieldId);
        
        this.currentTemplate.fields.push(fieldConfig);
        
        // Recharger le canvas
        const canvasContent = document.getElementById('canvas-content');
        this.loadFormBuilder(canvasContent);
        
        // Mettre à jour les infos du template
        this.updateTemplateInfo();
        
        console.log('Champ ajouté:', fieldConfig);
    }
    
    createFieldConfig(component, fieldId) {
        const baseConfig = {
            id: fieldId,
            type: component.type,
            label: component.label || 'Nouveau champ',
            gridColumn: 'span-12'
        };
        
        // Configuration spécifique par type
        switch (component.type) {
            case 'input':
                return {
                    ...baseConfig,
                    inputType: 'text',
                    placeholder: 'Saisir le texte...',
                    required: false
                };
                
            case 'textarea':
                return {
                    ...baseConfig,
                    placeholder: 'Saisir le texte...',
                    rows: 4,
                    required: false
                };
                
            case 'select':
                return {
                    ...baseConfig,
                    options: [
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' }
                    ],
                    placeholder: 'Sélectionner...',
                    required: false
                };
                
            case 'checkbox':
                return {
                    ...baseConfig,
                    label: 'Case à cocher',
                    required: false
                };
                
            case 'datePicker':
                return {
                    ...baseConfig,
                    placeholder: 'Sélectionner une date',
                    format: 'DD/MM/YYYY',
                    clearable: true
                };
                
            case 'fileUpload':
                return {
                    ...baseConfig,
                    accept: '*/*',
                    multiple: false,
                    maxSize: 5 * 1024 * 1024
                };
                
            case 'rating':
                return {
                    ...baseConfig,
                    maxRating: 5,
                    required: false
                };
                
            case 'section':
                return {
                    ...baseConfig,
                    title: 'Nouvelle section'
                };
                
            default:
                return baseConfig;
        }
    }
    
    renderFormFields(container) {
        container.innerHTML = '';
        
        if (!this.currentTemplate?.fields) return;
        
        // Créer le formulaire
        if (window.AdvancedFormBuilder) {
            this.formBuilder = new window.AdvancedFormBuilder(this.currentTemplate, {
                autoRender: false,
                theme: this.options.theme
            });
            
            const formElement = this.formBuilder.render();
            formElement.className += ' pointer-events-none'; // Désactiver les interactions en mode édition
            
            container.appendChild(formElement);
        }
    }
    
    // Actions
    switchMode(mode) {
        this.options.mode = mode;
        
        // Mettre à jour les boutons de mode
        const toolbar = this.components.toolbar;
        const modeButtons = toolbar.querySelectorAll('button');
        modeButtons.forEach(btn => {
            btn.className = btn.className.replace(/bg-white|dark:bg-gray-600|text-gray-900|dark:text-white|shadow-sm/, '');
            btn.className += ' text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white';
        });
        
        const activeButton = toolbar.querySelector(`button[onclick*="${mode}"]`);
        if (activeButton) {
            activeButton.className = activeButton.className.replace(/text-gray-600|dark:text-gray-300|hover:text-gray-900|dark:hover:text-white/, '');
            activeButton.className += ' bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm';
        }
        
        // Recharger le contenu
        const canvasContent = document.getElementById('canvas-content');
        this.loadCanvasContent(canvasContent);
    }
    
    useTemplate(templateId) {
        if (window.advancedFormTemplates) {
            const template = window.advancedFormTemplates.getTemplate(templateId);
            if (template) {
                this.currentTemplate = { ...template };
                this.switchMode('builder');
                this.updateTemplateInfo();
                
                console.log('Template chargé:', template.name);
            }
        }
    }
    
    previewTemplate(templateId) {
        if (window.advancedFormTemplates) {
            const template = window.advancedFormTemplates.getTemplate(templateId);
            if (template) {
                this.showPreview(template);
            }
        }
    }
    
    showPreview(template = this.currentTemplate) {
        if (!template || !this.components.preview) return;
        
        const previewContent = document.getElementById('preview-content');
        previewContent.innerHTML = '';
        
        if (window.AdvancedFormBuilder) {
            const previewBuilder = new window.AdvancedFormBuilder(template, {
                autoRender: false,
                onSubmit: (data) => {
                    alert('Formulaire soumis !\n\n' + JSON.stringify(data, null, 2));
                }
            });
            
            const previewForm = previewBuilder.render();
            previewContent.appendChild(previewForm);
        }
        
        this.components.preview.classList.remove('hidden');
    }
    
    closePreview() {
        if (this.components.preview) {
            this.components.preview.classList.add('hidden');
        }
    }
    
    createBlankForm() {
        this.currentTemplate = {
            id: 'blank-form',
            name: 'Nouveau formulaire',
            description: 'Formulaire vierge',
            category: 'custom',
            fields: [],
            styling: {
                layout: 'vertical',
                spacing: 'comfortable',
                theme: 'modern'
            },
            actions: []
        };
        
        this.switchMode('builder');
        this.updateTemplateInfo();
    }
    
    updateTemplateInfo() {
        const templateInfo = document.getElementById('template-info');
        if (templateInfo && this.currentTemplate) {
            templateInfo.textContent = `${this.currentTemplate.name} (${this.currentTemplate.fields?.length || 0} champs)`;
        }
    }
    
    handleToolbarAction(actionId) {
        switch (actionId) {
            case 'save':
                this.saveTemplate();
                break;
            case 'export':
                this.exportTemplate();
                break;
            case 'publish':
                this.publishForm();
                break;
        }
    }
    
    saveTemplate() {
        if (!this.currentTemplate) {
            alert('Aucun formulaire à sauvegarder');
            return;
        }
        
        const templateData = {
            ...this.currentTemplate,
            saved: new Date().toISOString()
        };
        
        const key = `formease-template-${this.currentTemplate.id}`;
        localStorage.setItem(key, JSON.stringify(templateData));
        
        alert('Template sauvegardé !');
        console.log('Template sauvegardé:', templateData);
    }
    
    exportTemplate() {
        if (!this.currentTemplate) {
            alert('Aucun formulaire à exporter');
            return;
        }
        
        const exportData = {
            formease_template: this.currentTemplate,
            version: '5.0.0',
            exported: new Date().toISOString()
        };
        
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentTemplate.name.replace(/\s+/g, '_')}_template.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('Template exporté');
    }
    
    publishForm() {
        if (!this.currentTemplate) {
            alert('Aucun formulaire à publier');
            return;
        }
        
        // Simulation de publication
        alert('Formulaire publié avec succès !');
        console.log('Formulaire publié:', this.currentTemplate);
    }
    
    filterComponents(query) {
        const componentsList = document.getElementById('components-list');
        const items = componentsList.querySelectorAll('[data-component-type]');
        
        items.forEach(item => {
            const label = item.querySelector('.font-medium').textContent.toLowerCase();
            const description = item.querySelector('.text-xs').textContent.toLowerCase();
            const searchTerm = query.toLowerCase();
            
            if (label.includes(searchTerm) || description.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Utilitaires
    createButton(text, variant = 'primary', icon = null) {
        const button = document.createElement('button');
        
        const baseClasses = 'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
        
        let variantClasses = '';
        switch (variant) {
            case 'primary':
                variantClasses = 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500';
                break;
            case 'ghost':
                variantClasses = 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500';
                break;
            case 'outline':
                variantClasses = 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500';
                break;
        }
        
        button.className = `${baseClasses} ${variantClasses}`;
        
        if (icon) {
            button.innerHTML = `${icon} <span class="ml-2">${text}</span>`;
        } else {
            button.textContent = text;
        }
        
        return button;
    }
}

// Export global
window.FormBuilderUI = FormBuilderUI;

console.log('🎨 FormBuilderUI chargé');
