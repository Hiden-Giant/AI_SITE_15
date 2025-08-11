// 다국어 번역 시스템 - 개선된 버전
class TranslationManager {
    constructor() {
        this.currentLanguage = 'ko'; // 기본 언어
        this.translations = new Map();
        this.translationCache = new Map();
        this.supportedLanguages = ['ko', 'en', 'ja', 'zh', 'ru', 'es', 'pt', 'ar', 'vi', 'id', 'fr', 'hi'];
        this.loadedLanguages = new Set();
        
        this.init();
    }

    async init() {
        console.log('TranslationManager initializing...');
        
        // 저장된 언어가 있으면 사용, 없으면 브라우저 언어 감지
        const savedLang = localStorage.getItem("language") || this.detectBrowserLanguage();
        console.log('Initial language:', savedLang);
        
        await this.setLanguage(savedLang);
        
        // 언어 선택기 이벤트 리스너 설정
        this.setupLanguageSwitchers();
        
        // DOM 로드 완료 후 번역 적용
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM loaded, translating page...');
                this.translatePage();
            });
        } else {
            console.log('DOM already loaded, translating page...');
            this.translatePage();
        }
        
        console.log('TranslationManager initialization completed');
    }

    // 브라우저 언어 감지
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        // 브라우저 언어가 지원되는 언어인지 확인
        if (this.supportedLanguages.includes(langCode)) {
            return langCode;
        }
        
        // 중국어 특별 처리 (zh-CN, zh-TW 등)
        if (langCode === 'zh') {
            return 'zh';
        }
        
        // 기본값은 한국어
        return 'ko';
    }

    // 언어 설정 및 번역 파일 로드
    async setLanguage(lang) {
        console.log(`Setting language to: ${lang}`);
        
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Unsupported language: ${lang}, falling back to ko`);
            lang = 'ko';
        }

        this.currentLanguage = lang;
        localStorage.setItem("language", lang);
        
        // 번역 파일이 로드되지 않은 경우에만 로드
        if (!this.loadedLanguages.has(lang)) {
            console.log(`Loading translation file for ${lang}...`);
            await this.loadTranslationFile(lang);
        }
        
        // HTML lang 속성 업데이트
        document.documentElement.lang = lang;
        
        // 페이지 번역 적용
        console.log(`Applying translations for ${lang}...`);
        this.translatePage();
        
        // 번역 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('translationComplete', { detail: { language: lang } }));
        
        console.log(`Language changed to ${lang} successfully`);
    }

    // 번역 파일 동적 로드
    async loadTranslationFile(lang) {
        try {
            // 한국어는 기본 번역 객체 사용
            if (lang === 'ko') {
                const koTranslations = {
                    // Header Menu
                    "menu_home": "홈",
                    "menu_filter": "AI 도구 검색",
                    "menu_profile": "프로필",
                    
                    // Builder Page Section
                    "builder_page_title": "AI 도구 찾기",
                    "builder_title": "커스텀 레시피 빌더",
                    "builder_subtitle": "원하는 AI 도구들을 조합하여 나만의 워크플로우를 만드세요.",
                    "builder_tool_selection": "AI 도구 선택",
                    "builder_category": "카테고리",
                    "builder_category_all": "전체",
                    "builder_category_text": "텍스트 생성",
                    "builder_category_image": "이미지 생성",
                    "builder_category_audio": "음성/오디오",
                    "builder_category_video": "비디오 제작",
                    "builder_category_coding": "코드 작성",
                    "builder_category_data": "데이터 분석",
                    "builder_category_marketing": "마케팅",
                    "builder_keyword_search": "키워드 검색",
                    "builder_keyword_placeholder": "도구명, 설명, 기능 등을 검색하세요",
                    "builder_pagination_info": "0-0 / 0개 도구",
                    "builder_prev": "이전",
                    "builder_next": "다음",
                    "builder_recipe_preview": "레시피 미리보기",
                    "builder_empty_preview": "AI 도구를 선택하여 레시피를 만들어보세요",
                    "builder_integrated_mode": "도구 조합 통합 작성",
                    "builder_detailed_mode": "상세 도구 사용 작성",
                    "builder_recipe_title": "레시피 제목",
                    "builder_recipe_title_placeholder": "레시피 제목을 입력하세요",
                    "builder_recipe_category": "레시피 카테고리",
                    "builder_recipe_category_select": "카테고리를 선택하세요",
                    "builder_recipe_category_text": "텍스트 생성",
                    "builder_recipe_category_image": "이미지 생성",
                    "builder_recipe_category_audio": "음성/오디오",
                    "builder_recipe_category_video": "비디오 제작",
                    "builder_recipe_category_coding": "코드 작성",
                    "builder_recipe_category_data": "데이터 분석",
                    "builder_recipe_category_marketing": "마케팅",
                    "builder_recipe_category_productivity": "생산성",
                    "builder_recipe_category_design": "디자인",
                    "builder_recipe_category_education": "교육",
                    "builder_recipe_category_business": "비즈니스",
                    "builder_recipe_category_other": "기타",
                    "builder_recipe_difficulty": "레시피 난의도",
                    "builder_recipe_difficulty_all": "전체",
                    "builder_recipe_difficulty_beginner": "초급",
                    "builder_recipe_difficulty_intermediate": "중급",
                    "builder_recipe_difficulty_advanced": "고급",
                    "builder_recipe_type": "레시피 타입",
                    "builder_recipe_type_private": "비공개 레시피",
                    "builder_recipe_type_public": "전체 공개 레시피",
                    "builder_recipe_type_partly": "부분 공유 레시피",
                    "builder_recipe_basic_description": "레시피 기본 설명",
                    "builder_recipe_basic_description_placeholder": "레시피의 전체적인 목적과 사용 방법에 대한 기본 설명을 입력하세요",
                    "builder_recipe_integrated_description": "도구 조합 통합 설명",
                    "builder_recipe_integrated_description_placeholder": "선택한 도구들을 사용하는지에 대한 상세한 설명을 입력하세요",
                    "builder_recipe_advantages": "도구 조합 장점 및 핵심 포인트",
                    "builder_recipe_advantage_1": "첫 번째 장점 또는 핵심 포인트를 입력하세요",
                    "builder_recipe_advantage_2": "두 번째 장점 또는 핵심 포인트를 입력하세요",
                    "builder_recipe_advantage_3": "세 번째 장점 또는 핵심 포인트를 입력하세요",
                    "builder_recipe_recommended_groups": "레시피 이용 추천 그룹 (최대 3개 선택)",
                    "builder_group_office_worker": "회사원",
                    "builder_group_university_student": "대학생",
                    "builder_group_professional": "전문직",
                    "builder_group_video_audio": "영상/음성 관련",
                    "builder_group_marketing": "마케팅 직군",
                    "builder_group_management_support": "경영지원 직군",
                    "builder_group_researcher": "연구원",
                    "builder_group_student": "중고생",
                    "builder_group_developer": "개발직군",
                    "builder_group_medical": "의료 관련",
                    "builder_group_design": "디자인 직군",
                    "builder_group_c_level": "C level 임원",
                    "builder_detailed_tools_title": "도구별 상세 설명",
                    "builder_image_upload": "참고 이미지 및 스크린 캡쳐",
                    "builder_drop_images": "Drop images here",
                    "builder_select_images": "이미지 선택",
                    "builder_save_recipe": "레시피 저장"
                };
                
                this.translations.set('ko', koTranslations);
                this.loadedLanguages.add('ko');
                console.log('Korean translations loaded directly');
                return;
            }
            
            // 다른 언어는 기존 방식으로 로드
            const response = await fetch(`lang/${lang}.js`);
            if (!response.ok) {
                throw new Error(`Failed to load translation file for ${lang}`);
            }
            
            const scriptContent = await response.text();
            
            // 번역 객체 추출 (const translations_ko = {...} 형태에서)
            const match = scriptContent.match(/const\s+translations_\w+\s*=\s*({[\s\S]*});/);
            if (match) {
                const translationObj = eval(`(${match[1]})`);
                this.translations.set(lang, translationObj);
                this.loadedLanguages.add(lang);
                console.log(`Translation loaded for ${lang}`);
            } else {
                throw new Error(`Invalid translation file format for ${lang}`);
            }
        } catch (error) {
            console.error(`Error loading translation for ${lang}:`, error);
            // 실패 시 기본 언어(한국어) 사용
            if (lang !== 'ko') {
                console.log('Falling back to Korean...');
                await this.loadTranslationFile('ko');
            }
        }
    }

    // 페이지 번역 적용
    translatePage() {
        const dict = this.translations.get(this.currentLanguage);
        if (!dict) {
            console.warn(`No translations available for ${this.currentLanguage}`);
            return;
        }

        console.log(`Starting translation for ${this.currentLanguage}...`);
        let translatedCount = 0;
        let missingCount = 0;

        // 텍스트 콘텐츠 번역
        const textElements = document.querySelectorAll('[data-i18n]');
        console.log(`Found ${textElements.length} text elements to translate`);
        
        textElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            if (dict[key]) {
                elem.textContent = dict[key];
                translatedCount++;
            } else {
                missingCount++;
                // 번역이 없는 경우 콘솔에 경고 (개발 중에만)
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.warn(`Translation missing for key: ${key} in language: ${this.currentLanguage}`);
                }
            }
        });

        // placeholder 번역
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n-placeholder');
            if (dict[key]) {
                elem.setAttribute('placeholder', dict[key]);
                translatedCount++;
            }
        });

        // select 옵션들 번역
        const optionElements = document.querySelectorAll('option[data-i18n]');
        optionElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            if (dict[key]) {
                elem.textContent = dict[key];
                translatedCount++;
            }
        });
        
        // title 속성 번역
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n-title');
            if (dict[key]) {
                elem.setAttribute('title', dict[key]);
                translatedCount++;
            }
        });
        
        // alt 속성 번역
        const altElements = document.querySelectorAll('[data-i18n-alt]');
        altElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n-alt');
            if (dict[key]) {
                elem.setAttribute('alt', dict[key]);
                translatedCount++;
            }
        });

        console.log(`Translation completed: ${translatedCount} elements translated, ${missingCount} missing keys`);
    }

    // 언어 선택기 이벤트 리스너 설정
    setupLanguageSwitchers() {
        const switcher = document.getElementById("languageSwitcher");
        const mobileSwitcher = document.getElementById("mobileLanguageSwitcher");
        
        if (switcher) {
            switcher.value = this.currentLanguage;
            switcher.addEventListener("change", async (e) => {
                const lang = e.target.value;
                console.log('Language switcher changed to:', lang);
                await this.setLanguage(lang);
                
                // 모바일 언어 선택기도 동기화
                if (mobileSwitcher) {
                    mobileSwitcher.value = lang;
                }
            });
        }
        
        if (mobileSwitcher) {
            mobileSwitcher.value = this.currentLanguage;
            mobileSwitcher.addEventListener("change", async (e) => {
                const lang = e.target.value;
                console.log('Mobile language switcher changed to:', lang);
                await this.setLanguage(lang);
                
                // 데스크톱 언어 선택기도 동기화
                if (switcher) {
                    switcher.value = lang;
                }
            });
        }
        
        // 디버깅을 위한 로그
        console.log('Language switchers setup completed');
        console.log('Desktop switcher found:', !!switcher);
        console.log('Mobile switcher found:', !!mobileSwitcher);
    }

    // 현재 언어 가져오기
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // 번역 텍스트 가져오기
    getTranslation(key, lang = null) {
        if (!lang) {
            lang = this.currentLanguage;
        }
        
        const dict = this.translations.get(lang);
        return dict ? dict[key] || key : key;
    }

    // 동적 콘텐츠 번역
    translateElement(element, lang = null) {
        if (!lang) {
            lang = this.currentLanguage;
        }
        
        const dict = this.translations.get(lang);
        if (!dict) return false;
        
        const key = element.getAttribute('data-i18n');
        if (dict[key]) {
            element.textContent = dict[key];
            return true;
        }
        return false;
    }

    // 새로 추가된 요소 번역
    translateNewElements(container = document) {
        const dict = this.translations.get(this.currentLanguage);
        if (!dict) return;

        container.querySelectorAll('[data-i18n]').forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            if (dict[key] && !elem.dataset.translated) {
                elem.textContent = dict[key];
                elem.dataset.translated = 'true';
            }
        });
    }
}

// 전역 번역 매니저 인스턴스 생성
window.translationManager = new TranslationManager();

// 기존 함수들과의 호환성을 위한 래퍼 함수들
window.translate = (lang) => window.translationManager.setLanguage(lang);
window.translateElement = (element, lang) => window.translationManager.translateElement(element, lang);
window.getCurrentLanguage = () => window.translationManager.getCurrentLanguage();
window.getTranslation = (key, lang) => window.translationManager.getTranslation(key, lang);

// 디버깅을 위한 테스트 함수들
window.testTranslation = () => {
    console.log('=== Translation System Test ===');
    console.log('Current language:', window.translationManager.getCurrentLanguage());
    console.log('Loaded languages:', Array.from(window.translationManager.loadedLanguages));
    console.log('Available translations:', window.translationManager.translations.size);
    
    // 번역 키 테스트
    const testKey = 'builder_title';
    const translation = window.translationManager.getTranslation(testKey);
    console.log(`Test translation for "${testKey}":`, translation);
    
    // 페이지의 번역 가능한 요소 수 확인
    const translatableElements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-alt]');
    console.log('Translatable elements found:', translatableElements.length);
    
    return {
        currentLanguage: window.translationManager.getCurrentLanguage(),
        loadedLanguages: Array.from(window.translationManager.loadedLanguages),
        translationCount: window.translationManager.translations.size,
        translatableElements: translatableElements.length
    };
};

// 언어 변경 테스트 함수
window.testLanguageChange = async (lang) => {
    console.log(`Testing language change to: ${lang}`);
    try {
        await window.translationManager.setLanguage(lang);
        console.log(`Language changed to ${lang} successfully`);
        return true;
    } catch (error) {
        console.error(`Failed to change language to ${lang}:`, error);
        return false;
    }
};

// MutationObserver를 사용하여 동적으로 추가되는 요소 자동 번역
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    window.translationManager.translateNewElements(node);
                }
            });
        }
    });
});

// DOM 변경 감지 시작
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
    });
} else {
    observer.observe(document.body, { childList: true, subtree: true });
}
  