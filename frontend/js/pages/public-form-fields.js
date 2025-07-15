/**
 * Extension du PublicFormManager - Rendu des champs spéciaux
 */

// Extension des méthodes de rendu pour les champs complexes
Object.assign(PublicFormManager.prototype, {

    /**
     * Champ de fichier
     */
    renderFileField(fieldId, field) {
        const accept = field.validation?.allowedTypes?.join(',') || '';
        const maxSize = field.validation?.maxSize || 10; // MB
        const multiple = field.settings?.multiple;
        
        return `
            <div class="file-upload-area border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input type="file" 
                       id="${fieldId}" 
                       name="${fieldId}" 
                       ${accept ? `accept="${accept}"` : ''}
                       ${multiple ? 'multiple' : ''}
                       class="hidden"
                       ${field.required ? 'required' : ''}>
                <label for="${fieldId}" class="cursor-pointer">
                    <i class="ri-upload-cloud-2-line text-4xl text-gray-400 mb-2 block"></i>
                    <p class="text-gray-600 mb-2">Cliquez pour sélectionner ${multiple ? 'des fichiers' : 'un fichier'}</p>
                    <p class="text-sm text-gray-500">
                        ${accept ? `Types acceptés: ${accept}` : 'Tous les types de fichiers'}
                        ${maxSize ? ` • Taille max: ${maxSize}MB` : ''}
                    </p>
                </label>
                <div id="${fieldId}-preview" class="mt-4 hidden">
                    <div class="text-sm text-gray-600">Fichier(s) sélectionné(s):</div>
                    <div id="${fieldId}-files" class="mt-2 space-y-1"></div>
                </div>
            </div>
        `;
    },

    /**
     * Champ d'évaluation par étoiles
     */
    renderRatingField(fieldId, field) {
        const maxStars = field.settings?.maxStars || 5;
        const allowHalf = field.settings?.allowHalf || false;
        
        let html = `
            <div class="rating-container flex items-center space-x-1">
                <input type="hidden" id="${fieldId}" name="${fieldId}" value="" ${field.required ? 'required' : ''}>
        `;
        
        for (let i = 1; i <= maxStars; i++) {
            html += `
                <i class="rating-star ri-star-line text-2xl text-gray-300 cursor-pointer" 
                   data-rating="${i}" 
                   data-field="${fieldId}"></i>
            `;
        }
        
        html += `
            </div>
            <div class="text-sm text-gray-500 mt-2">
                Cliquez sur les étoiles pour noter (1 à ${maxStars})
            </div>
        `;
        
        return html;
    },

    /**
     * Champ curseur
     */
    renderSliderField(fieldId, field) {
        const min = field.settings?.min || 0;
        const max = field.settings?.max || 100;
        const step = field.settings?.step || 1;
        const defaultValue = field.settings?.defaultValue || min;
        const showValue = field.settings?.showValue !== false;
        
        return `
            <div class="slider-container">
                <input type="range" 
                       id="${fieldId}" 
                       name="${fieldId}" 
                       min="${min}" 
                       max="${max}" 
                       step="${step}" 
                       value="${defaultValue}"
                       class="form-slider w-full"
                       ${field.required ? 'required' : ''}>
                ${showValue ? `
                    <div class="flex justify-between text-sm text-gray-600 mt-2">
                        <span>${min}</span>
                        <span id="${fieldId}-value" class="font-medium">${defaultValue}</span>
                        <span>${max}</span>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Champ de signature électronique
     */
    renderSignatureField(fieldId, field) {
        const width = field.settings?.width || 400;
        const height = field.settings?.height || 200;
        
        return `
            <div class="signature-container">
                <canvas id="${fieldId}-canvas" 
                        class="signature-canvas w-full" 
                        width="${width}" 
                        height="${height}"></canvas>
                <input type="hidden" id="${fieldId}" name="${fieldId}" ${field.required ? 'required' : ''}>
                <div class="flex justify-between items-center mt-3">
                    <div class="text-sm text-gray-600">
                        <i class="ri-edit-pen-line mr-1"></i>
                        Signez dans la zone ci-dessus
                    </div>
                    <button type="button" 
                            class="text-sm text-blue-600 hover:text-blue-800" 
                            onclick="clearSignature('${fieldId}')">
                        <i class="ri-eraser-line mr-1"></i>
                        Effacer
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Champ devise
     */
    renderCurrencyField(fieldId, field) {
        const currency = field.settings?.currency || 'EUR';
        const symbols = {
            EUR: '€',
            USD: '$',
            GBP: '£',
            CAD: 'C$',
            CHF: 'CHF'
        };
        const symbol = symbols[currency] || currency;
        
        return `
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 font-medium">${symbol}</span>
                </div>
                <input type="number" 
                       id="${fieldId}" 
                       name="${fieldId}" 
                       step="0.01" 
                       min="0"
                       placeholder="0.00"
                       class="form-input w-full p-3 pl-8 border border-gray-300 rounded-lg"
                       ${field.required ? 'required' : ''}>
            </div>
        `;
    },

    /**
     * Champ de paiement Stripe
     */
    renderStripePaymentField(fieldId, field) {
        const amount = field.settings?.amount || 0;
        const currency = field.settings?.currency || 'EUR';
        const description = field.settings?.description || 'Paiement';
        
        return `
            <div class="payment-section">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="font-semibold text-gray-900">${description}</h4>
                        <p class="text-sm text-gray-600">Paiement sécurisé via Stripe</p>
                    </div>
                    <div class="text-2xl font-bold text-blue-600">
                        ${amount}${currency === 'EUR' ? '€' : currency}
                    </div>
                </div>
                
                <div id="${fieldId}-stripe-elements" class="mb-4">
                    <!-- Éléments Stripe seront injectés ici -->
                </div>
                
                <input type="hidden" id="${fieldId}" name="${fieldId}" ${field.required ? 'required' : ''}>
                
                <div class="flex items-center text-sm text-gray-500">
                    <i class="ri-secure-payment-line mr-2"></i>
                    Paiement sécurisé SSL
                </div>
            </div>
        `;
    },

    /**
     * Champ de paiement PayPal
     */
    renderPayPalPaymentField(fieldId, field) {
        const amount = field.settings?.amount || 0;
        const currency = field.settings?.currency || 'EUR';
        const description = field.settings?.description || 'Paiement';
        
        return `
            <div class="payment-section">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="font-semibold text-gray-900">${description}</h4>
                        <p class="text-sm text-gray-600">Paiement sécurisé via PayPal</p>
                    </div>
                    <div class="text-2xl font-bold text-blue-600">
                        ${amount}${currency === 'EUR' ? '€' : currency}
                    </div>
                </div>
                
                <div id="${fieldId}-paypal-buttons" class="mb-4">
                    <!-- Boutons PayPal seront injectés ici -->
                </div>
                
                <input type="hidden" id="${fieldId}" name="${fieldId}" ${field.required ? 'required' : ''}>
                
                <div class="flex items-center text-sm text-gray-500">
                    <i class="ri-paypal-line mr-2"></i>
                    Paiement sécurisé PayPal
                </div>
            </div>
        `;
    },

    /**
     * Champ de consentement RGPD
     */
    renderConsentField(fieldId, field) {
        const consentText = field.settings?.text || "J'accepte les conditions d'utilisation et la politique de confidentialité.";
        const links = field.settings?.links || {};
        
        let processedText = consentText;
        
        // Remplacer les liens dans le texte
        if (links.privacy) {
            processedText = processedText.replace(
                'politique de confidentialité',
                `<a href="${links.privacy}" target="_blank" class="text-blue-600 underline">politique de confidentialité</a>`
            );
        }
        
        if (links.terms) {
            processedText = processedText.replace(
                "conditions d'utilisation",
                `<a href="${links.terms}" target="_blank" class="text-blue-600 underline">conditions d'utilisation</a>`
            );
        }
        
        return `
            <label class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" 
                       id="${fieldId}" 
                       name="${fieldId}" 
                       value="accepted"
                       class="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded mt-1"
                       ${field.required ? 'required' : ''}>
                <div>
                    <span class="block text-sm font-medium text-gray-900 mb-1">
                        ${field.label}
                        ${field.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
                    </span>
                    <div class="text-sm text-gray-600">${processedText}</div>
                </div>
            </label>
        `;
    },

    /**
     * Champ de calcul automatique
     */
    renderCalculationField(fieldId, field) {
        const formula = field.settings?.formula || '';
        const dependencies = field.settings?.dependencies || [];
        
        return `
            <div class="calculation-field bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">Calcul automatique</span>
                    <i class="ri-calculator-line text-gray-400"></i>
                </div>
                <div id="${fieldId}-result" class="text-2xl font-bold text-blue-600 mt-2">
                    0
                </div>
                <input type="hidden" id="${fieldId}" name="${fieldId}" value="0">
                <div class="text-xs text-gray-500 mt-2">
                    Basé sur: ${dependencies.join(', ')}
                </div>
            </div>
        `;
    },

    /**
     * Champ Captcha
     */
    renderCaptchaField(fieldId, field) {
        const captchaType = field.settings?.type || 'simple';
        
        if (captchaType === 'recaptcha') {
            return `
                <div class="captcha-container">
                    <div id="${fieldId}-recaptcha" class="g-recaptcha"></div>
                    <input type="hidden" id="${fieldId}" name="${fieldId}" ${field.required ? 'required' : ''}>
                </div>
            `;
        }
        
        // Captcha simple mathématique
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const result = num1 + num2;
        
        return `
            <div class="captcha-container bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-4">
                    <div class="text-lg font-mono bg-white px-4 py-2 rounded border">
                        ${num1} + ${num2} = ?
                    </div>
                    <input type="number" 
                           id="${fieldId}" 
                           name="${fieldId}" 
                           placeholder="Résultat"
                           class="form-input w-24 p-3 border border-gray-300 rounded-lg"
                           data-captcha-result="${result}"
                           ${field.required ? 'required' : ''}>
                </div>
                <div class="text-sm text-gray-600 mt-2">
                    <i class="ri-shield-check-line mr-1"></i>
                    Vérification anti-robot
                </div>
            </div>
        `;
    },

    /**
     * Champ de section
     */
    renderSectionField(field) {
        return `
            <div class="section-field bg-white rounded-xl shadow-lg p-6 text-center">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">${field.label}</h3>
                ${field.description ? `<p class="text-gray-600">${field.description}</p>` : ''}
            </div>
        `;
    },

    /**
     * Champ HTML personnalisé
     */
    renderHtmlField(field) {
        const htmlContent = field.settings?.content || '';
        
        return `
            <div class="html-field bg-white rounded-xl shadow-lg p-6">
                ${htmlContent}
            </div>
        `;
    },

    /**
     * Initialiser les éléments spéciaux après rendu
     */
    initializeSpecialFields() {
        this.initializeFileFields();
        this.initializeRatingFields();
        this.initializeSliderFields();
        this.initializeSignatureFields();
        this.initializePaymentFields();
        this.initializeCalculationFields();
    },

    /**
     * Initialiser les champs de fichier
     */
    initializeFileFields() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileSelection(e);
            });
        });
    },

    /**
     * Gérer la sélection de fichiers
     */
    handleFileSelection(e) {
        const input = e.target;
        const fieldId = input.id;
        const preview = document.getElementById(`${fieldId}-preview`);
        const filesContainer = document.getElementById(`${fieldId}-files`);
        
        if (input.files.length > 0) {
            preview.classList.remove('hidden');
            filesContainer.innerHTML = '';
            
            Array.from(input.files).forEach((file, index) => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'flex items-center space-x-2 text-sm bg-blue-50 px-3 py-2 rounded';
                fileDiv.innerHTML = `
                    <i class="ri-file-line text-blue-600"></i>
                    <span class="flex-1 truncate">${file.name}</span>
                    <span class="text-gray-500">${this.formatFileSize(file.size)}</span>
                `;
                filesContainer.appendChild(fileDiv);
            });
        } else {
            preview.classList.add('hidden');
        }
    },

    /**
     * Formater la taille de fichier
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Initialiser les champs d'évaluation
     */
    initializeRatingFields() {
        document.querySelectorAll('.rating-star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.handleRatingClick(e);
            });
            
            star.addEventListener('mouseenter', (e) => {
                this.handleRatingHover(e);
            });
        });
        
        document.querySelectorAll('.rating-container').forEach(container => {
            container.addEventListener('mouseleave', (e) => {
                this.resetRatingDisplay(e.currentTarget);
            });
        });
    },

    /**
     * Gérer le clic sur une étoile
     */
    handleRatingClick(e) {
        const star = e.target;
        const rating = parseInt(star.dataset.rating);
        const fieldId = star.dataset.field;
        const container = star.closest('.rating-container');
        const hiddenInput = document.getElementById(fieldId);
        
        hiddenInput.value = rating;
        this.updateRatingDisplay(container, rating);
        
        // Validation
        this.validateField(hiddenInput);
    },

    /**
     * Gérer le survol des étoiles
     */
    handleRatingHover(e) {
        const star = e.target;
        const rating = parseInt(star.dataset.rating);
        const container = star.closest('.rating-container');
        
        this.updateRatingDisplay(container, rating, true);
    },

    /**
     * Mettre à jour l'affichage des étoiles
     */
    updateRatingDisplay(container, rating, isHover = false) {
        const stars = container.querySelectorAll('.rating-star');
        
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
                star.classList.remove('ri-star-line');
                star.classList.add('ri-star-fill', 'active');
                star.style.color = isHover ? '#fbbf24' : '#f59e0b';
            } else {
                star.classList.remove('ri-star-fill', 'active');
                star.classList.add('ri-star-line');
                star.style.color = '#d1d5db';
            }
        });
    },

    /**
     * Réinitialiser l'affichage des étoiles
     */
    resetRatingDisplay(container) {
        const fieldId = container.querySelector('.rating-star').dataset.field;
        const hiddenInput = document.getElementById(fieldId);
        const currentRating = parseInt(hiddenInput.value) || 0;
        
        this.updateRatingDisplay(container, currentRating);
    }
});

// Fonctions globales pour les éléments interactifs
window.clearSignature = function(fieldId) {
    const manager = window.publicFormManager;
    if (manager && manager.signaturePads[fieldId]) {
        manager.signaturePads[fieldId].clear();
        document.getElementById(fieldId).value = '';
        manager.validateField(document.getElementById(fieldId));
    }
};
