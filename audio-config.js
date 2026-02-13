// Audio Configuration for QuranReview
// Using external CDN for Quran audio streaming

const QuranAudio = {
    // Surah names and their corresponding audio files
    surahNames: {
        1: "الفاتحة",
        2: "البقرة", 
        3: "آل عمران",
        4: "النساء",
        5: "المائدة",
        6: "الأنعام",
        7: "الأعراف",
        8: "الأنفال",
        9: "التوبة",
        10: "يونس",
        11: "هود",
        12: "يوسف",
        13: "الرعد",
        14: "إبراهيم",
        15: "الحجر",
        16: "النحل",
        17: "الإسراء",
        18: "الكهف",
        19: "مريم",
        20: "طه",
        21: "الأنبياء",
        22: "الحج",
        23: "المؤمنون",
        24: "النور",
        25: "الفرقان",
        26: "الشعراء",
        27: "النمل",
        28: "القصص",
        29: "العنكبوت",
        30: "الروم",
        31: "لقمان",
        32: "السجدة",
        33: "الأحزاب",
        34: "سبأ",
        35: "فاطر",
        36: "يس",
        37: "الصافات",
        38: "ص",
        39: "الزمر",
        40: "غافر",
        41: "فصلت",
        42: "الشورى",
        43: "الزخرف",
        44: "الدخان",
        45: "الجاثية",
        46: "الأحقاف",
        47: "محمد",
        48: "الفتح",
        49: "الحجرات",
        50: "ق",
        51: "الذاريات",
        52: "الطور",
        53: "النجم",
        54: "القمر",
        55: "الرحمن",
        56: "الواقعة",
        57: "الحديد",
        58: "المجادلة",
        59: "الحشر",
        60: "الممتحنة",
        61: "الصف",
        62: "الجمعة",
        63: "المنافقون",
        64: "التغابن",
        65: "الطلاق",
        66: "التحريم",
        67: "الملك",
        68: "القلم",
        69: "الحاقة",
        70: "المعارج",
        71: "نوح",
        72: "الجن",
        73: "المزمل",
        74: "المدثر",
        75: "القيامة",
        76: "الإنسان",
        77: "المرسلات",
        78: "النبأ",
        79: "النازعات",
        80: "عبس",
        81: "التكوير",
        82: "الانفطار",
        83: "المطففين",
        84: "الانشقاق",
        85: "البروج",
        86: "الطارق",
        87: "الأعلى",
        88: "الغاشية",
        89: "الفجر",
        90: "البلد",
        91: "الشمس",
        92: "الليل",
        93: "الضحى",
        94: "الشرح",
        95: "التين",
        96: "العلق",
        97: "القدر",
        98: "البينة",
        99: "الزلزلة",
        100: "العاديات",
        101: "القارعة",
        102: "التكاثر",
        103: "العصر",
        104: "الهمزة",
        105: "الفيل",
        106: "قريش",
        107: "الماعون",
        108: "الكوثر",
        109: "الكافرون",
        110: "النصر",
        111: "المسد",
        112: "الإخلاص",
        113: "الفلق",
        114: "الناس"
    },

    // Reciters available
    reciters: {
        'alafasy': {
            name: 'مشاري بن راشد العفاسي',
            baseUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy'
        }
    },

    // Current reciter
    currentReciter: 'alafasy',

    // ===================================
    // ISLAMIC NETWORK CDN INTEGRATION
    // ===================================
    
    // CDN Base URLs
    cdn: {
        audioSurah: 'https://cdn.islamic.network/quran/audio-surah',
        audioAyah: 'https://cdn.islamic.network/quran/audio',
        images: 'https://cdn.islamic.network/quran/images',
        imagesHighRes: 'https://cdn.islamic.network/quran/images/high-resolution',
        info: 'https://cdn.islamic.network/quran/info'
    },
    
    // Available bitrates
    bitrates: {
        high: 192,
        medium: 128,
        low: 64,
        lowest: 32
    },
    
    // Current bitrate (can be changed in settings)
    currentBitrate: 128,
    
    // Get audio URL for a surah
    getAudioUrl: function(surahNumber, reciter = this.currentReciter, bitrate = this.currentBitrate) {
        // Use Islamic Network CDN - Add "ar." prefix
        const edition = `ar.${reciter}`;
        return `${this.cdn.audioSurah}/${bitrate}/${edition}/${surahNumber}.mp3`;
    },

    // Get audio URL for a specific ayah
    getAyahAudioUrl: function(ayahNumber, reciter = this.currentReciter, bitrate = this.currentBitrate) {
        // Use Islamic Network CDN - Add "ar." prefix
        const edition = `ar.${reciter}`;
        return `${this.cdn.audioAyah}/${bitrate}/${edition}/${ayahNumber}.mp3`;
    },

    // Get image URL for a specific ayah
    getAyahImageUrl: function(surahNumber, ayahNumber, highRes = false) {
        const baseUrl = highRes ? this.cdn.imagesHighRes : this.cdn.images;
        return `${baseUrl}/${surahNumber}_${ayahNumber}.png`;
    },
    
    // Get high resolution image URL
    getAyahHighResImageUrl: function(surahNumber, ayahNumber) {
        return this.getAyahImageUrl(surahNumber, ayahNumber, true);
    },

    // Complete ayah counts for all 114 surahs
    ayahCounts: [
        7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
    ],

    // Precomputed cumulative sums for O(1) global ayah calculation
    cumulativeAyahCounts: [],
    
    // Convert surah:ayah to global ayah number (accurate mapping)
    surahAyahToGlobal: function(surahNumber, ayahNumber) {
        const start = this.cumulativeAyahCounts[surahNumber - 1] || 0;
        return start + ayahNumber;
    },
    
    // Get surah ayah range (start and end global numbers)
    getSurahAyahRange: function(surahNumber) {
        const start = (this.cumulativeAyahCounts[surahNumber - 1] || 0) + 1;
        const count = this.ayahCounts[surahNumber - 1] || 0;
        const end = start + count - 1;
        
        return { start, end, total: count };
    },
    
    // Get audio URLs for a range of ayahs
    getAyahRangeAudioUrls: function(surahNumber, fromAyah, toAyah, reciter = this.currentReciter, bitrate = this.currentBitrate) {
        const urls = [];
        const range = this.getSurahAyahRange(surahNumber);
        const startGlobal = range.start + fromAyah - 1;
        const endGlobal = range.start + toAyah - 1;
        
        for (let i = startGlobal; i <= endGlobal; i++) {
            urls.push(this.getAyahAudioUrl(i, reciter, bitrate));
        }
        
        return urls;
    },
    
    // Set audio quality
    setBitrate: function(bitrate) {
        if (Object.values(this.bitrates).includes(bitrate)) {
            this.currentBitrate = bitrate;
            return true;
        }
        return false;
    },
    
    // Get available reciters from CDN info
    fetchAvailableReciters: async function() {
        try {
            const response = await fetch(`${this.cdn.info}/by-surah/info.json`);
            const data = await response.json();
            return data.editions || [];
        } catch (error) {
            console.error('Error fetching reciters:', error);
            return [];
        }
    },
    
    // Check if audio file exists
    checkAudioExists: async function(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Get surah name
    getSurahName: function(surahNumber) {
        return this.surahNames[surahNumber] || `سورة ${surahNumber}`;
    },

    // Get reciter name
    getReciterName: function(reciter = this.currentReciter) {
        return this.reciters[reciter]?.name || 'غير معروف';
    },

    // Set current reciter
    setReciter: function(reciter) {
        if (this.reciters[reciter]) {
            this.currentReciter = reciter;
            return true;
        }
        return false;
    },

    // Check if audio exists for surah
    hasAudio: function(surahNumber) {
        return surahNumber >= 1 && surahNumber <= 114;
    },

    // Get all available reciters
    getAvailableReciters: function() {
        return Object.keys(this.reciters).map(key => ({
            id: key,
            name: this.reciters[key].name
        }));
    }
};

// Precompute cumulative ayah counts for efficient lookup
(function() {
    let sum = 0;
    const cumulative = [0];
    for (let i = 0; i < QuranAudio.ayahCounts.length; i++) {
        sum += QuranAudio.ayahCounts[i];
        cumulative.push(sum);
    }
    QuranAudio.cumulativeAyahCounts = cumulative;
})();

// Make available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuranAudio;
}
if (typeof window !== 'undefined') {
    window.QuranAudio = QuranAudio;
}
