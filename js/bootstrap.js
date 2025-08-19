// bootstrap.js - 공통 초기화 (헤더/푸터 주입, 테마/다국어/서비스워커 초기화, 이벤트 중복 바인딩 방지)

(function () {
  if (window.__bootstrapInitialized) return; // 중복 방ㅈ지
  window.__bootstrapInitialized = true;

  // 1) 테마 초기화: DOMContentLoaded 전에 기본값 보장(이미 theme-manager가 즉시 다크 변수 적용)
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
      // 테마 토글 초기화는 header-menu에서 SimpleThemeToggle이 처리
    } catch (e) {}
  });

  // 2) 헤더/푸터 주입 (페이지에 컨테이너가 있을 때만)
  document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer && !headerContainer.__loaded) {
      console.log('헤더 로딩 시작...');
      fetch('header.html')
        .then(r => {
          if (!r.ok) {
            throw new Error(`HTTP ${r.status}: ${r.statusText}`);
          }
          return r.text();
        })
        .then(html => {
          console.log('헤더 HTML 로딩 성공, 길이:', html.length);
          headerContainer.innerHTML = html;
          headerContainer.__loaded = true;
          
          // header-menu 스크립트 로드 후 메뉴/토글 초기화
          const script = document.createElement('script');
          script.src = 'js/header-menu.js';
          script.onload = function () {
            console.log('header-menu.js 로딩 완료');
            if (window.initProfileMenuDropdown) window.initProfileMenuDropdown();
            if (window.initMobileMenuToggle) window.initMobileMenuToggle();
            if (window.SimpleThemeToggle && !window.__themeToggleInitialized) {
              new window.SimpleThemeToggle();
              window.__themeToggleInitialized = true;
            }
          };
          script.onerror = function() {
            console.error('header-menu.js 로딩 실패');
          };
          document.body.appendChild(script);
        })
        .catch(error => {
          console.error('헤더 로딩 실패:', error);
          // 헤더 로딩 실패 시 기본 헤더 표시
          headerContainer.innerHTML = `
            <div style="background: var(--bg-primary); padding: 1rem; text-align: center; color: var(--text-primary);">
              <h1>AI Curator</h1>
              <p>헤더 로딩 중 오류가 발생했습니다.</p>
            </div>
          `;
        });
    }

    const footerContainer = document.getElementById('footer-container');
    if (footerContainer && !footerContainer.__loaded) {
      fetch('footer.html').then(r => r.text()).then(html => {
        footerContainer.innerHTML = html;
        footerContainer.__loaded = true;
      }).catch(() => {});
    }
  });

  // 3) 다국어 초기화 (translate.js가 로드되어 있을 때만)
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.translate && !window.__i18nInitialized) {
        const savedLang = localStorage.getItem('language');
        if (savedLang) window.translate(savedLang);
        window.__i18nInitialized = true;
      }
    } catch (e) {}
  });

  // 4) 서비스 워커 등록 (전역)
  window.addEventListener('load', () => {
    try {
      if ('serviceWorker' in navigator && !window.__swRegistered) {
        navigator.serviceWorker.register('/mobile_service/service-worker.js')
          .then(reg => console.log('Service Worker registered:', reg.scope))
          .catch(err => console.warn('Service Worker register failed:', err));
        window.__swRegistered = true;
      }
    } catch (e) {
      console.warn('SW registration error:', e);
    }
  });
})();


