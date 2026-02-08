/**
 * QURAN REVIEW - JAVASCRIPT APPLICATION
 * Professional Quran Memorization & Review System
 */

// ===================================
// APP STATE & CONFIGURATION
// ===================================

const QuranReview = {
    // App Configuration
    config: {
        appName: 'QuranReview',
        version: '1.0.0',
        storageKey: 'quranreview_data',
        themeKey: 'quranreview_theme',
        
        // Default Settings
        defaultSettings: {
            userName: '',
            dailyGoal: 5,
            theme: 'light',
            notifications: true
        },
        
        // Quran Data - Complete 114 Surahs
        surahs: [
            { id: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', ayahs: 7, type: 'meccan' },
            { id: 2, name: 'البقرة', englishName: 'Al-Baqarah', ayahs: 286, type: 'medinan' },
            { id: 3, name: 'آل عمران', englishName: 'Aal-E-Imran', ayahs: 200, type: 'medinan' },
            { id: 4, name: 'النساء', englishName: 'An-Nisa', ayahs: 176, type: 'medinan' },
            { id: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', ayahs: 120, type: 'medinan' },
            { id: 6, name: 'الأنعام', englishName: 'Al-An\'am', ayahs: 165, type: 'meccan' },
            { id: 7, name: 'الأعراف', englishName: 'Al-A\'raf', ayahs: 206, type: 'meccan' },
            { id: 8, name: 'الأنفال', englishName: 'Al-Anfal', ayahs: 75, type: 'medinan' },
            { id: 9, name: 'التوبة', englishName: 'At-Tawbah', ayahs: 129, type: 'medinan' },
            { id: 10, name: 'يونس', englishName: 'Yunus', ayahs: 109, type: 'meccan' },
            { id: 11, name: 'هود', englishName: 'Hud', ayahs: 123, type: 'meccan' },
            { id: 12, name: 'يوسف', englishName: 'Yusuf', ayahs: 111, type: 'meccan' },
            { id: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', ayahs: 43, type: 'medinan' },
            { id: 14, name: 'إبراهيم', englishName: 'Ibrahim', ayahs: 52, type: 'meccan' },
            { id: 15, name: 'الحجر', englishName: 'Al-Hijr', ayahs: 99, type: 'meccan' },
            { id: 16, name: 'النحل', englishName: 'An-Nahl', ayahs: 128, type: 'meccan' },
            { id: 17, name: 'الإسراء', englishName: 'Al-Isra', ayahs: 111, type: 'meccan' },
            { id: 18, name: 'الكهف', englishName: 'Al-Kahf', ayahs: 110, type: 'meccan' },
            { id: 19, name: 'مريم', englishName: 'Maryam', ayahs: 98, type: 'meccan' },
            { id: 20, name: 'طه', englishName: 'Ta-Ha', ayahs: 135, type: 'meccan' },
            { id: 21, name: 'الأنبياء', englishName: 'Al-Anbiya', ayahs: 112, type: 'meccan' },
            { id: 22, name: 'الحج', englishName: 'Al-Hajj', ayahs: 78, type: 'medinan' },
            { id: 23, name: 'المؤمنون', englishName: 'Al-Mu\'minun', ayahs: 118, type: 'meccan' },
            { id: 24, name: 'النور', englishName: 'An-Nur', ayahs: 64, type: 'medinan' },
            { id: 25, name: 'الفرقان', englishName: 'Al-Furqan', ayahs: 77, type: 'meccan' },
            { id: 26, name: 'الشعراء', englishName: 'Ash-Shu\'ara', ayahs: 227, type: 'meccan' },
            { id: 27, name: 'النمل', englishName: 'An-Naml', ayahs: 93, type: 'meccan' },
            { id: 28, name: 'القصص', englishName: 'Al-Qasas', ayahs: 88, type: 'meccan' },
            { id: 29, name: 'العنكبوت', englishName: 'Al-Ankabut', ayahs: 69, type: 'meccan' },
            { id: 30, name: 'الروم', englishName: 'Ar-Rum', ayahs: 60, type: 'meccan' },
            { id: 31, name: 'لقمان', englishName: 'Luqman', ayahs: 34, type: 'meccan' },
            { id: 32, name: 'السجدة', englishName: 'As-Sajdah', ayahs: 30, type: 'meccan' },
            { id: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', ayahs: 73, type: 'medinan' },
            { id: 34, name: 'سبأ', englishName: 'Saba', ayahs: 54, type: 'meccan' },
            { id: 35, name: 'فاطر', englishName: 'Fatir', ayahs: 45, type: 'meccan' },
            { id: 36, name: 'يس', englishName: 'Ya-Sin', ayahs: 83, type: 'meccan' },
            { id: 37, name: 'الصافات', englishName: 'As-Saffat', ayahs: 182, type: 'meccan' },
            { id: 38, name: 'ص', englishName: 'Sad', ayahs: 88, type: 'meccan' },
            { id: 39, name: 'الزمر', englishName: 'Az-Zumar', ayahs: 75, type: 'meccan' },
            { id: 40, name: 'غافر', englishName: 'Ghafir', ayahs: 85, type: 'meccan' },
            { id: 41, name: 'فصلت', englishName: 'Fussilat', ayahs: 54, type: 'meccan' },
            { id: 42, name: 'الشورى', englishName: 'Ash-Shura', ayahs: 53, type: 'meccan' },
            { id: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', ayahs: 89, type: 'meccan' },
            { id: 44, name: 'الدخان', englishName: 'Ad-Dukhan', ayahs: 59, type: 'meccan' },
            { id: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', ayahs: 37, type: 'meccan' },
            { id: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', ayahs: 35, type: 'meccan' },
            { id: 47, name: 'محمد', englishName: 'Muhammad', ayahs: 38, type: 'medinan' },
            { id: 48, name: 'الفتح', englishName: 'Al-Fath', ayahs: 29, type: 'medinan' },
            { id: 49, name: 'الحجرات', englishName: 'Al-Hujurat', ayahs: 18, type: 'medinan' },
            { id: 50, name: 'ق', englishName: 'Qaf', ayahs: 45, type: 'meccan' },
            { id: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', ayahs: 60, type: 'meccan' },
            { id: 52, name: 'الطور', englishName: 'At-Tur', ayahs: 49, type: 'meccan' },
            { id: 53, name: 'النجم', englishName: 'An-Najm', ayahs: 62, type: 'meccan' },
            { id: 54, name: 'القمر', englishName: 'Al-Qamar', ayahs: 55, type: 'meccan' },
            { id: 55, name: 'الرحمن', englishName: 'Ar-Rahman', ayahs: 78, type: 'medinan' },
            { id: 56, name: 'الواقعة', englishName: 'Al-Waqiah', ayahs: 96, type: 'meccan' },
            { id: 57, name: 'الحديد', englishName: 'Al-Hadid', ayahs: 29, type: 'medinan' },
            { id: 58, name: 'المجادلة', englishName: 'Al-Mujadilah', ayahs: 22, type: 'medinan' },
            { id: 59, name: 'الحشر', englishName: 'Al-Hashr', ayahs: 24, type: 'medinan' },
            { id: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', ayahs: 13, type: 'medinan' },
            { id: 61, name: 'الصف', englishName: 'As-Saff', ayahs: 14, type: 'medinan' },
            { id: 62, name: 'الجمعة', englishName: 'Al-Jumua', ayahs: 11, type: 'medinan' },
            { id: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', ayahs: 11, type: 'medinan' },
            { id: 64, name: 'التغابن', englishName: 'At-Taghabun', ayahs: 18, type: 'medinan' },
            { id: 65, name: 'الطلاق', englishName: 'At-Talaq', ayahs: 12, type: 'medinan' },
            { id: 66, name: 'التحريم', englishName: 'At-Tahrim', ayahs: 12, type: 'medinan' },
            { id: 67, name: 'الملك', englishName: 'Al-Mulk', ayahs: 30, type: 'meccan' },
            { id: 68, name: 'القلم', englishName: 'Al-Qalam', ayahs: 52, type: 'meccan' },
            { id: 69, name: 'الحاقة', englishName: 'Al-Haqqah', ayahs: 52, type: 'meccan' },
            { id: 70, name: 'المعارج', englishName: 'Al-Maarij', ayahs: 44, type: 'meccan' },
            { id: 71, name: 'نوح', englishName: 'Nuh', ayahs: 28, type: 'meccan' },
            { id: 72, name: 'الجن', englishName: 'Al-Jinn', ayahs: 28, type: 'meccan' },
            { id: 73, name: 'المزمل', englishName: 'Al-Muzzammil', ayahs: 20, type: 'meccan' },
            { id: 74, name: 'المدثر', englishName: 'Al-Muddaththir', ayahs: 56, type: 'meccan' },
            { id: 75, name: 'القيامة', englishName: 'Al-Qiyamah', ayahs: 40, type: 'meccan' },
            { id: 76, name: 'الإنسان', englishName: 'Al-Insan', ayahs: 31, type: 'medinan' },
            { id: 77, name: 'المرسلات', englishName: 'Al-Mursalat', ayahs: 50, type: 'meccan' },
            { id: 78, name: 'النبأ', englishName: 'An-Naba', ayahs: 40, type: 'meccan' },
            { id: 79, name: 'النازعات', englishName: 'An-Nazi-at', ayahs: 46, type: 'meccan' },
            { id: 80, name: 'عبس', englishName: 'Abasa', ayahs: 42, type: 'meccan' },
            { id: 81, name: 'التكوير', englishName: 'At-Takwir', ayahs: 29, type: 'meccan' },
            { id: 82, name: 'الانفطار', englishName: 'Al-Infitar', ayahs: 19, type: 'meccan' },
            { id: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', ayahs: 36, type: 'meccan' },
            { id: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaq', ayahs: 25, type: 'meccan' },
            { id: 85, name: 'البروج', englishName: 'Al-Buruj', ayahs: 22, type: 'meccan' },
            { id: 86, name: 'الطارق', englishName: 'At-Tariq', ayahs: 17, type: 'meccan' },
            { id: 87, name: 'الأعلى', englishName: 'Al-A-la', ayahs: 19, type: 'meccan' },
            { id: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', ayahs: 26, type: 'meccan' },
            { id: 89, name: 'الفجر', englishName: 'Al-Fajr', ayahs: 30, type: 'meccan' },
            { id: 90, name: 'البلد', englishName: 'Al-Balad', ayahs: 20, type: 'meccan' },
            { id: 91, name: 'الشمس', englishName: 'Ash-Shams', ayahs: 15, type: 'meccan' },
            { id: 92, name: 'الليل', englishName: 'Al-Lail', ayahs: 21, type: 'meccan' },
            { id: 93, name: 'الضحى', englishName: 'Ad-Duha', ayahs: 11, type: 'meccan' },
            { id: 94, name: 'الشرح', englishName: 'Ash-Sharh', ayahs: 8, type: 'meccan' },
            { id: 95, name: 'التين', englishName: 'At-Tin', ayahs: 8, type: 'meccan' },
            { id: 96, name: 'العلق', englishName: 'Al-Alaq', ayahs: 19, type: 'meccan' },
            { id: 97, name: 'القدر', englishName: 'Al-Qadr', ayahs: 5, type: 'meccan' },
            { id: 98, name: 'البينة', englishName: 'Al-Bayyinah', ayahs: 8, type: 'medinan' },
            { id: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', ayahs: 8, type: 'medinan' },
            { id: 100, name: 'العاديات', englishName: 'Al-Adiyat', ayahs: 11, type: 'meccan' },
            { id: 101, name: 'القارعة', englishName: 'Al-Qari\'ah', ayahs: 11, type: 'meccan' },
            { id: 102, name: 'التكاثر', englishName: 'At-Takathur', ayahs: 8, type: 'meccan' },
            { id: 103, name: 'العصر', englishName: 'Al-Asr', ayahs: 3, type: 'meccan' },
            { id: 104, name: 'الهمزة', englishName: 'Al-Humazah', ayahs: 9, type: 'meccan' },
            { id: 105, name: 'الفيل', englishName: 'Al-Fil', ayahs: 5, type: 'meccan' },
            { id: 106, name: 'قريش', englishName: 'Quraysh', ayahs: 4, type: 'meccan' },
            { id: 107, name: 'الماعون', englishName: 'Al-Ma\'un', ayahs: 7, type: 'meccan' },
            { id: 108, name: 'الكوثر', englishName: 'Al-Kawthar', ayahs: 3, type: 'meccan' },
            { id: 109, name: 'الكافرون', englishName: 'Al-Kafirun', ayahs: 6, type: 'meccan' },
            { id: 110, name: 'النصر', englishName: 'An-Nasr', ayahs: 3, type: 'medinan' },
            { id: 111, name: 'المسد', englishName: 'Al-Masad', ayahs: 5, type: 'meccan' },
            { id: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', ayahs: 4, type: 'meccan' },
            { id: 113, name: 'الفلق', englishName: 'Al-Falaq', ayahs: 5, type: 'meccan' },
            { id: 114, name: 'الناس', englishName: 'An-Nas', ayahs: 6, type: 'meccan' }
        ]
    },
    
    // App State
    state: {
        currentPage: 'home',
        memorizationData: [],
        settings: {},
        todayDate: new Date().toISOString().split('T')[0]
    },
    
    // ===================================
    // INITIALIZATION
    // ===================================
    
    init() {
        console.log(' Initializing QuranReview App...');
        
        // Initialize state
        this.state = {
            currentPage: 'home',
            memorizationData: [],
            settings: { ...this.config.defaultSettings },
            todayDate: new Date().toISOString().split('T')[0],
            imageQuality: 'normal'
        };
        
        // Load data
        this.loadData();
        
        // Setup navigation
        this.setupNavigation();
        
        // Initialize audio player
        this.initAudioPlayer();
        
        // Initialize ward player
        this.initWardPlayer();
        
        // Initialize theme
        this.initTheme();
        
        // Render initial page
        this.renderPage('home');
        
        // Update today's date
        this.updateTodayDate();
        
        console.log(' QuranReview App initialized successfully');
    },
    
    // ===================================
    // DATA MANAGEMENT
    // ===================================
    
    loadData() {
        try {
            // Load settings
            const savedSettings = localStorage.getItem(this.config.themeKey);
            this.state.settings = savedSettings ? 
                JSON.parse(savedSettings) : 
                { ...this.config.defaultSettings };
            
            // Load memorization data
            const savedData = localStorage.getItem(this.config.storageKey);
            this.state.memorizationData = savedData ? 
                JSON.parse(savedData) : 
                this.getDefaultMemorizationData();
            
            console.log('📁 Data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.state.settings = { ...this.config.defaultSettings };
            this.state.memorizationData = this.getDefaultMemorizationData();
        }
    },
    
    saveData() {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.state.memorizationData));
            localStorage.setItem(this.config.themeKey, JSON.stringify(this.state.settings));
            console.log('💾 Data saved successfully');
        } catch (error) {
            console.error('❌ Error saving data:', error);
            this.showNotification('خطأ في حفظ البيانات', 'error');
        }
    },
    
    getDefaultMemorizationData() {
        return [
            {
                id: 1,
                surahId: 1,
                surahName: 'الفاتحة',
                fromAyah: 1,
                toAyah: 7,
                status: 'mastered',
                dateAdded: '2024-01-01',
                lastReviewed: '2024-02-06',
                reviewCount: 15
            },
            {
                id: 2,
                surahId: 2,
                surahName: 'البقرة',
                fromAyah: 1,
                toAyah: 5,
                status: 'weak',
                dateAdded: '2024-01-15',
                lastReviewed: '2024-02-01',
                reviewCount: 8
            },
            {
                id: 3,
                surahId: 3,
                surahName: 'آل عمران',
                fromAyah: 1,
                toAyah: 3,
                status: 'new',
                dateAdded: '2024-02-07',
                lastReviewed: null,
                reviewCount: 0
            }
        ];
    },
    
    // ===================================
    // THEME MANAGEMENT
    // ===================================
    
    initTheme() {
        const theme = this.state.settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeToggle(theme);
    },
    
    toggleTheme() {
        const currentTheme = this.state.settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.state.settings.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeToggle(newTheme);
        this.saveData();
        
        console.log('🎨 Theme changed to:', newTheme);
    },
    
    updateThemeToggle(theme) {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    },
    
    // ===================================
    // NAVIGATION
    // ===================================
    
    setupNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    },
    
    navigateTo(pageName) {
        console.log('🔄 Navigating to:', pageName);
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log('✅ Navigation link updated');
        } else {
            console.error('❌ Navigation link not found:', pageName);
        }
        
        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log('✅ Page element updated');
        } else {
            console.error('❌ Page element not found:', `${pageName}-page`);
        }
        
        this.state.currentPage = pageName;
        
        // Render page content
        this.renderPage(pageName);
        
        console.log('📍 Navigation completed to:', pageName);
    },
    
    // ===================================
    // PAGE RENDERING
    // ===================================
    
    renderPage(pageName) {
        switch (pageName) {
            case 'home':
                this.renderHomePage();
                break;
            case 'memorization':
                this.renderMemorizationPage();
                break;
            case 'reading':
                this.renderReadingPage();
                break;
            case 'progress':
                this.renderProgressPage();
                break;
            case 'settings':
                this.renderSettingsPage();
                break;
        }
    },
    
    renderHomePage() {
        // Update motivation
        this.updateDailyMotivation();
        
        // Update stats
        this.updateHomeStats();
    },
    
    renderReadingPage() {
        this.setupReadingControls();
        this.populateReadingSurahSelect();
    },
    
    renderMemorizationPage() {
        console.log('🔄 Rendering memorization page...');
        this.renderMemorizationTable();
        this.setupMemorizationActions();
        console.log('✅ Memorization page rendered');
    },
    
    renderProgressPage() {
        this.renderProgressStats();
        this.renderProgressChart();
    },
    
    renderSettingsPage() {
        this.renderSettingsForm();
    },
    
    // ===================================
    // HOME PAGE FUNCTIONS
    // ===================================
    
    updateDailyMotivation() {
        const motivations = [
            { text: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', source: 'رواه البخاري' },
            { text: 'الْقُرْآنُ كَلامُ اللهِ، مَنْ قَرَأَهُ فَقَدْ تَكَلَّمَ مَعَ اللهِ', source: 'حديث قدسي' },
            { text: 'مَثَلُ الْمُؤْمِنِ الَّذِي يَقْرَأُ الْقُرْآنَ كَمَثَلِ الْأُتْرُجَّةِ، رِيحُهَا طَيِّبٌ وَطَعْمُهَا طَيِّبٌ', source: 'رواه البخاري' },
            { text: 'سَيَأْتِي عَلَى النَّاسِ زَمَانٌ يَتَعَلَّمُونَ فِيهِ الْقُرْآنَ، ثُمَّ يَقْرَؤُونَهُ', source: 'رواه البخاري' }
        ];
        
        const today = new Date().getDate();
        const motivation = motivations[today % motivations.length];
        
        const textElement = document.getElementById('motivation-text');
        const sourceElement = document.getElementById('motivation-source');
        
        if (textElement) textElement.textContent = motivation.text;
        if (sourceElement) sourceElement.textContent = motivation.source;
    },
    
    updateHomeStats() {
        const stats = this.calculateStats();
        
        const totalSurahsElement = document.getElementById('home-total-surahs');
        const masteredElement = document.getElementById('home-mastered');
        const weakElement = document.getElementById('home-weak');
        const newElement = document.getElementById('home-new');
        
        if (totalSurahsElement) totalSurahsElement.textContent = stats.total;
        if (masteredElement) masteredElement.textContent = stats.mastered;
        if (weakElement) weakElement.textContent = stats.weak;
        if (newElement) newElement.textContent = stats.new;
    },
    
    // ===================================
    // READING PAGE FUNCTIONS
    // ===================================
    
    setupReadingControls() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        const prevBtn = document.getElementById('prev-ayah');
        const nextBtn = document.getElementById('next-ayah');
        const playBtn = document.getElementById('play-ayah');
        const toggleBtn = document.getElementById('toggle-image-text');
        const downloadBtn = document.getElementById('download-image');
        
        // Surah selection
        if (surahSelect) {
            surahSelect.addEventListener('change', () => {
                this.populateAyahSelect();
                this.updateAyahDisplay();
            });
        }
        
        // Ayah selection
        if (ayahSelect) {
            ayahSelect.addEventListener('change', () => {
                this.updateAyahDisplay();
            });
        }
        
        // Navigation buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.navigateAyah(-1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.navigateAyah(1);
            });
        }
        
        // Play ayah audio
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.playCurrentAyah();
            });
        }
        
        // Toggle image/text
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleImageText();
            });
        }
        
        // Download image
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadAyahImage();
            });
        }
    },
    
    populateReadingSurahSelect() {
        const surahSelect = document.getElementById('reading-surah-select');
        if (!surahSelect) return;
        
        // Clear existing options except the first one
        while (surahSelect.children.length > 1) {
            surahSelect.removeChild(surahSelect.lastChild);
        }
        
        // Add all surahs
        this.config.surahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.id;
            option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
            surahSelect.appendChild(option);
        });
    },
    
    populateAyahSelect() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        
        if (!surahSelect || !ayahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        const surah = this.config.surahs.find(s => s.id === surahId);
        
        if (!surah) return;
        
        // Clear existing options
        ayahSelect.innerHTML = '<option value="">-- اختر الآية --</option>';
        
        // Add ayah options
        for (let i = 1; i <= surah.ayahs; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `الآية ${i}`;
            ayahSelect.appendChild(option);
        }
        
        // Enable navigation buttons
        this.updateNavigationButtons();
    },
    
    updateAyahDisplay() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        const ayahImage = document.getElementById('ayah-image');
        const ayahText = document.getElementById('ayah-text');
        const ayahInfo = document.getElementById('current-ayah-info');
        
        if (!surahSelect || !ayahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        const ayahNumber = parseInt(ayahSelect.value);
        
        if (!surahId || !ayahNumber) return;
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Update info
        if (ayahInfo) {
            ayahInfo.textContent = `${surah.name} - الآية ${ayahNumber}`;
        }
        
        // Update image with quality setting
        if (ayahImage && window.QuranAudio) {
            const highRes = this.state.imageQuality === 'high';
            const imageUrl = QuranAudio.getAyahImageUrl(surahId, ayahNumber, highRes);
            ayahImage.src = imageUrl;
            ayahImage.style.display = 'block';
            ayahImage.onerror = () => {
                ayahImage.style.display = 'none';
                if (ayahText) {
                    ayahText.textContent = `${surah.name} - الآية ${ayahNumber}`;
                    ayahText.style.display = 'block';
                }
            };
        }
        
        // Hide text initially
        if (ayahText) {
            ayahText.style.display = 'none';
        }
        
        // Update navigation buttons
        this.updateNavigationButtons();
    },
    
    updateNavigationButtons() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        const prevBtn = document.getElementById('prev-ayah');
        const nextBtn = document.getElementById('next-ayah');
        
        if (!surahSelect || !ayahSelect || !prevBtn || !nextBtn) return;
        
        const surahId = parseInt(surahSelect.value);
        const ayahNumber = parseInt(ayahSelect.value);
        
        if (!surahId || !ayahNumber) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        prevBtn.disabled = ayahNumber <= 1;
        nextBtn.disabled = ayahNumber >= surah.ayahs;
    },
    
    navigateAyah(direction) {
        const ayahSelect = document.getElementById('reading-ayah-select');
        if (!ayahSelect) return;
        
        const currentAyah = parseInt(ayahSelect.value);
        const newAyah = currentAyah + direction;
        
        if (newAyah >= 1) {
            ayahSelect.value = newAyah;
            this.updateAyahDisplay();
        }
    },
    
    playCurrentAyah() {
        const surahSelect = document.getElementById('reading-surah-select');
        const ayahSelect = document.getElementById('reading-ayah-select');
        
        if (!surahSelect || !ayahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        const ayahNumber = parseInt(ayahSelect.value);
        
        if (!surahId || !ayahNumber) return;
        
        // Convert to global ayah number
        const globalAyahNumber = window.QuranAudio ? 
            QuranAudio.surahAyahToGlobal(surahId, ayahNumber) : 
            (surahId * 1000 + ayahNumber); // Fallback
        
        // Play ayah audio
        if (window.QuranAudio) {
            const audioUrl = QuranAudio.getAyahAudioUrl(globalAyahNumber);
            console.log('🎵 Playing ayah audio:', audioUrl);
            window.open(audioUrl, '_blank', 'noopener,noreferrer');
            this.showNotification('تم فتح الآية في نافذة جديدة', 'info');
        }
    },
    
    toggleImageText() {
        const ayahImage = document.getElementById('ayah-image');
        const ayahText = document.getElementById('ayah-text');
        
        if (!ayahImage || !ayahText) return;
        
        if (ayahImage.style.display === 'none') {
            ayahImage.style.display = 'block';
            ayahText.style.display = 'none';
        } else {
            ayahImage.style.display = 'none';
            ayahText.style.display = 'block';
        }
    },
    
    downloadAyahImage() {
        const ayahImage = document.getElementById('ayah-image');
        if (!ayahImage || !ayahImage.src) return;
        
        const link = document.createElement('a');
        link.href = ayahImage.src;
        link.download = `ayah_${Date.now()}.png`;
        link.click();
        
        this.showNotification('تم تحميل صورة الآية', 'success');
    },
    
    // ===================================
    // MEMORIZATION PAGE FUNCTIONS
    // ===================================
    
    renderMemorizationTable() {
        const tableBody = document.getElementById('memorization-table-body');
        if (!tableBody) return;
        
        const todayData = this.getTodayMemorizationData();
        
        // Render sections separately to avoid duplication
        let html = '';
        
        // Previously memorized section
        if (todayData.previouslyMemorized.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="7" style="background: var(--accent-green); color: white; text-align: center; font-weight: bold;">
                        📚 محفوظ سابقًا (للتثبيت)
                    </td>
                </tr>
            `;
            html += todayData.previouslyMemorized.map(item => this.createTableRow(item)).join('');
        }
        
        // Today's review section
        if (todayData.todayReview.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="7" style="background: var(--accent-gold); color: white; text-align: center; font-weight: bold;">
                        📋 مراجعة اليوم
                    </td>
                </tr>
            `;
            html += todayData.todayReview.map(item => this.createTableRow(item)).join('');
        }
        
        // New memorization section
        if (todayData.newMemorization.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="7" style="background: var(--accent-red); color: white; text-align: center; font-weight: bold;">
                        ✨ حفظ جديد
                    </td>
                </tr>
            `;
            html += todayData.newMemorization.map(item => this.createTableRow(item)).join('');
        }
        
        // No data message
        if (todayData.previouslyMemorized.length === 0 && 
            todayData.todayReview.length === 0 && 
            todayData.newMemorization.length === 0) {
            html += `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        لا توجد عناصر للحفظ اليوم. أضف حفظًا جديدًا للبدء!
                    </td>
                </tr>
            `;
        }
        
        tableBody.innerHTML = html;
    },
    
    createTableRow(item) {
        return `
            <tr>
                <td class="arabic-text">${item.surahName}</td>
                <td>${item.fromAyah} - ${item.toAyah}</td>
                <td>${this.getStatusBadge(item.status)}</td>
                <td>${item.lastReviewed ? new Date(item.lastReviewed).toLocaleDateString('ar-SA') : 'لم يراجع بعد'}</td>
                <td>${item.reviewCount || 0}</td>
                <td>${this.getNextReviewDate(item)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="QuranReview.markAsReviewed(${item.id})" title="تسجيل المراجعة">
                        ✓ مراجعة
                    </button>
                    <button class="btn btn-sm btn-success" onclick="QuranReview.playSurahAudio(${item.surahId})" title="استماع للسورة">
                        🎵 استماع
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="QuranReview.openTarteel(${item.surahId}, ${item.fromAyah}, ${item.toAyah})" title="فتح في تطبيق ترتيل">
                        🎧 ترتيل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="QuranReview.deleteItem(${item.id})" title="حذف العنصر">
                        حذف
                    </button>
                </td>
            </tr>
        `;
    },
    
        
        
    getStatusBadge(status) {
        const badges = {
            mastered: '<span class="status-badge status-mastered">✓ متقن</span>',
            weak: '<span class="status-badge status-weak">⚠ ضعيف</span>',
            new: '<span class="status-badge status-new">+ جديد</span>'
        };
        return badges[status] || status;
    },
    
    getNextReviewDate(item) {
        if (!item.lastReviewed) return 'اليوم';
        
        const lastReview = new Date(item.lastReviewed);
        const today = new Date();
        const daysSinceReview = Math.floor((today - lastReview) / (1000 * 60 * 60 * 24));
        
        const reviewCount = item.reviewCount || 0;
        let requiredDays;
        
        if (reviewCount === 0) {
            requiredDays = 1;
        } else if (reviewCount === 1) {
            requiredDays = 2;
        } else if (reviewCount === 2) {
            requiredDays = 4;
        } else if (reviewCount === 3) {
            requiredDays = 7;
        } else if (reviewCount === 4) {
            requiredDays = 14;
        } else if (reviewCount >= 5 && reviewCount <= 7) {
            requiredDays = 21;
        } else if (reviewCount >= 8 && reviewCount <= 12) {
            requiredDays = 30;
        } else {
            requiredDays = 45;
        }
        
        if (item.status === 'weak') {
            requiredDays = Math.max(1, Math.floor(requiredDays * 0.5));
        }
        
        const daysUntilNext = requiredDays - daysSinceReview;
        
        if (daysUntilNext <= 0) return 'اليوم';
        if (daysUntilNext === 1) return 'غداً';
        if (daysUntilNext <= 7) return `بعد ${daysUntilNext} أيام`;
        if (daysUntilNext <= 30) return `بعد ${Math.floor(daysUntilNext / 7)} أسابيع`;
        return `بعد ${Math.floor(daysUntilNext / 30)} أشهر`;
    },
    
    setupMemorizationActions() {
        // Add new memorization form
        const addForm = document.getElementById('add-memorization-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewMemorization();
            });
        }
        
        // Surah selector for memorization form
        const surahSelect = document.getElementById('surah-select');
        if (surahSelect) {
            surahSelect.addEventListener('change', () => {
                this.updateAyahLimits();
                // Show ward player when surah is selected
                if (surahSelect.value) {
                    this.showWardPlayer();
                }
            });
        }
        
        // From/To ayah inputs
        const fromAyahInput = document.getElementById('from-ayah');
        const toAyahInput = document.getElementById('to-ayah');
        
        if (fromAyahInput) {
            fromAyahInput.addEventListener('input', () => {
                if (surahSelect.value && fromAyahInput.value && toAyahInput.value) {
                    this.showWardPlayer();
                }
            });
        }
        
        if (toAyahInput) {
            toAyahInput.addEventListener('input', () => {
                if (surahSelect.value && fromAyahInput.value && toAyahInput.value) {
                    this.showWardPlayer();
                }
            });
        }
        
        // Reciter selector
        const reciterSelector = document.getElementById('reciter-selector');
        if (reciterSelector) {
            reciterSelector.addEventListener('change', () => {
                this.updateReciter();
            });
        }
        
        // Audio quality selector
        const audioQualitySelector = document.getElementById('audio-quality');
        if (audioQualitySelector) {
            audioQualitySelector.addEventListener('change', () => {
                this.updateAudioQuality();
            });
        }
        
        // Image quality selector
        const imageQualitySelector = document.getElementById('image-quality');
        if (imageQualitySelector) {
            imageQualitySelector.addEventListener('change', () => {
                this.updateImageQuality();
            });
        }
    },
    
    addNewMemorization() {
        const surahSelect = document.getElementById('surah-select');
        const fromAyahInput = document.getElementById('from-ayah');
        const toAyahInput = document.getElementById('to-ayah');
        
        const surahId = parseInt(surahSelect.value);
        const surah = this.config.surahs.find(s => s.id === surahId);
        const fromAyah = parseInt(fromAyahInput.value);
        const toAyah = parseInt(toAyahInput.value);
        
        if (!surah || fromAyah < 1 || toAyah < fromAyah || toAyah > surah.ayahs) {
            this.showNotification('بيانات غير صحيحة', 'error');
            return;
        }
        
        const newItem = {
            id: Date.now(),
            surahId: surahId,
            surahName: surah.name,
            fromAyah: fromAyah,
            toAyah: toAyah,
            status: 'new',
            dateAdded: this.state.todayDate,
            lastReviewed: null,
            reviewCount: 0
        };
        
        this.state.memorizationData.push(newItem);
        this.saveData();
        this.renderMemorizationPage();
        
        // Reset form
        document.getElementById('add-memorization-form').reset();
        
        this.showNotification('تمت إضافة الحفظ الجديد', 'success');
    },
    
    markAsReviewed(itemId) {
        const item = this.state.memorizationData.find(i => i.id === itemId);
        if (!item) return;
        
        item.lastReviewed = this.state.todayDate;
        item.reviewCount = (item.reviewCount || 0) + 1;
        
        // Update status based on review count
        if (item.reviewCount >= 10) {
            item.status = 'mastered';
        } else if (item.reviewCount >= 3) {
            item.status = 'weak';
        }
        
        this.saveData();
        this.renderMemorizationPage();
        
        this.showNotification('تم تسجيل المراجعة', 'success');
    },
    
    deleteItem(itemId) {
        if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
        
        this.state.memorizationData = this.state.memorizationData.filter(i => i.id !== itemId);
        this.saveData();
        this.renderMemorizationPage();
        
        this.showNotification('تم حذف العنصر', 'info');
    },
    
    // ===================================
    // PROGRESS PAGE FUNCTIONS
    // ===================================
    
    renderProgressStats() {
        const stats = this.calculateStats();
        
        // Update stat cards
        const elements = {
            'progress-total': stats.total,
            'progress-mastered': stats.mastered,
            'progress-weak': stats.weak,
            'progress-new': stats.new,
            'progress-average': stats.averageReviews.toFixed(1)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    },
    
    renderProgressChart() {
        const chartContainer = document.getElementById('progress-chart');
        if (!chartContainer) return;
        
        const last7Days = this.getLast7DaysProgress();
        
        chartContainer.innerHTML = last7Days.map(day => `
            <div class="chart-bar" style="height: ${day.percentage}%" title="${day.date}: ${day.count} مراجعات">
            </div>
        `).join('');
    },
    
    getLast7DaysProgress() {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            const count = this.state.memorizationData.filter(item => 
                item.lastReviewed === dateString
            ).length;
            
            days.push({
                date: dateString,
                count: count,
                percentage: Math.min((count / 5) * 100, 100)
            });
        }
        
        return days;
    },
    
    // ===================================
    // SETTINGS PAGE FUNCTIONS
    // ===================================
    
    renderSettingsForm() {
        const form = document.getElementById('settings-form');
        if (!form) return;
        
        // Populate form with current settings
        document.getElementById('user-name').value = this.state.settings.userName || '';
        document.getElementById('daily-goal').value = this.state.settings.dailyGoal || 5;
        document.getElementById('notifications').checked = this.state.settings.notifications || false;
    },
    
    setupForms() {
        // Settings form
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }
    },
    
    saveSettings() {
        this.state.settings = {
            userName: document.getElementById('user-name').value,
            dailyGoal: parseInt(document.getElementById('daily-goal').value),
            theme: this.state.settings.theme,
            notifications: document.getElementById('notifications').checked
        };
        
        this.saveData();
        this.showNotification('تم حفظ الإعدادات', 'success');
    },
    
    // ===================================
    // UTILITY FUNCTIONS
    // ===================================
    
    calculateStats() {
        const total = this.state.memorizationData.length;
        const mastered = this.state.memorizationData.filter(item => item.status === 'mastered').length;
        const weak = this.state.memorizationData.filter(item => item.status === 'weak').length;
        const newMemorization = this.state.memorizationData.filter(item => item.status === 'new').length;
        
        const totalReviews = this.state.memorizationData.reduce((sum, item) => sum + (item.reviewCount || 0), 0);
        const averageReviews = total > 0 ? totalReviews / total : 0;
        
        return {
            total,
            mastered,
            weak,
            new: newMemorization,
            averageReviews
        };
    },
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveData();
        }, 30000);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveData();
        });
    },
    
    // ===================================
    // DATA MANAGEMENT FUNCTIONS
    // ===================================
    
    exportData() {
        try {
            const data = {
                version: this.config.version,
                exportDate: new Date().toISOString(),
                settings: this.state.settings,
                memorizationData: this.state.memorizationData
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quranreview-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('تم تصدير البيانات بنجاح', 'success');
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            this.showNotification('خطأ في تصدير البيانات', 'error');
        }
    },
    
    importData() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        // Validate data structure
                        if (!data.memorizationData || !Array.isArray(data.memorizationData)) {
                            throw new Error('Invalid data structure');
                        }
                        
                        // Backup current data
                        const backup = { ...this.state };
                        
                        // Import new data
                        this.state.memorizationData = data.memorizationData || [];
                        this.state.settings = { ...this.config.defaultSettings, ...data.settings };
                        
                        // Save imported data
                        this.saveData();
                        
                        // Refresh UI
                        this.renderPage(this.state.currentPage);
                        
                        this.showNotification('تم استيراد البيانات بنجاح', 'success');
                    } catch (error) {
                        console.error('❌ Error parsing imported data:', error);
                        this.showNotification('ملف غير صالح. يرجى التحقق من البيانات', 'error');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        } catch (error) {
            console.error('❌ Error importing data:', error);
            this.showNotification('خطأ في استيراد البيانات', 'error');
        }
    },
    
    clearData() {
        if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
        
        try {
            // Clear LocalStorage
            localStorage.removeItem(this.config.storageKey);
            localStorage.removeItem(this.config.themeKey);
            
            // Reset to defaults
            this.state.memorizationData = this.getDefaultMemorizationData();
            this.state.settings = { ...this.config.defaultSettings };
            
            // Refresh UI
            this.renderPage(this.state.currentPage);
            
            this.showNotification('تم مسح جميع البيانات', 'info');
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            this.showNotification('خطأ في مسح البيانات', 'error');
        }
    },
    
    // ===================================
    // WARD PLAYER FUNCTIONS
    // ===================================
    
    initWardPlayer() {
        const playWardBtn = document.getElementById('play-ward-btn');
        const playSurahBtn = document.getElementById('play-surah-btn');
        const stopWardBtn = document.getElementById('stop-ward-btn');
        
        if (playWardBtn) {
            playWardBtn.addEventListener('click', () => {
                this.playWard();
            });
        }
        
        if (playSurahBtn) {
            playSurahBtn.addEventListener('click', () => {
                this.playFullSurah();
            });
        }
        
        if (stopWardBtn) {
            stopWardBtn.addEventListener('click', () => {
                this.stopWardPlayback();
            });
        }
        
        // Initialize ward state
        this.state.wardPlayer = {
            isPlaying: false,
            currentAyah: 0,
            totalAyahs: 0,
            mode: 'ward', // 'ward' or 'surah'
            surahId: null,
            fromAyah: null,
            toAyah: null
        };
        
        console.log('🎧 Ward player initialized');
    },
    
    showWardPlayer() {
        const wardPlayer = document.getElementById('ward-player');
        if (wardPlayer) {
            wardPlayer.style.display = 'block';
        }
    },
    
    hideWardPlayer() {
        const wardPlayer = document.getElementById('ward-player');
        if (wardPlayer) {
            wardPlayer.style.display = 'none';
        }
    },
    
    playWard() {
        const surahSelect = document.getElementById('surah-select');
        const fromAyahInput = document.getElementById('from-ayah');
        const toAyahInput = document.getElementById('to-ayah');
        
        if (!surahSelect || !fromAyahInput || !toAyahInput) return;
        
        const surahId = parseInt(surahSelect.value);
        const fromAyah = parseInt(fromAyahInput.value);
        const toAyah = parseInt(toAyahInput.value);
        
        if (!surahId || !fromAyah || !toAyah) {
            this.showNotification('يرجى اختيار السورة والآيات', 'warning');
            return;
        }
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Setup ward player state
        this.state.wardPlayer = {
            isPlaying: true,
            currentAyah: fromAyah,
            totalAyahs: toAyah - fromAyah + 1,
            mode: 'ward',
            surahId: surahId,
            fromAyah: fromAyah,
            toAyah: toAyah
        };
        
        // Show and update ward player
        this.showWardPlayer();
        this.updateWardDisplay();
        this.playCurrentWardAyah();
        
        this.showNotification(`جاري تشغيل ورد ${surah.name} (${fromAyah}-${toAyah})`, 'success');
    },
    
    playFullSurah() {
        const surahSelect = document.getElementById('surah-select');
        
        if (!surahSelect) return;
        
        const surahId = parseInt(surahSelect.value);
        if (!surahId) {
            this.showNotification('يرجى اختيار السورة', 'warning');
            return;
        }
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Setup ward player state for full surah
        this.state.wardPlayer = {
            isPlaying: true,
            currentAyah: 1,
            totalAyahs: surah.ayahs,
            mode: 'surah',
            surahId: surahId,
            fromAyah: 1,
            toAyah: surah.ayahs
        };
        
        // Show and update ward player
        this.showWardPlayer();
        this.updateWardDisplay();
        this.playCurrentWardAyah();
        
        this.showNotification(`جاري تشغيل سورة ${surah.name} كاملة`, 'success');
    },
    
    playCurrentWardAyah() {
        if (!this.state.wardPlayer.isPlaying) return;
        
        const { surahId, currentAyah } = this.state.wardPlayer;
        
        if (!window.QuranAudio) return;
        
        // Get global ayah number
        const globalAyahNumber = QuranAudio.surahAyahToGlobal(surahId, currentAyah);
        const audioUrl = QuranAudio.getAyahAudioUrl(globalAyahNumber);
        
        // Create audio element for this ayah
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
            this.playNextWardAyah();
        };
        
        audio.onerror = () => {
            console.error('❌ Error playing ayah audio:', currentAyah);
            this.playNextWardAyah();
        };
        
        // Update display
        this.updateWardAyahDisplay(surahId, currentAyah);
        
        // Play audio
        audio.play().catch(error => {
            console.error('❌ Error playing audio:', error);
            this.playNextWardAyah();
        });
        
        console.log(`🎵 Playing ayah ${currentAyah} of surah ${surahId}`);
    },
    
    playNextWardAyah() {
        const { currentAyah, toAyah } = this.state.wardPlayer;
        
        if (currentAyah < toAyah) {
            this.state.wardPlayer.currentAyah++;
            this.updateWardDisplay();
            this.playCurrentWardAyah();
        } else {
            // Finished playing
            this.stopWardPlayback();
            this.showNotification('تم الانتهاء من تشغيل الورد', 'success');
        }
    },
    
    stopWardPlayback() {
        this.state.wardPlayer.isPlaying = false;
        
        // Stop any playing audio
        const allAudio = document.querySelectorAll('audio');
        allAudio.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        this.updateWardDisplay();
        console.log('⏹️ Ward playback stopped');
    },
    
    updateWardDisplay() {
        const { currentAyah, totalAyahs, isPlaying } = this.state.wardPlayer;
        
        // Update progress
        const progressText = document.getElementById('ward-progress-text');
        const progressBar = document.getElementById('ward-progress-bar');
        const currentAyahInfo = document.getElementById('current-ayah-info');
        
        if (progressText) {
            progressText.textContent = `${currentAyah} / ${totalAyahs}`;
        }
        
        if (progressBar) {
            const progress = (currentAyah - this.state.wardPlayer.fromAyah + 1) / totalAyahs * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        if (currentAyahInfo) {
            const surah = this.config.surahs.find(s => s.id === this.state.wardPlayer.surahId);
            currentAyahInfo.textContent = `الآية الحالية: ${surah?.name || ''} - ${currentAyah}`;
        }
    },
    
    updateWardAyahDisplay(surahId, ayahNumber) {
        const wardImage = document.getElementById('ward-image');
        const wardText = document.getElementById('ward-ayah-text');
        
        if (!window.QuranAudio) return;
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Update image
        if (wardImage) {
            const highRes = this.state.imageQuality === 'high';
            const imageUrl = QuranAudio.getAyahImageUrl(surahId, ayahNumber, highRes);
            
            wardImage.src = imageUrl;
            wardImage.style.display = 'block';
            wardImage.onerror = () => {
                wardImage.style.display = 'none';
                if (wardText) {
                    wardText.style.display = 'block';
                }
            };
        }
        
        // Update text
        if (wardText) {
            wardText.textContent = `${surah.name} - الآية ${ayahNumber}`;
            wardText.style.display = wardImage && wardImage.style.display !== 'none' ? 'none' : 'block';
        }
    },
    
    initAudioPlayer() {
        const audioElement = document.getElementById('audio-element');
        const reciterSelector = document.getElementById('reciter-selector');
        
        if (audioElement && reciterSelector) {
            reciterSelector.addEventListener('change', () => {
                this.updateReciter();
            });
            
            audioElement.addEventListener('error', () => {
                this.showNotification('خطأ في تحميل الملف الصوتي', 'error');
            });
            
            console.log('🎵 Audio player initialized');
        }
    },
    
    playSurahAudio(surahNumber) {
        try {
            const audioElement = document.getElementById('audio-element');
            const audioSource = document.getElementById('audio-source');
            const surahNameElement = document.getElementById('audio-surah-name');
            const reciterElement = document.getElementById('audio-reciter');
            
            if (!window.QuranAudio) {
                console.error('❌ QuranAudio not loaded');
                this.showNotification('Configuration audio non chargée', 'error');
                return;
            }
            
            const audioUrl = QuranAudio.getAudioUrl(surahNumber);
            const surahName = QuranAudio.getSurahName(surahNumber);
            const reciterName = QuranAudio.getReciterName();
            
            // Debug: log the URL
            console.log('🎵 Generated URL:', audioUrl);
            console.log('🎵 Surah Number:', surahNumber);
            console.log('🎵 QuranAudio available:', !!window.QuranAudio);
            console.log('🎵 Current reciter:', QuranAudio?.currentReciter);
            console.log('🎵 Audio config loaded:', !!window.QuranAudio);
            
            // Validate URL
            if (!audioUrl || !audioUrl.startsWith('https://')) {
                console.error('❌ Invalid audio URL:', audioUrl);
                this.showNotification('رابط الصوت غير صالح', 'error');
                return;
            }
            
            // Use internal HTML5 audio player
            if (audioElement && audioSource) {
                // Set the audio source
                audioSource.src = audioUrl;
                
                // Update UI
                if (surahNameElement) {
                    surahNameElement.textContent = `سورة ${surahName}`;
                }
                
                if (reciterElement) {
                    reciterElement.textContent = `القارئ: ${reciterName}`;
                }
                
                // Load and play
                audioElement.load();
                audioElement.play()
                    .then(() => {
                        this.showNotification(`جاري تشغيل ${surahName}`, 'success');
                        console.log('🎵 Audio playing successfully');
                    })
                    .catch(error => {
                        console.error('❌ Error playing audio:', error);
                        // Fallback to opening in new tab if autoplay fails
                        window.open(audioUrl, '_blank', 'noopener,noreferrer');
                        this.showNotification(`تم فتح ${surahName} في نافذة جديدة`, 'info');
                    });
            } else {
                // Fallback if audio element not found
                window.open(audioUrl, '_blank', 'noopener,noreferrer');
                this.showNotification(`تم فتح ${surahName} في نافذة جديدة`, 'info');
            }
            
        } catch (error) {
            console.error('❌ Error playing audio:', error);
            this.showNotification('خطأ في تشغيل الصوت', 'error');
        }
    },
    
    updateReciter() {
        const reciterSelector = document.getElementById('reciter-selector');
        
        if (reciterSelector) {
            const selectedReciter = reciterSelector.value;
            
            // Update QuranAudio current reciter
            if (window.QuranAudio) {
                QuranAudio.setReciter(selectedReciter);
                console.log('🎵 Reciter updated to:', selectedReciter);
                this.showNotification(`تم تغيير القارئ إلى: ${QuranAudio.getReciterName(selectedReciter)}`, 'success');
            }
        }
    },
    
    updateAudioQuality() {
        const audioQualitySelector = document.getElementById('audio-quality');
        
        if (audioQualitySelector && window.QuranAudio) {
            const bitrate = parseInt(audioQualitySelector.value);
            if (QuranAudio.setBitrate(bitrate)) {
                this.showNotification(`تم تغيير جودة الصوت إلى: ${bitrate} kbps`, 'success');
            }
        }
    },
    
    updateImageQuality() {
        const imageQualitySelector = document.getElementById('image-quality');
        
        if (imageQualitySelector) {
            const quality = imageQualitySelector.value;
            this.state.imageQuality = quality;
            this.showNotification(`تم تغيير جودة الصور إلى: ${quality === 'high' ? 'عالية الدقة' : 'عادية'}`, 'success');
        }
    },
    
    updateAyahLimits() {
        const surahSelect = document.getElementById('surah-select');
        const fromAyahInput = document.getElementById('from-ayah');
        const toAyahInput = document.getElementById('to-ayah');
        
        if (!surahSelect || !fromAyahInput || !toAyahInput) return;
        
        const surahId = parseInt(surahSelect.value);
        if (!surahId) return;
        
        const surah = this.config.surahs.find(s => s.id === surahId);
        if (!surah) return;
        
        // Update max values
        fromAyahInput.max = surah.ayahs;
        toAyahInput.max = surah.ayahs;
        
        // Update placeholder
        fromAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;
        toAyahInput.placeholder = `من 1 إلى ${surah.ayahs}`;
        
        // Clear current values if they exceed the limit
        if (parseInt(fromAyahInput.value) > surah.ayahs) {
            fromAyahInput.value = '';
        }
        if (parseInt(toAyahInput.value) > surah.ayahs) {
            toAyahInput.value = '';
        }
        
        console.log(`📊 Updated ayah limits for Surah ${surahId}: 1-${surah.ayahs}`);
    },
    
    populateSurahSelect() {
        const surahSelect = document.getElementById('surah-select');
        if (!surahSelect) return;
        
        // Clear existing options except the first one
        while (surahSelect.children.length > 1) {
            surahSelect.removeChild(surahSelect.lastChild);
        }
        
        // Add all 114 surahs with correct ayah counts
        this.config.surahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.id;
            option.textContent = `${surah.name} (${surah.ayahs} آيات)`;
            surahSelect.appendChild(option);
        });
        
        console.log('📋 Surah select populated with 114 surahs');
    },
    
    // ===================================
    // TARTEEL INTEGRATION
    // ===================================
    
    openTarteel(surahId, fromAyah, toAyah) {
        try {
            // Official Tarteel smart deep link
            const url = 'https://tarteel.go.link/?adj_t=1d1pgcav&adj_engagement_type=fallback_click';
            window.open(url, '_blank', 'noopener,noreferrer');
            
            console.log(`🎧 Opening Tarteel for Surah ${surahId}, Ayahs ${fromAyah}-${toAyah}`);
        } catch (error) {
            console.error('❌ Error opening Tarteel:', error);
            this.showNotification('خطأ في فتح تطبيق ترتيل', 'error');
        }
    },
    
    // ===================================
    // IMPROVED SPACED REPETITION
    // ===================================
    
    shouldReviewToday(item) {
        if (!item.lastReviewed) return true;
        
        const lastReview = new Date(item.lastReviewed);
        const today = new Date();
        const daysSinceReview = Math.floor((today - lastReview) / (1000 * 60 * 60 * 24));
        
        // Enhanced spaced repetition schedule
        const reviewCount = item.reviewCount || 0;
        let requiredDays;
        
        if (reviewCount === 0) {
            requiredDays = 1;  // First review: next day
        } else if (reviewCount === 1) {
            requiredDays = 2;  // Second review: after 2 days
        } else if (reviewCount === 2) {
            requiredDays = 4;  // Third review: after 4 days
        } else if (reviewCount === 3) {
            requiredDays = 7;  // Fourth review: after 1 week
        } else if (reviewCount === 4) {
            requiredDays = 14; // Fifth review: after 2 weeks
        } else if (reviewCount >= 5 && reviewCount <= 7) {
            requiredDays = 21; // Reviews 6-8: after 3 weeks
        } else if (reviewCount >= 8 && reviewCount <= 12) {
            requiredDays = 30; // Reviews 9-13: after 1 month
        } else {
            requiredDays = 45; // Reviews 14+: after 1.5 months
        }
        
        // Weak items need more frequent review
        if (item.status === 'weak') {
            requiredDays = Math.max(1, Math.floor(requiredDays * 0.5));
        }
        
        return daysSinceReview >= requiredDays;
    },
    
    // ===================================
    // IMPROVED MEMORIZATION DATA ORGANIZATION
    // ===================================
    
    getTodayMemorizationData() {
        const today = this.state.todayDate;
        
        // Previously memorized (mastered items for revision)
        const previouslyMemorized = this.state.memorizationData.filter(item => 
            item.status === 'mastered' && !this.shouldReviewToday(item)
        );
        
        // Today's review (items that need review today)
        const todayReview = this.state.memorizationData.filter(item => 
            this.shouldReviewToday(item)
        );
        
        // New memorization (items added today)
        const newMemorization = this.state.memorizationData.filter(item => 
            item.status === 'new' && item.dateAdded === today
        );
        
        return {
            previouslyMemorized,
            todayReview,
            newMemorization
        };
    }
};

// ===================================
// INITIALIZATION
// ===================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    QuranReview.init();
});

// Add slideDown animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Global error handling
window.addEventListener('error', (e) => {
    console.error('❌ Application Error:', e.error);
    QuranReview.showNotification('حدث خطأ في التطبيق', 'error');
});

// Make QuranReview available globally
window.QuranReview = QuranReview;
