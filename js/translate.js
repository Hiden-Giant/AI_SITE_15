window.translate = function(lang) {
    const dict = getTranslationDict(lang);
  
    // 텍스트 콘텐츠 번역
    document.querySelectorAll('[data-i18n]').forEach(elem => {
      const key = elem.getAttribute('data-i18n');
      if (dict[key]) {
        elem.textContent = dict[key];
      } else {
        // 번역이 없는 경우 콘솔에 경고 (개발 중에만)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn(`Translation missing for key: ${key} in language: ${lang}`);
        }
      }
    });
  
    // placeholder 번역
    document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
      const key = elem.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        elem.setAttribute('placeholder', dict[key]);
      }
    });

    // select 옵션들 번역
    document.querySelectorAll('option[data-i18n]').forEach(elem => {
      const key = elem.getAttribute('data-i18n');
      if (dict[key]) {
        elem.textContent = dict[key];
      }
    });
    
    // title 속성 번역
    document.querySelectorAll('[data-i18n-title]').forEach(elem => {
      const key = elem.getAttribute('data-i18n-title');
      if (dict[key]) {
        elem.setAttribute('title', dict[key]);
      }
    });
    
    // alt 속성 번역
    document.querySelectorAll('[data-i18n-alt]').forEach(elem => {
      const key = elem.getAttribute('data-i18n-alt');
      if (dict[key]) {
        elem.setAttribute('alt', dict[key]);
      }
    });
    
    // HTML lang 속성 업데이트
    document.documentElement.lang = lang;
    
    // 번역 완료 이벤트 발생
    window.dispatchEvent(new CustomEvent('translationComplete', { detail: { language: lang } }));
  }

  // 동적 콘텐츠 번역을 위한 함수
  window.translateElement = function(element, lang) {
    const dict = getTranslationDict(lang);
    
    const key = element.getAttribute('data-i18n');
    if (dict[key]) {
      element.textContent = dict[key];
      return true;
    }
    return false;
  }

  // 현재 언어 가져오기
  window.getCurrentLanguage = function() {
    return localStorage.getItem('language') || 'en';
  }

  // 번역 텍스트 가져오기
  window.getTranslation = function(key, lang = null) {
    if (!lang) {
      lang = window.getCurrentLanguage();
    }
    
    const dict = getTranslationDict(lang);
    return dict[key] || key;
  }
  
  // 지원하는 언어 목록
  const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh', 'ru', 'es', 'pt', 'ar', 'vi', 'id', 'fr', 'hi'];
  
  // 브라우저 언어 감지 함수
  function detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // 브라우저 언어가 지원되는 언어인지 확인
    if (SUPPORTED_LANGUAGES.includes(langCode)) {
      return langCode;
    }
    
    // 중국어 특별 처리 (zh-CN, zh-TW 등)
    if (langCode === 'zh') {
      return 'zh';
    }
    
    // 기본값은 영어
    return 'en';
  }
  
  // 번역 캐시 (성능 향상을 위해)
  const translationCache = new Map();
  
  // 번역 사전 가져오기 (캐시된 경우 캐시에서, 아니면 새로 생성)
  function getTranslationDict(lang) {
    if (translationCache.has(lang)) {
      return translationCache.get(lang);
    }
    
    let dict;
    switch(lang) {
        case 'ko':
            dict = translations_ko;
            break;
        case 'en':
            dict = translations_en;
            break;
        case 'ja':
            dict = translations_ja;
            break;
        case 'zh':
            dict = translations_zh;
            break;
        case 'ru':
            dict = translations_ru;
            break;
        case 'es':
            dict = translations_es;
            break;
        case 'pt':
            dict = translations_pt;
            break;
        case 'ar':
            dict = translations_ar;
            break;
        case 'vi':
            dict = translations_vi;
            break;
        case 'id':
            dict = translations_id;
            break;
        case 'fr':
            dict = translations_fr;
            break;
        case 'hi':
            dict = translations_hi;
            break;
        default:
            dict = translations_en;
    }
    
    // 캐시에 저장
    translationCache.set(lang, dict);
    return dict;
  }

  document.addEventListener("DOMContentLoaded", () => {
    // 저장된 언어가 있으면 사용, 없으면 브라우저 언어 감지
    const savedLang = localStorage.getItem("language") || detectBrowserLanguage();
    translate(savedLang);
  
    const switcher = document.getElementById("languageSwitcher");
    const mobileSwitcher = document.getElementById("mobileLanguageSwitcher");
    
    if (switcher) {
      switcher.value = savedLang;
      switcher.addEventListener("change", e => {
        const lang = e.target.value;
        localStorage.setItem("language", lang);
        translate(lang);
        
        // 모바일 언어 선택기도 동기화
        if (mobileSwitcher) {
          mobileSwitcher.value = lang;
        }
      });
    }
    
    if (mobileSwitcher) {
      mobileSwitcher.value = savedLang;
      mobileSwitcher.addEventListener("change", e => {
        const lang = e.target.value;
        localStorage.setItem("language", lang);
        translate(lang);
        
        // 데스크톱 언어 선택기도 동기화
        if (switcher) {
          switcher.value = lang;
        }
      });
    }
  });
  