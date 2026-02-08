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
        },
        'abdul_basit': {
            name: 'عبد الباسط عبد الصمد',
            baseUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.abdulbasit'
        },
        'sudais': {
            name: 'عبد الرحمن السديس',
            baseUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.sudais'
        },
        'minshawi': {
            name: 'محمد صديق المنشاوي',
            baseUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.minshawi_mujawwad'
        },
        'husary': {
            name: 'محمود خليل الحصري',
            baseUrl: 'https://cdn.islamic.network/quran/audio-surah/128/ar.husary'
        }
    },

    // Current reciter
    currentReciter: 'alafasy',

    // Get audio URL for a surah
    getAudioUrl: function(surahNumber, reciter = this.currentReciter) {
        const fileName = surahNumber.toString().padStart(3, '0');
        
        // Use Islamic Network CDN (official AlQuran.cloud API)
        const cdnUrls = {
            'alafasy': `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`,
            'abdul_basit': `https://cdn.islamic.network/quran/audio-surah/128/ar.abdulbasit/${surahNumber}.mp3`,
            'sudais': `https://cdn.islamic.network/quran/audio-surah/128/ar.sudais/${surahNumber}.mp3`,
            'minshawi': `https://cdn.islamic.network/quran/audio-surah/128/ar.minshawi_mujawwad/${surahNumber}.mp3`,
            'husary': `https://cdn.islamic.network/quran/audio-surah/128/ar.husary/${surahNumber}.mp3`
        };
        
        return cdnUrls[reciter] || cdnUrls['alafasy'];
    },

    // Get audio URL for a specific ayah
    getAyahAudioUrl: function(ayahNumber, reciter = this.currentReciter) {
        // Use Islamic Network CDN for ayah-by-ayah audio
        const cdnUrls = {
            'alafasy': `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`,
            'abdul_basit': `https://cdn.islamic.network/quran/audio/128/ar.abdulbasit/${ayahNumber}.mp3`,
            'sudais': `https://cdn.islamic.network/quran/audio/128/ar.sudais/${ayahNumber}.mp3`,
            'minshawi': `https://cdn.islamic.network/quran/audio/128/ar.minshawi_mujawwad/${ayahNumber}.mp3`,
            'husary': `https://cdn.islamic.network/quran/audio/128/ar.husary/${ayahNumber}.mp3`
        };
        
        return cdnUrls[reciter] || cdnUrls['alafasy'];
    },

    // Get image URL for a specific ayah
    getAyahImageUrl: function(surahNumber, ayahNumber, highRes = false) {
        const baseUrl = highRes ? 
            'https://cdn.islamic.network/quran/images/high-resolution' :
            'https://cdn.islamic.network/quran/images';
        
        return `${baseUrl}/${surahNumber}_${ayahNumber}.png`;
    },

    // Convert surah:ayah to global ayah number
    surahAyahToGlobal: function(surahNumber, ayahNumber) {
        // This would need a complete mapping of all ayahs
        // For now, return a simple calculation (approximate)
        const ayahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109];
        let globalNumber = 0;
        
        for (let i = 0; i < surahNumber - 1; i++) {
            globalNumber += ayahCounts[i] || 0;
        }
        
        return globalNumber + ayahNumber;
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

// Make available globally
window.QuranAudio = QuranAudio;
