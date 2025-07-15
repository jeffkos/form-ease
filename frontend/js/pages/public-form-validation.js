/**
 * Extension du PublicFormManager - Validation et Soumission
 */

Object.assign(PublicFormManager.prototype, {

    /**
     * Configurer la validation
     */
    setupValidation() {
        // Règles de validation par type de champ
        this.validationRules = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Veuillez entrer une adresse email valide'
            },
            website: {
                pattern: /^https?:\/\/.+/,
                message: 'Veuillez entrer une URL valide (http:// ou https://)'
            },
            number_only: {
                pattern: /^\d+(\.\d+)?$/,
                message: 'Veuillez entrer un nombre valide'
            }
        };
    },

    /**
     * Gérer les changements de champ
     */
    handleFieldChange(e) {
        const field = e.target;
        
        // Validation en temps réel
        this.validateField(field);
        
        // Gestion spéciale selon le type
        this.handleSpecialFieldChange(field);
        
        // Sauvegarde automatique des réponses
        this.saveFieldResponse(field);
        
        // Mise à jour des calculs
        this.updateCalculations();
    },

    /**
     * Gérer les changements spéciaux
     */
    handleSpecialFieldChange(field) {
        const fieldType = field.closest('[data-field-type]')?.dataset.fieldType;
        
        switch (fieldType) {
            case 'slider':
                this.updateSliderValue(field);
                break;
            case 'captcha':
                this.validateCaptcha(field);
                break;
            case 'currency':
                this.formatCurrencyValue(field);
                break;
        }
    },

    /**
     * Mettre à jour la valeur du slider
     */
    updateSliderValue(slider) {
        const valueDisplay = document.getElementById(`${slider.id}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = slider.value;
        }
    },

    /**
     * Valider le captcha
     */
    validateCaptcha(field) {
        if (field.dataset.captchaResult) {
            const expectedResult = parseInt(field.dataset.captchaResult);
            const userResult = parseInt(field.value);
            
            if (userResult === expectedResult) {
                this.showFieldSuccess(field, 'Captcha valide');
            } else if (field.value) {
                this.showFieldError(field, 'Résultat incorrect');
            }
        }
    },

    /**
     * Formater la valeur de devise
     */
    formatCurrencyValue(field) {
        const value = parseFloat(field.value);
        if (!isNaN(value)) {
            field.value = value.toFixed(2);
        }
    },

    /**
     * Valider un champ
     */
    validateField(field) {
        if (!field || field.type === 'hidden') return true;
        
        const fieldContainer = field.closest('.form-field');
        const fieldType = fieldContainer?.dataset.fieldType;
        const isRequired = field.hasAttribute('required');
        
        // Effacer les erreurs précédentes
        this.clearFieldError(field);
        
        // Validation requis
        if (isRequired && this.isEmpty(field)) {
            this.showFieldError(field, 'Ce champ est obligatoire');
            return false;
        }
        
        // Si vide et non requis, c'est valide
        if (this.isEmpty(field)) {
            return true;
        }
        
        // Validation selon le type
        return this.validateFieldType(field, fieldType);
    },

    /**
     * Vérifier si un champ est vide
     */
    isEmpty(field) {
        if (field.type === 'checkbox' || field.type === 'radio') {
            const name = field.name;
            const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
            return checked.length === 0;
        }
        
        return !field.value || field.value.trim() === '';
    },

    /**
     * Valider selon le type de champ
     */
    validateFieldType(field, fieldType) {
        switch (fieldType) {
            case 'email':
                return this.validateEmail(field);
            case 'website':
                return this.validateWebsite(field);
            case 'number_only':
                return this.validateNumber(field);
            case 'file':
                return this.validateFile(field);
            case 'address':
                return this.validateAddress(field);
            case 'captcha':
                return this.validateCaptchaField(field);
            case 'signature':
                return this.validateSignature(field);
            case 'rating':
                return this.validateRating(field);
            default:
                return true;
        }
    },

    /**
     * Valider email
     */
    validateEmail(field) {
        const rule = this.validationRules.email;
        if (!rule.pattern.test(field.value)) {
            this.showFieldError(field, rule.message);
            return false;
        }
        return true;
    },

    /**
     * Valider website
     */
    validateWebsite(field) {
        const rule = this.validationRules.website;
        if (!rule.pattern.test(field.value)) {
            this.showFieldError(field, rule.message);
            return false;
        }
        return true;
    },

    /**
     * Valider nombre
     */
    validateNumber(field) {
        const value = parseFloat(field.value);
        
        if (isNaN(value)) {
            this.showFieldError(field, 'Veuillez entrer un nombre valide');
            return false;
        }
        
        // Vérifier min/max
        const min = field.getAttribute('min');
        const max = field.getAttribute('max');
        
        if (min !== null && value < parseFloat(min)) {
            this.showFieldError(field, `La valeur doit être supérieure ou égale à ${min}`);
            return false;
        }
        
        if (max !== null && value > parseFloat(max)) {
            this.showFieldError(field, `La valeur doit être inférieure ou égale à ${max}`);
            return false;
        }
        
        return true;
    },

    /**
     * Valider fichier
     */
    validateFile(field) {
        if (!field.files || field.files.length === 0) return true;
        
        const maxSize = 10 * 1024 * 1024; // 10MB par défaut
        const allowedTypes = field.accept ? field.accept.split(',').map(t => t.trim()) : [];
        
        for (let file of field.files) {
            // Vérifier la taille
            if (file.size > maxSize) {
                this.showFieldError(field, `Le fichier "${file.name}" est trop volumineux (max 10MB)`);
                return false;
            }
            
            // Vérifier le type
            if (allowedTypes.length > 0) {
                const fileType = file.type;
                const fileName = file.name.toLowerCase();
                
                const isAllowed = allowedTypes.some(type => {
                    if (type.startsWith('.')) {
                        return fileName.endsWith(type);
                    }
                    return fileType.match(type.replace('*', '.*'));
                });
                
                if (!isAllowed) {
                    this.showFieldError(field, `Le type de fichier "${file.name}" n'est pas autorisé`);
                    return false;
                }
            }
        }
        
        return true;
    },

    /**
     * Valider adresse
     */
    validateAddress(field) {
        const fieldContainer = field.closest('.form-field');
        const addressFields = fieldContainer.querySelectorAll('input, select');
        let isValid = true;
        
        addressFields.forEach(subField => {
            if (subField.hasAttribute('required') && !subField.value.trim()) {
                this.showFieldError(subField, 'Ce champ est obligatoire');
                isValid = false;
            }
        });
        
        return isValid;
    },

    /**
     * Valider captcha
     */
    validateCaptchaField(field) {
        if (field.dataset.captchaResult) {
            const expectedResult = parseInt(field.dataset.captchaResult);
            const userResult = parseInt(field.value);
            
            if (userResult !== expectedResult) {
                this.showFieldError(field, 'Résultat du captcha incorrect');
                return false;
            }
        }
        
        return true;
    },

    /**
     * Valider signature
     */
    validateSignature(field) {
        if (!field.value) {
            this.showFieldError(field, 'La signature est obligatoire');
            return false;
        }
        return true;
    },

    /**
     * Valider rating
     */
    validateRating(field) {
        const rating = parseInt(field.value);
        if (isNaN(rating) || rating < 1) {
            this.showFieldError(field, 'Veuillez donner une note');
            return false;
        }
        return true;
    },

    /**
     * Afficher une erreur de champ
     */
    showFieldError(field, message) {
        const fieldContainer = field.closest('.form-field') || field.parentElement;
        const errorElement = fieldContainer.querySelector('.error-message') || 
                           document.getElementById(`${field.id}-error`);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        
        field.classList.add('error');
    },

    /**
     * Afficher un succès de champ
     */
    showFieldSuccess(field, message) {
        // Optionnel: afficher un message de succès
        this.clearFieldError(field);
    },

    /**
     * Effacer l'erreur d'un champ
     */
    clearFieldError(field) {
        const fieldContainer = field.closest('.form-field') || field.parentElement;
        const errorElement = fieldContainer.querySelector('.error-message') || 
                           document.getElementById(`${field.id}-error`);
        
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        
        field.classList.remove('error');
    },

    /**
     * Sauvegarder la réponse d'un champ
     */
    saveFieldResponse(field) {
        if (field.type === 'hidden') return;
        
        const fieldId = field.id || field.name;
        
        if (field.type === 'checkbox' || field.type === 'radio') {
            const name = field.name;
            const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
            
            if (field.type === 'checkbox' && name.endsWith('[]')) {
                // Cases à cocher multiples
                this.responses[fieldId] = Array.from(checked).map(cb => cb.value);
            } else {
                // Radio ou case unique
                this.responses[fieldId] = checked.length > 0 ? checked[0].value : null;
            }
        } else if (field.type === 'file') {
            // Les fichiers seront traités lors de la soumission
            this.responses[fieldId] = field.files.length > 0 ? Array.from(field.files).map(f => f.name) : null;
        } else {
            this.responses[fieldId] = field.value;
        }
    },

    /**
     * Initialiser les calculs
     */
    initializeCalculationFields() {
        const calculationFields = document.querySelectorAll('[data-field-type="calculations"]');
        
        calculationFields.forEach(fieldContainer => {
            const field = fieldContainer.querySelector('input[type="hidden"]');
            const fieldData = this.getFieldDataById(field.id);
            
            if (fieldData?.settings?.dependencies) {
                this.setupCalculationWatchers(field, fieldData);
            }
        });
    },

    /**
     * Configurer les surveillants de calcul
     */
    setupCalculationWatchers(calculationField, fieldData) {
        const dependencies = fieldData.settings.dependencies || [];
        
        dependencies.forEach(depId => {
            const depField = document.getElementById(depId);
            if (depField) {
                depField.addEventListener('input', () => {
                    this.updateCalculation(calculationField, fieldData);
                });
            }
        });
        
        // Calcul initial
        this.updateCalculation(calculationField, fieldData);
    },

    /**
     * Mettre à jour un calcul
     */
    updateCalculation(calculationField, fieldData) {
        try {
            const formula = fieldData.settings.formula;
            const dependencies = fieldData.settings.dependencies || [];
            
            // Récupérer les valeurs des champs dépendants
            const values = {};
            dependencies.forEach(depId => {
                const depField = document.getElementById(depId);
                values[depId] = parseFloat(depField?.value) || 0;
            });
            
            // Évaluer la formule (attention: en production, utiliser un parser sécurisé)
            let result = this.evaluateFormula(formula, values);
            
            // Mettre à jour l'affichage
            calculationField.value = result;
            const resultDisplay = document.getElementById(`${calculationField.id}-result`);
            if (resultDisplay) {
                resultDisplay.textContent = this.formatNumber(result);
            }
            
        } catch (error) {
            console.warn('Erreur de calcul:', error);
        }
    },

    /**
     * Évaluer une formule simple (version sécurisée)
     */
    evaluateFormula(formula, values) {
        // Remplacer les variables par leurs valeurs
        let processedFormula = formula;
        Object.keys(values).forEach(varName => {
            const regex = new RegExp(`\\b${varName}\\b`, 'g');
            processedFormula = processedFormula.replace(regex, values[varName]);
        });
        
        // Validation de sécurité (ne permet que des opérations mathématiques de base)
        if (!/^[0-9+\-*/().\s]+$/.test(processedFormula)) {
            throw new Error('Formule non sécurisée');
        }
        
        // Évaluation
        try {
            return Function(`"use strict"; return (${processedFormula})`)();
        } catch (error) {
            throw new Error('Erreur d\'évaluation de formule');
        }
    },

    /**
     * Mettre à jour tous les calculs
     */
    updateCalculations() {
        const calculationFields = document.querySelectorAll('[data-field-type="calculations"] input[type="hidden"]');
        
        calculationFields.forEach(field => {
            const fieldData = this.getFieldDataById(field.id);
            if (fieldData) {
                this.updateCalculation(field, fieldData);
            }
        });
    },

    /**
     * Obtenir les données d'un champ par ID
     */
    getFieldDataById(fieldId) {
        if (!this.formData?.fields) return null;
        
        return this.formData.fields.find(field => 
            (field.id === fieldId) || 
            (`field_${this.formData.fields.indexOf(field)}` === fieldId)
        );
    },

    /**
     * Formater un nombre
     */
    formatNumber(number) {
        if (isNaN(number)) return '0';
        
        // Formater avec 2 décimales si nécessaire
        if (number % 1 === 0) {
            return number.toString();
        } else {
            return number.toFixed(2);
        }
    },

    /**
     * Gérer la soumission du formulaire
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) {
            return;
        }
        
        console.log('📤 Soumission du formulaire');
        
        // Valider tous les champs
        if (!this.validateAllFields()) {
            this.showGlobalError('Veuillez corriger les erreurs dans le formulaire.');
            return;
        }
        
        // Si formulaire multi-pages, vérifier qu'on est sur la dernière page
        if (this.totalPages > 1 && this.currentPage < this.totalPages) {
            this.nextPage();
            return;
        }
        
        this.isSubmitting = true;
        this.showSubmittingState();
        
        try {
            // Collecter toutes les réponses
            const formData = this.collectFormData();
            
            // Envoyer les données
            const response = await this.submitFormData(formData);
            
            if (response.success) {
                this.showSuccessPage(response.data);
                
                // Tracking de soumission
                this.trackFormSubmission();
            } else {
                throw new Error(response.error || 'Erreur lors de la soumission');
            }
            
        } catch (error) {
            console.error('❌ Erreur soumission:', error);
            this.showGlobalError(error.message);
            this.hideSubmittingState();
        }
        
        this.isSubmitting = false;
    },

    /**
     * Valider tous les champs
     */
    validateAllFields() {
        const allFields = document.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        allFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    },

    /**
     * Collecter les données du formulaire
     */
    collectFormData() {
        const formData = new FormData();
        const jsonData = {
            formId: this.formId,
            responses: {},
            metadata: {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                completionTime: this.getCompletionTime()
            }
        };
        
        // Collecter les champs normaux
        const fields = document.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (field.type === 'file') {
                // Gérer les fichiers séparément
                if (field.files.length > 0) {
                    Array.from(field.files).forEach((file, index) => {
                        formData.append(`${field.name}_file_${index}`, file);
                    });
                    jsonData.responses[field.name] = Array.from(field.files).map(f => f.name);
                }
            } else if (field.type === 'checkbox') {
                if (field.name.endsWith('[]')) {
                    // Checkboxes multiples
                    const name = field.name.replace('[]', '');
                    if (!jsonData.responses[name]) {
                        jsonData.responses[name] = [];
                    }
                    if (field.checked) {
                        jsonData.responses[name].push(field.value);
                    }
                } else {
                    // Checkbox unique
                    jsonData.responses[field.name] = field.checked ? field.value : null;
                }
            } else if (field.type === 'radio') {
                if (field.checked) {
                    jsonData.responses[field.name] = field.value;
                }
            } else {
                jsonData.responses[field.name] = field.value;
            }
        });
        
        // Ajouter les données JSON
        formData.append('data', JSON.stringify(jsonData));
        
        return formData;
    },

    /**
     * Soumettre les données
     */
    async submitFormData(formData) {
        const response = await fetch(`/api/public/forms/${this.formId}/submit`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return response.json();
    },

    /**
     * Afficher l'état de soumission
     */
    showSubmittingState() {
        const submitBtn = document.getElementById('submit-btn');
        const submitText = document.getElementById('submit-text');
        const submitSpinner = document.getElementById('submit-spinner');
        
        if (submitBtn) submitBtn.disabled = true;
        if (submitText) submitText.textContent = 'Envoi en cours...';
        if (submitSpinner) submitSpinner.classList.remove('hidden');
    },

    /**
     * Masquer l'état de soumission
     */
    hideSubmittingState() {
        const submitBtn = document.getElementById('submit-btn');
        const submitText = document.getElementById('submit-text');
        const submitSpinner = document.getElementById('submit-spinner');
        
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Envoyer le formulaire';
        if (submitSpinner) submitSpinner.classList.add('hidden');
    },

    /**
     * Afficher la page de succès
     */
    showSuccessPage(responseData) {
        document.getElementById('public-form').style.display = 'none';
        document.getElementById('submit-container').style.display = 'none';
        document.getElementById('form-navigation').style.display = 'none';
        
        const successPage = document.getElementById('success-page');
        const successMessage = document.getElementById('success-message-display');
        
        if (successMessage && responseData?.message) {
            successMessage.textContent = responseData.message;
        }
        
        successPage.classList.remove('hidden');
        
        // Faire défiler vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Afficher une erreur globale
     */
    showGlobalError(message) {
        const container = document.getElementById('global-messages');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message-global p-4 rounded-lg mb-4';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="ri-error-warning-line text-red-600 mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.innerHTML = '';
        container.appendChild(errorDiv);
        
        // Auto-hide après 5 secondes
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    },

    /**
     * Calculer le temps de completion
     */
    getCompletionTime() {
        if (this.startTime) {
            return Math.round((Date.now() - this.startTime) / 1000);
        }
        return null;
    },

    /**
     * Tracking de soumission
     */
    async trackFormSubmission() {
        try {
            await fetch(`/api/analytics/forms/${this.formId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    completionTime: this.getCompletionTime()
                })
            });
        } catch (error) {
            console.warn('⚠️ Erreur tracking soumission:', error);
        }
    }
});
