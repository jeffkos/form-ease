/**
 * 🧪 FormEase - Script de Test des Nouveaux Champs
 * Test et validation de tous les types de champs du Form Builder
 */

class FormBuilderTester {
    constructor() {
        this.testResults = {};
        this.formBuilder = null;
    }

    async runAllTests() {
        console.log('🧪 Démarrage des tests du Form Builder...');
        
        // Attendre que le FormBuilder soit initialisé
        if (window.formBuilder) {
            this.formBuilder = window.formBuilder;
        } else {
            console.error('❌ FormBuilder non trouvé');
            return;
        }

        const tests = [
            this.testBasicFields(),
            this.testSelectionFields(), 
            this.testDateTimeFields(),
            this.testAdvancedFields(),
            this.testPaymentFields(),
            this.testLayoutFields(),
            this.testPremiumValidation(),
            this.testFieldRendering(),
            this.testFieldValidation(),
            this.testFieldPersistence()
        ];

        try {
            await Promise.all(tests);
            this.displayTestResults();
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
        }
    }

    async testBasicFields() {
        console.log('📝 Test des champs de base...');
        
        const basicFieldTypes = [
            'text', 'textarea', 'email', 'number_only', 
            'address', 'website', 'hidden'
        ];

        const results = [];
        
        for (const fieldType of basicFieldTypes) {
            try {
                // Tester l'ajout du champ
                this.formBuilder.addFieldFromTemplate(fieldType);
                
                // Vérifier que le champ a été ajouté
                const field = this.formBuilder.formFields.find(f => f.type === fieldType);
                const isAdded = !!field;
                
                // Vérifier le rendu
                const preview = this.formBuilder.renderFieldPreview(field);
                const hasPreview = !!preview && preview.length > 0;
                
                results.push({
                    type: fieldType,
                    added: isAdded,
                    preview: hasPreview,
                    success: isAdded && hasPreview
                });
                
                console.log(`  ✅ ${fieldType}: ${isAdded && hasPreview ? 'OK' : 'ERREUR'}`);
                
            } catch (error) {
                console.error(`  ❌ ${fieldType}: ${error.message}`);
                results.push({
                    type: fieldType,
                    added: false,
                    preview: false,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.testResults.basicFields = results;
    }

    async testSelectionFields() {
        console.log('🎯 Test des champs de sélection...');
        
        const selectionFieldTypes = [
            'select', 'radio', 'checkbox', 'slider', 'rating'
        ];

        const results = [];
        
        for (const fieldType of selectionFieldTypes) {
            try {
                this.formBuilder.addFieldFromTemplate(fieldType);
                const field = this.formBuilder.formFields.find(f => f.type === fieldType);
                
                // Tests spécifiques aux champs de sélection
                const hasOptions = fieldType === 'slider' || fieldType === 'rating' ? 
                    !!field.settings : field.options && field.options.length > 0;
                
                const preview = this.formBuilder.renderFieldPreview(field);
                const hasPreview = !!preview && preview.length > 0;
                
                results.push({
                    type: fieldType,
                    added: !!field,
                    hasOptions,
                    preview: hasPreview,
                    success: !!field && hasOptions && hasPreview
                });
                
                console.log(`  ✅ ${fieldType}: ${!!field && hasOptions && hasPreview ? 'OK' : 'ERREUR'}`);
                
            } catch (error) {
                console.error(`  ❌ ${fieldType}: ${error.message}`);
                results.push({
                    type: fieldType,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.testResults.selectionFields = results;
    }

    async testDateTimeFields() {
        console.log('📅 Test des champs de date et heure...');
        
        const dateTimeFieldTypes = ['date', 'time', 'publish_date'];
        const results = [];
        
        for (const fieldType of dateTimeFieldTypes) {
            try {
                this.formBuilder.addFieldFromTemplate(fieldType);
                const field = this.formBuilder.formFields.find(f => f.type === fieldType);
                
                const preview = this.formBuilder.renderFieldPreview(field);
                const hasPreview = !!preview && preview.length > 0;
                
                // Vérifier les éléments spécifiques
                const hasDateInput = preview.includes('type="date"') || 
                                   preview.includes('type="time"') || 
                                   preview.includes('type="datetime-local"');
                
                results.push({
                    type: fieldType,
                    added: !!field,
                    preview: hasPreview,
                    hasDateInput,
                    success: !!field && hasPreview && hasDateInput
                });
                
                console.log(`  ✅ ${fieldType}: ${!!field && hasPreview && hasDateInput ? 'OK' : 'ERREUR'}`);
                
            } catch (error) {
                console.error(`  ❌ ${fieldType}: ${error.message}`);
                results.push({
                    type: fieldType,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.testResults.dateTimeFields = results;
    }

    async testAdvancedFields() {
        console.log('⚙️ Test des champs avancés...');
        
        const advancedFieldTypes = [
            'file', 'signature', 'captcha', 'html', 'calculations'
        ];
        
        const results = [];
        
        for (const fieldType of advancedFieldTypes) {
            try {
                this.formBuilder.addFieldFromTemplate(fieldType);
                const field = this.formBuilder.formFields.find(f => f.type === fieldType);
                
                const preview = this.formBuilder.renderFieldPreview(field);
                const hasPreview = !!preview && preview.length > 0;
                
                // Vérifications spécifiques
                let specificCheck = true;
                if (fieldType === 'signature') {
                    specificCheck = preview.includes('Signature électronique');
                } else if (fieldType === 'captcha') {
                    specificCheck = preview.includes('robot');
                } else if (fieldType === 'html') {
                    specificCheck = preview.includes('HTML');
                } else if (fieldType === 'calculations') {
                    specificCheck = preview.includes('Calcul');
                }
                
                results.push({
                    type: fieldType,
                    added: !!field,
                    preview: hasPreview,
                    specificCheck,
                    success: !!field && hasPreview && specificCheck
                });
                
                console.log(`  ✅ ${fieldType}: ${!!field && hasPreview && specificCheck ? 'OK' : 'ERREUR'}`);
                
            } catch (error) {
                console.error(`  ❌ ${fieldType}: ${error.message}`);
                results.push({
                    type: fieldType,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.testResults.advancedFields = results;
    }

    async testPaymentFields() {
        console.log('💳 Test des champs de paiement...');
        
        const paymentFieldTypes = ['currency', 'stripe_payment', 'paypal_payment'];
        const results = [];
        
        for (const fieldType of paymentFieldTypes) {
            try {
                this.formBuilder.addFieldFromTemplate(fieldType);
                const field = this.formBuilder.formFields.find(f => f.type === fieldType);
                
                const preview = this.formBuilder.renderFieldPreview(field);
                const hasPreview = !!preview && preview.length > 0;
                
                // Vérifications spécifiques aux paiements
                let paymentCheck = true;
                if (fieldType === 'currency') {
                    paymentCheck = preview.includes('€') || preview.includes('$');
                } else if (fieldType === 'stripe_payment') {
                    paymentCheck = preview.includes('Stripe');
                } else if (fieldType === 'paypal_payment') {
                    paymentCheck = preview.includes('PayPal');
                }
                
                results.push({
                    type: fieldType,
                    added: !!field,
                    preview: hasPreview,
                    paymentCheck,
                    success: !!field && hasPreview && paymentCheck
                });
                
                console.log(`  ✅ ${fieldType}: ${!!field && hasPreview && paymentCheck ? 'OK' : 'ERREUR'}`);
                
            } catch (error) {
                console.error(`  ❌ ${fieldType}: ${error.message}`);
                results.push({
                    type: fieldType,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.testResults.paymentFields = results;
    }

    async testLayoutFields() {
        console.log('📐 Test des éléments de structure...');
        
        const layoutFieldTypes = ['section', 'field_group', 'page_break', 'consent'];
        const results = [];
        
        for (const fieldType of layoutFieldTypes) {
            try {
                this.formBuilder.addFieldFromTemplate(fieldType);
                const field = this.formBuilder.formFields.find(f => f.type === fieldType);
                
                const preview = this.formBuilder.renderFieldPreview(field);
                const hasPreview = !!preview && preview.length > 0;
                
                // Vérifications spécifiques à la structure
                let structureCheck = true;
                if (fieldType === 'section') {
                    structureCheck = preview.includes('border-l-4');
                } else if (fieldType === 'page_break') {
                    structureCheck = preview.includes('page');
                } else if (fieldType === 'consent') {
                    structureCheck = preview.includes('checkbox');
                }
                
                results.push({
                    type: fieldType,
                    added: !!field,
                    preview: hasPreview,
                    structureCheck,
                    success: !!field && hasPreview && structureCheck
                });
                
                console.log(`  ✅ ${fieldType}: ${!!field && hasPreview && structureCheck ? 'OK' : 'ERREUR'}`);
                
            } catch (error) {
                console.error(`  ❌ ${fieldType}: ${error.message}`);
                results.push({
                    type: fieldType,
                    success: false,
                    error: error.message
                });
            }
        }
        
        this.testResults.layoutFields = results;
    }

    async testPremiumValidation() {
        console.log('👑 Test de la validation Premium...');
        
        // Simuler un utilisateur non-premium
        const originalCheckPremium = this.formBuilder.checkPremiumAccess;
        this.formBuilder.checkPremiumAccess = () => false;
        
        try {
            // Compter les modals avant
            const modalsBefore = document.querySelectorAll('.fixed').length;
            
            // Essayer d'ajouter un champ premium
            this.formBuilder.addFieldFromTemplate('signature');
            
            // Compter les modals après
            const modalsAfter = document.querySelectorAll('.fixed').length;
            
            const premiumModalShown = modalsAfter > modalsBefore;
            
            this.testResults.premiumValidation = {
                modalShown: premiumModalShown,
                success: premiumModalShown
            };
            
            console.log(`  ✅ Validation Premium: ${premiumModalShown ? 'OK' : 'ERREUR'}`);
            
            // Nettoyer les modals
            document.querySelectorAll('.fixed').forEach(modal => {
                if (modal.innerHTML.includes('Premium')) {
                    modal.remove();
                }
            });
            
        } catch (error) {
            console.error(`  ❌ Validation Premium: ${error.message}`);
            this.testResults.premiumValidation = {
                modalShown: false,
                success: false,
                error: error.message
            };
        } finally {
            // Restaurer la fonction originale
            this.formBuilder.checkPremiumAccess = originalCheckPremium;
        }
    }

    async testFieldRendering() {
        console.log('🎨 Test du rendu des champs...');
        
        const field = {
            id: 'test_field',
            type: 'text',
            label: 'Test Field',
            placeholder: 'Test placeholder',
            required: true
        };
        
        try {
            const preview = this.formBuilder.renderFieldPreview(field);
            const hasInput = preview.includes('<input');
            const hasPlaceholder = preview.includes('Test placeholder');
            
            this.testResults.fieldRendering = {
                hasPreview: !!preview,
                hasInput,
                hasPlaceholder,
                success: !!preview && hasInput && hasPlaceholder
            };
            
            console.log(`  ✅ Rendu des champs: ${!!preview && hasInput && hasPlaceholder ? 'OK' : 'ERREUR'}`);
            
        } catch (error) {
            console.error(`  ❌ Rendu des champs: ${error.message}`);
            this.testResults.fieldRendering = {
                hasPreview: false,
                success: false,
                error: error.message
            };
        }
    }

    async testFieldValidation() {
        console.log('✅ Test de la validation des champs...');
        
        try {
            // Tester différents types de validation
            const emailField = { type: 'email', validation: { pattern: 'email' } };
            const numberField = { type: 'number_only', validation: { min: 0, max: 100 } };
            
            const hasEmailValidation = emailField.validation.pattern === 'email';
            const hasNumberValidation = numberField.validation.min !== undefined;
            
            this.testResults.fieldValidation = {
                emailValidation: hasEmailValidation,
                numberValidation: hasNumberValidation,
                success: hasEmailValidation && hasNumberValidation
            };
            
            console.log(`  ✅ Validation: ${hasEmailValidation && hasNumberValidation ? 'OK' : 'ERREUR'}`);
            
        } catch (error) {
            console.error(`  ❌ Validation: ${error.message}`);
            this.testResults.fieldValidation = {
                success: false,
                error: error.message
            };
        }
    }

    async testFieldPersistence() {
        console.log('💾 Test de la persistance des champs...');
        
        try {
            const initialFieldCount = this.formBuilder.formFields.length;
            
            // Ajouter un champ
            this.formBuilder.addFieldFromTemplate('text');
            const afterAddCount = this.formBuilder.formFields.length;
            
            // Vérifier l'ajout
            const fieldAdded = afterAddCount > initialFieldCount;
            
            // Vérifier que le champ a les bonnes propriétés
            const lastField = this.formBuilder.formFields[this.formBuilder.formFields.length - 1];
            const hasRequiredProps = lastField && lastField.id && lastField.type && lastField.label;
            
            this.testResults.fieldPersistence = {
                fieldAdded,
                hasRequiredProps,
                success: fieldAdded && hasRequiredProps
            };
            
            console.log(`  ✅ Persistance: ${fieldAdded && hasRequiredProps ? 'OK' : 'ERREUR'}`);
            
        } catch (error) {
            console.error(`  ❌ Persistance: ${error.message}`);
            this.testResults.fieldPersistence = {
                success: false,
                error: error.message
            };
        }
    }

    displayTestResults() {
        console.log('\n📊 RÉSULTATS DES TESTS');
        console.log('==========================================');
        
        let totalTests = 0;
        let passedTests = 0;
        
        Object.entries(this.testResults).forEach(([category, results]) => {
            console.log(`\n${this.getCategoryIcon(category)} ${category.toUpperCase()}`);
            console.log('------------------------------------------');
            
            if (Array.isArray(results)) {
                results.forEach(result => {
                    totalTests++;
                    if (result.success) passedTests++;
                    console.log(`  ${result.success ? '✅' : '❌'} ${result.type}: ${result.success ? 'PASS' : 'FAIL'}`);
                    if (result.error) {
                        console.log(`     Erreur: ${result.error}`);
                    }
                });
            } else {
                totalTests++;
                if (results.success) passedTests++;
                console.log(`  ${results.success ? '✅' : '❌'} ${category}: ${results.success ? 'PASS' : 'FAIL'}`);
                if (results.error) {
                    console.log(`     Erreur: ${results.error}`);
                }
            }
        });
        
        const successRate = Math.round((passedTests / totalTests) * 100);
        
        console.log('\n==========================================');
        console.log(`📈 SCORE GLOBAL: ${passedTests}/${totalTests} (${successRate}%)`);
        console.log(`${successRate >= 90 ? '🎉 EXCELLENT' : successRate >= 70 ? '👍 BON' : '⚠️ À AMÉLIORER'}`);
        
        // Afficher dans une notification visuelle
        this.showVisualResults(passedTests, totalTests, successRate);
    }

    getCategoryIcon(category) {
        const icons = {
            basicFields: '📝',
            selectionFields: '🎯',
            dateTimeFields: '📅',
            advancedFields: '⚙️',
            paymentFields: '💳',
            layoutFields: '📐',
            premiumValidation: '👑',
            fieldRendering: '🎨',
            fieldValidation: '✅',
            fieldPersistence: '💾'
        };
        return icons[category] || '🔧';
    }

    showVisualResults(passed, total, rate) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-white rounded-lg shadow-xl p-6 border z-50 max-w-sm';
        notification.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2">${rate >= 90 ? '🎉' : rate >= 70 ? '👍' : '⚠️'}</div>
                <h3 class="text-lg font-bold mb-2">Tests Form Builder</h3>
                <div class="text-2xl font-bold ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-blue-600' : 'text-orange-600'} mb-2">
                    ${rate}%
                </div>
                <p class="text-gray-600 mb-4">${passed}/${total} tests réussis</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Fermer
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-suppression après 10 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
}

// Fonction globale pour lancer les tests
window.testFormBuilder = function() {
    const tester = new FormBuilderTester();
    tester.runAllTests();
};

// Fonction pour tester un type spécifique
window.testFieldType = function(fieldType) {
    if (window.formBuilder) {
        console.log(`🧪 Test du type: ${fieldType}`);
        try {
            window.formBuilder.addFieldFromTemplate(fieldType);
            const field = window.formBuilder.formFields.find(f => f.type === fieldType);
            if (field) {
                const preview = window.formBuilder.renderFieldPreview(field);
                console.log(`✅ ${fieldType} ajouté et rendu avec succès`);
                console.log('Preview:', preview.substring(0, 100) + '...');
            } else {
                console.error(`❌ ${fieldType} non trouvé après ajout`);
            }
        } catch (error) {
            console.error(`❌ Erreur avec ${fieldType}:`, error);
        }
    }
};

console.log('🧪 Testeur Form Builder chargé. Utilisez testFormBuilder() pour lancer tous les tests.');
console.log('💡 Ou testFieldType("nom_du_type") pour tester un type spécifique.');
