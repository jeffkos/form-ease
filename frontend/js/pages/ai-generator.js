/**
 * 🤖 FormEase - Script pour Générateur IA de Formulaires
 * Gère la génération de formulaires avec l'IA et les fonctionnalités associées
 */

class AIGeneratorDynamic {
    constructor() {
        this.api = window.apiService || new ApiService();
        this.isGenerating = false;
        this.currentForm = null;
        this.generationHistory = [];
        
        console.log('🤖 Générateur IA dynamique initialisé');
        this.init();
    }

    async init() {
        try {
            // Vérifier l'authentification
            if (!this.api.isAuthenticated()) {
                window.location.href = '/frontend/pages/auth/login.html';
                return;
            }

            // Vérifier les permissions IA (premium feature)
            await this.checkAIPermissions();

            // Charger les données initiales
            await this.loadInitialData();

            // Configurer les événements
            this.setupEventListeners();

            // Configurer l'interface
            this.setupUI();

        } catch (error) {
            console.error('❌ Erreur initialisation générateur IA:', error);
            this.showError('Erreur de chargement du générateur IA');
        }
    }

    async checkAIPermissions() {
        try {
            const user = this.api.user;
            const quotas = await this.api.getUserQuotas();
            
            // Vérifier si l'utilisateur peut utiliser l'IA
            if (!this.api.isPremium() && quotas.data.aiGenerations >= quotas.data.aiGenerationsMax) {
                this.showUpgradePrompt();
                return;
            }

            // Afficher les quotas IA
            this.updateAIQuotaDisplay(quotas.data);

        } catch (error) {
            console.error('❌ Erreur vérification permissions IA:', error);
        }
    }

    async loadInitialData() {
        try {
            // Charger l'historique des générations
            const history = await this.api.getAIHistory();
            this.generationHistory = history.data || [];
            
            // Mettre à jour l'interface
            this.updateHistoryDisplay();
            
            // Charger les templates suggérés
            await this.loadSuggestedPrompts();
            
        } catch (error) {
            console.error('❌ Erreur chargement données initiales:', error);
        }
    }

    setupEventListeners() {
        // Formulaire de génération IA
        const generateForm = document.getElementById('ai-generate-form');
        if (generateForm) {
            generateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleGeneration();
            });
        }

        // Bouton de génération
        const generateButton = document.getElementById('generate-button');
        if (generateButton) {
            generateButton.addEventListener('click', () => {
                this.handleGeneration();
            });
        }

        // Prompts suggérés
        const suggestedPrompts = document.querySelectorAll('[data-suggested-prompt]');
        suggestedPrompts.forEach(button => {
            button.addEventListener('click', (e) => {
                const prompt = e.target.dataset.suggestedPrompt;
                this.fillPrompt(prompt);
            });
        });

        // Historique
        const historyItems = document.querySelectorAll('[data-history-id]');
        historyItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const historyId = e.target.dataset.historyId;
                this.loadFromHistory(historyId);
            });
        });

        // Options avancées
        const advancedToggle = document.getElementById('advanced-options-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => {
                this.toggleAdvancedOptions();
            });
        }

        // Prévisualisation en temps réel
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            let debounceTimer;
            promptInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.updatePromptPreview();
                }, 500);
            });
        }
    }

    setupUI() {
        // Initialiser les tooltips
        this.initializeTooltips();
        
        // Configurer le textarea auto-resize
        this.setupAutoResizeTextarea();
        
        // Configurer les animations
        this.setupAnimations();
    }

    async handleGeneration() {
        if (this.isGenerating) return;

        const promptInput = document.getElementById('prompt-input');
        const prompt = promptInput?.value?.trim();

        if (!prompt) {
            this.showError('Veuillez saisir une description pour votre formulaire');
            return;
        }

        try {
            this.isGenerating = true;
            this.showGenerationInProgress();

            // Collecter les options avancées
            const options = this.collectAdvancedOptions();

            // Générer le formulaire
            const result = await this.api.generateFormWithAI(prompt, options);
            
            // Afficher le résultat
            this.displayGenerationResult(result.data);
            
            // Ajouter à l'historique
            this.addToHistory(prompt, result.data);
            
            // Mettre à jour les quotas
            await this.updateQuotasAfterGeneration();

        } catch (error) {
            console.error('❌ Erreur génération IA:', error);
            this.showError('Erreur lors de la génération du formulaire');
        } finally {
            this.isGenerating = false;
            this.hideGenerationInProgress();
        }
    }

    collectAdvancedOptions() {
        return {
            formType: this.getSelectedValue('form-type'),
            fieldTypes: this.getSelectedValues('preferred-fields'),
            language: this.getSelectedValue('form-language') || 'fr',
            style: this.getSelectedValue('form-style') || 'modern',
            complexity: this.getSelectedValue('form-complexity') || 'medium',
            includeValidation: document.getElementById('include-validation')?.checked || true,
            includeConditionalLogic: document.getElementById('include-conditional')?.checked || false,
            includeMultistep: document.getElementById('include-multistep')?.checked || false
        };
    }

    getSelectedValue(elementId) {
        const element = document.getElementById(elementId);
        return element?.value;
    }

    getSelectedValues(elementId) {
        const checkboxes = document.querySelectorAll(`input[name="${elementId}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value);
    }

    displayGenerationResult(formData) {
        const resultContainer = document.getElementById('generation-result');
        if (!resultContainer) return;

        this.currentForm = formData;

        resultContainer.innerHTML = `
            <div class="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">${formData.title}</h3>
                        <p class="text-gray-600 mt-1">${formData.description || 'Formulaire généré par IA'}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="aiGeneratorDynamic.regenerateForm()" 
                                class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <i class="ri-refresh-line mr-2"></i>Régénérer
                        </button>
                        <button onclick="aiGeneratorDynamic.saveForm()" 
                                class="px-4 py-2 bg-tremor-brand-DEFAULT text-white rounded-lg hover:bg-tremor-brand-emphasis transition-colors">
                            <i class="ri-save-line mr-2"></i>Sauvegarder
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Aperçu du formulaire -->
                    <div class="space-y-4">
                        <h4 class="font-medium text-gray-900 mb-4">Aperçu du formulaire</h4>
                        <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                            ${this.renderFormPreview(formData.fields)}
                        </div>
                    </div>

                    <!-- Détails de génération -->
                    <div class="space-y-4">
                        <h4 class="font-medium text-gray-900 mb-4">Détails de génération</h4>
                        <div class="space-y-3">
                            <div class="flex justify-between py-2 border-b border-gray-200">
                                <span class="text-gray-600">Nombre de champs</span>
                                <span class="font-medium">${formData.fields?.length || 0}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-200">
                                <span class="text-gray-600">Type de formulaire</span>
                                <span class="font-medium">${formData.type || 'Standard'}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-200">
                                <span class="text-gray-600">Validation incluse</span>
                                <span class="font-medium">${formData.hasValidation ? 'Oui' : 'Non'}</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-200">
                                <span class="text-gray-600">Logique conditionnelle</span>
                                <span class="font-medium">${formData.hasConditionalLogic ? 'Oui' : 'Non'}</span>
                            </div>
                        </div>

                        <!-- Actions avancées -->
                        <div class="mt-6 space-y-2">
                            <button onclick="aiGeneratorDynamic.editInBuilder()" 
                                    class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="ri-edit-line mr-2"></i>Éditer dans le Builder
                            </button>
                            <button onclick="aiGeneratorDynamic.previewForm()" 
                                    class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                <i class="ri-eye-line mr-2"></i>Aperçu complet
                            </button>
                            <button onclick="aiGeneratorDynamic.exportForm()" 
                                    class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                <i class="ri-download-line mr-2"></i>Exporter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Animer l'apparition
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderFormPreview(fields) {
        if (!fields || fields.length === 0) {
            return '<p class="text-gray-500 text-center py-8">Aucun champ généré</p>';
        }

        return fields.map(field => {
            switch (field.type) {
                case 'text':
                case 'email':
                case 'tel':
                    return `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                ${field.label}
                                ${field.required ? '<span class="text-red-500">*</span>' : ''}
                            </label>
                            <input type="${field.type}" 
                                   placeholder="${field.placeholder || ''}" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                   disabled>
                        </div>
                    `;

                case 'textarea':
                    return `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                ${field.label}
                                ${field.required ? '<span class="text-red-500">*</span>' : ''}
                            </label>
                            <textarea placeholder="${field.placeholder || ''}" 
                                      rows="3"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                      disabled></textarea>
                        </div>
                    `;

                case 'select':
                    return `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                ${field.label}
                                ${field.required ? '<span class="text-red-500">*</span>' : ''}
                            </label>
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" disabled>
                                <option>Choisir une option...</option>
                                ${(field.options || []).map(option => `<option value="${option.value}">${option.label}</option>`).join('')}
                            </select>
                        </div>
                    `;

                case 'radio':
                    return `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                ${field.label}
                                ${field.required ? '<span class="text-red-500">*</span>' : ''}
                            </label>
                            <div class="space-y-2">
                                ${(field.options || []).map((option, index) => `
                                    <div class="flex items-center">
                                        <input type="radio" id="${field.name}_${index}" name="${field.name}" value="${option.value}" class="mr-2" disabled>
                                        <label for="${field.name}_${index}" class="text-sm text-gray-600">${option.label}</label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;

                case 'checkbox':
                    return `
                        <div class="mb-4">
                            <div class="flex items-center">
                                <input type="checkbox" id="${field.name}" class="mr-2" disabled>
                                <label for="${field.name}" class="text-sm text-gray-700">
                                    ${field.label}
                                    ${field.required ? '<span class="text-red-500">*</span>' : ''}
                                </label>
                            </div>
                        </div>
                    `;

                default:
                    return `
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
                            <div class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500">
                                Champ ${field.type} (aperçu non disponible)
                            </div>
                        </div>
                    `;
            }
        }).join('');
    }

    updateAIQuotaDisplay(quotas) {
        const quotaContainer = document.getElementById('ai-quota-display');
        if (!quotaContainer) return;

        const percentage = (quotas.aiGenerations / quotas.aiGenerationsMax) * 100;
        const remaining = quotas.aiGenerationsMax - quotas.aiGenerations;

        quotaContainer.innerHTML = `
            <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-700">Générations IA utilisées</span>
                    <span class="text-sm text-gray-600">${quotas.aiGenerations}/${quotas.aiGenerationsMax}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div class="bg-tremor-brand-DEFAULT h-2 rounded-full transition-all duration-300" 
                         style="width: ${percentage}%"></div>
                </div>
                <p class="text-xs text-gray-500">
                    ${remaining > 0 ? `${remaining} générations restantes` : 'Quota épuisé - Passez Premium'}
                </p>
            </div>
        `;
    }

    updateHistoryDisplay() {
        const historyContainer = document.getElementById('generation-history');
        if (!historyContainer || this.generationHistory.length === 0) return;

        historyContainer.innerHTML = `
            <div class="space-y-3">
                <h4 class="font-medium text-gray-900">Historique des générations</h4>
                <div class="space-y-2 max-h-64 overflow-y-auto">
                    ${this.generationHistory.map(item => `
                        <div class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                             data-history-id="${item.id}"
                             onclick="aiGeneratorDynamic.loadFromHistory('${item.id}')">
                            <p class="text-sm font-medium text-gray-900 truncate">${item.prompt}</p>
                            <div class="flex justify-between items-center mt-1">
                                <span class="text-xs text-gray-500">${this.formatDate(item.createdAt)}</span>
                                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${item.fieldsCount} champs</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async loadSuggestedPrompts() {
        const suggestedPrompts = [
            "Formulaire de contact pour un site web d'entreprise",
            "Enquête de satisfaction client avec échelle de notation",
            "Formulaire d'inscription à un événement avec informations détaillées",
            "Questionnaire de recrutement pour un poste technique",
            "Formulaire de demande de devis personnalisé",
            "Enquête de feedback produit avec questions ouvertes",
            "Formulaire de réservation de restaurant",
            "Questionnaire d'évaluation de formation"
        ];

        const container = document.getElementById('suggested-prompts');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-3">
                <h4 class="font-medium text-gray-900">Suggestions de prompts</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    ${suggestedPrompts.map(prompt => `
                        <button class="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                                data-suggested-prompt="${prompt}"
                                onclick="aiGeneratorDynamic.fillPrompt('${prompt}')">
                            ${prompt}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    fillPrompt(prompt) {
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            promptInput.value = prompt;
            promptInput.focus();
            this.updatePromptPreview();
        }
    }

    showGenerationInProgress() {
        const button = document.getElementById('generate-button');
        if (button) {
            button.disabled = true;
            button.innerHTML = `
                <div class="flex items-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération en cours...
                </div>
            `;
        }

        // Afficher un indicateur de progression
        const progressContainer = document.getElementById('generation-progress');
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
            progressContainer.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <div>
                            <p class="text-sm font-medium text-blue-900">Génération du formulaire en cours...</p>
                            <p class="text-xs text-blue-700">L'IA analyse votre demande et crée le formulaire optimal</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    hideGenerationInProgress() {
        const button = document.getElementById('generate-button');
        if (button) {
            button.disabled = false;
            button.innerHTML = `
                <i class="ri-magic-line mr-2"></i>Générer avec l'IA
            `;
        }

        const progressContainer = document.getElementById('generation-progress');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
    }

    async saveForm() {
        if (!this.currentForm) return;

        try {
            const loader = this.showLoader('Sauvegarde en cours...');
            
            const savedForm = await this.api.createForm(this.currentForm);
            
            this.hideLoader(loader);
            this.showSuccess('Formulaire sauvegardé avec succès !');
            
            // Rediriger vers le builder pour édition
            setTimeout(() => {
                window.location.href = `/frontend/pages/forms/builder.html?id=${savedForm.data.id}`;
            }, 1500);

        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            this.showError('Erreur lors de la sauvegarde');
        }
    }

    async regenerateForm() {
        const promptInput = document.getElementById('prompt-input');
        if (promptInput?.value) {
            await this.handleGeneration();
        }
    }

    editInBuilder() {
        if (this.currentForm) {
            // Sauvegarder temporairement et rediriger
            localStorage.setItem('temp_ai_form', JSON.stringify(this.currentForm));
            window.location.href = '/frontend/pages/forms/builder.html?from=ai';
        }
    }

    previewForm() {
        if (this.currentForm) {
            // Ouvrir dans un nouvel onglet
            const previewData = encodeURIComponent(JSON.stringify(this.currentForm));
            window.open(`/frontend/pages/forms/preview.html?data=${previewData}`, '_blank');
        }
    }

    exportForm() {
        if (this.currentForm) {
            const dataStr = JSON.stringify(this.currentForm, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${this.currentForm.title || 'formulaire'}_ai.json`;
            link.click();
        }
    }

    loadFromHistory(historyId) {
        const historyItem = this.generationHistory.find(item => item.id === historyId);
        if (historyItem) {
            this.fillPrompt(historyItem.prompt);
            if (historyItem.formData) {
                this.displayGenerationResult(historyItem.formData);
            }
        }
    }

    // Utilitaires
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showUpgradePrompt() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl p-6 max-w-md mx-4">
                <div class="text-center">
                    <i class="ri-magic-line text-4xl text-yellow-500 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Passez Premium</h3>
                    <p class="text-gray-600 mb-6">Débloquez la génération illimitée de formulaires avec l'IA</p>
                    <div class="space-y-3">
                        <button onclick="window.location.href='/frontend/pages/subscription/pricing.html'" 
                                class="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                            Voir les plans Premium
                        </button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                                class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                            Plus tard
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showLoader(message) {
        const loader = document.createElement('div');
        loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loader.innerHTML = `
            <div class="bg-white rounded-lg p-6">
                <div class="flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>${message}</span>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
        return loader;
    }

    hideLoader(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="ri-close-line"></i>
                </button>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Méthodes pour l'interface
    initializeTooltips() {
        // Implementation des tooltips si nécessaire
    }

    setupAutoResizeTextarea() {
        const textarea = document.getElementById('prompt-input');
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        }
    }

    setupAnimations() {
        // Animations CSS avec Intersection Observer
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    toggleAdvancedOptions() {
        const advancedOptions = document.getElementById('advanced-options');
        const toggle = document.getElementById('advanced-options-toggle');
        
        if (advancedOptions) {
            const isHidden = advancedOptions.classList.contains('hidden');
            
            if (isHidden) {
                advancedOptions.classList.remove('hidden');
                toggle.innerHTML = '<i class="ri-arrow-up-s-line mr-2"></i>Masquer les options avancées';
            } else {
                advancedOptions.classList.add('hidden');
                toggle.innerHTML = '<i class="ri-arrow-down-s-line mr-2"></i>Afficher les options avancées';
            }
        }
    }

    updatePromptPreview() {
        // Aperçu en temps réel du prompt (optionnel)
        const promptInput = document.getElementById('prompt-input');
        const previewContainer = document.getElementById('prompt-preview');
        
        if (previewContainer && promptInput) {
            const prompt = promptInput.value.trim();
            if (prompt) {
                // Analyser le prompt et suggérer des améliorations
                const suggestions = this.analyzePrompt(prompt);
                previewContainer.innerHTML = suggestions;
                previewContainer.classList.remove('hidden');
            } else {
                previewContainer.classList.add('hidden');
            }
        }
    }

    analyzePrompt(prompt) {
        // Analyse basique du prompt pour suggérer des améliorations
        const suggestions = [];
        
        if (prompt.length < 20) {
            suggestions.push('💡 Essayez d\'être plus spécifique dans votre description');
        }
        
        if (!prompt.includes('formulaire')) {
            suggestions.push('💡 Mentionnez le type de formulaire souhaité');
        }
        
        if (prompt.split(' ').length < 5) {
            suggestions.push('💡 Ajoutez des détails sur les champs nécessaires');
        }

        if (suggestions.length === 0) {
            suggestions.push('✅ Votre description semble complète !');
        }

        return suggestions.map(s => `<p class="text-sm text-gray-600 mb-1">${s}</p>`).join('');
    }

    addToHistory(prompt, formData) {
        const historyItem = {
            id: Date.now().toString(),
            prompt,
            formData,
            fieldsCount: formData.fields?.length || 0,
            createdAt: new Date().toISOString()
        };
        
        this.generationHistory.unshift(historyItem);
        
        // Limiter l'historique à 10 éléments
        if (this.generationHistory.length > 10) {
            this.generationHistory = this.generationHistory.slice(0, 10);
        }
        
        this.updateHistoryDisplay();
    }

    async updateQuotasAfterGeneration() {
        try {
            const quotas = await this.api.getUserQuotas();
            this.updateAIQuotaDisplay(quotas.data);
        } catch (error) {
            console.error('❌ Erreur mise à jour quotas:', error);
        }
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    window.aiGeneratorDynamic = new AIGeneratorDynamic();
});

console.log('🤖 Script AI Generator dynamique chargé');
