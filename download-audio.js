// Script pour télécharger les fichiers audio Quran
// Exécutez avec: node download-audio.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = './audio/abdul_basit';
const BASE_URL = 'https://everyayah.com/data/Abdul_Basit_Mujawwad_192kbps/';

// Créer le dossier audio s'il n'existe pas
if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
    console.log('📁 Dossier audio créé:', AUDIO_DIR);
}

// Télécharger une sourate
function downloadSurah(surahNumber) {
    const fileName = surahNumber.toString().padStart(3, '0') + '.mp3';
    const url = BASE_URL + fileName;
    const filePath = path.join(AUDIO_DIR, fileName);
    
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Sourate ${surahNumber} téléchargée: ${fileName}`);
                    resolve();
                });
            } else {
                console.error(`❌ Erreur ${response.statusCode} pour sourate ${surahNumber}`);
                fs.unlink(filePath, () => {}); // Supprimer fichier vide
                resolve();
            }
        }).on('error', (err) => {
            console.error(`❌ Erreur réseau pour sourate ${surahNumber}:`, err.message);
            fs.unlink(filePath, () => {}); // Supprimer fichier vide
            resolve();
        });
    });
}

// Télécharger toutes les sourates (1-114)
async function downloadAllSurahs() {
    console.log('🕌 Début du téléchargement des 114 sourates...');
    
    for (let i = 1; i <= 114; i++) {
        await downloadSurah(i);
        
        // Pause entre chaque téléchargement pour éviter de surcharger le serveur
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎉 Téléchargement terminé !');
    console.log(`📁 Fichiers dans: ${AUDIO_DIR}`);
}

// Télécharger seulement les 10 premières sourates pour tester
async function downloadFirstSurahs() {
    console.log('🕌 Début du téléchargement des 10 premières sourates...');
    
    for (let i = 1; i <= 10; i++) {
        await downloadSurah(i);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🎉 Téléchargement terminé !');
    console.log(`📁 Fichiers dans: ${AUDIO_DIR}`);
}

// Choisir quoi télécharger
if (process.argv.includes('--all')) {
    downloadAllSurahs();
} else if (process.argv.includes('--test')) {
    downloadFirstSurahs();
} else {
    console.log('🕌 Quran Audio Downloader');
    console.log('Usage:');
    console.log('  node download-audio.js --test   # Télécharge les 10 premières sourates');
    console.log('  node download-audio.js --all    # Télécharge toutes les 114 sourates');
}
