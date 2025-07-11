/**
 * Report Templates Manager
 * Advanced template system for creating custom reports
 */

class ReportTemplateManager {
    constructor(reportingSystem) {
        this.reportingSystem = reportingSystem;
        this.templateBuilder = null;
        this.currentTemplate = null;
        
        this.sectionTypes = new Map([
            ['header', {
                name: 'En-tête',
                icon: 'ri-heading',
                description: 'Titre et informations générales du rapport',
                configurable: ['title', 'subtitle', 'showDate', 'showLogo']
            }],
            ['metrics', {
                name: 'Métriques',
                icon: 'ri-dashboard-line',
                description: 'Affichage de KPIs et métriques clés',
                configurable: ['metrics', 'layout', 'colors']
            }],
            ['charts', {
                name: 'Graphiques',
                icon: 'ri-bar-chart-line',
                description: 'Visualisations de données en graphiques',
                configurable: ['chartTypes', 'fields', 'colors', 'size']
            }],
            ['table', {
                name: 'Tableau',
                icon: 'ri-table-line',
                description: 'Données tabulaires avec tri et filtres',
                configurable: ['columns', 'sorting', 'pagination', 'styling']
            }],
            ['text', {
                name: 'Texte',
                icon: 'ri-text',
                description: 'Contenu textuel libre et formaté',
                configurable: ['content', 'formatting', 'alignment']
            }],
            ['insights', {
                name: 'Insights',
                icon: 'ri-lightbulb-line',
                description: 'Analyses automatiques et recommandations',
                configurable: ['autoGenerate', 'categories', 'priority']
            }],
            ['image', {
                name: 'Image',
                icon: 'ri-image-line',
                description: 'Images, logos et éléments visuels',
                configurable: ['source', 'size', 'alignment', 'caption']
            }],
            ['spacer', {
                name: 'Espacement',
                icon: 'ri-space',
                description: 'Espace vertical pour la mise en page',
                configurable: ['height', 'background']
            }]
        ]);
        
        this.init();
    }
    
    init() {
        console.log('📝 Report Template Manager initialized');
    }
    
    createTemplate(name, category = 'custom') {
        const template = {
            id: `template_${Date.now()}`,
            name,
            description: '',
            category,
            type: 'custom',
            icon: 'ri-file-edit-line',
            sections: [],
            formats: ['pdf', 'excel', 'html'],
            scheduling: {
                enabled: true,
                frequencies: ['daily', 'weekly', 'monthly']
            },
            isCustom: true,
            created: new Date().toISOString(),
            version: '1.0'
        };
        
        this.currentTemplate = template;
        return template;
    }
    
    addSection(templateId, sectionConfig) {
        const template = this.reportingSystem.getReportTemplate(templateId) || this.currentTemplate;
        if (!template) {
            throw new Error('Template not found');
        }
        
        const section = {
            id: `section_${Date.now()}`,
            type: sectionConfig.type,
            title: sectionConfig.title || this.sectionTypes.get(sectionConfig.type)?.name || 'Section',
            order: template.sections.length,
            ...sectionConfig
        };
        
        template.sections.push(section);
        
        if (template === this.currentTemplate) {
            // Update in reporting system if it's saved
            if (this.reportingSystem.getReportTemplate(templateId)) {
                this.reportingSystem.addReportTemplate(template);
            }
        }
        
        return section;
    }
    
    removeSection(templateId, sectionId) {
        const template = this.reportingSystem.getReportTemplate(templateId) || this.currentTemplate;
        if (!template) return false;
        
        const index = template.sections.findIndex(s => s.id === sectionId);
        if (index === -1) return false;
        
        template.sections.splice(index, 1);
        
        // Reorder remaining sections
        template.sections.forEach((section, i) => {
            section.order = i;
        });
        
        return true;
    }
    
    updateSection(templateId, sectionId, updates) {
        const template = this.reportingSystem.getReportTemplate(templateId) || this.currentTemplate;
        if (!template) return null;
        
        const section = template.sections.find(s => s.id === sectionId);
        if (!section) return null;
        
        Object.assign(section, updates);
        return section;
    }
    
    reorderSections(templateId, sectionIds) {
        const template = this.reportingSystem.getReportTemplate(templateId) || this.currentTemplate;
        if (!template) return false;
        
        const sections = sectionIds.map(id => 
            template.sections.find(s => s.id === id)
        ).filter(Boolean);
        
        if (sections.length !== template.sections.length) return false;
        
        sections.forEach((section, index) => {
            section.order = index;
        });
        
        template.sections = sections;
        return true;
    }
    
    duplicateSection(templateId, sectionId) {
        const template = this.reportingSystem.getReportTemplate(templateId) || this.currentTemplate;
        if (!template) return null;
        
        const originalSection = template.sections.find(s => s.id === sectionId);
        if (!originalSection) return null;
        
        const duplicatedSection = {
            ...JSON.parse(JSON.stringify(originalSection)),
            id: `section_${Date.now()}`,
            title: `${originalSection.title} (copie)`,
            order: template.sections.length
        };
        
        template.sections.push(duplicatedSection);
        return duplicatedSection;
    }
    
    saveTemplate(template = this.currentTemplate) {
        if (!template) {
            throw new Error('No template to save');
        }
        
        template.updated = new Date().toISOString();
        const templateId = this.reportingSystem.addReportTemplate(template);
        
        console.log(`💾 Template saved: ${template.name}`);
        return templateId;
    }
    
    loadTemplate(templateId) {
        const template = this.reportingSystem.getReportTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        this.currentTemplate = JSON.parse(JSON.stringify(template)); // Deep clone
        return this.currentTemplate;
    }
    
    exportTemplate(templateId) {
        const template = this.reportingSystem.getReportTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        const exportData = {
            template,
            exportedAt: new Date().toISOString(),
            exportedBy: 'FormEase Reporting System',
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name.replace(/[^a-z0-9]/gi, '_')}_template.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📤 Template exported: ${template.name}`);
    }
    
    async importTemplate(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (!importData.template || !importData.template.sections) {
                        throw new Error('Invalid template format');
                    }
                    
                    const template = importData.template;
                    
                    // Update metadata
                    template.id = `template_${Date.now()}`;
                    template.imported = new Date().toISOString();
                    template.isCustom = true;
                    
                    // Generate new IDs for sections
                    template.sections.forEach(section => {
                        section.id = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    });
                    
                    const templateId = this.reportingSystem.addReportTemplate(template);
                    
                    console.log(`📥 Template imported: ${template.name}`);
                    resolve({ templateId, template });
                    
                } catch (error) {
                    reject(new Error(`Import failed: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsText(file);
        });
    }
    
    getSectionTypes() {
        return Array.from(this.sectionTypes.entries()).map(([type, config]) => ({
            type,
            ...config
        }));
    }
    
    getSectionConfig(sectionType) {
        return this.sectionTypes.get(sectionType);
    }
    
    validateTemplate(template) {
        const errors = [];
        const warnings = [];
        
        // Basic validation
        if (!template.name || template.name.trim().length === 0) {
            errors.push('Template name is required');
        }
        
        if (!template.sections || template.sections.length === 0) {
            warnings.push('Template has no sections');
        }
        
        // Section validation
        template.sections?.forEach((section, index) => {
            if (!section.type) {
                errors.push(`Section ${index + 1}: Type is required`);
            }
            
            if (!this.sectionTypes.has(section.type)) {
                errors.push(`Section ${index + 1}: Unknown section type "${section.type}"`);
            }
            
            if (!section.title || section.title.trim().length === 0) {
                warnings.push(`Section ${index + 1}: Title is empty`);
            }
        });
        
        // Format validation
        if (!template.formats || template.formats.length === 0) {
            warnings.push('No export formats specified');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    previewTemplate(template, sampleData = {}) {
        const validation = this.validateTemplate(template);
        
        if (!validation.isValid) {
            throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
        }
        
        // Generate preview with sample data
        return this.reportingSystem.generateReport(template.id, sampleData, {
            format: 'html',
            title: `Aperçu - ${template.name}`,
            isPreview: true
        });
    }
    
    cloneTemplate(templateId, newName) {
        const originalTemplate = this.reportingSystem.getReportTemplate(templateId);
        if (!originalTemplate) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        const clonedTemplate = JSON.parse(JSON.stringify(originalTemplate));
        
        // Update metadata
        clonedTemplate.id = `template_${Date.now()}`;
        clonedTemplate.name = newName || `${originalTemplate.name} (copie)`;
        clonedTemplate.created = new Date().toISOString();
        clonedTemplate.isCustom = true;
        delete clonedTemplate.updated;
        
        // Generate new section IDs
        clonedTemplate.sections.forEach(section => {
            section.id = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        });
        
        const newTemplateId = this.reportingSystem.addReportTemplate(clonedTemplate);
        
        console.log(`📋 Template cloned: ${originalTemplate.name} → ${clonedTemplate.name}`);
        return { templateId: newTemplateId, template: clonedTemplate };
    }
    
    getTemplateUsageStats(templateId) {
        const template = this.reportingSystem.getReportTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        const history = this.reportingSystem.getReportHistory();
        const templateReports = history.filter(report => report.templateId === templateId);
        
        const stats = {
            totalReports: templateReports.length,
            successfulReports: templateReports.filter(r => r.success).length,
            lastUsed: templateReports.length > 0 ? templateReports[0].generated : null,
            averageDuration: 0,
            formatBreakdown: {},
            monthlyUsage: {}
        };
        
        if (templateReports.length > 0) {
            stats.averageDuration = templateReports.reduce((sum, r) => sum + r.duration, 0) / templateReports.length;
            
            // Format breakdown
            templateReports.forEach(report => {
                const format = report.options.format;
                stats.formatBreakdown[format] = (stats.formatBreakdown[format] || 0) + 1;
            });
            
            // Monthly usage
            templateReports.forEach(report => {
                const month = report.generated.substring(0, 7); // YYYY-MM
                stats.monthlyUsage[month] = (stats.monthlyUsage[month] || 0) + 1;
            });
        }
        
        return stats;
    }
    
    searchTemplates(query, filters = {}) {
        const allTemplates = this.reportingSystem.getAllReportTemplates();
        
        let results = allTemplates.filter(template => {
            // Text search
            if (query) {
                const searchText = query.toLowerCase();
                const searchableText = [
                    template.name,
                    template.description,
                    template.category,
                    ...(template.sections?.map(s => s.title) || [])
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchText)) {
                    return false;
                }
            }
            
            // Category filter
            if (filters.category && template.category !== filters.category) {
                return false;
            }
            
            // Type filter
            if (filters.type && template.type !== filters.type) {
                return false;
            }
            
            // Custom/built-in filter
            if (filters.isCustom !== undefined && !!template.isCustom !== filters.isCustom) {
                return false;
            }
            
            // Format support filter
            if (filters.format && !template.formats?.includes(filters.format)) {
                return false;
            }
            
            return true;
        });
        
        // Sort results
        if (filters.sortBy) {
            results.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'created':
                        return new Date(b.created) - new Date(a.created);
                    case 'updated':
                        return new Date(b.updated || b.created) - new Date(a.updated || a.created);
                    case 'category':
                        return a.category.localeCompare(b.category);
                    default:
                        return 0;
                }
            });
        }
        
        return results;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportTemplateManager;
} else {
    window.ReportTemplateManager = ReportTemplateManager;
}
