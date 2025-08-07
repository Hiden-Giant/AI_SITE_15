# 다국어 지원 시스템 (Internationalization)

AI Curator Hub는 12개 언어를 지원하는 다국어 시스템을 제공합니다.

## 지원 언어

- 🇰🇷 한국어 (ko)
- 🇺🇸 영어 (en)
- 🇯🇵 일본어 (ja)
- 🇨🇳 중국어 (zh)
- 🇷🇺 러시아어 (ru)
- 🇪🇸 스페인어 (es)
- 🇧🇷 브라질 포르투갈어 (pt)
- 🇸🇦 아랍어 (ar)
- 🇻🇳 베트남어 (vi)
- 🇮🇩 인도네시아어 (id)
- 🇫🇷 프랑스어 (fr)
- 🇮🇳 힌디어 (hi)

## 파일 구조

```
lang/
├── ko.js      # 한국어 번역
├── en.js      # 영어 번역
├── ja.js      # 일본어 번역
├── zh.js      # 중국어 번역
├── ru.js      # 러시아어 번역
├── es.js      # 스페인어 번역
├── pt.js      # 브라질 포르투갈어 번역
├── ar.js      # 아랍어 번역
├── vi.js      # 베트남어 번역
├── id.js      # 인도네시아어 번역
├── fr.js      # 프랑스어 번역
├── hi.js      # 힌디어 번역
└── README.md  # 이 파일
```

## 사용법

### 1. HTML에서 번역 키 사용

```html
<!-- 텍스트 번역 -->
<h1 data-i18n="hero_title">당신을 위한 AI 도구 지금 바로 찾아드립니다!</h1>

<!-- placeholder 번역 -->
<input type="text" data-i18n-placeholder="search_placeholder" placeholder="찾으시는 AI 도구를 검색해보세요...">

<!-- title 속성 번역 -->
<button data-i18n-title="tooltip_text" title="도구 상세 정보">상세보기</button>

<!-- alt 속성 번역 -->
<img src="icon.png" data-i18n-alt="image_description" alt="AI 도구 아이콘">

<!-- select 옵션 번역 -->
<select>
    <option value="ko" data-i18n="language_ko">한국어</option>
    <option value="en" data-i18n="language_en">English</option>
</select>
```

### 2. JavaScript에서 번역 사용

```javascript
// 현재 언어 가져오기
const currentLang = window.getCurrentLanguage();

// 번역 텍스트 가져오기
const translatedText = window.getTranslation('hero_title');

// 특정 언어로 번역 텍스트 가져오기
const japaneseText = window.getTranslation('hero_title', 'ja');

// 동적 요소 번역
const element = document.getElementById('myElement');
window.translateElement(element, 'en');
```

### 3. 언어 변경

```javascript
// 언어 변경
window.translate('ja');

// 언어 변경 이벤트 리스너
window.addEventListener('translationComplete', function(event) {
    console.log('언어가 변경되었습니다:', event.detail.language);
});
```

## 번역 파일 구조

각 언어 파일은 다음과 같은 구조를 가집니다:

```javascript
const translations_ko = {
    // 섹션별로 주석으로 구분
    "key_name": "번역된 텍스트",
    
    // 예시
    "hero_title": "당신을 위한 AI 도구 지금 바로 찾아드립니다!",
    "search_placeholder": "찾으시는 AI 도구를 검색해보세요...",
    "btn_search": "검색"
};
```

## 번역 키 명명 규칙

- **소문자와 언더스코어 사용**: `hero_title`, `search_button`
- **섹션별 접두사**: `header_`, `footer_`, `modal_`
- **의미있는 이름**: `btn_get_recommendations`, `feature_smart_search`

## 자동 언어 감지

시스템은 사용자의 브라우저 언어 설정을 자동으로 감지하여 적절한 언어를 선택합니다:

1. 저장된 언어 설정 확인
2. 브라우저 언어 감지
3. 지원되지 않는 언어인 경우 영어로 기본 설정

## 새로운 언어 추가하기

1. `lang/` 폴더에 새로운 언어 파일 생성 (예: `fr.js`)
2. 번역 객체 생성:
   ```javascript
   const translations_fr = {
       // 모든 번역 키와 값 추가
   };
   ```
3. `js/translate.js`의 switch 문에 새 언어 추가
4. HTML 파일들에 새 언어 스크립트 포함
5. 언어 선택기에 새 옵션 추가

## 개발 팁

- **번역 누락 감지**: 개발 환경에서 번역이 없는 키는 콘솔에 경고가 표시됩니다
- **동적 콘텐츠**: JavaScript로 생성된 콘텐츠는 `window.translateElement()` 함수를 사용하세요
- **이벤트 리스너**: `translationComplete` 이벤트를 사용하여 번역 완료 후 작업을 수행하세요

## 브라우저 지원

- Chrome, Firefox, Safari, Edge 등 모든 최신 브라우저 지원
- IE11 이하 버전은 지원하지 않습니다

## 문제 해결

### 번역이 적용되지 않는 경우
1. 번역 키가 올바른지 확인
2. 언어 파일이 HTML에 포함되었는지 확인
3. `data-i18n` 속성이 올바르게 설정되었는지 확인

### 새로운 번역 키 추가
1. 모든 언어 파일에 동일한 키 추가
2. 번역 텍스트 입력
3. 페이지 새로고침하여 확인

## 라이센스

이 다국어 시스템은 MIT 라이센스 하에 제공됩니다. 