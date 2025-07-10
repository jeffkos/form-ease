/**
 * 🚀 SPRINT 2 - Composants Tremor avec Tailwind CSS
 * Design System : Tremor Blocks + Tailwind
 * Documentation : https://blocks.tremor.so/
 * Icônes : Remix Icons
 */

class TremorComponents {
    constructor() {
        this.classes = window.tremorClasses || {};
        console.log('🎨 TremorComponents initialisé avec Tailwind CSS');
    }

    /**
     * 📊 KPI Card - Composant métrique Tremor
     */
    createKPICard({ title, value, delta, deltaType = 'neutral', icon, color = 'blue' }) {
        const deltaColors = {
            positive: 'text-emerald-600',
            negative: 'text-red-600', 
            neutral: 'text-gray-600'
        };

        const iconColors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-emerald-100 text-emerald-600',
            red: 'bg-red-100 text-red-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            purple: 'bg-purple-100 text-purple-600'
        };

        return `
            <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-600 mb-1">${title}</p>
                        <p class="text-3xl font-bold text-gray-900">${value}</p>
                        ${delta ? `
                            <p class="text-sm ${deltaColors[deltaType]} mt-1">
                                <i class="ri-arrow-${deltaType === 'positive' ? 'up' : deltaType === 'negative' ? 'down' : 'right'}-line mr-1"></i>
                                ${delta}
                            </p>
                        ` : ''}
                    </div>
                    ${icon ? `
                        <div class="w-12 h-12 ${iconColors[color]} rounded-lg flex items-center justify-center">
                            <i class="${icon} text-xl"></i>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 🃏 Card - Composant carte Tremor standard
     */
    createCard({ title, subtitle, content, actions, className = '' }) {
        return `
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${className}">
                ${title || subtitle ? `
                    <div class="px-6 py-4 border-b border-gray-200">
                        ${title ? `<h3 class="text-lg font-semibold text-gray-900">${title}</h3>` : ''}
                        ${subtitle ? `<p class="text-sm text-gray-600 mt-1">${subtitle}</p>` : ''}
                    </div>
                ` : ''}
                <div class="p-6">
                    ${content}
                </div>
                ${actions ? `
                    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <div class="flex justify-end space-x-3">
                            ${actions}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * 🎯 Button - Boutons Tremor style
     */
    createButton({ text, variant = 'primary', size = 'md', icon, disabled = false, onClick }) {
        const variants = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
            secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300',
            success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
            danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
            outline: 'bg-transparent text-blue-600 hover:bg-blue-50 border-blue-600'
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base'
        };

        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
        const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

        const buttonId = `btn-${Math.random().toString(36).substr(2, 9)}`;

        setTimeout(() => {
            const btn = document.getElementById(buttonId);
            if (btn && onClick) {
                btn.addEventListener('click', onClick);
            }
        }, 0);

        return `
            <button 
                id="${buttonId}"
                class="${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses}"
                ${disabled ? 'disabled' : ''}
            >
                ${icon ? `<i class="${icon} mr-2"></i>` : ''}
                ${text}
            </button>
        `;
    }

    /**
     * 📊 Table - Tableau Tremor responsive
     */
    createTable({ headers, rows, actions = true }) {
        return `
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                ${headers.map(header => `
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ${header}
                                    </th>
                                `).join('')}
                                ${actions ? '<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>' : ''}
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${rows.map((row, index) => `
                                <tr class="hover:bg-gray-50 transition-colors duration-150">
                                    ${row.cells.map(cell => `
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${cell}
                                        </td>
                                    `).join('')}
                                    ${actions ? `
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex justify-end space-x-2">
                                                ${row.actions || `
                                                    <button class="text-blue-600 hover:text-blue-900">
                                                        <i class="ri-eye-line"></i>
                                                    </button>
                                                    <button class="text-gray-600 hover:text-gray-900">
                                                        <i class="ri-edit-line"></i>
                                                    </button>
                                                    <button class="text-red-600 hover:text-red-900">
                                                        <i class="ri-delete-bin-line"></i>
                                                    </button>
                                                `}
                                            </div>
                                        </td>
                                    ` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * 🏷️ Badge - Badges Tremor colorés
     */
    createBadge({ text, variant = 'neutral', size = 'md' }) {
        const variants = {
            success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            error: 'bg-red-100 text-red-800 border-red-200',
            info: 'bg-blue-100 text-blue-800 border-blue-200',
            neutral: 'bg-gray-100 text-gray-800 border-gray-200'
        };

        const sizes = {
            sm: 'px-2 py-1 text-xs',
            md: 'px-2.5 py-1 text-sm',
            lg: 'px-3 py-1.5 text-sm'
        };

        return `
            <span class="inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]}">
                ${text}
            </span>
        `;
    }

    /**
     * 📱 Input - Champs de saisie Tremor
     */
    createInput({ 
        type = 'text', 
        placeholder, 
        label, 
        value = '', 
        required = false, 
        disabled = false,
        icon,
        error,
        help
    }) {
        const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="space-y-1">
                ${label ? `
                    <label for="${inputId}" class="block text-sm font-medium text-gray-700">
                        ${label} ${required ? '<span class="text-red-500">*</span>' : ''}
                    </label>
                ` : ''}
                <div class="relative">
                    ${icon ? `
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="${icon} text-gray-400"></i>
                        </div>
                    ` : ''}
                    <input
                        type="${type}"
                        id="${inputId}"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${icon ? 'pl-10' : ''} ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''} ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}"
                        placeholder="${placeholder || ''}"
                        value="${value}"
                        ${required ? 'required' : ''}
                        ${disabled ? 'disabled' : ''}
                    />
                </div>
                ${error ? `
                    <p class="text-sm text-red-600 flex items-center">
                        <i class="ri-error-warning-line mr-1"></i>
                        ${error}
                    </p>
                ` : ''}
                ${help ? `
                    <p class="text-sm text-gray-500">${help}</p>
                ` : ''}
            </div>
        `;
    }

    /**
     * 🔄 Loading Skeleton - Style Tremor
     */
    createSkeleton({ type = 'text', width = 'full', height = 'auto', count = 1 }) {
        const skeletons = {
            text: `<div class="animate-pulse bg-gray-200 rounded h-4 w-${width}"></div>`,
            card: `
                <div class="animate-pulse bg-white p-6 rounded-lg border border-gray-200">
                    <div class="flex items-center space-x-4">
                        <div class="rounded-full bg-gray-200 h-12 w-12"></div>
                        <div class="space-y-2 flex-1">
                            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            `,
            table: `
                <div class="animate-pulse bg-white rounded-lg border border-gray-200 p-6">
                    <div class="space-y-3">
                        ${Array(5).fill(0).map(() => `
                            <div class="grid grid-cols-4 gap-4">
                                <div class="h-4 bg-gray-200 rounded"></div>
                                <div class="h-4 bg-gray-200 rounded"></div>
                                <div class="h-4 bg-gray-200 rounded"></div>
                                <div class="h-4 bg-gray-200 rounded"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
        };

        return Array(count).fill(0).map(() => skeletons[type]).join('');
    }

    /**
     * 🚨 Alert - Notifications Tremor
     */
    createAlert({ type = 'info', title, message, dismissible = true, actions }) {
        const types = {
            success: {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                icon: 'ri-check-line text-emerald-400',
                text: 'text-emerald-800'
            },
            warning: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200', 
                icon: 'ri-alert-line text-yellow-400',
                text: 'text-yellow-800'
            },
            error: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                icon: 'ri-error-warning-line text-red-400',
                text: 'text-red-800'
            },
            info: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                icon: 'ri-information-line text-blue-400',
                text: 'text-blue-800'
            }
        };

        const alertType = types[type];
        const alertId = `alert-${Math.random().toString(36).substr(2, 9)}`;

        setTimeout(() => {
            const dismissBtn = document.getElementById(`dismiss-${alertId}`);
            if (dismissBtn) {
                dismissBtn.addEventListener('click', () => {
                    const alert = document.getElementById(alertId);
                    if (alert) {
                        alert.style.opacity = '0';
                        alert.style.transform = 'translateY(-100%)';
                        setTimeout(() => alert.remove(), 300);
                    }
                });
            }
        }, 0);

        return `
            <div id="${alertId}" class="rounded-lg border p-4 transition-all duration-300 ${alertType.bg} ${alertType.border}">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="${alertType.icon} text-xl"></i>
                    </div>
                    <div class="ml-3 flex-1">
                        ${title ? `<h3 class="text-sm font-medium ${alertType.text}">${title}</h3>` : ''}
                        ${message ? `<div class="text-sm ${alertType.text} ${title ? 'mt-1' : ''}">${message}</div>` : ''}
                        ${actions ? `<div class="mt-2">${actions}</div>` : ''}
                    </div>
                    ${dismissible ? `
                        <div class="ml-auto pl-3">
                            <button id="dismiss-${alertId}" class="${alertType.text} hover:bg-black hover:bg-opacity-10 rounded p-1.5">
                                <i class="ri-close-line"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * 📊 Progress Bar - Barre de progression Tremor
     */
    createProgressBar({ value, max = 100, color = 'blue', size = 'md', showValue = true, label }) {
        const colors = {
            blue: 'bg-blue-600',
            green: 'bg-emerald-600',
            yellow: 'bg-yellow-600',
            red: 'bg-red-600',
            purple: 'bg-purple-600'
        };

        const sizes = {
            sm: 'h-2',
            md: 'h-3',
            lg: 'h-4'
        };

        const percentage = Math.round((value / max) * 100);

        return `
            <div class="space-y-2">
                ${label || showValue ? `
                    <div class="flex justify-between items-center">
                        ${label ? `<span class="text-sm font-medium text-gray-700">${label}</span>` : ''}
                        ${showValue ? `<span class="text-sm text-gray-500">${percentage}%</span>` : ''}
                    </div>
                ` : ''}
                <div class="w-full bg-gray-200 rounded-full ${sizes[size]}">
                    <div 
                        class="${colors[color]} ${sizes[size]} rounded-full transition-all duration-500 ease-out"
                        style="width: ${percentage}%"
                    ></div>
                </div>
            </div>
        `;
    }
}

// Export global
window.TremorComponents = TremorComponents;
window.tremor = new TremorComponents();

console.log('🎨 TremorComponents chargé avec Tailwind CSS');
console.log('🚀 Usage: tremor.createKPICard({ ... })');
