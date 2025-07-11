// Fonctions JavaScript simplifiées pour FormEase

// Test de base
function testFunction() {
    alert('Test fonction OK!');
    console.log('testFunction appelée');
}

// Version complète de viewResponses
function viewResponses(formId, formName, responseCount) {
    console.log('viewResponses appelée avec:', formId, formName, responseCount);
    
    if (responseCount === 0) {
        alert('Aucune réponse pour ' + formName);
        return;
    }
    
    // Modal complet avec gestion des réponses
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; max-width: 90vw; max-height: 90vh; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
                <div style="display: flex; align-items: center; justify-content: between;">
                    <div style="flex: 1;">
                        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">📊 ${formName}</h2>
                        <p style="margin: 0; opacity: 0.9; font-size: 14px;">${responseCount} réponses • Gestion avancée</p>
                    </div>
                    <button onclick="this.closest('[style*=fixed]').remove()" 
                            style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 18px;">
                        ✕
                    </button>
                </div>
            </div>
            
            <!-- Corps principal -->
            <div style="display: flex; height: 70vh;">
                <!-- Sidebar Filtres -->
                <div style="width: 300px; background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 20px; overflow-y: auto;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">🔍 Filtres intelligents</h3>
                    ${getSmartFiltersHTML(formId)}
                </div>
                
                <!-- Zone de contenu -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <!-- Contrôles -->
                    <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: white;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 14px;">
                                    <input type="checkbox" id="select-all-${formId}" onchange="toggleSelectAll('${formId}')">
                                    Tout sélectionner
                                </label>
                                <span id="selection-count-${formId}" style="font-size: 12px; color: #6b7280;">0 sélectionné(s)</span>
                            </div>
                            <select style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="25">25 par page</option>
                                <option value="50">50 par page</option>
                                <option value="100">100 par page</option>
                            </select>
                        </div>
                        
                        <!-- Actions en lot -->
                        <div id="bulk-actions-${formId}" style="display: none; background: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px;">
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button onclick="bulkAction('email')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">📧 Email</button>
                                <button onclick="bulkAction('sms')" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">📱 SMS</button>
                                <button onclick="bulkAction('newsletter')" style="background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">📰 Newsletter</button>
                                <button onclick="bulkAction('archive')" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">📁 Archiver</button>
                                <button onclick="bulkAction('delete')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">🗑️ Supprimer</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tableau des réponses -->
                    <div style="flex: 1; overflow-y: auto; padding: 20px;">
                        ${getResponsesTable(formId, responseCount)}
                    </div>
                    
                    <!-- Pagination -->
                    <div style="padding: 16px 20px; border-top: 1px solid #e2e8f0; background: white; display: flex; justify-content: between; align-items: center;">
                        <span style="font-size: 14px; color: #6b7280;">Affichage de 1 à 25 sur ${responseCount} réponses</span>
                        <div style="display: flex; gap: 4px;">
                            <button style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer;">←</button>
                            <button style="padding: 6px 12px; border: 1px solid #d1d5db; background: #3b82f6; color: white; border-radius: 4px;">1</button>
                            <button style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer;">2</button>
                            <button style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 4px; cursor: pointer;">→</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('Modal complet de réponses affiché');
}

// Version simplifiée de shareForm
function shareForm(formId, formName) {
    console.log('shareForm appelée avec:', formId, formName);
    
    const shareUrl = window.location.origin + '/form/' + formId;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(function() {
            alert('Lien copié: ' + shareUrl);
        }).catch(function() {
            alert('Lien à partager: ' + shareUrl);
        });
    } else {
        alert('Lien à partager: ' + shareUrl);
    }
}

// Version simplifiée de showQRCode
function showQRCode(formId, formName) {
    console.log('showQRCode appelée avec:', formId, formName);
    alert('QR Code pour: ' + formName + ' (ID: ' + formId + ')');
}

console.log('Fonctions FormEase chargées avec succès');

// Fonctions auxiliaires pour le modal des réponses

function getSmartFiltersHTML(formId) {
    const filters = {
        'form-1': `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">📅 Période</label>
                <input type="date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-bottom: 8px;">
                <input type="date" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">🏷️ Sujet</label>
                <label style="display: flex; align-items: center; margin-bottom: 6px; padding: 4px; border-radius: 4px; cursor: pointer;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" style="margin-right: 8px;"> Support technique
                </label>
                <label style="display: flex; align-items: center; margin-bottom: 6px; padding: 4px; border-radius: 4px; cursor: pointer;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" style="margin-right: 8px;"> Information produit
                </label>
                <label style="display: flex; align-items: center; margin-bottom: 6px; padding: 4px; border-radius: 4px; cursor: pointer;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" style="margin-right: 8px;"> Partenariat
                </label>
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">🔍 Recherche</label>
                <input type="text" placeholder="Nom, email, message..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
        `,
        'form-2': `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">⭐ Satisfaction</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> ⭐ Très insatisfait</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> ⭐⭐ Insatisfait</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> ⭐⭐⭐ Neutre</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> ⭐⭐⭐⭐ Satisfait</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> ⭐⭐⭐⭐⭐ Très satisfait</label>
            </div>
        `,
        'form-3': `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px;">🏢 Secteur</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> Technologie</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> Marketing</label>
                <label style="display: flex; align-items: center; margin-bottom: 4px; cursor: pointer;"><input type="checkbox" style="margin-right: 8px;"> E-commerce</label>
            </div>
        `
    };
    return filters[formId] || '<p style="color: #6b7280;">Aucun filtre disponible</p>';
}

function getResponsesTable(formId, responseCount) {
    let tableHTML = `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f9fafb;">
                    <tr>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; width: 40px;">
                            <input type="checkbox">
                        </th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Date</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Nom</th>
    `;
    
    if (formId === 'form-1') {
        tableHTML += `
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Email</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Sujet</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Statut</th>
        `;
    } else if (formId === 'form-2') {
        tableHTML += `
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Satisfaction</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Recommandation</th>
        `;
    } else if (formId === 'form-3') {
        tableHTML += `
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Entreprise</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Secteur</th>
        `;
    }
    
    tableHTML += `
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 14px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Générer quelques lignes d'exemple
    for (let i = 1; i <= Math.min(10, responseCount); i++) {
        tableHTML += `
                    <tr style="border-bottom: 1px solid #f3f4f6;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
                        <td style="padding: 12px;"><input type="checkbox"></td>
                        <td style="padding: 12px; font-size: 14px;">${new Date(Date.now() - i * 86400000).toLocaleDateString()}</td>
                        <td style="padding: 12px; font-size: 14px;">Utilisateur ${i}</td>
        `;
        
        if (formId === 'form-1') {
            tableHTML += `
                        <td style="padding: 12px; font-size: 14px;">user${i}@email.com</td>
                        <td style="padding: 12px; font-size: 14px;">Support</td>
                        <td style="padding: 12px;"><span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Nouveau</span></td>
            `;
        } else if (formId === 'form-2') {
            tableHTML += `
                        <td style="padding: 12px; font-size: 14px;">⭐⭐⭐⭐⭐</td>
                        <td style="padding: 12px; font-size: 14px;">Oui</td>
            `;
        } else if (formId === 'form-3') {
            tableHTML += `
                        <td style="padding: 12px; font-size: 14px;">Entreprise ${i}</td>
                        <td style="padding: 12px; font-size: 14px;">Technologie</td>
            `;
        }
        
        tableHTML += `
                        <td style="padding: 12px;">
                            <button onclick="viewResponse(${i})" style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; margin-right: 4px;">👁️</button>
                            <button onclick="editResponse(${i})" style="background: #f59e0b; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">✏️</button>
                        </td>
                    </tr>
        `;
    }
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    return tableHTML;
}

// Fonctions utilitaires
function toggleSelectAll(formId) {
    console.log('Toggle select all pour:', formId);
    // Logique de sélection
}

function bulkAction(action) {
    alert('Action en lot: ' + action);
    console.log('Action en lot:', action);
}

function viewResponse(id) {
    alert('Voir la réponse #' + id);
}

function editResponse(id) {
    alert('Modifier la réponse #' + id);
}
