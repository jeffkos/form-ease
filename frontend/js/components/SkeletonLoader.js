/**
 * 🚀 SPRINT 2 - SkeletonLoader : Composants de chargement style Tremor
 * Design System : Tremor Blocks
 * Couleurs : #ffffff (bg), #2563eb (primary), #f3f4f6 (skeleton)
 * Icônes : Remix Icons
 */

class SkeletonLoader {
    constructor() {
        this.config = {
            colors: {
                background: '#ffffff',
                primary: '#2563eb',
                skeleton: '#f3f4f6',
                skeletonShimmer: '#e5e7eb',
                border: '#e5e7eb'
            },
            animations: {
                duration: '1.5s',
                timing: 'ease-in-out',
                direction: 'infinite alternate'
            }
        };
        
        this.injectCSS();
        console.log('🎨 SkeletonLoader initialisé - Style Tremor');
    }

    /**
     * 💄 Injection des styles CSS Tremor
     */
    injectCSS() {
        if (document.getElementById('tremor-skeleton-styles')) return;

        const style = document.createElement('style');
        style.id = 'tremor-skeleton-styles';
        style.textContent = `
            /* 🎨 Tremor Skeleton Styles */
            .tremor-skeleton {
                background: linear-gradient(
                    90deg,
                    ${this.config.colors.skeleton} 25%,
                    ${this.config.colors.skeletonShimmer} 50%,
                    ${this.config.colors.skeleton} 75%
                );
                background-size: 200% 100%;
                animation: tremor-shimmer ${this.config.animations.duration} ${this.config.animations.timing} ${this.config.animations.direction};
                border-radius: 6px;
            }

            .tremor-skeleton-card {
                background: ${this.config.colors.background};
                border: 1px solid ${this.config.colors.border};
                border-radius: 8px;
                padding: 1.5rem;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }

            .tremor-skeleton-table-row {
                border-bottom: 1px solid ${this.config.colors.border};
                padding: 0.75rem 0;
            }

            .tremor-skeleton-form-field {
                margin-bottom: 1rem;
            }

            .tremor-skeleton-badge {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
            }

            @keyframes tremor-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            /* 🎯 Variations spécifiques */
            .tremor-skeleton-text-sm { height: 1rem; width: 60%; }
            .tremor-skeleton-text-md { height: 1.25rem; width: 80%; }
            .tremor-skeleton-text-lg { height: 1.5rem; width: 90%; }
            .tremor-skeleton-text-xl { height: 2rem; width: 95%; }

            .tremor-skeleton-button { 
                height: 2.5rem; 
                width: 6rem; 
                border-radius: 6px;
            }

            .tremor-skeleton-avatar { 
                width: 2.5rem; 
                height: 2.5rem; 
                border-radius: 50%;
            }

            .tremor-skeleton-icon { 
                width: 1.25rem; 
                height: 1.25rem; 
                border-radius: 4px;
            }

            /* 📊 Tremor Chart Skeletons */
            .tremor-skeleton-chart {
                height: 300px;
                border-radius: 8px;
                position: relative;
                overflow: hidden;
            }

            .tremor-skeleton-kpi {
                height: 4rem;
                border-radius: 8px;
                margin-bottom: 0.5rem;
            }

            /* 📱 Responsive */
            @media (max-width: 640px) {
                .tremor-skeleton-card { padding: 1rem; }
                .tremor-skeleton-chart { height: 200px; }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 📋 Skeleton pour liste de formulaires (style Tremor)
     */
    createFormListSkeleton(count = 5) {
        return `
            <div class="space-y-4">
                <!-- 📊 Header avec stats -->
                <div class="tremor-skeleton-card">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        ${Array(4).fill(0).map(() => `
                            <div class="text-center">
                                <div class="tremor-skeleton tremor-skeleton-kpi mb-2"></div>
                                <div class="tremor-skeleton tremor-skeleton-text-sm mx-auto"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 🔍 Barre de recherche et filtres -->
                <div class="tremor-skeleton-card">
                    <div class="flex flex-col md:flex-row gap-4 items-center">
                        <div class="flex-1">
                            <div class="tremor-skeleton tremor-skeleton-text-md mb-2"></div>
                            <div class="tremor-skeleton h-10 w-full"></div>
                        </div>
                        <div class="flex gap-2">
                            <div class="tremor-skeleton tremor-skeleton-button"></div>
                            <div class="tremor-skeleton tremor-skeleton-button"></div>
                        </div>
                    </div>
                </div>

                <!-- 📝 Liste des formulaires -->
                <div class="tremor-skeleton-card">
                    <div class="space-y-4">
                        ${Array(count).fill(0).map((_, index) => `
                            <div class="tremor-skeleton-table-row flex items-center justify-between">
                                <div class="flex items-center space-x-4 flex-1">
                                    <div class="tremor-skeleton tremor-skeleton-icon"></div>
                                    <div class="flex-1 space-y-2">
                                        <div class="tremor-skeleton tremor-skeleton-text-lg"></div>
                                        <div class="tremor-skeleton tremor-skeleton-text-sm"></div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div class="tremor-skeleton tremor-skeleton-badge"></div>
                                    <div class="tremor-skeleton tremor-skeleton-text-sm"></div>
                                    <div class="flex space-x-1">
                                        ${Array(3).fill(0).map(() => `
                                            <div class="tremor-skeleton w-8 h-8 rounded"></div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 📊 Skeleton pour dashboard (style Tremor)
     */
    createDashboardSkeleton() {
        return `
            <div class="space-y-6">
                <!-- 📈 KPI Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${Array(4).fill(0).map(() => `
                        <div class="tremor-skeleton-card">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="tremor-skeleton tremor-skeleton-text-sm mb-2"></div>
                                    <div class="tremor-skeleton tremor-skeleton-text-xl mb-1"></div>
                                    <div class="tremor-skeleton tremor-skeleton-text-sm w-20"></div>
                                </div>
                                <div class="tremor-skeleton tremor-skeleton-icon"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 📊 Charts Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="tremor-skeleton-card">
                        <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                        <div class="tremor-skeleton tremor-skeleton-chart"></div>
                    </div>
                    <div class="tremor-skeleton-card">
                        <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                        <div class="tremor-skeleton tremor-skeleton-chart"></div>
                    </div>
                </div>

                <!-- 📋 Recent Activity -->
                <div class="tremor-skeleton-card">
                    <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                    <div class="space-y-3">
                        ${Array(5).fill(0).map(() => `
                            <div class="flex items-center space-x-4">
                                <div class="tremor-skeleton tremor-skeleton-avatar"></div>
                                <div class="flex-1 space-y-1">
                                    <div class="tremor-skeleton tremor-skeleton-text-md"></div>
                                    <div class="tremor-skeleton tremor-skeleton-text-sm w-32"></div>
                                </div>
                                <div class="tremor-skeleton tremor-skeleton-text-sm w-20"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 🏗️ Skeleton pour form builder (style Tremor)
     */
    createFormBuilderSkeleton() {
        return `
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
                <!-- 🛠️ Palette d'outils -->
                <div class="tremor-skeleton-card h-full">
                    <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                    <div class="space-y-3">
                        ${Array(8).fill(0).map(() => `
                            <div class="tremor-skeleton h-12 rounded-lg"></div>
                        `).join('')}
                    </div>
                </div>

                <!-- 🖼️ Zone de construction -->
                <div class="lg:col-span-2 tremor-skeleton-card h-full">
                    <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                    <div class="space-y-4">
                        ${Array(6).fill(0).map(() => `
                            <div class="tremor-skeleton h-16 rounded-lg"></div>
                        `).join('')}
                    </div>
                </div>

                <!-- ⚙️ Propriétés -->
                <div class="tremor-skeleton-card h-full">
                    <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                    <div class="space-y-4">
                        ${Array(10).fill(0).map(() => `
                            <div class="tremor-skeleton-form-field">
                                <div class="tremor-skeleton tremor-skeleton-text-sm mb-2"></div>
                                <div class="tremor-skeleton h-10 rounded"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 🤖 Skeleton pour générateur IA (style Tremor)
     */
    createAIGeneratorSkeleton() {
        return `
            <div class="max-w-4xl mx-auto space-y-6">
                <!-- 🎯 Header -->
                <div class="tremor-skeleton-card text-center">
                    <div class="tremor-skeleton tremor-skeleton-text-xl mx-auto mb-4 w-80"></div>
                    <div class="tremor-skeleton tremor-skeleton-text-md mx-auto w-96"></div>
                </div>

                <!-- 💬 Zone de prompt -->
                <div class="tremor-skeleton-card">
                    <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                    <div class="tremor-skeleton h-32 mb-4 rounded-lg"></div>
                    <div class="flex justify-between items-center">
                        <div class="tremor-skeleton tremor-skeleton-text-sm w-32"></div>
                        <div class="tremor-skeleton tremor-skeleton-button"></div>
                    </div>
                </div>

                <!-- 🎨 Options de personnalisation -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="tremor-skeleton-card">
                        <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                        <div class="space-y-3">
                            ${Array(4).fill(0).map(() => `
                                <div class="tremor-skeleton h-10 rounded"></div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tremor-skeleton-card">
                        <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                        <div class="space-y-3">
                            ${Array(4).fill(0).map(() => `
                                <div class="tremor-skeleton h-10 rounded"></div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 📋 Aperçu en cours de génération -->
                <div class="tremor-skeleton-card">
                    <div class="tremor-skeleton tremor-skeleton-text-lg mb-4"></div>
                    <div class="space-y-4">
                        ${Array(5).fill(0).map(() => `
                            <div class="tremor-skeleton h-12 rounded-lg"></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 📱 Skeleton pour tableau responsive (style Tremor)
     */
    createTableSkeleton(rows = 10, columns = 5) {
        return `
            <div class="tremor-skeleton-card">
                <!-- Header du tableau -->
                <div class="tremor-skeleton-table-row grid grid-cols-${columns} gap-4 font-medium">
                    ${Array(columns).fill(0).map(() => `
                        <div class="tremor-skeleton tremor-skeleton-text-sm"></div>
                    `).join('')}
                </div>
                
                <!-- Lignes du tableau -->
                <div class="space-y-0">
                    ${Array(rows).fill(0).map(() => `
                        <div class="tremor-skeleton-table-row grid grid-cols-${columns} gap-4 items-center">
                            ${Array(columns).fill(0).map((_, colIndex) => `
                                <div class="tremor-skeleton ${colIndex === 0 ? 'tremor-skeleton-text-md' : 'tremor-skeleton-text-sm'}"></div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 🎨 Application du skeleton à un élément
     */
    applyTo(element, type = 'formList', options = {}) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) {
            console.warn('🤔 Élément non trouvé pour skeleton');
            return;
        }

        const skeletonContent = this.generateSkeleton(type, options);
        element.innerHTML = skeletonContent;
        element.classList.add('tremor-skeleton-container');
        
        console.log(`🎨 Skeleton appliqué: ${type}`, options);
    }

    /**
     * 🏭 Factory de skeletons
     */
    generateSkeleton(type, options = {}) {
        switch (type) {
            case 'formList':
                return this.createFormListSkeleton(options.count);
            case 'dashboard':
                return this.createDashboardSkeleton();
            case 'formBuilder':
                return this.createFormBuilderSkeleton();
            case 'aiGenerator':
                return this.createAIGeneratorSkeleton();
            case 'table':
                return this.createTableSkeleton(options.rows, options.columns);
            default:
                console.warn(`🤔 Type de skeleton inconnu: ${type}`);
                return this.createFormListSkeleton();
        }
    }

    /**
     * ✨ Removal du skeleton avec animation
     */
    remove(element, fadeOut = true) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        if (!element) return;

        if (fadeOut) {
            element.style.transition = 'opacity 0.3s ease-out';
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.classList.remove('tremor-skeleton-container');
                element.style.opacity = '';
                element.style.transition = '';
            }, 300);
        } else {
            element.classList.remove('tremor-skeleton-container');
        }
        
        console.log('✨ Skeleton supprimé avec animation');
    }

    /**
     * 🎯 Skeleton intelligent basé sur le contenu
     */
    createSmartSkeleton(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        
        const classes = element.className;
        
        if (classes.includes('dashboard')) {
            return this.generateSkeleton('dashboard');
        } else if (classes.includes('form-builder')) {
            return this.generateSkeleton('formBuilder');
        } else if (classes.includes('ai-generator')) {
            return this.generateSkeleton('aiGenerator');
        } else if (classes.includes('table')) {
            return this.generateSkeleton('table');
        } else {
            return this.generateSkeleton('formList');
        }
    }
}

// Export pour utilisation globale
window.SkeletonLoader = SkeletonLoader;

// Instance globale
window.tremorSkeleton = new SkeletonLoader();

console.log('🎨 SkeletonLoader chargé - Style Tremor prêt !');
