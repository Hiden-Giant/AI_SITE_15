// header.html에서 분리한 모바일 메뉴 및 테마 토글 관련 스크립트
// 햄버거 메뉴 토글 기능
class MobileMenuToggle {
    constructor() {
        this.hamburgerBtn = document.getElementById('hamburger-btn');
        this.navMobile = document.getElementById('nav-mobile');
        this.isOpen = false;
        this.init();
    }
    init() {
        if (this.hamburgerBtn && this.navMobile) {
            this.hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
            setTimeout(() => {
                document.addEventListener('click', (e) => this.handleOutsideClick(e));
            }, 0);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                }
            });
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768 && this.isOpen) {
                    this.closeMenu();
                }
            });
        }
    }
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    openMenu() {
        this.navMobile.classList.add('active');
        this.hamburgerBtn.querySelector('i').className = 'fas fa-times';
        this.hamburgerBtn.setAttribute('aria-label', '메뉴 닫기');
        this.isOpen = true;
        const firstFocusable = this.navMobile.querySelector('a');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
    closeMenu() {
        this.navMobile.classList.remove('active');
        this.hamburgerBtn.querySelector('i').className = 'fas fa-bars';
        this.hamburgerBtn.setAttribute('aria-label', '메뉴 열기');
        this.isOpen = false;
    }
    handleOutsideClick(e) {
        if (
            this.isOpen &&
            !this.navMobile.contains(e.target) &&
            !this.hamburgerBtn.contains(e.target)
        ) {
            this.closeMenu();
        }
    }
}

// 간단한 테마 토글 기능
class SimpleThemeToggle {
    constructor() {
        this.currentTheme = 'dark';
        this.init();
    }
    init() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.currentTheme = savedTheme;
        this.applyTheme(this.currentTheme);
        this.attachEventListeners();
    }
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        this.saveTheme();
    }
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        const icons = document.querySelectorAll('[data-theme-toggle] i');
        icons.forEach(icon => {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        });
    }
    saveTheme() {
        localStorage.setItem('theme', this.currentTheme);
    }
    attachEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-theme-toggle]')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }
}

// SimpleThemeToggle 클래스를 전역으로 등록
window.SimpleThemeToggle = SimpleThemeToggle;

// 모달 관련 전역 함수 추가
window.showLoginModal = function() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('show');
};
window.showSignupModal = function() {
  const modal = document.getElementById('signupModal');
  if (modal) modal.classList.add('show');
};
window.togglePasswordVisibility = function(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling?.querySelector('i') || input.nextElementSibling;
  if (!input || !icon) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
};

// 프로필 메뉴 클릭 토글 및 바깥 클릭 시 닫힘 (함수로 분리)
window.initProfileMenuDropdown = function() {
  const btn = document.getElementById('profileMenuButton');
  const dropdown = document.getElementById('profileDropdown');
  if (btn && dropdown) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function(e) {
      if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }
};

window.initMobileMenuToggle = function() {
  new MobileMenuToggle();
};

document.addEventListener('DOMContentLoaded', () => {
    // new MobileMenuToggle(); // 자동 바인딩 제거
    new SimpleThemeToggle();
    // 프로필 메뉴도 fetch 후 명시적으로 호출
});

// Firebase 인증 상태에 따라 헤더 UI 업데이트
function updateHeaderAuthUI(user) {
    const authButtons = document.getElementById('authButtons');
    const profileMenu = document.getElementById('profileMenu');
    const profileName = document.getElementById('profileName');
    const profileInitial = document.getElementById('profileInitial');
    const profileMenuButton = document.getElementById('profileMenuButton');
    const profileEmail = document.getElementById('profileEmail');
    // 모바일용
    const mobileAuthButtons = document.getElementById('mobileAuthButtons');
    const mobileProfileMenu = document.getElementById('mobileProfileMenu');
    const mobileProfileName = document.getElementById('mobileProfileName');
    
    if (user) {
      if (authButtons) authButtons.style.display = 'none';
      if (profileMenu) profileMenu.style.display = 'flex';
      
      // 사용자 정보 표시 개선
      const displayName = user.displayName || user.email.split('@')[0];
      const userEmail = user.email;
      
      if (profileName) {
        // 사용자 이름과 이메일을 함께 표시
        profileName.textContent = displayName;
        profileName.title = userEmail; // 툴팁으로 이메일 표시
      }
      if (profileInitial) profileInitial.textContent = displayName[0].toUpperCase();
      
      // 프로필 메뉴 버튼에 이메일 정보 설정
      if (profileMenuButton) {
        profileMenuButton.setAttribute('data-email', userEmail);
      }
      
      // 프로필 드롭다운에 이메일 표시
      if (profileEmail) {
        profileEmail.textContent = userEmail;
      }
      
      // 모바일
      if (mobileAuthButtons) mobileAuthButtons.style.display = 'none';
      if (mobileProfileMenu) mobileProfileMenu.style.display = 'flex';
      if (mobileProfileName) {
        mobileProfileName.textContent = displayName;
        mobileProfileName.title = userEmail; // 툴팁으로 이메일 표시
      }
    } else {
      if (authButtons) authButtons.style.display = 'flex';
      if (profileMenu) profileMenu.style.display = 'none';
      // 모바일
      if (mobileAuthButtons) mobileAuthButtons.style.display = 'flex';
      if (mobileProfileMenu) mobileProfileMenu.style.display = 'none';
    }
  }
  
// Firebase 인증 상태 감지 및 헤더 UI 연동
(function() {
  function tryAttachAuthListener() {
    // AuthManager가 초기화되었는지 확인
    if (window.authManager && window.authManager.auth && window.authManager.auth.onAuthStateChanged) {
      window.authManager.auth.onAuthStateChanged(updateHeaderAuthUI);
      return true;
    }
    // 기존 방식 (하위 호환성)
    else if (window.auth && window.auth.onAuthStateChanged) {
      window.auth.onAuthStateChanged(updateHeaderAuthUI);
      return true;
    } else if (window.firebase && window.firebase.auth && window.firebase.auth().onAuthStateChanged) {
      window.firebase.auth().onAuthStateChanged(updateHeaderAuthUI);
      return true;
    }
    return false;
  }
  
  // AuthManager 초기화 완료 이벤트 리스너
  window.addEventListener('authManagerReady', () => {
    console.log('AuthManager 준비됨, 인증 리스너 연결');
    tryAttachAuthListener();
  });
  
  // 즉시 시도, 실패하면 1초 간격으로 최대 10초까지 재시도
  let tries = 0;
  (function waitForFirebase() {
    if (!tryAttachAuthListener() && tries < 10) {
      tries++;
      setTimeout(waitForFirebase, 1000);
    }
  })();
})();

window.navigateToProfile = function() {
  window.location.href = 'profile.html';
};