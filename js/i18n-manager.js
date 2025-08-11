/**
 * 다국어 시스템 관리자 - 고급 기능
 * 
 * 주요 기능:
 * - 언어별 번역 파일 동적 로드
 * - 번역 키 자동 감지 및 관리
 * - 성능 최적화 (캐싱, 지연 로딩)
 * - 동적 콘텐츠 자동 번역
 * - 번역 품질 모니터링
 */

class I18nManager {
    constructor() {
        this.currentLanguage = 'ko';
        this.fallbackLanguage = 'ko';
        this.translations = new Map();
        this.loadedLanguages = new Set();
        this.missingKeys = new Set();
        this.performanceMetrics = {
            loadTimes: new Map(),
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.supportedLanguages = [
            'ko', 'en', 'ja', 'zh', 'ru', 'es', 'pt', 'ar', 'vi', 'id', 'fr', 'hi'
        ];
        
        this.languageNames = {
            'ko': '한국어',
            'en': 'English',
            'ja': '日本語',
            'zh': '中文',
            'ru': 'Русский',
            'es': 'Español',
            'pt': 'Português',
            'ar': 'العربية',
            'vi': 'Tiếng Việt',
            'id': 'Bahasa Indonesia',
            'fr': 'Français',
            'hi': 'हिन्दी'
        };
        
        this.init();
    }

    async init() {
        // 기본 언어 로드
        await this.loadLanguage(this.fallbackLanguage);
        
        // 저장된 언어 또는 브라우저 언어 감지
        const savedLang = localStorage.getItem('language') || this.detectBrowserLanguage();
        await this.setLanguage(savedLang);
        
        // 성능 모니터링 설정
        this.setupPerformanceMonitoring();
        
        // 동적 콘텐츠 번역을 위한 MutationObserver 설정
        this.setupMutationObserver();
    }

    // 브라우저 언어 감지
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        if (this.supportedLanguages.includes(langCode)) {
            return langCode;
        }
        
        // 중국어 특별 처리
        if (langCode === 'zh') {
            return 'zh';
        }
        
        return this.fallbackLanguage;
    }

    // 언어 설정
    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Unsupported language: ${lang}, falling back to ${this.fallbackLanguage}`);
            lang = this.fallbackLanguage;
        }

        const startTime = performance.now();
        
        try {
            // 언어 파일 로드 (아직 로드되지 않은 경우)
            if (!this.loadedLanguages.has(lang)) {
                await this.loadLanguage(lang);
            }
            
            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
            
            // HTML lang 속성 업데이트
            document.documentElement.lang = lang;
            
            // 페이지 번역 적용
            this.translatePage();
            
            // 성능 측정
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.loadTimes.set(lang, loadTime);
            
            // 번역 완료 이벤트 발생
            this.dispatchTranslationEvent('languageChanged', { language: lang, loadTime });
            
            console.log(`Language changed to ${lang} in ${loadTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`Failed to set language to ${lang}:`, error);
            // 실패 시 기본 언어 사용
            if (lang !== this.fallbackLanguage) {
                await this.setLanguage(this.fallbackLanguage);
            }
        }
    }

    // 언어 파일 로드
    async loadLanguage(lang) {
        if (this.loadedLanguages.has(lang)) {
            this.performanceMetrics.cacheHits++;
            return;
        }

        this.performanceMetrics.cacheMisses++;
        const startTime = performance.now();
        
        try {
            const response = await fetch(`lang/${lang}.js`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const scriptContent = await response.text();
            
            // 번역 객체 추출
            const match = scriptContent.match(/const\s+translations_\w+\s*=\s*({[\s\S]*});/);
            if (!match) {
                throw new Error('Invalid translation file format');
            }
            
            const translationObj = eval(`(${match[1]})`);
            this.translations.set(lang, translationObj);
            this.loadedLanguages.add(lang);
            
            const loadTime = performance.now() - startTime;
            console.log(`Translation loaded for ${lang} in ${loadTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`Error loading translation for ${lang}:`, error);
            throw error;
        }
    }

    // 페이지 번역
    translatePage() {
        const dict = this.translations.get(this.currentLanguage);
        if (!dict) {
            console.warn(`No translations available for ${this.currentLanguage}`);
            return;
        }

        const startTime = performance.now();
        let translatedElements = 0;
        let missingKeys = 0;

        // 모든 번역 가능한 요소 찾기
        const translatableElements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-alt]');
        
        translatableElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n') || 
                       elem.getAttribute('data-i18n-placeholder') || 
                       elem.getAttribute('data-i18n-title') || 
                       elem.getAttribute('data-i18n-alt');
            
            if (dict[key]) {
                this.translateElement(elem, key, dict[key]);
                translatedElements++;
            } else {
                missingKeys++;
                this.missingKeys.add(key);
                
                // 개발 환경에서만 경고
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.warn(`Missing translation for key: ${key} in language: ${this.currentLanguage}`);
                }
            }
        });

        const translateTime = performance.now() - startTime;
        console.log(`Translated ${translatedElements} elements in ${translateTime.toFixed(2)}ms (${missingKeys} missing keys)`);
    }

    // 개별 요소 번역
    translateElement(element, key, translation) {
        const attr = element.getAttribute('data-i18n') ? 'data-i18n' :
                    element.getAttribute('data-i18n-placeholder') ? 'data-i18n-placeholder' :
                    element.getAttribute('data-i18n-title') ? 'data-i18n-title' :
                    element.getAttribute('data-i18n-alt') ? 'data-i18n-alt' : null;

        if (!attr) return;

        switch (attr) {
            case 'data-i18n':
                element.textContent = translation;
                break;
            case 'data-i18n-placeholder':
                element.setAttribute('placeholder', translation);
                break;
            case 'data-i18n-title':
                element.setAttribute('title', translation);
                break;
            case 'data-i18n-alt':
                element.setAttribute('alt', translation);
                break;
        }

        // 번역 완료 표시
        element.dataset.translated = 'true';
    }

    // 동적 콘텐츠 번역
    translateNewElements(container = document) {
        const dict = this.translations.get(this.currentLanguage);
        if (!dict) return;

        const newElements = container.querySelectorAll('[data-i18n]:not([data-translated]), [data-i18n-placeholder]:not([data-translated]), [data-i18n-title]:not([data-translated]), [data-i18n-alt]:not([data-translated])');
        
        newElements.forEach(elem => {
            const key = elem.getAttribute('data-i18n') || 
                       elem.getAttribute('data-i18n-placeholder') || 
                       elem.getAttribute('data-i18n-title') || 
                       elem.getAttribute('data-i18n-alt');
            
            if (dict[key]) {
                this.translateElement(elem, key, dict[key]);
            }
        });
    }

    // MutationObserver 설정
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.translateNewElements(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }

    // 성능 모니터링 설정
    setupPerformanceMonitoring() {
        // 주기적으로 성능 메트릭 로깅
        setInterval(() => {
            if (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0) {
                const cacheHitRate = (this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100).toFixed(1);
                console.log(`I18n Performance - Cache Hit Rate: ${cacheHitRate}%, Loaded Languages: ${this.loadedLanguages.size}`);
            }
        }, 30000); // 30초마다
    }

    // 번역 키 자동 감지
    detectTranslationKeys() {
        const keys = new Set();
        
        document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-alt]').forEach(elem => {
            const key = elem.getAttribute('data-i18n') || 
                       elem.getAttribute('data-i18n-placeholder') || 
                       elem.getAttribute('data-i18n-title') || 
                       elem.getAttribute('data-i18n-alt');
            if (key) keys.add(key);
        });
        
        return Array.from(keys);
    }

    // 누락된 번역 키 확인
    getMissingKeys(lang = null) {
        if (!lang) lang = this.currentLanguage;
        
        const dict = this.translations.get(lang);
        if (!dict) return [];
        
        const allKeys = this.detectTranslationKeys();
        const missingKeys = allKeys.filter(key => !dict[key]);
        
        return missingKeys;
    }

    // 번역 품질 점수 계산
    getTranslationQuality(lang = null) {
        if (!lang) lang = this.currentLanguage;
        
        const dict = this.translations.get(lang);
        if (!dict) return 0;
        
        const allKeys = this.detectTranslationKeys();
        const translatedKeys = allKeys.filter(key => dict[key]);
        
        return (translatedKeys.length / allKeys.length) * 100;
    }

    // 언어별 통계 정보
    getLanguageStats() {
        const stats = {};
        
        this.supportedLanguages.forEach(lang => {
            if (this.loadedLanguages.has(lang)) {
                const dict = this.translations.get(lang);
                const quality = this.getTranslationQuality(lang);
                const loadTime = this.performanceMetrics.loadTimes.get(lang) || 0;
                
                stats[lang] = {
                    loaded: true,
                    quality: quality.toFixed(1),
                    loadTime: loadTime.toFixed(2),
                    name: this.languageNames[lang]
                };
            } else {
                stats[lang] = {
                    loaded: false,
                    quality: 0,
                    loadTime: 0,
                    name: this.languageNames[lang]
                };
            }
        });
        
        return stats;
    }

    // 이벤트 디스패치
    dispatchTranslationEvent(type, detail) {
        window.dispatchEvent(new CustomEvent(`i18n:${type}`, { detail }));
    }

    // 공개 API
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getTranslation(key, lang = null) {
        if (!lang) lang = this.currentLanguage;
        
        const dict = this.translations.get(lang);
        return dict ? dict[key] || key : key;
    }

    async preloadLanguage(lang) {
        if (!this.loadedLanguages.has(lang)) {
            await this.loadLanguage(lang);
        }
    }

    // 언어 선택기 생성
    createLanguageSelector(container, options = {}) {
        const {
            showNames = true,
            showFlags = false,
            onChange = null
        } = options;
        
        const select = document.createElement('select');
        select.id = 'languageSelector';
        select.className = 'language-selector';
        
        this.supportedLanguages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = showNames ? this.languageNames[lang] : lang.toUpperCase();
            select.appendChild(option);
        });
        
        select.value = this.currentLanguage;
        
        select.addEventListener('change', async (e) => {
            const newLang = e.target.value;
            await this.setLanguage(newLang);
            
            if (onChange) onChange(newLang);
        });
        
        if (container) {
            container.appendChild(select);
        }
        
        return select;
    }
}

// 전역 인스턴스 생성
window.i18nManager = new I18nManager();

// 기존 TranslationManager와의 호환성
if (window.translationManager) {
    // 기존 인스턴스가 있으면 새로운 기능으로 확장
    Object.assign(window.translationManager, {
        getTranslationQuality: (lang) => window.i18nManager.getTranslationQuality(lang),
        getLanguageStats: () => window.i18nManager.getLanguageStats(),
        getMissingKeys: (lang) => window.i18nManager.getMissingKeys(lang),
        preloadLanguage: (lang) => window.i18nManager.preloadLanguage(lang)
    });
}

// ES6 모듈 export 제거 - 일반 스크립트로 사용
