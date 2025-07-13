// FormEase Email Tracking System
// Backend API simulation for email tracking functionality

class EmailTrackingSystem {
    constructor() {
        this.emailDatabase = this.initializeDatabase();
        this.trackingPixels = new Map();
        this.webhookEndpoints = new Map();
    }

    initializeDatabase() {
        // Simulate a more comprehensive email database
        return [
            {
                id: 'email_001',
                messageId: 'msg_' + Date.now() + '_001',
                recipient: 'marie.dupont@example.com',
                recipientName: 'Marie Dupont',
                formId: 'form-contact-001',
                formName: 'Formulaire de Contact',
                campaign: 'Réponses Automatiques',
                subject: 'Confirmation de votre message',
                status: 'opened',
                sentDate: new Date('2025-01-10T14:30:00Z'),
                deliveredDate: new Date('2025-01-10T14:31:15Z'),
                openedDate: new Date('2025-01-10T15:45:22Z'),
                firstOpenDate: new Date('2025-01-10T15:45:22Z'),
                lastOpenDate: new Date('2025-01-11T09:12:45Z'),
                openCount: 3,
                clickCount: 2,
                clicks: [
                    { url: 'https://formease.app/form/contact', timestamp: new Date('2025-01-10T15:46:30Z') },
                    { url: 'https://formease.app/dashboard', timestamp: new Date('2025-01-11T09:13:15Z') }
                ],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ipAddress: '192.168.1.100',
                location: { country: 'France', city: 'Paris', region: 'Île-de-France' },
                device: 'desktop',
                emailClient: 'Outlook',
                bounceReason: null,
                unsubscribed: false,
                tags: ['priority', 'customer']
            },
            {
                id: 'email_002',
                messageId: 'msg_' + Date.now() + '_002',
                recipient: 'jean.martin@example.com',
                recipientName: 'Jean Martin',
                formId: 'form-survey-001',
                formName: 'Sondage Satisfaction Client',
                campaign: 'Enquête Q1 2025',
                subject: 'Votre avis nous intéresse - Sondage 5 minutes',
                status: 'delivered',
                sentDate: new Date('2025-01-10T13:15:00Z'),
                deliveredDate: new Date('2025-01-10T13:16:45Z'),
                openedDate: null,
                firstOpenDate: null,
                lastOpenDate: null,
                openCount: 0,
                clickCount: 0,
                clicks: [],
                userAgent: null,
                ipAddress: null,
                location: null,
                device: null,
                emailClient: null,
                bounceReason: null,
                unsubscribed: false,
                tags: ['survey', 'customer']
            },
            {
                id: 'email_003',
                messageId: 'msg_' + Date.now() + '_003',
                recipient: 'pierre.bernard@invalid-domain.xyz',
                recipientName: 'Pierre Bernard',
                formId: 'form-event-001',
                formName: 'Inscription Événement FormEase',
                campaign: 'Lancement Produit',
                subject: 'Confirmation d\'inscription - Événement FormEase 2025',
                status: 'bounced',
                sentDate: new Date('2025-01-10T12:00:00Z'),
                deliveredDate: null,
                openedDate: null,
                firstOpenDate: null,
                lastOpenDate: null,
                openCount: 0,
                clickCount: 0,
                clicks: [],
                userAgent: null,
                ipAddress: null,
                location: null,
                device: null,
                emailClient: null,
                bounceReason: 'Invalid domain: domain does not exist',
                bounceType: 'hard',
                unsubscribed: false,
                tags: ['event', 'prospect']
            },
            {
                id: 'email_004',
                messageId: 'msg_' + Date.now() + '_004',
                recipient: 'sophie.leroy@example.com',
                recipientName: 'Sophie Leroy',
                formId: 'form-contact-001',
                formName: 'Formulaire de Contact',
                campaign: 'Support Client',
                subject: 'Réponse à votre demande de support technique',
                status: 'opened',
                sentDate: new Date('2025-01-10T11:20:00Z'),
                deliveredDate: new Date('2025-01-10T11:21:30Z'),
                openedDate: new Date('2025-01-10T11:35:15Z'),
                firstOpenDate: new Date('2025-01-10T11:35:15Z'),
                lastOpenDate: new Date('2025-01-10T16:22:30Z'),
                openCount: 5,
                clickCount: 1,
                clicks: [
                    { url: 'https://formease.app/support/ticket/12345', timestamp: new Date('2025-01-10T11:36:00Z') }
                ],
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
                ipAddress: '192.168.1.200',
                location: { country: 'France', city: 'Lyon', region: 'Auvergne-Rhône-Alpes' },
                device: 'mobile',
                emailClient: 'iOS Mail',
                bounceReason: null,
                unsubscribed: false,
                tags: ['support', 'urgent']
            },
            {
                id: 'email_005',
                messageId: 'msg_' + Date.now() + '_005',
                recipient: 'paul.durand@example.com',
                recipientName: 'Paul Durand',
                formId: 'newsletter-001',
                formName: 'Newsletter FormEase',
                campaign: 'Newsletter Janvier 2025',
                subject: 'FormEase Newsletter - Nouveautés et astuces',
                status: 'clicked',
                sentDate: new Date('2025-01-10T10:00:00Z'),
                deliveredDate: new Date('2025-01-10T10:01:20Z'),
                openedDate: new Date('2025-01-10T14:22:45Z'),
                firstOpenDate: new Date('2025-01-10T14:22:45Z'),
                lastOpenDate: new Date('2025-01-10T14:25:30Z'),
                openCount: 2,
                clickCount: 3,
                clicks: [
                    { url: 'https://formease.app/features/new', timestamp: new Date('2025-01-10T14:23:15Z') },
                    { url: 'https://formease.app/pricing', timestamp: new Date('2025-01-10T14:24:00Z') },
                    { url: 'https://formease.app/blog/tips', timestamp: new Date('2025-01-10T14:25:45Z') }
                ],
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                ipAddress: '192.168.1.150',
                location: { country: 'France', city: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur' },
                device: 'desktop',
                emailClient: 'Gmail',
                bounceReason: null,
                unsubscribed: false,
                tags: ['newsletter', 'engaged']
            }
        ];
    }

    // Get comprehensive statistics
    getEmailStatistics(filters = {}) {
        const filteredEmails = this.filterEmails(filters);
        
        const stats = {
            total: filteredEmails.length,
            sent: filteredEmails.length,
            delivered: filteredEmails.filter(e => ['delivered', 'opened', 'clicked'].includes(e.status)).length,
            opened: filteredEmails.filter(e => ['opened', 'clicked'].includes(e.status)).length,
            clicked: filteredEmails.filter(e => e.status === 'clicked').length,
            bounced: filteredEmails.filter(e => e.status === 'bounced').length,
            pending: filteredEmails.filter(e => e.status === 'pending').length,
            unsubscribed: filteredEmails.filter(e => e.unsubscribed).length
        };

        // Calculate rates
        stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent * 100).toFixed(2) : 0;
        stats.openRate = stats.delivered > 0 ? (stats.opened / stats.delivered * 100).toFixed(2) : 0;
        stats.clickRate = stats.delivered > 0 ? (stats.clicked / stats.delivered * 100).toFixed(2) : 0;
        stats.bounceRate = stats.sent > 0 ? (stats.bounced / stats.sent * 100).toFixed(2) : 0;

        return stats;
    }

    // Filter emails based on criteria
    filterEmails(filters) {
        return this.emailDatabase.filter(email => {
            if (filters.formId && email.formId !== filters.formId) return false;
            if (filters.status && email.status !== filters.status) return false;
            if (filters.campaign && email.campaign !== filters.campaign) return false;
            if (filters.dateFrom && email.sentDate < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && email.sentDate > new Date(filters.dateTo)) return false;
            if (filters.recipient && !email.recipient.toLowerCase().includes(filters.recipient.toLowerCase())) return false;
            return true;
        });
    }

    // Get paginated email list
    getEmailList(page = 1, perPage = 25, filters = {}, sortBy = 'sentDate', sortOrder = 'desc') {
        const filteredEmails = this.filterEmails(filters);
        
        // Sort emails
        filteredEmails.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (aValue instanceof Date) {
                aValue = aValue.getTime();
                bValue = bValue ? bValue.getTime() : 0;
            }
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        
        return {
            emails: filteredEmails.slice(startIndex, endIndex),
            pagination: {
                currentPage: page,
                perPage: perPage,
                totalItems: filteredEmails.length,
                totalPages: Math.ceil(filteredEmails.length / perPage),
                hasNext: endIndex < filteredEmails.length,
                hasPrev: page > 1
            }
        };
    }

    // Get detailed email information
    getEmailDetails(emailId) {
        const email = this.emailDatabase.find(e => e.id === emailId);
        if (!email) return null;

        return {
            ...email,
            timeline: this.generateEmailTimeline(email),
            engagement: this.calculateEngagement(email),
            deliverabilityScore: this.calculateDeliverabilityScore(email)
        };
    }

    generateEmailTimeline(email) {
        const timeline = [];
        
        timeline.push({
            event: 'sent',
            timestamp: email.sentDate,
            description: 'Email envoyé',
            icon: 'ri-send-plane-line',
            color: 'blue'
        });

        if (email.deliveredDate) {
            timeline.push({
                event: 'delivered',
                timestamp: email.deliveredDate,
                description: 'Email livré avec succès',
                icon: 'ri-check-line',
                color: 'green'
            });
        }

        if (email.bounceReason) {
            timeline.push({
                event: 'bounced',
                timestamp: email.sentDate,
                description: `Email rejeté: ${email.bounceReason}`,
                icon: 'ri-error-warning-line',
                color: 'red'
            });
        }

        if (email.firstOpenDate) {
            timeline.push({
                event: 'opened',
                timestamp: email.firstOpenDate,
                description: 'Premier ouverture de l\'email',
                icon: 'ri-mail-open-line',
                color: 'purple'
            });
        }

        email.clicks.forEach((click, index) => {
            timeline.push({
                event: 'clicked',
                timestamp: click.timestamp,
                description: `Clic sur: ${click.url}`,
                icon: 'ri-cursor-line',
                color: 'orange'
            });
        });

        if (email.unsubscribed) {
            timeline.push({
                event: 'unsubscribed',
                timestamp: email.lastOpenDate || email.sentDate,
                description: 'Désabonnement de la liste',
                icon: 'ri-user-unfollow-line',
                color: 'gray'
            });
        }

        return timeline.sort((a, b) => a.timestamp - b.timestamp);
    }

    calculateEngagement(email) {
        const timeSinceDelivery = email.deliveredDate ? 
            (Date.now() - email.deliveredDate.getTime()) / (1000 * 60 * 60) : 0; // hours
        
        let score = 0;
        if (email.openCount > 0) score += 30;
        if (email.openCount > 1) score += 20;
        if (email.clickCount > 0) score += 40;
        if (email.clickCount > 1) score += 10;
        
        // Bonus for quick engagement
        if (email.firstOpenDate && email.deliveredDate) {
            const timeToOpen = (email.firstOpenDate - email.deliveredDate) / (1000 * 60); // minutes
            if (timeToOpen < 60) score += 10; // Opened within 1 hour
        }

        return Math.min(100, score);
    }

    calculateDeliverabilityScore(email) {
        let score = 100;
        
        if (email.status === 'bounced') {
            score = email.bounceType === 'hard' ? 0 : 30;
        } else if (email.status === 'pending') {
            score = 50;
        } else if (email.status === 'delivered') {
            score = 80;
        } else if (['opened', 'clicked'].includes(email.status)) {
            score = 100;
        }

        return score;
    }

    // Resend email
    async resendEmail(emailId) {
        const email = this.emailDatabase.find(e => e.id === emailId);
        if (!email) throw new Error('Email not found');

        // Create new email entry for resend
        const newEmail = {
            ...email,
            id: 'email_' + Date.now(),
            messageId: 'msg_' + Date.now() + '_resend',
            status: 'pending',
            sentDate: new Date(),
            deliveredDate: null,
            openedDate: null,
            openCount: 0,
            clickCount: 0,
            clicks: []
        };

        this.emailDatabase.push(newEmail);

        // Simulate delivery process
        setTimeout(() => {
            newEmail.status = 'delivered';
            newEmail.deliveredDate = new Date();
        }, 2000);

        return { success: true, newEmailId: newEmail.id };
    }

    // Get performance data for charts
    getPerformanceData(days = 30) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
        
        const data = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayEmails = this.emailDatabase.filter(email => {
                const emailDate = new Date(email.sentDate);
                return emailDate.toDateString() === d.toDateString();
            });

            data.push({
                date: d.toISOString().split('T')[0],
                sent: dayEmails.length,
                delivered: dayEmails.filter(e => ['delivered', 'opened', 'clicked'].includes(e.status)).length,
                opened: dayEmails.filter(e => ['opened', 'clicked'].includes(e.status)).length,
                clicked: dayEmails.filter(e => e.status === 'clicked').length,
                bounced: dayEmails.filter(e => e.status === 'bounced').length
            });
        }

        return data;
    }

    // Export tracking data
    exportTrackingData(format = 'csv', filters = {}) {
        const emails = this.filterEmails(filters);
        
        if (format === 'csv') {
            const headers = [
                'ID', 'Destinataire', 'Nom', 'Formulaire', 'Campagne', 'Objet', 
                'Statut', 'Date Envoi', 'Date Livraison', 'Date Ouverture', 
                'Nb Ouvertures', 'Nb Clics', 'Device', 'Client Email', 'Localisation'
            ];
            
            const csvContent = [
                headers.join(','),
                ...emails.map(email => [
                    email.id,
                    `"${email.recipient}"`,
                    `"${email.recipientName}"`,
                    `"${email.formName}"`,
                    `"${email.campaign}"`,
                    `"${email.subject}"`,
                    email.status,
                    email.sentDate.toISOString(),
                    email.deliveredDate ? email.deliveredDate.toISOString() : '',
                    email.openedDate ? email.openedDate.toISOString() : '',
                    email.openCount,
                    email.clickCount,
                    email.device || '',
                    email.emailClient || '',
                    email.location ? `"${email.location.city}, ${email.location.country}"` : ''
                ].join(','))
            ].join('\n');
            
            return csvContent;
        }
        
        return emails; // Return JSON for other formats
    }

    // Real-time tracking pixel handler
    trackEmailOpen(trackingId, userAgent, ipAddress) {
        const email = this.emailDatabase.find(e => e.messageId === trackingId);
        if (!email) return false;

        if (!email.openedDate) {
            email.openedDate = new Date();
            email.firstOpenDate = new Date();
            email.status = email.status === 'delivered' ? 'opened' : email.status;
        }
        
        email.lastOpenDate = new Date();
        email.openCount++;
        email.userAgent = userAgent;
        email.ipAddress = ipAddress;

        // Update device and email client detection
        email.device = this.detectDevice(userAgent);
        email.emailClient = this.detectEmailClient(userAgent);

        return true;
    }

    // Click tracking handler
    trackEmailClick(trackingId, clickedUrl, userAgent, ipAddress) {
        const email = this.emailDatabase.find(e => e.messageId === trackingId);
        if (!email) return false;

        email.clicks.push({
            url: clickedUrl,
            timestamp: new Date()
        });
        
        email.clickCount++;
        email.status = 'clicked';

        return true;
    }

    detectDevice(userAgent) {
        if (/iPhone|iPad|iPod/i.test(userAgent)) return 'mobile';
        if (/Android/i.test(userAgent)) return 'mobile';
        if (/Tablet/i.test(userAgent)) return 'tablet';
        return 'desktop';
    }

    detectEmailClient(userAgent) {
        if (/Outlook/i.test(userAgent)) return 'Outlook';
        if (/Gmail/i.test(userAgent)) return 'Gmail';
        if (/Apple Mail/i.test(userAgent)) return 'Apple Mail';
        if (/Thunderbird/i.test(userAgent)) return 'Thunderbird';
        return 'Unknown';
    }
}

// Global instance
const emailTracker = new EmailTrackingSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailTrackingSystem;
}
