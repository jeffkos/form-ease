#!/usr/bin/env node

/**
 * Script pour corriger les entités HTML dans les fichiers TypeScript/React
 * Usage: node fix-html-entities.js
 */

const fs = require('fs');
const path = require('path');

// Entités HTML à corriger
const htmlEntities = {
  '&apos;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"'
};

/**
 * Corrige les entités HTML dans un fichier
 */
function fixHtmlEntitiesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Remplacer toutes les entités HTML
    for (const [entity, replacement] of Object.entries(htmlEntities)) {
      if (content.includes(entity)) {
        content = content.replace(new RegExp(entity, 'g'), replacement);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur dans ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Parcourt récursivement un dossier
 */
function walkDirectory(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Ignorer certains dossiers
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Fonction principale
 */
function main() {
  console.log('🔧 Correction des entités HTML dans les fichiers TypeScript/React...\n');
  
  const frontendDir = path.join(__dirname, '..', 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    console.error('❌ Dossier frontend non trouvé');
    process.exit(1);
  }
  
  // Trouver tous les fichiers TypeScript/React
  const files = walkDirectory(frontendDir, ['.tsx', '.ts', '.jsx', '.js']);
  
  console.log(`📁 ${files.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (fixHtmlEntitiesInFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Correction terminée:`);
  console.log(`   - ${files.length} fichiers analysés`);
  console.log(`   - ${fixedCount} fichiers corrigés`);
  
  if (fixedCount > 0) {
    console.log('\n⚠️ Recommendations:');
    console.log('   - Testez le build: npm run build');
    console.log('   - Vérifiez les tests: npm test');
    console.log('   - Commitez les changements');
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  fixHtmlEntitiesInFile,
  walkDirectory,
  htmlEntities
};
