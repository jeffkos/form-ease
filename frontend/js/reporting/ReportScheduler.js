/**
 * Report Scheduler
 * Automated report generation and delivery system
 */

class ReportScheduler {
    constructor(reportingSystem) {
        this.reportingSystem = reportingSystem;
        this.scheduledJobs = new Map();
        this.isRunning = false;
        this.checkInterval = 60000; // Check every minute
        this.intervalId = null;
        
        this.emailService = null; // Would be configured with actual email service
        this.notificationService = null;
        
        this.init();
    }
    
    init() {
        this.loadScheduledJobs();
        this.start();
        
        console.log('⏰ Report Scheduler initialized');
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.checkScheduledReports();
        }, this.checkInterval);
        
        console.log('▶️ Report Scheduler started');
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('⏸️ Report Scheduler stopped');
    }
    
    async checkScheduledReports() {
        const now = new Date();
        const scheduledReports = this.reportingSystem.getScheduledReports();
        
        for (const scheduledReport of scheduledReports) {
            if (!scheduledReport.schedule.enabled) continue;
            
            const nextRun = new Date(scheduledReport.nextRun);
            
            if (now >= nextRun) {
                try {
                    await this.executeScheduledReport(scheduledReport);
                } catch (error) {
                    console.error(`Failed to execute scheduled report ${scheduledReport.id}:`, error);
                    await this.handleScheduleError(scheduledReport, error);
                }
            }
        }
    }
    
    async executeScheduledReport(scheduledReport) {
        console.log(`🔄 Executing scheduled report: ${scheduledReport.template.name}`);
        
        try {
            // Get fresh data for the report
            const data = await this.getReportData(scheduledReport);
            
            // Generate the report
            const reportResult = await this.reportingSystem.generateReport(
                scheduledReport.templateId,
                data,
                scheduledReport.options
            );
            
            // Handle delivery
            await this.deliverReport(scheduledReport, reportResult);
            
            // Update schedule
            this.updateScheduleAfterExecution(scheduledReport, true);
            
            console.log(`✅ Scheduled report executed successfully: ${scheduledReport.id}`);
            
        } catch (error) {
            this.updateScheduleAfterExecution(scheduledReport, false, error);
            throw error;
        }
    }
    
    async getReportData(scheduledReport) {
        // In a real implementation, this would fetch actual data
        // For now, we'll return sample data based on the template type
        
        const template = scheduledReport.template;
        
        switch (template.type) {
            case 'summary':
                return this.getSummaryData();
            case 'detailed':
                return this.getDetailedAnalyticsData();
            case 'performance':
                return this.getPerformanceData();
            default:
                return this.getDefaultReportData();
        }
    }
    
    getSummaryData() {
        return {
            totalResponses: Math.floor(Math.random() * 1000) + 500,
            completionRate: Math.floor(Math.random() * 20) + 80, // 80-100%
            averageTime: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
            lastResponse: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            responses_over_time: this.generateTimeSeriesData(),
            completion_status: this.generateCompletionData()
        };
    }
    
    getDetailedAnalyticsData() {
        return {
            ...this.getSummaryData(),
            fieldAnalysis: this.generateFieldAnalysis(),
            correlations: this.generateCorrelations(),
            trends: this.generateTrends(),
            insights: this.generateInsights()
        };
    }
    
    getPerformanceData() {
        return {
            loadTime: Math.floor(Math.random() * 2000) + 500, // 0.5-2.5s
            abandonRate: Math.floor(Math.random() * 15) + 5, // 5-20%
            errorRate: Math.floor(Math.random() * 5) + 1, // 1-6%
            mobileUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
            deviceBreakdown: this.generateDeviceData(),
            userJourney: this.generateUserJourneyData()
        };
    }
    
    getDefaultReportData() {
        return {
            timestamp: new Date().toISOString(),
            reportType: 'general',
            data: {}
        };
    }
    
    generateTimeSeriesData() {
        const data = [];
        const now = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            data.push({
                date: date.toISOString().split('T')[0],
                responses: Math.floor(Math.random() * 50) + 10
            });
        }
        
        return data;
    }
    
    generateCompletionData() {
        return [
            { status: 'Complété', count: Math.floor(Math.random() * 100) + 150 },
            { status: 'Partiel', count: Math.floor(Math.random() * 30) + 20 },
            { status: 'Abandonné', count: Math.floor(Math.random() * 20) + 10 }
        ];
    }
    
    generateFieldAnalysis() {
        return {
            textFields: { avgLength: 45, completion: 92 },
            multipleChoice: { mostSelected: 'Option A', distribution: { A: 40, B: 35, C: 25 } },
            dateFields: { avgDaysAhead: 14, completion: 88 }
        };
    }
    
    generateCorrelations() {
        return [
            { field1: 'age', field2: 'interest', correlation: 0.67 },
            { field1: 'location', field2: 'preference', correlation: 0.34 }
        ];
    }
    
    generateTrends() {
        return {
            weekly: { trend: 'increasing', change: 12 },
            monthly: { trend: 'stable', change: 2 },
            seasonal: { peak: 'Q4', low: 'Q2' }
        };
    }
    
    generateInsights() {
        return [
            'Response rate increased by 15% this month',
            'Mobile users show 23% higher completion rate',
            'Weekend submissions are 40% lower than weekdays'
        ];
    }
    
    generateDeviceData() {
        return {
            mobile: Math.floor(Math.random() * 30) + 50,
            desktop: Math.floor(Math.random() * 30) + 30,
            tablet: Math.floor(Math.random() * 15) + 5
        };
    }
    
    generateUserJourneyData() {
        return {
            avgSteps: 4.2,
            dropoffPoints: ['Step 2', 'Step 4'],
            avgTimePerStep: 45
        };
    }
    
    async deliverReport(scheduledReport, reportResult) {
        const deliveryMethods = scheduledReport.options.delivery || ['download'];
        
        for (const method of deliveryMethods) {
            switch (method) {
                case 'email':
                    await this.deliverByEmail(scheduledReport, reportResult);
                    break;
                case 'webhook':
                    await this.deliverByWebhook(scheduledReport, reportResult);
                    break;
                case 'storage':
                    await this.saveToStorage(scheduledReport, reportResult);
                    break;
                case 'notification':
                    await this.sendNotification(scheduledReport, reportResult);
                    break;
                default:
                    console.log(`Report ready for download: ${reportResult.filename}`);
            }
        }
    }
    
    async deliverByEmail(scheduledReport, reportResult) {
        if (!this.emailService) {
            console.log('📧 Email service not configured - simulating email delivery');
            return;
        }
        
        const emailConfig = {
            to: scheduledReport.options.recipients || [],
            subject: scheduledReport.options.subject || `Rapport automatique - ${scheduledReport.template.name}`,
            body: this.generateEmailBody(scheduledReport, reportResult),
            attachments: [{
                filename: reportResult.filename,
                content: reportResult.data,
                contentType: this.getMimeType(reportResult.type)
            }]
        };
        
        try {
            await this.emailService.send(emailConfig);
            console.log(`📧 Report emailed to ${emailConfig.to.length} recipients`);
        } catch (error) {
            console.error('Email delivery failed:', error);
            throw new Error(`Email delivery failed: ${error.message}`);
        }
    }
    
    generateEmailBody(scheduledReport, reportResult) {
        return `
        Bonjour,
        
        Veuillez trouver ci-joint le rapport automatique "${scheduledReport.template.name}" généré le ${new Date().toLocaleDateString('fr-FR')}.
        
        Détails du rapport :
        - Template : ${scheduledReport.template.name}
        - Format : ${reportResult.type.toUpperCase()}
        - Taille : ${this.formatFileSize(reportResult.size)}
        - Pages : ${reportResult.pages || 'N/A'}
        
        Ce rapport a été généré automatiquement par FormEase.
        
        Cordialement,
        L'équipe FormEase
        `;
    }
    
    async deliverByWebhook(scheduledReport, reportResult) {
        const webhookUrl = scheduledReport.options.webhookUrl;
        if (!webhookUrl) {
            throw new Error('Webhook URL not configured');
        }
        
        const payload = {
            reportId: reportResult.id || scheduledReport.id,
            templateName: scheduledReport.template.name,
            format: reportResult.type,
            filename: reportResult.filename,
            size: reportResult.size,
            generatedAt: new Date().toISOString(),
            downloadUrl: this.generateDownloadUrl(reportResult)
        };
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FormEase-Scheduler/1.0'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook responded with status ${response.status}`);
            }
            
            console.log(`🔗 Report delivered via webhook: ${webhookUrl}`);
        } catch (error) {
            console.error('Webhook delivery failed:', error);
            throw new Error(`Webhook delivery failed: ${error.message}`);
        }
    }
    
    async saveToStorage(scheduledReport, reportResult) {
        // In a real implementation, this would save to cloud storage (S3, Azure Blob, etc.)
        const storageKey = `reports/${scheduledReport.templateId}/${new Date().toISOString().split('T')[0]}/${reportResult.filename}`;
        
        try {
            // Simulate storage save
            console.log(`💾 Report saved to storage: ${storageKey}`);
            
            // You could also save to browser storage for demo purposes
            if (typeof localStorage !== 'undefined') {
                const storageData = {
                    key: storageKey,
                    filename: reportResult.filename,
                    type: reportResult.type,
                    size: reportResult.size,
                    savedAt: new Date().toISOString()
                };
                
                const existingReports = JSON.parse(localStorage.getItem('formease-stored-reports') || '[]');
                existingReports.push(storageData);
                
                // Keep only last 50 reports
                if (existingReports.length > 50) {
                    existingReports.splice(0, existingReports.length - 50);
                }
                
                localStorage.setItem('formease-stored-reports', JSON.stringify(existingReports));
            }
        } catch (error) {
            console.error('Storage save failed:', error);
            throw new Error(`Storage save failed: ${error.message}`);
        }
    }
    
    async sendNotification(scheduledReport, reportResult) {
        if (!this.notificationService) {
            console.log('🔔 Notification service not configured - simulating notification');
            return;
        }
        
        const notification = {
            title: 'Rapport généré automatiquement',
            message: `Le rapport "${scheduledReport.template.name}" a été généré avec succès.`,
            type: 'info',
            data: {
                reportId: scheduledReport.id,
                filename: reportResult.filename,
                size: reportResult.size
            }
        };
        
        try {
            await this.notificationService.send(notification);
            console.log('🔔 Notification sent for scheduled report');
        } catch (error) {
            console.error('Notification failed:', error);
            throw new Error(`Notification failed: ${error.message}`);
        }
    }
    
    updateScheduleAfterExecution(scheduledReport, success, error = null) {
        const now = new Date();
        
        // Update last run info
        scheduledReport.lastRun = now.toISOString();
        scheduledReport.runCount = (scheduledReport.runCount || 0) + 1;
        
        if (success) {
            scheduledReport.lastSuccess = now.toISOString();
            scheduledReport.consecutiveFailures = 0;
        } else {
            scheduledReport.lastError = {
                timestamp: now.toISOString(),
                message: error?.message || 'Unknown error'
            };
            scheduledReport.consecutiveFailures = (scheduledReport.consecutiveFailures || 0) + 1;
            
            // Disable schedule after too many failures
            if (scheduledReport.consecutiveFailures >= 5) {
                scheduledReport.schedule.enabled = false;
                console.warn(`⚠️ Schedule disabled due to consecutive failures: ${scheduledReport.id}`);
            }
        }
        
        // Calculate next run time
        scheduledReport.nextRun = this.calculateNextRun(scheduledReport.schedule);
        
        // Update in the main system
        this.reportingSystem.updateScheduledReport(scheduledReport.id, scheduledReport);
    }
    
    calculateNextRun(schedule) {
        const now = new Date();
        const nextRun = new Date();
        
        switch (schedule.frequency) {
            case 'daily':
                nextRun.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                const daysUntilTarget = (schedule.dayOfWeek - now.getDay() + 7) % 7;
                nextRun.setDate(now.getDate() + (daysUntilTarget || 7));
                break;
            case 'monthly':
                nextRun.setMonth(now.getMonth() + 1);
                nextRun.setDate(schedule.dayOfMonth || 1);
                break;
            case 'quarterly':
                nextRun.setMonth(now.getMonth() + 3);
                nextRun.setDate(schedule.dayOfMonth || 1);
                break;
        }
        
        // Set the time
        const [hours, minutes] = (schedule.time || '09:00').split(':');
        nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        return nextRun.toISOString();
    }
    
    async handleScheduleError(scheduledReport, error) {
        console.error(`Scheduled report error for ${scheduledReport.id}:`, error);
        
        // Send error notification if configured
        if (scheduledReport.options.notifyOnError && this.notificationService) {
            await this.notificationService.send({
                title: 'Erreur de rapport planifié',
                message: `Échec de génération du rapport "${scheduledReport.template.name}": ${error.message}`,
                type: 'error',
                data: {
                    scheduleId: scheduledReport.id,
                    error: error.message
                }
            });
        }
    }
    
    getMimeType(type) {
        switch (type) {
            case 'pdf':
                return 'application/pdf';
            case 'excel':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'html':
                return 'text/html';
            default:
                return 'application/octet-stream';
        }
    }
    
    generateDownloadUrl(reportResult) {
        // In a real implementation, this would generate a secure download URL
        return `${window.location.origin}/api/reports/download/${reportResult.id || 'temp'}`;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    loadScheduledJobs() {
        // Load any persisted scheduled jobs
        try {
            const saved = localStorage.getItem('formease-scheduled-jobs');
            if (saved) {
                const jobs = JSON.parse(saved);
                jobs.forEach(job => {
                    this.scheduledJobs.set(job.id, job);
                });
                console.log(`📅 Loaded ${jobs.length} scheduled jobs`);
            }
        } catch (error) {
            console.warn('Could not load scheduled jobs:', error);
        }
    }
    
    saveScheduledJobs() {
        try {
            const jobs = Array.from(this.scheduledJobs.values());
            localStorage.setItem('formease-scheduled-jobs', JSON.stringify(jobs));
        } catch (error) {
            console.warn('Could not save scheduled jobs:', error);
        }
    }
    
    getSchedulerStats() {
        const scheduledReports = this.reportingSystem.getScheduledReports();
        const now = new Date();
        
        const stats = {
            totalSchedules: scheduledReports.length,
            activeSchedules: scheduledReports.filter(s => s.schedule.enabled).length,
            nextExecution: null,
            totalExecutions: scheduledReports.reduce((sum, s) => sum + (s.runCount || 0), 0),
            failureRate: 0
        };
        
        // Find next execution
        const nextRuns = scheduledReports
            .filter(s => s.schedule.enabled)
            .map(s => new Date(s.nextRun))
            .sort((a, b) => a - b);
        
        if (nextRuns.length > 0) {
            stats.nextExecution = nextRuns[0].toISOString();
        }
        
        // Calculate failure rate
        const totalRuns = scheduledReports.reduce((sum, s) => sum + (s.runCount || 0), 0);
        const failures = scheduledReports.reduce((sum, s) => sum + (s.consecutiveFailures || 0), 0);
        
        if (totalRuns > 0) {
            stats.failureRate = (failures / totalRuns) * 100;
        }
        
        return stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportScheduler;
} else {
    window.ReportScheduler = ReportScheduler;
}
