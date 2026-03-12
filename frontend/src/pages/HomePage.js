// frontend/src/pages/HomePage.js
import { state } from '../core/state.js';

// Injection CSS co-localisé
if (!document.querySelector('link[href*="HomePage.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/pages/HomePage.css';
    document.head.appendChild(link);
}

export function render() {
    return `<div id="home-page" class="page active">
            <!-- Hero Section -->
            <section class="section-pro" style="text-align: center; padding-top: var(--space-16);">
                <div class="container-pro">
                    <h1 class="hero-title gradient-text animate-fade-in-up">
                        حفظ القرآن<br>بطريقة عصرية
                    </h1>
                    <p class="hero-subtitle animate-fade-in-up" style="animation-delay: 0.1s;">
                        تطبيق احترافي يجمع بين التقنية الحديثة والطريقة النبوية في حفظ ومراجعة القرآن الكريم
                    </p>
                    <div class="flex-pro" style="justify-content: center; gap: var(--space-4); animation-delay: 0.2s;" class="animate-fade-in-up">
                        <button class="btn btn-glow btn-ripple" onclick="navigateTo('memorization')">
                            <span>📖</span>
                            ابدأ الحفظ
                        </button>
                        <button class="btn btn-outline-glow" onclick="navigateTo('ward')">
                            <span>🎧</span>
                            استمع للورد
                        </button>
                    </div>
                </div>
            </section>

            <!-- Daily Motivation -->
            <section class="section-pro">
                <div class="container-pro">
                    <div class="card-glass-pro shimmer" style="text-align: center; max-width: 800px; margin: 0 auto;">
                        <span class="badge badge-gold" style="margin-bottom: var(--space-4);">✨ حكمة اليوم</span>
                        <div class="arabic-large motivation-text" id="motivation-text" style="margin: var(--space-6) 0; font-size: 2rem;">
                            خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
                        </div>
                        <p class="motivation-source" id="motivation-source" style="color: var(--color-text-secondary);">رواه البخاري</p>
                    </div>
                </div>
            </section>

            <!-- Stats Section -->
            <section class="section-pro">
                <div class="container-pro">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">📊 إحصائياتك <span style="font-size: 0.875rem; color: var(--color-text-secondary); font-weight: 400;">يوم <span id="today-date"></span></span></h2>
                    <div class="grid-pro grid-cols-4 stagger-children" id="home-stats">
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value stat-number" id="home-total-surahs">0</div>
                            <p style="color: var(--color-text-secondary); margin-top: var(--space-2);">إجمالي السور</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value stat-number" id="home-mastered">0</div>
                            <p style="color: var(--color-text-secondary); margin-top: var(--space-2);">متقنة</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value stat-number" id="home-weak">0</div>
                            <p style="color: var(--color-text-secondary); margin-top: var(--space-2);">ضعيفة</p>
                        </div>
                        <div class="card-stat-premium" style="text-align: center;">
                            <div class="stat-value stat-number" id="home-new">0</div>
                            <p style="color: var(--color-text-secondary); margin-top: var(--space-2);">جديدة</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Features Grid -->
            <section class="section-pro">
                <div class="container-pro">
                    <h2 class="section-title" style="text-align: center; margin-bottom: var(--space-8);">✨ المميزات</h2>
                    <div class="grid-pro grid-cols-3 stagger-children">
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div class="feature-icon-pro">📖</div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">قراءة وتلاوة</h3>
                            <p style="color: var(--color-text-secondary);">استماع للقراءات بأصوات مختلفة مع عرض المصحف</p>
                        </div>
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div class="feature-icon-pro">🧠</div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">تتبع ذكي</h3>
                            <p style="color: var(--color-text-secondary);">نظام تكرار متباعد لضمان الحفظ القوي</p>
                        </div>
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div class="feature-icon-pro">🎯</div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">وضع الحفظ</h3>
                            <p style="color: var(--color-text-secondary);">تمارين تفاعلية لاختبار الحفظ بمستويات مختلفة</p>
                        </div>
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div class="feature-icon-pro">🏆</div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">تحديات</h3>
                            <p style="color: var(--color-text-secondary);">تنافس مع الأصدقاء واكسب النقاط</p>
                        </div>
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div class="feature-icon-pro">📈</div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">إحصائيات</h3>
                            <p style="color: var(--color-text-secondary);">تتبع تقدمك يومياً وأسبوعياً وشهرياً</p>
                        </div>
                        <div class="card-glass-pro hover-lift" style="text-align: center;">
                            <div class="feature-icon-pro">👨‍🏫</div>
                            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: var(--space-2);">معلمك</h3>
                            <p style="color: var(--color-text-secondary);">تواصل مع معلميك واستلم المهام</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>`;
}

export function init() {
    updateDailyMotivation();
    updateHomeStats();
    updateTodayDate();
}

function updateDailyMotivation() {
    const motivations = [
        { text: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', source: 'رواه البخاري' },
        { text: 'الْقُرْآنُ كَلامُ اللهِ، مَنْ قَرَأَهُ فَقَدْ تَكَلَّمَ مَعَ اللهِ', source: 'حديث قدسي' },
        { text: 'مَثَلُ الْمُؤْمِنِ الَّذِي يَقْرَأُ الْقُرْآنَ كَمَثَلِ الْأُتْرُجَّةِ، رِيحُهَا طَيِّبٌ وَطَعْمُهَا طَيِّبٌ', source: 'رواه البخاري' },
        { text: 'سَيَأْتِي عَلَى النَّاسِ زَمَانٌ يَتَعَلَّمُونَ فِيهِ الْقُرْآنَ، ثُمَّ يَقْرَؤُونَهُ', source: 'رواه البخاري' }
    ];

    const today = new Date().getDate();
    const motivation = motivations[today % motivations.length];

    const textElement = document.getElementById('motivation-text');
    const sourceElement = document.getElementById('motivation-source');

    if (textElement) textElement.textContent = motivation.text;
    if (sourceElement) sourceElement.textContent = motivation.source;
}

function updateHomeStats() {
    const stats = calculateStats();

    const totalSurahsElement = document.getElementById('home-total-surahs');
    const masteredElement = document.getElementById('home-mastered');
    const weakElement = document.getElementById('home-weak');
    const newElement = document.getElementById('home-new');

    if (totalSurahsElement) totalSurahsElement.textContent = stats.total;
    if (masteredElement) masteredElement.textContent = stats.mastered;
    if (weakElement) weakElement.textContent = stats.weak;
    if (newElement) newElement.textContent = stats.new;
}

function updateTodayDate() {
    const todayDateElement = document.getElementById('today-date');
    if (todayDateElement) {
        const today = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        todayDateElement.textContent = today.toLocaleDateString('ar-SA', options);
    }
}

// Calcul des stats à partir du state central
function calculateStats() {
    const data = state.memorizationData || [];
    return {
        total: data.length,
        mastered: data.filter(s => s.level >= 4).length,
        weak: data.filter(s => s.level <= 1 && s.level >= 0).length,
        new: data.filter(s => s.level === 0 || s.level === undefined).length
    };
}
