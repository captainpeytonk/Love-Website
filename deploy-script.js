#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Script de déploiement WorldSpots');
console.log('=====================================');

// Vérifier si on est dans le bon répertoire
if (!fs.existsSync('package.json')) {
    console.error('❌ Erreur: package.json non trouvé. Assurez-vous d\'être dans le bon répertoire.');
    process.exit(1);
}

// Vérifier les dépendances
console.log('📦 Vérification des dépendances...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dépendances installées');
} catch (error) {
    console.error('❌ Erreur lors de l\'installation des dépendances');
    process.exit(1);
}

// Vérifier la configuration Vercel
console.log('🔧 Vérification de la configuration Vercel...');
if (!fs.existsSync('vercel.json')) {
    console.error('❌ vercel.json manquant');
    process.exit(1);
}

// Déployer
console.log('🚀 Déploiement en cours...');
try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Déploiement réussi!');
} catch (error) {
    console.error('❌ Erreur lors du déploiement');
    console.log('\n🔧 Solutions possibles:');
    console.log('1. Vérifiez votre token Vercel Blob dans le dashboard');
    console.log('2. Assurez-vous d\'être connecté à Vercel: vercel login');
    console.log('3. Vérifiez les logs dans le dashboard Vercel');
    process.exit(1);
}
