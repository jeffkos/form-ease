/**
 * 💳 BillingSystem.js - FormEase Sprint 4 Phase 2
 * 
 * Système de facturation et abonnements multi-tenant
 * Gestion complète du cycle de vie financier
 * 
 * Fonctionnalités :
 * - Facturation automatisée multi-tenant
 * - Gestion des abonnements et upgrades
 * - Systèmes de paiement multiples
 * - Coupons et promotions
 * - Analytics financières avancées
 * - Conformité fiscale internationale
 * - Proration et calculs complexes
 * - Dunning et recouvrement
 * 
 * @version 4.0.0
 * @author FormEase Billing Team
 * @since Sprint 4 Phase 2
 */

class BillingSystem {
    constructor() {
        this.subscriptions = new Map();
        this.invoices = new Map();
        this.payments = new Map();
        this.coupons = new Map();
        this.billingCycles = new Map();
        this.paymentMethods = new Map();
        this.pricingRules = new Map();
        this.revenueAnalytics = new Map();
        
        this.config = {
            currency: 'EUR',
            taxRate: 0.20, // 20% TVA France
            gracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 jours
            dunningCycles: 3,
            prorationEnabled: true,
            autoChargeEnabled: true,
            invoiceNumberPrefix: 'FE',
            fiscalYear: new Date().getFullYear(),
            complianceRegion: 'EU'
        };
        
        this.subscriptionStatus = {
            active: 'active',
            trialing: 'trialing',
            past_due: 'past_due',
            canceled: 'canceled',
            unpaid: 'unpaid',
            suspended: 'suspended',
            expired: 'expired'
        };
        
        this.invoiceStatus = {
            draft: 'draft',
            open: 'open',
            paid: 'paid',
            void: 'void',
            uncollectible: 'uncollectible',
            pending: 'pending'
        };
        
        this.paymentStatus = {
            pending: 'pending',
            succeeded: 'succeeded',
            failed: 'failed',
            canceled: 'canceled',
            refunded: 'refunded',
            partially_refunded: 'partially_refunded'
        };
        
        this.paymentProviders = {
            stripe: 'stripe',
            paypal: 'paypal',
            braintree: 'braintree',
            square: 'square',
            adyen: 'adyen',
            sepa: 'sepa_direct_debit',
            wire: 'wire_transfer'
        };
        
        this.couponTypes = {
            percentage: 'percentage',
            fixed_amount: 'fixed_amount',
            free_trial: 'free_trial',
            free_months: 'free_months'
        };
        
        this.billingFrequencies = {
            monthly: 'monthly',
            quarterly: 'quarterly',
            semiannual: 'semiannual',
            annual: 'annual',
            biennial: 'biennial'
        };
        
        this.taxTypes = {
            vat: 'vat',
            gst: 'gst',
            sales_tax: 'sales_tax',
            withholding_tax: 'withholding_tax'
        };
        
        this.revenueMetrics = {
            mrr: 'monthly_recurring_revenue',
            arr: 'annual_recurring_revenue',
            churn: 'churn_rate',
            ltv: 'lifetime_value',
            cac: 'customer_acquisition_cost',
            arpu: 'average_revenue_per_user'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du système de facturation
     */
    init() {
        this.setupPricingRules();
        this.initializePaymentProviders();
        this.setupTaxCalculation();
        this.setupCouponsSystem();
        this.startBillingEngine();
        this.initializeAnalytics();
        this.setupComplianceTracking();
        console.log('💳 BillingSystem v4.0 initialisé - Enterprise Billing');
    }
    
    /**
     * Création d'un abonnement
     */
    async createSubscription(tenantId, subscriptionData) {
        try {
            const subscriptionId = this.generateSubscriptionId();
            
            // Validation des données
            await this.validateSubscriptionData(subscriptionData);
            
            // Récupérer le plan de pricing
            const pricingPlan = await this.getPricingPlan(subscriptionData.planId);
            if (!pricingPlan) {
                throw new Error(`Plan ${subscriptionData.planId} introuvable`);
            }
            
            // Calculer les dates de facturation
            const billingDates = this.calculateBillingDates(
                subscriptionData.startDate || new Date(),
                pricingPlan.billingFrequency
            );
            
            // Appliquer les coupons si fournis
            let discountInfo = null;
            if (subscriptionData.couponCode) {
                discountInfo = await this.applyCoupon(subscriptionData.couponCode, pricingPlan);
            }
            
            const subscription = {
                id: subscriptionId,
                tenantId: tenantId,
                customerId: subscriptionData.customerId,
                planId: subscriptionData.planId,
                status: this.subscriptionStatus.trialing,
                
                // Pricing
                plan: pricingPlan,
                baseAmount: pricingPlan.price,
                currency: pricingPlan.currency || this.config.currency,
                billingFrequency: pricingPlan.billingFrequency,
                
                // Dates
                startDate: subscriptionData.startDate || new Date(),
                trialEndDate: subscriptionData.trialEndDate || this.calculateTrialEnd(pricingPlan),
                currentPeriodStart: billingDates.periodStart,
                currentPeriodEnd: billingDates.periodEnd,
                nextBillingDate: billingDates.nextBilling,
                
                // Discounts
                discount: discountInfo,
                
                // Métadonnées
                metadata: subscriptionData.metadata || {},
                customFields: subscriptionData.customFields || {},
                
                // Usage
                usageTracking: pricingPlan.usageBased ? {
                    enabled: true,
                    currentUsage: new Map(),
                    billedUsage: new Map(),
                    overage: 0
                } : null,
                
                // Historique
                history: [{
                    action: 'created',
                    timestamp: new Date(),
                    details: { planId: subscriptionData.planId }
                }],
                
                // Paramètres
                settings: {
                    autoCharge: subscriptionData.autoCharge !== false,
                    prorationEnabled: this.config.prorationEnabled,
                    taxInclusive: subscriptionData.taxInclusive || false,
                    invoiceGeneration: subscriptionData.invoiceGeneration !== false
                },
                
                // Création
                created: new Date(),
                createdBy: subscriptionData.createdBy
            };
            
            // Si période d'essai terminée, activer immédiatement
            if (!subscription.trialEndDate || subscription.trialEndDate <= new Date()) {
                subscription.status = this.subscriptionStatus.active;
            }
            
            // Sauvegarder l'abonnement
            this.subscriptions.set(subscriptionId, subscription);
            
            // Créer la première facture si nécessaire
            if (subscription.status === this.subscriptionStatus.active && subscription.settings.invoiceGeneration) {
                await this.generateInvoice(subscription);
            }
            
            // Mettre à jour les analytics
            await this.updateRevenueAnalytics(subscription, 'subscription_created');
            
            // Journaliser
            await this.logBillingEvent(subscriptionId, 'subscription_created', {
                tenantId,
                planId: subscription.planId,
                amount: subscription.baseAmount,
                currency: subscription.currency
            });
            
            console.log(`💳 Abonnement créé : ${subscriptionId} (${pricingPlan.name})`);
            return subscription;
            
        } catch (error) {
            console.error('Erreur création abonnement :', error);
            throw error;
        }
    }
    
    /**
     * Génération d'une facture
     */
    async generateInvoice(subscription, options = {}) {
        try {
            const invoiceId = this.generateInvoiceId();
            
            // Calculer les montants
            const amounts = await this.calculateInvoiceAmounts(subscription, options);
            
            // Récupérer les informations client
            const customer = await this.getCustomerInfo(subscription.customerId);
            
            // Générer les lignes de facturation
            const lineItems = await this.generateLineItems(subscription, amounts);
            
            // Calculer les taxes
            const taxCalculation = await this.calculateTaxes(amounts, customer);
            
            const invoice = {
                id: invoiceId,
                subscriptionId: subscription.id,
                tenantId: subscription.tenantId,
                customerId: subscription.customerId,
                number: await this.generateInvoiceNumber(),
                status: this.invoiceStatus.draft,
                
                // Montants
                subtotal: amounts.subtotal,
                taxAmount: taxCalculation.total,
                discountAmount: amounts.discount,
                total: amounts.total + taxCalculation.total,
                currency: subscription.currency,
                
                // Détails
                lineItems: lineItems,
                taxDetails: taxCalculation.details,
                
                // Dates
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
                periodStart: subscription.currentPeriodStart,
                periodEnd: subscription.currentPeriodEnd,
                
                // Customer
                billingAddress: customer.billingAddress,
                shippingAddress: customer.shippingAddress,
                
                // Paramètres
                autoCharge: subscription.settings.autoCharge,
                paymentTerms: options.paymentTerms || '30 days',
                
                // Métadonnées
                metadata: {
                    generatedBy: 'auto',
                    billingReason: options.billingReason || 'subscription_cycle',
                    ...options.metadata
                },
                
                // Historique
                history: [{
                    action: 'generated',
                    timestamp: new Date(),
                    amount: amounts.total + taxCalculation.total
                }],
                
                // Création
                created: new Date()
            };
            
            // Finaliser la facture si pas en mode brouillon
            if (!options.draft) {
                invoice.status = this.invoiceStatus.open;
                invoice.finalizedAt = new Date();
            }
            
            // Sauvegarder
            this.invoices.set(invoiceId, invoice);
            
            // Programmer le paiement automatique si activé
            if (invoice.autoCharge && !options.draft) {
                await this.scheduleAutoPayment(invoice);
            }
            
            // Envoyer la facture par email
            if (!options.suppressEmail) {
                await this.sendInvoiceEmail(invoice);
            }
            
            await this.logBillingEvent(invoiceId, 'invoice_generated', {
                subscriptionId: subscription.id,
                amount: invoice.total,
                currency: invoice.currency
            });
            
            console.log(`📄 Facture générée : ${invoiceId} (${invoice.total}${invoice.currency})`);
            return invoice;
            
        } catch (error) {
            console.error('Erreur génération facture :', error);
            throw error;
        }
    }
    
    /**
     * Traitement d'un paiement
     */
    async processPayment(invoiceId, paymentData) {
        try {
            const invoice = this.invoices.get(invoiceId);
            if (!invoice) {
                throw new Error(`Facture ${invoiceId} introuvable`);
            }
            
            if (invoice.status === this.invoiceStatus.paid) {
                throw new Error('Facture déjà payée');
            }
            
            const paymentId = this.generatePaymentId();
            
            const payment = {
                id: paymentId,
                invoiceId: invoiceId,
                subscriptionId: invoice.subscriptionId,
                tenantId: invoice.tenantId,
                customerId: invoice.customerId,
                
                // Montant
                amount: paymentData.amount || invoice.total,
                currency: invoice.currency,
                
                // Méthode de paiement
                paymentMethod: paymentData.paymentMethod,
                provider: paymentData.provider || this.paymentProviders.stripe,
                
                // Status
                status: this.paymentStatus.pending,
                
                // Détails du paiement
                providerTransactionId: null,
                failureReason: null,
                
                // Métadonnées
                metadata: paymentData.metadata || {},
                
                // Dates
                attemptedAt: new Date(),
                processedAt: null,
                
                // Création
                created: new Date()
            };
            
            // Traiter le paiement avec le provider
            const paymentResult = await this.processWithProvider(payment, paymentData);
            
            // Mettre à jour le paiement
            payment.status = paymentResult.status;
            payment.providerTransactionId = paymentResult.transactionId;
            payment.processedAt = paymentResult.processedAt;
            payment.failureReason = paymentResult.failureReason;
            
            // Sauvegarder le paiement
            this.payments.set(paymentId, payment);
            
            // Si paiement réussi, mettre à jour la facture
            if (payment.status === this.paymentStatus.succeeded) {
                await this.markInvoiceAsPaid(invoice, payment);
                await this.updateSubscriptionAfterPayment(invoice.subscriptionId);
            } else {
                // Gérer l'échec du paiement
                await this.handlePaymentFailure(invoice, payment);
            }
            
            // Mettre à jour les analytics
            await this.updateRevenueAnalytics(payment, 'payment_processed');
            
            await this.logBillingEvent(paymentId, 'payment_processed', {
                invoiceId,
                amount: payment.amount,
                status: payment.status,
                provider: payment.provider
            });
            
            console.log(`💰 Paiement traité : ${paymentId} (${payment.status})`);
            return payment;
            
        } catch (error) {
            console.error('Erreur traitement paiement :', error);
            throw error;
        }
    }
    
    /**
     * Gestion des coupons et promotions
     */
    async createCoupon(couponData) {
        try {
            const couponId = couponData.code || this.generateCouponCode();
            
            const coupon = {
                id: couponId,
                code: couponId,
                name: couponData.name,
                type: couponData.type,
                
                // Discount
                value: couponData.value,
                currency: couponData.currency || this.config.currency,
                
                // Validité
                validFrom: couponData.validFrom || new Date(),
                validUntil: couponData.validUntil,
                maxRedemptions: couponData.maxRedemptions,
                redemptionsCount: 0,
                
                // Restrictions
                minimumAmount: couponData.minimumAmount || 0,
                applicablePlans: couponData.applicablePlans || [],
                firstTimeOnly: couponData.firstTimeOnly || false,
                
                // Métadonnées
                description: couponData.description,
                metadata: couponData.metadata || {},
                
                // Status
                active: couponData.active !== false,
                
                // Création
                created: new Date(),
                createdBy: couponData.createdBy
            };
            
            this.coupons.set(couponId, coupon);
            
            await this.logBillingEvent(couponId, 'coupon_created', {
                type: coupon.type,
                value: coupon.value,
                maxRedemptions: coupon.maxRedemptions
            });
            
            console.log(`🎟️ Coupon créé : ${couponId} (${coupon.type})`);
            return coupon;
            
        } catch (error) {
            console.error('Erreur création coupon :', error);
            throw error;
        }
    }
    
    /**
     * Application d'un coupon
     */
    async applyCoupon(couponCode, pricingPlan) {
        try {
            const coupon = this.coupons.get(couponCode);
            if (!coupon) {
                throw new Error(`Coupon ${couponCode} introuvable`);
            }
            
            // Vérifications de validité
            await this.validateCoupon(coupon, pricingPlan);
            
            // Calculer la réduction
            const discount = await this.calculateCouponDiscount(coupon, pricingPlan);
            
            // Incrémenter le compteur d'utilisation
            coupon.redemptionsCount++;
            
            await this.logBillingEvent(couponCode, 'coupon_applied', {
                planId: pricingPlan.id,
                discountAmount: discount.amount
            });
            
            return {
                coupon: coupon,
                discountAmount: discount.amount,
                discountPercentage: discount.percentage,
                validUntil: coupon.validUntil
            };
            
        } catch (error) {
            console.error('Erreur application coupon :', error);
            throw error;
        }
    }
    
    /**
     * Mise à jour d'un abonnement (upgrade/downgrade)
     */
    async updateSubscription(subscriptionId, updateData) {
        try {
            const subscription = this.subscriptions.get(subscriptionId);
            if (!subscription) {
                throw new Error(`Abonnement ${subscriptionId} introuvable`);
            }
            
            const oldPlan = subscription.plan;
            const newPlan = await this.getPricingPlan(updateData.planId);
            
            // Calculer la proration si nécessaire
            let prorationCredit = 0;
            let prorationCharge = 0;
            
            if (this.config.prorationEnabled && updateData.prorate !== false) {
                const proration = await this.calculateProration(subscription, newPlan);
                prorationCredit = proration.credit;
                prorationCharge = proration.charge;
            }
            
            // Mettre à jour l'abonnement
            subscription.plan = newPlan;
            subscription.planId = updateData.planId;
            subscription.baseAmount = newPlan.price;
            subscription.billingFrequency = newPlan.billingFrequency;
            
            // Recalculer les dates de facturation si nécessaire
            if (oldPlan.billingFrequency !== newPlan.billingFrequency) {
                const newBillingDates = this.calculateBillingDates(
                    new Date(),
                    newPlan.billingFrequency
                );
                subscription.nextBillingDate = newBillingDates.nextBilling;
            }
            
            // Ajouter à l'historique
            subscription.history.push({
                action: 'plan_changed',
                timestamp: new Date(),
                details: {
                    oldPlanId: oldPlan.id,
                    newPlanId: newPlan.id,
                    prorationCredit,
                    prorationCharge
                }
            });
            
            // Générer une facture de proration si nécessaire
            if (prorationCharge > 0) {
                await this.generateProrationInvoice(subscription, prorationCharge);
            }
            
            // Appliquer le crédit de proration si nécessaire
            if (prorationCredit > 0) {
                await this.applyCreditToAccount(subscription.customerId, prorationCredit);
            }
            
            // Mettre à jour les analytics
            await this.updateRevenueAnalytics(subscription, 'subscription_updated');
            
            await this.logBillingEvent(subscriptionId, 'subscription_updated', {
                oldPlanId: oldPlan.id,
                newPlanId: newPlan.id,
                changeType: newPlan.price > oldPlan.price ? 'upgrade' : 'downgrade'
            });
            
            console.log(`🔄 Abonnement mis à jour : ${subscriptionId} (${oldPlan.name} → ${newPlan.name})`);
            return subscription;
            
        } catch (error) {
            console.error('Erreur mise à jour abonnement :', error);
            throw error;
        }
    }
    
    /**
     * Annulation d'un abonnement
     */
    async cancelSubscription(subscriptionId, options = {}) {
        try {
            const subscription = this.subscriptions.get(subscriptionId);
            if (!subscription) {
                throw new Error(`Abonnement ${subscriptionId} introuvable`);
            }
            
            const cancelDate = options.cancelAt || new Date();
            const immediate = options.immediate || false;
            
            if (immediate) {
                // Annulation immédiate
                subscription.status = this.subscriptionStatus.canceled;
                subscription.canceledAt = cancelDate;
                subscription.endedAt = cancelDate;
            } else {
                // Annulation à la fin de la période
                subscription.status = this.subscriptionStatus.canceled;
                subscription.canceledAt = cancelDate;
                subscription.endedAt = subscription.currentPeriodEnd;
            }
            
            subscription.cancellationReason = options.reason || 'customer_request';
            subscription.canceledBy = options.canceledBy;
            
            // Ajouter à l'historique
            subscription.history.push({
                action: 'canceled',
                timestamp: new Date(),
                details: {
                    reason: subscription.cancellationReason,
                    immediate: immediate,
                    endDate: subscription.endedAt
                }
            });
            
            // Arrêter la facturation future
            await this.stopFutureBilling(subscription);
            
            // Gérer les remboursements si demandés
            if (options.refund) {
                await this.processRefund(subscription, options.refund);
            }
            
            // Mettre à jour les analytics
            await this.updateRevenueAnalytics(subscription, 'subscription_canceled');
            
            await this.logBillingEvent(subscriptionId, 'subscription_canceled', {
                reason: subscription.cancellationReason,
                immediate: immediate,
                endDate: subscription.endedAt
            });
            
            console.log(`❌ Abonnement annulé : ${subscriptionId} (${subscription.cancellationReason})`);
            return subscription;
            
        } catch (error) {
            console.error('Erreur annulation abonnement :', error);
            throw error;
        }
    }
    
    /**
     * Analytics et reporting financier
     */
    async generateRevenueReport(period = 'monthly', options = {}) {
        try {
            const reportId = this.generateReportId();
            const startDate = this.getReportPeriodStart(period);
            const endDate = options.endDate || new Date();
            
            // Collecter les données
            const subscriptions = this.getSubscriptionsInPeriod(startDate, endDate);
            const payments = this.getPaymentsInPeriod(startDate, endDate);
            const invoices = this.getInvoicesInPeriod(startDate, endDate);
            
            // Calculer les métriques
            const metrics = {
                // Revenue récurrent mensuel
                mrr: this.calculateMRR(subscriptions),
                
                // Revenue récurrent annuel
                arr: this.calculateARR(subscriptions),
                
                // Taux de désabonnement
                churnRate: this.calculateChurnRate(subscriptions, period),
                
                // Valeur vie client
                ltv: this.calculateLTV(subscriptions),
                
                // Revenue moyen par utilisateur
                arpu: this.calculateARPU(subscriptions),
                
                // Croissance
                growth: {
                    subscriptions: this.calculateSubscriptionGrowth(subscriptions, period),
                    revenue: this.calculateRevenueGrowth(payments, period)
                },
                
                // Conversion
                conversion: {
                    trialTopaid: this.calculateTrialConversion(subscriptions),
                    upgradeRate: this.calculateUpgradeRate(subscriptions)
                }
            };
            
            // Données détaillées
            const details = {
                totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                totalSubscriptions: subscriptions.length,
                newSubscriptions: subscriptions.filter(s => s.created >= startDate).length,
                canceledSubscriptions: subscriptions.filter(s => s.canceledAt && s.canceledAt >= startDate).length,
                totalInvoices: invoices.length,
                paidInvoices: invoices.filter(i => i.status === this.invoiceStatus.paid).length,
                
                // Par plan
                byPlan: this.groupRevenueByPlan(subscriptions, payments),
                
                // Par région
                byRegion: this.groupRevenueByRegion(subscriptions, payments),
                
                // Par devise
                byCurrency: this.groupRevenueByCurrency(payments)
            };
            
            const report = {
                id: reportId,
                type: 'revenue_report',
                period: period,
                startDate: startDate,
                endDate: endDate,
                metrics: metrics,
                details: details,
                generatedAt: new Date()
            };
            
            console.log(`📊 Rapport financier généré : ${reportId} (${period})`);
            return report;
            
        } catch (error) {
            console.error('Erreur génération rapport :', error);
            throw error;
        }
    }
    
    /**
     * Configuration des prix et plans
     */
    setupPricingRules() {
        // Plan Trial
        this.pricingRules.set('trial', {
            id: 'trial',
            name: 'Plan Trial',
            price: 0,
            currency: 'EUR',
            billingFrequency: this.billingFrequencies.monthly,
            trialDays: 14,
            usageBased: false,
            features: ['basic_forms', 'basic_analytics'],
            limits: {
                users: 5,
                forms: 3,
                submissions: 100
            }
        });
        
        // Plan Standard
        this.pricingRules.set('standard', {
            id: 'standard',
            name: 'Plan Standard',
            price: 29,
            currency: 'EUR',
            billingFrequency: this.billingFrequencies.monthly,
            trialDays: 14,
            usageBased: false,
            features: ['advanced_forms', 'standard_analytics', 'integrations'],
            limits: {
                users: 25,
                forms: 20,
                submissions: 5000
            },
            discounts: {
                annual: 0.15 // 15% de réduction annuelle
            }
        });
        
        // Plan Professional
        this.pricingRules.set('professional', {
            id: 'professional',
            name: 'Plan Professional',
            price: 79,
            currency: 'EUR',
            billingFrequency: this.billingFrequencies.monthly,
            trialDays: 14,
            usageBased: true,
            features: ['enterprise_forms', 'advanced_analytics', 'custom_branding', 'sso'],
            limits: {
                users: 100,
                forms: 100,
                submissions: 25000
            },
            usageRates: {
                extra_users: 5,
                extra_submissions: 0.01
            },
            discounts: {
                annual: 0.20 // 20% de réduction annuelle
            }
        });
        
        // Plan Enterprise
        this.pricingRules.set('enterprise', {
            id: 'enterprise',
            name: 'Plan Enterprise',
            price: 'custom',
            currency: 'EUR',
            billingFrequency: this.billingFrequencies.annual,
            trialDays: 30,
            usageBased: true,
            features: ['unlimited', 'white_labeling', 'dedicated_support', 'custom_integrations'],
            limits: {
                users: 'unlimited',
                forms: 'unlimited',
                submissions: 'unlimited'
            },
            customPricing: true
        });
        
        console.log('💰 Règles de pricing configurées :', this.pricingRules.size);
    }
    
    /**
     * Démarrage du moteur de facturation
     */
    startBillingEngine() {
        // Traitement des facturations quotidiennes
        setInterval(() => {
            this.processDailyBilling();
        }, 24 * 60 * 60 * 1000); // Chaque jour
        
        // Vérification des paiements en attente
        setInterval(() => {
            this.checkPendingPayments();
        }, 60 * 60 * 1000); // Chaque heure
        
        // Processus de dunning (relances)
        setInterval(() => {
            this.processDunning();
        }, 24 * 60 * 60 * 1000); // Chaque jour
        
        // Nettoyage des données expirées
        setInterval(() => {
            this.cleanupExpiredData();
        }, 7 * 24 * 60 * 60 * 1000); // Chaque semaine
        
        console.log('⚙️ Moteur de facturation démarré');
    }
    
    /**
     * Fonctions utilitaires
     */
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateInvoiceId() {
        return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generatePaymentId() {
        return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateReportId() {
        return `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateCouponCode() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    
    async generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const sequence = this.getNextInvoiceSequence();
        return `${this.config.invoiceNumberPrefix}-${year}-${sequence.toString().padStart(6, '0')}`;
    }
    
    getNextInvoiceSequence() {
        // Simulation - en production, utiliser une séquence de base de données
        return Math.floor(Math.random() * 999999) + 1;
    }
    
    calculateBillingDates(startDate, frequency) {
        const start = new Date(startDate);
        let periodEnd;
        
        switch (frequency) {
            case this.billingFrequencies.monthly:
                periodEnd = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
                break;
            case this.billingFrequencies.quarterly:
                periodEnd = new Date(start.getFullYear(), start.getMonth() + 3, start.getDate());
                break;
            case this.billingFrequencies.annual:
                periodEnd = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
                break;
            default:
                periodEnd = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
        }
        
        return {
            periodStart: start,
            periodEnd: periodEnd,
            nextBilling: periodEnd
        };
    }
    
    calculateTrialEnd(plan) {
        if (!plan.trialDays) return null;
        
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
        return trialEnd;
    }
    
    async validateSubscriptionData(data) {
        if (!data.customerId) {
            throw new Error('Customer ID requis');
        }
        
        if (!data.planId) {
            throw new Error('Plan ID requis');
        }
        
        return true;
    }
    
    async getPricingPlan(planId) {
        return this.pricingRules.get(planId);
    }
    
    async getCustomerInfo(customerId) {
        // Simulation - en production, récupérer depuis la base de données
        return {
            id: customerId,
            email: 'customer@example.com',
            billingAddress: {
                country: 'FR',
                postalCode: '75001',
                city: 'Paris'
            }
        };
    }
    
    async calculateInvoiceAmounts(subscription, options = {}) {
        const baseAmount = subscription.baseAmount;
        let subtotal = baseAmount;
        
        // Calcul de l'usage si applicable
        if (subscription.usageTracking && subscription.usageTracking.enabled) {
            const usageAmount = await this.calculateUsageAmount(subscription);
            subtotal += usageAmount;
        }
        
        // Application des réductions
        let discountAmount = 0;
        if (subscription.discount) {
            discountAmount = this.calculateDiscountAmount(subtotal, subscription.discount);
        }
        
        return {
            subtotal: subtotal,
            discount: discountAmount,
            total: subtotal - discountAmount
        };
    }
    
    async generateLineItems(subscription, amounts) {
        const lineItems = [];
        
        // Ligne principale d'abonnement
        lineItems.push({
            id: 'subscription',
            description: `${subscription.plan.name} - ${this.formatPeriod(subscription)}`,
            quantity: 1,
            unitPrice: subscription.baseAmount,
            amount: subscription.baseAmount,
            period: {
                start: subscription.currentPeriodStart,
                end: subscription.currentPeriodEnd
            }
        });
        
        // Lignes d'usage si applicable
        if (subscription.usageTracking && subscription.usageTracking.enabled) {
            const usageLineItems = await this.generateUsageLineItems(subscription);
            lineItems.push(...usageLineItems);
        }
        
        // Ligne de réduction si applicable
        if (amounts.discount > 0) {
            lineItems.push({
                id: 'discount',
                description: 'Réduction',
                quantity: 1,
                unitPrice: -amounts.discount,
                amount: -amounts.discount
            });
        }
        
        return lineItems;
    }
    
    async calculateTaxes(amounts, customer) {
        const taxRate = this.getTaxRateForCustomer(customer);
        const taxableAmount = amounts.total;
        const taxAmount = taxableAmount * taxRate;
        
        return {
            total: taxAmount,
            details: {
                rate: taxRate,
                type: this.getTaxTypeForCustomer(customer),
                taxableAmount: taxableAmount
            }
        };
    }
    
    getTaxRateForCustomer(customer) {
        // Logique de calcul de taxe basée sur la localisation
        if (customer.billingAddress.country === 'FR') {
            return this.config.taxRate; // 20% TVA France
        }
        
        // Autres pays EU
        const euCountries = ['DE', 'IT', 'ES', 'NL', 'BE', 'AT'];
        if (euCountries.includes(customer.billingAddress.country)) {
            return 0.19; // TVA moyenne EU
        }
        
        return 0; // Pas de taxe pour les autres pays
    }
    
    getTaxTypeForCustomer(customer) {
        if (customer.billingAddress.country === 'FR') {
            return this.taxTypes.vat;
        }
        return this.taxTypes.vat; // Par défaut TVA
    }
    
    async processWithProvider(payment, paymentData) {
        // Simulation du traitement avec un provider de paiement
        console.log(`💳 Traitement paiement avec ${payment.provider}...`);
        
        // Simulation d'un délai de traitement
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulation de succès/échec
        const success = Math.random() > 0.1; // 90% de succès
        
        if (success) {
            return {
                status: this.paymentStatus.succeeded,
                transactionId: `txn_${Math.random().toString(36).substr(2, 16)}`,
                processedAt: new Date(),
                failureReason: null
            };
        } else {
            return {
                status: this.paymentStatus.failed,
                transactionId: null,
                processedAt: new Date(),
                failureReason: 'insufficient_funds'
            };
        }
    }
    
    async markInvoiceAsPaid(invoice, payment) {
        invoice.status = this.invoiceStatus.paid;
        invoice.paidAt = new Date();
        invoice.paymentId = payment.id;
        
        invoice.history.push({
            action: 'paid',
            timestamp: new Date(),
            amount: payment.amount,
            paymentId: payment.id
        });
    }
    
    async updateSubscriptionAfterPayment(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) return;
        
        // Réactiver l'abonnement si nécessaire
        if (subscription.status === this.subscriptionStatus.past_due) {
            subscription.status = this.subscriptionStatus.active;
        }
        
        // Mettre à jour la dernière date de paiement
        subscription.lastPaymentDate = new Date();
    }
    
    async handlePaymentFailure(invoice, payment) {
        // Mettre à jour le statut de l'abonnement
        const subscription = this.subscriptions.get(invoice.subscriptionId);
        if (subscription && subscription.status === this.subscriptionStatus.active) {
            subscription.status = this.subscriptionStatus.past_due;
        }
        
        // Démarrer le processus de dunning
        await this.startDunningProcess(invoice);
    }
    
    async validateCoupon(coupon, pricingPlan) {
        const now = new Date();
        
        // Vérifier si actif
        if (!coupon.active) {
            throw new Error('Coupon inactif');
        }
        
        // Vérifier les dates
        if (coupon.validFrom > now) {
            throw new Error('Coupon pas encore valide');
        }
        
        if (coupon.validUntil && coupon.validUntil < now) {
            throw new Error('Coupon expiré');
        }
        
        // Vérifier le nombre d'utilisations
        if (coupon.maxRedemptions && coupon.redemptionsCount >= coupon.maxRedemptions) {
            throw new Error('Coupon épuisé');
        }
        
        // Vérifier les plans applicables
        if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(pricingPlan.id)) {
            throw new Error('Coupon non applicable à ce plan');
        }
        
        return true;
    }
    
    async calculateCouponDiscount(coupon, pricingPlan) {
        let discountAmount = 0;
        let discountPercentage = 0;
        
        switch (coupon.type) {
            case this.couponTypes.percentage:
                discountPercentage = coupon.value;
                discountAmount = (pricingPlan.price * coupon.value) / 100;
                break;
                
            case this.couponTypes.fixed_amount:
                discountAmount = Math.min(coupon.value, pricingPlan.price);
                discountPercentage = (discountAmount / pricingPlan.price) * 100;
                break;
                
            case this.couponTypes.free_trial:
                // Géré dans la logique d'abonnement
                discountAmount = 0;
                break;
                
            case this.couponTypes.free_months:
                // Calculer la valeur des mois gratuits
                discountAmount = pricingPlan.price * coupon.value;
                break;
        }
        
        return {
            amount: discountAmount,
            percentage: discountPercentage
        };
    }
    
    formatPeriod(subscription) {
        const start = subscription.currentPeriodStart.toLocaleDateString();
        const end = subscription.currentPeriodEnd.toLocaleDateString();
        return `${start} - ${end}`;
    }
    
    // Métriques et analytics
    calculateMRR(subscriptions) {
        return subscriptions
            .filter(s => s.status === this.subscriptionStatus.active)
            .reduce((sum, s) => {
                let monthlyAmount = s.baseAmount;
                
                // Convertir en montant mensuel
                switch (s.billingFrequency) {
                    case this.billingFrequencies.annual:
                        monthlyAmount = s.baseAmount / 12;
                        break;
                    case this.billingFrequencies.quarterly:
                        monthlyAmount = s.baseAmount / 3;
                        break;
                }
                
                return sum + monthlyAmount;
            }, 0);
    }
    
    calculateARR(subscriptions) {
        return this.calculateMRR(subscriptions) * 12;
    }
    
    calculateChurnRate(subscriptions, period) {
        const startOfPeriod = this.getReportPeriodStart(period);
        const activeAtStart = subscriptions.filter(s => s.created < startOfPeriod && s.status === this.subscriptionStatus.active).length;
        const canceledInPeriod = subscriptions.filter(s => s.canceledAt && s.canceledAt >= startOfPeriod).length;
        
        return activeAtStart > 0 ? (canceledInPeriod / activeAtStart) * 100 : 0;
    }
    
    getReportPeriodStart(period) {
        const now = new Date();
        switch (period) {
            case 'monthly':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                return new Date(now.getFullYear(), quarter * 3, 1);
            case 'yearly':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }
    
    // Méthodes de simulation pour les opérations asynchrones
    processDailyBilling() {
        console.log('💰 Traitement facturation quotidienne...');
    }
    
    checkPendingPayments() {
        console.log('🔍 Vérification paiements en attente...');
    }
    
    processDunning() {
        console.log('📧 Traitement relances clients...');
    }
    
    cleanupExpiredData() {
        console.log('🧹 Nettoyage données expirées...');
    }
    
    async logBillingEvent(entityId, event, details) {
        if (window.auditLogger) {
            await window.auditLogger.log(
                window.auditLogger.logLevels.info,
                'billing_system',
                event,
                { entityId, ...details },
                { entityId }
            );
        }
        
        console.log(`💳 [BILLING-${entityId}] ${event}:`, details);
    }
    
    /**
     * API publique
     */
    getBillingStatus() {
        return {
            totalSubscriptions: this.subscriptions.size,
            activeSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.status === this.subscriptionStatus.active).length,
            totalInvoices: this.invoices.size,
            paidInvoices: Array.from(this.invoices.values()).filter(i => i.status === this.invoiceStatus.paid).length,
            totalRevenue: Array.from(this.payments.values()).reduce((sum, p) => sum + (p.amount || 0), 0),
            activeCoupons: Array.from(this.coupons.values()).filter(c => c.active).length
        };
    }
    
    getSubscriptions() {
        return Array.from(this.subscriptions.values());
    }
    
    getActiveSubscriptions() {
        return Array.from(this.subscriptions.values()).filter(s => s.status === this.subscriptionStatus.active);
    }
    
    getInvoices() {
        return Array.from(this.invoices.values());
    }
    
    getPayments() {
        return Array.from(this.payments.values());
    }
    
    getCoupons() {
        return Array.from(this.coupons.values());
    }
    
    getPricingPlans() {
        return Array.from(this.pricingRules.values());
    }
}

// Export pour compatibilité navigateur
window.BillingSystem = BillingSystem;

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.billingSystem) {
        window.billingSystem = new BillingSystem();
        console.log('💳 BillingSystem initialisé globalement');
    }
});
