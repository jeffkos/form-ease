/**
 * Navigation Component - FormEase Universal Navigation (Version Autonome)
 * Version simplifiée qui fonctionne de manière autonome
 */

// Vérifier si la classe principale n'existe pas déjà
if (typeof FormEaseNavigation === 'undefined') {
    class FormEaseNavigation {
        constructor(currentPage = '', userInfo = null) {
            this.currentPage = currentPage;
            this.userInfo = userInfo || {
                name: 'Jeff KOSI',
                email: 'jeff.kosi@formease.com',
                avatar: null
            };
            this.notifications = [];
            console.log('FormEaseNavigation initialized with page:', currentPage);
        }

        // Configuration des menus par contexte
        getMenuItems() {
            const baseItems = [
                { id: 'dashboard', label: 'Tableau de bord', href: 'dashboard/home.html' },
                { id: 'forms', label: 'Mes formulaires', href: 'forms/management.html' },
                { id: 'email', label: 'Suivi emails', href: 'email-tracking.html' },
                { id: 'analytics', label: 'Analytics', href: 'analytics/dashboard.html' }
            ];

            // Adaptation contextuelle selon la page courante
            switch (this.currentPage) {
                case 'dashboard':
                    return baseItems.concat([
                        { id: 'users', label: 'Utilisateurs', href: 'dashboard/users.html' },
                        { id: 'settings', label: 'Paramètres', href: 'dashboard/settings.html' }
                    ]);
                
                case 'forms':
                    return baseItems.concat([
                        { id: 'builder', label: 'Créateur', href: 'forms/builder.html' },
                        { id: 'templates', label: 'Modèles', href: 'forms/templates.html' }
                    ]);
                
                case 'analytics':
                    return baseItems.concat([
                        { id: 'reports', label: 'Rapports', href: 'analytics/reports.html' },
                        { id: 'exports', label: 'Exports', href: 'analytics/exports.html' }
                    ]);
                
                default:
                    return baseItems;
            }
        }

        // Génération du HTML de navigation
        generateHTML() {
            const menuItems = this.getMenuItems();
            
            return `
                <nav class="border-b border-gray-200 bg-white/95 backdrop-blur-md fixed w-full z-50">
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between h-16">
                            <!-- Logo et navigation principale -->
                            <div class="flex items-center">
                                <div class="flex-shrink-0 flex items-center">
                                    <a href="dashboard/home.html" class="flex items-center hover:opacity-80 transition-opacity">
                                        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <span class="text-white text-lg font-bold">F</span>
                                        </div>
                                        <span class="ml-3 text-xl font-bold text-gray-900">FormEase</span>
                                    </a>
                                </div>
                                
                                <!-- Menu desktop -->
                                <div class="hidden md:ml-10 md:flex md:space-x-8">
                                    ${menuItems.map(item => `
                                        <a href="${item.href}" 
                                           class="text-gray-600 hover:text-blue-600 transition-colors ${item.id === this.currentPage ? 'text-blue-600 font-medium' : ''}">
                                            ${item.label}
                                        </a>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Actions utilisateur -->
                            <div class="flex items-center space-x-4">
                                <!-- Notifications -->
                                <div class="relative">
                                    <button id="notifications-btn" class="p-2 text-gray-600 hover:text-blue-600 transition-colors relative" 
                                            tabindex="0" aria-label="Notifications" aria-expanded="false" aria-haspopup="true">
                                        <span class="text-xl">🔔</span>
                                        ${this.notifications.length > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">${this.notifications.length}</span>` : ''}
                                    </button>
                                    
                                    <!-- Dropdown notifications -->
                                    <div id="notifications-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                        <div class="p-4 border-b border-gray-200">
                                            <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
                                        </div>
                                        <div class="max-h-64 overflow-y-auto">
                                            ${this.notifications.length === 0 ? 
                                                '<div class="p-4 text-center text-gray-500">Aucune notification</div>' :
                                                this.notifications.map(notif => this.renderNotification(notif)).join('')
                                            }
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Bouton actualiser -->
                                <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" 
                                        onclick="window.location.reload()">
                                    Actualiser
                                </button>
                                
                                <!-- Menu utilisateur -->
                                <div class="relative">
                                    <button id="user-menu-btn" class="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors" 
                                            tabindex="0" aria-label="Menu utilisateur" aria-expanded="false" aria-haspopup="true">
                                        <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span class="text-white text-sm font-medium">${this.userInfo.name.charAt(0)}</span>
                                        </div>
                                        <span class="hidden md:block text-sm">${this.userInfo.name}</span>
                                        <span class="text-sm">▼</span>
                                    </button>
                                    
                                    <!-- Dropdown utilisateur -->
                                    <div id="user-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                        <div class="p-3 border-b border-gray-200">
                                            <p class="text-sm font-medium text-gray-900">${this.userInfo.name}</p>
                                            <p class="text-xs text-gray-500">${this.userInfo.email}</p>
                                        </div>
                                        <div class="py-1">
                                            <a href="dashboard/profile.html" class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Profil
                                            </a>
                                            <a href="dashboard/settings.html" class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Paramètres
                                            </a>
                                            <a href="#" class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                Aide
                                            </a>
                                            <div class="border-t border-gray-200 my-1"></div>
                                            <a href="../../index.html" class="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                                Déconnexion
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Menu mobile toggle -->
                                <div class="md:hidden">
                                    <button id="mobile-menu-btn" class="p-2 text-gray-600 hover:text-blue-600 transition-colors" 
                                            tabindex="0" aria-label="Menu mobile" aria-expanded="false">
                                        <span class="text-xl">☰</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Menu mobile -->
                        <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 bg-white">
                            <div class="px-4 py-3 space-y-2">
                                ${menuItems.map(item => `
                                    <a href="${item.href}" 
                                       class="flex items-center px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors ${item.id === this.currentPage ? 'text-blue-600 bg-blue-50 font-medium' : ''}">
                                        ${item.label}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </nav>
            `;
        }

        // Rendu d'une notification
        renderNotification(notification) {
            const iconMap = {
                'success': '✅',
                'warning': '⚠️',
                'error': '❌',
                'info': 'ℹ️'
            };
            
            return `
                <div class="p-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <span class="text-lg">${iconMap[notification.type] || 'ℹ️'}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-900 font-medium">${notification.title}</p>
                            <p class="text-xs text-gray-500">${notification.message} - ${notification.time}</p>
                        </div>
                        ${notification.unread ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                    </div>
                </div>
            `;
        }

        // Configuration des écouteurs d'événements
        setupEventListeners() {
            console.log('Setting up event listeners...');
            
            // Dropdown notifications
            const notifBtn = document.getElementById('notifications-btn');
            const notifDropdown = document.getElementById('notifications-dropdown');
            
            if (notifBtn && notifDropdown) {
                notifBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    notifDropdown.classList.toggle('hidden');
                    notifBtn.setAttribute('aria-expanded', !notifDropdown.classList.contains('hidden'));
                });
            }

            // Dropdown utilisateur
            const userBtn = document.getElementById('user-menu-btn');
            const userDropdown = document.getElementById('user-menu-dropdown');
            
            if (userBtn && userDropdown) {
                userBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('hidden');
                    userBtn.setAttribute('aria-expanded', !userDropdown.classList.contains('hidden'));
                });
            }

            // Menu mobile
            const mobileBtn = document.getElementById('mobile-menu-btn');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (mobileBtn && mobileMenu) {
                mobileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mobileMenu.classList.toggle('hidden');
                    mobileBtn.setAttribute('aria-expanded', !mobileMenu.classList.contains('hidden'));
                });
            }

            // Fermer les dropdowns en cliquant ailleurs
            document.addEventListener('click', (e) => {
                if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
                    notifDropdown.classList.add('hidden');
                    notifBtn?.setAttribute('aria-expanded', 'false');
                }
                
                if (userDropdown && !userDropdown.classList.contains('hidden')) {
                    userDropdown.classList.add('hidden');
                    userBtn?.setAttribute('aria-expanded', 'false');
                }
            });

            // Support clavier
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    notifDropdown?.classList.add('hidden');
                    userDropdown?.classList.add('hidden');
                    mobileMenu?.classList.add('hidden');
                }
            });
            
            console.log('Event listeners configured');
        }

        // Méthodes publiques pour la gestion
        addNotification(notification) {
            this.notifications.unshift({
                id: Date.now(),
                unread: true,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                ...notification
            });
        }

        updateUser(userInfo) {
            this.userInfo = { ...this.userInfo, ...userInfo };
        }

        render(containerId) {
            console.log('Rendering navigation to container:', containerId);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = this.generateHTML();
                // Attendre un peu que le DOM soit mis à jour
                setTimeout(() => {
                    this.setupEventListeners();
                }, 10);
                console.log('Navigation rendered successfully');
            } else {
                console.error('Container not found:', containerId);
            }
        }
    }

    // Export pour utilisation globale
    window.FormEaseNavigation = FormEaseNavigation;
    console.log('FormEaseNavigation class defined and exported to window');
}
