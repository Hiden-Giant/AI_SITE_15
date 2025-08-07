/**
 * AI Site 테마 매니저
 * 다크/라이트 모드 완전 구현
 * 로컬 스토리지 저장 및 시스템 테마 감지
 */

class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'light',
                displayName: '라이트 모드',
                icon: 'fas fa-sun',
                variables: {
                    '--bg-primary': '#ffffff',
                    '--bg-secondary': '#f8fafc',
                    '--bg-tertiary': '#f1f5f9',
                    '--text-primary': '#1e293b',
                    '--text-secondary': '#64748b',
                    '--text-muted': '#94a3b8',
                    '--border-color': '#e2e8f0',
                    '--border-hover': '#cbd5e1',
                    '--card-bg': '#ffffff',
                    '--card-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    '--input-bg': '#ffffff',
                    '--input-border': '#d1d5db',
                    '--button-primary': '#3b82f6',
                    '--button-primary-hover': '#2563eb',
                    '--button-secondary': '#6b7280',
                    '--button-secondary-hover': '#4b5563',
                    '--success-color': '#10b981',
                    '--warning-color': '#f59e0b',
                    '--error-color': '#ef4444',
                    '--info-color': '#06b6d4',
                    '--gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '--gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    '--gradient-start': '#7C3AED',
                    '--gradient-end': '#DB2777',
                    '--navbar-bg': 'rgba(255, 255, 255, 0.95)',
                    '--sidebar-bg': '#ffffff',
                    '--modal-bg': 'rgba(0, 0, 0, 0.5)',
                    '--overlay-bg': 'rgba(255, 255, 255, 0.9)',
                    '--scrollbar-track': '#f1f5f9',
                    '--scrollbar-thumb': '#cbd5e1',
                    '--scrollbar-thumb-hover': '#94a3b8',
                    '--hover-bg': '#edf2f7',
                    '--primary': '#4a35e8',
                    '--dark-bg': '#f8fafc',
                    '--card-hover': '#f1f5f9'
                }
            },
            dark: {
                name: 'dark',
                displayName: '다크 모드',
                icon: 'fas fa-moon',
                variables: {
                    '--bg-primary': '#0f172a',
                    '--bg-secondary': '#1e293b',
                    '--bg-tertiary': '#334155',
                    '--text-primary': '#f8fafc',
                    '--text-secondary': '#cbd5e1',
                    '--text-muted': '#94a3b8',
                    '--border-color': '#374151',
                    '--border-hover': '#4b5563',
                    '--card-bg': '#1e293b',
                    '--card-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                    '--input-bg': '#374151',
                    '--input-border': '#4b5563',
                    '--button-primary': '#3b82f6',
                    '--button-primary-hover': '#2563eb',
                    '--button-secondary': '#6b7280',
                    '--button-secondary-hover': '#9ca3af',
                    '--success-color': '#10b981',
                    '--warning-color': '#f59e0b',
                    '--error-color': '#ef4444',
                    '--info-color': '#06b6d4',
                    '--gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '--gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    '--gradient-start': '#7C3AED',
                    '--gradient-end': '#DB2777',
                    '--navbar-bg': 'rgba(15, 23, 42, 0.95)',
                    '--sidebar-bg': '#1e293b',
                    '--modal-bg': 'rgba(0, 0, 0, 0.7)',
                    '--overlay-bg': 'rgba(0, 0, 0, 0.8)',
                    '--scrollbar-track': '#1e293b',
                    '--scrollbar-thumb': '#475569',
                    '--scrollbar-thumb-hover': '#64748b',
                    '--hover-bg': '#2d3748',
                    '--primary': '#4a35e8',
                    '--dark-bg': '#121620',
                    '--card-hover': '#232939'
                }
            }
        };

        this.currentTheme = 'dark'; // 기본값
        this.transitionDuration = 300; // 테마 전환 애니메이션 시간 (ms)
        this.storageKey = 'ai-site-theme';
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * 테마 매니저 초기화
     */
    init() {
        // 이미 초기화되었으면 중복 실행 방지
        if (this.isInitialized) {
            console.log('⚠️ 테마 매니저가 이미 초기화됨');
            return;
        }
        
        console.log('🎨 테마 매니저 초기화 시작');
        
        // 저장된 테마 불러오기
        this.loadSavedTheme();
        
        // CSS 전환 효과 추가
        this.addTransitionStyles();
        
        // 시스템 테마 변경 감지
        this.detectSystemThemeChange();
        
        // 테마 토글 버튼들에 이벤트 연결
        this.attachEventListeners();
        
        // 실제 테마 적용 (애니메이션 포함)
        if (this.currentTheme !== 'dark') {
            console.log(`🔄 저장된 테마로 변경: ${this.currentTheme}`);
            this.applyTheme(this.currentTheme, false);
        } else {
            console.log('✅ 기본 다크 모드 유지');
        }
        
        // 테마 매니저 준비 완료 이벤트 발생
        this.dispatchThemeReadyEvent();
        
        this.isInitialized = true;
        console.log(`🎨 테마 매니저 초기화 완료 - 현재 테마: ${this.currentTheme}`);
    }

    /**
     * 즉시 테마 적용 (애니메이션 없이)
     */
    applyThemeImmediately(themeName) {
        const theme = this.themes[themeName];
        if (!theme) {
            console.warn(`⚠️ 테마를 찾을 수 없음: ${themeName}`);
            return;
        }

        const root = document.documentElement;
        
        // CSS 변수 적용
        Object.entries(theme.variables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // body 클래스 업데이트
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        
        // 테마 속성 설정
        document.body.setAttribute('data-theme', themeName);
        
        // 메타 테마 색상 업데이트
        this.updateMetaThemeColor(theme.variables['--bg-primary']);
        
        console.log(`⚡ 즉시 테마 적용: ${themeName}`);
    }

    /**
     * 저장된 테마 불러오기
     */
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
                console.log(`💾 저장된 테마 불러옴: ${savedTheme}`);
            } else {
                // 저장된 테마가 없으면 기본 다크 모드
                this.currentTheme = 'dark';
                console.log(`🌙 기본 다크 모드 적용`);
            }
        } catch (error) {
            console.warn('테마 불러오기 실패:', error);
            this.currentTheme = 'dark'; // 기본값으로 fallback
        }
    }

    /**
     * 시스템 테마 변경 감지 (비활성화)
     */
    detectSystemThemeChange() {
        // 시스템 테마 감지 기능을 비활성화하여 항상 다크 모드 기본값 유지
        console.log(`🚫 시스템 테마 감지 비활성화 - 기본 다크 모드 유지`);
    }

    /**
     * 테마 전환 애니메이션 CSS 추가
     */
    addTransitionStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                transition: 
                    background-color ${this.transitionDuration}ms ease,
                    color ${this.transitionDuration}ms ease,
                    border-color ${this.transitionDuration}ms ease,
                    box-shadow ${this.transitionDuration}ms ease;
            }
            
            * {
                transition: 
                    background-color ${this.transitionDuration}ms ease,
                    color ${this.transitionDuration}ms ease,
                    border-color ${this.transitionDuration}ms ease,
                    box-shadow ${this.transitionDuration}ms ease,
                    fill ${this.transitionDuration}ms ease,
                    stroke ${this.transitionDuration}ms ease;
            }
            
            .theme-transition-disabled * {
                transition: none !important;
            }
            
            /* 초기 로딩 시 깜빡임 방지 */
            .theme-loading {
                visibility: hidden;
            }
            
            .theme-loaded {
                visibility: visible;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 테마 토글 (다크 ↔ 라이트)
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        console.log(`🔄 테마 토글 시작: ${this.currentTheme} → ${newTheme}`);
        
        this.setTheme(newTheme);
        
        // 토글 효과 애니메이션
        this.animateToggle();
        
        console.log(`✅ 테마 토글 완료: ${this.currentTheme} → ${newTheme}`);
    }

    /**
     * 특정 테마로 설정
     */
    setTheme(themeName, saveToStorage = true) {
        if (!this.themes[themeName]) {
            console.warn(`⚠️ 존재하지 않는 테마: ${themeName}`);
            return false;
        }

        const oldTheme = this.currentTheme;
        this.currentTheme = themeName;
        
        this.applyTheme(themeName);
        
        if (saveToStorage) {
            this.saveTheme();
        }
        
        // 테마 변경 이벤트 발생
        this.dispatchThemeChangeEvent(oldTheme, themeName);
        
        return true;
    }

    /**
     * 테마 적용
     */
    applyTheme(themeName, animate = true) {
        const theme = this.themes[themeName];
        if (!theme) {
            console.warn(`⚠️ 존재하지 않는 테마: ${themeName}`);
            return;
        }

        console.log(`🎨 테마 적용 시작: ${themeName} (애니메이션: ${animate})`);

        const root = document.documentElement;
        
        // 애니메이션 비활성화 (필요한 경우)
        if (!animate) {
            document.body.classList.add('theme-transition-disabled');
        }

        // CSS 변수 적용
        Object.entries(theme.variables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // body 클래스 업데이트
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        
        // 테마 속성 설정
        document.body.setAttribute('data-theme', themeName);
        
        // 메타 테마 색상 업데이트 (모바일 브라우저 상단바)
        this.updateMetaThemeColor(theme.variables['--bg-primary']);
        
        // 토글 버튼 아이콘 업데이트
        this.updateToggleButtons();

        // 애니메이션 재활성화
        if (!animate) {
            setTimeout(() => {
                document.body.classList.remove('theme-transition-disabled');
            }, 50);
        }

        console.log(`✨ 테마 적용 완료: ${themeName}`);
    }

    /**
     * 메타 테마 색상 업데이트 (모바일 브라우저)
     */
    updateMetaThemeColor(color) {
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }
        metaTheme.content = color;
    }

    /**
     * 토글 버튼 아이콘 업데이트
     */
    updateToggleButtons() {
        const theme = this.themes[this.currentTheme];
        const oppositeTheme = this.currentTheme === 'dark' ? this.themes.light : this.themes.dark;
        
        const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
        console.log(`🔘 토글 버튼 업데이트: ${toggleButtons.length}개 버튼 발견`);
        
        toggleButtons.forEach((button, index) => {
            const icon = button.querySelector('i, .icon');
            const text = button.querySelector('.theme-text');
            
            if (icon) {
                // 다음에 전환될 테마의 아이콘을 표시
                icon.className = oppositeTheme.icon;
                console.log(`🔄 버튼 ${index + 1} 아이콘 변경: ${oppositeTheme.icon}`);
            }
            
            if (text) {
                // 다음에 전환될 테마의 이름을 표시
                text.textContent = oppositeTheme.displayName;
                console.log(`🔄 버튼 ${index + 1} 텍스트 변경: ${oppositeTheme.displayName}`);
            }
            
            // 버튼 aria-label 업데이트
            button.setAttribute('aria-label', `${oppositeTheme.displayName}로 변경`);
            button.setAttribute('title', `${oppositeTheme.displayName}로 변경`);
        });
    }

    /**
     * 토글 애니메이션 효과
     */
    animateToggle() {
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.style.transform = 'scale(0.9)';
            button.style.transition = 'transform 0.1s ease';
            
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                setTimeout(() => {
                    button.style.transform = '';
                    button.style.transition = '';
                }, 100);
            }, 100);
        });
    }

    /**
     * 테마 저장
     */
    saveTheme() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
            console.log(`💾 테마 저장: ${this.currentTheme}`);
        } catch (error) {
            console.warn('테마 저장 실패:', error);
        }
    }

    /**
     * 이벤트 리스너 연결
     */
    attachEventListeners() {
        // 테마 토글 버튼들
        document.addEventListener('click', (e) => {
            const toggleButton = e.target.closest('[data-theme-toggle]');
            if (toggleButton) {
                e.preventDefault();
                console.log(`🎯 테마 토글 버튼 클릭됨`);
                this.toggleTheme();
            }
        });

        // 키보드 단축키 (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                console.log(`⌨️ 키보드 단축키로 테마 토글`);
                this.toggleTheme();
            }
        });

        console.log('🎯 테마 이벤트 리스너 연결 완료');
    }

    /**
     * 테마 준비 완료 이벤트 발생
     */
    dispatchThemeReadyEvent() {
        const event = new CustomEvent('themeReady', {
            detail: {
                currentTheme: this.currentTheme,
                availableThemes: Object.keys(this.themes),
                themeManager: this
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 테마 변경 이벤트 발생
     */
    dispatchThemeChangeEvent(oldTheme, newTheme) {
        const event = new CustomEvent('themeChange', {
            detail: {
                oldTheme,
                newTheme,
                themeData: this.themes[newTheme],
                themeManager: this
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 현재 테마 정보 반환
     */
    getCurrentTheme() {
        return {
            name: this.currentTheme,
            data: this.themes[this.currentTheme]
        };
    }

    /**
     * 사용 가능한 테마 목록 반환
     */
    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            name: key,
            displayName: this.themes[key].displayName,
            icon: this.themes[key].icon
        }));
    }

    /**
     * 테마 리셋 (시스템 테마로 돌아가기)
     */
    resetToSystemTheme() {
        localStorage.removeItem(this.storageKey);
        this.setTheme('dark', true);
        console.log(`🔄 기본 다크 모드로 리셋`);
    }

    /**
     * 테마 매니저 제거
     */
    destroy() {
        // 이벤트 리스너 제거는 delegation을 사용했으므로 별도 제거 불필요
        console.log('🗑️ 테마 매니저 제거됨');
    }
}

// 전역 테마 매니저 인스턴스
let themeManager;

// 즉시 기본 테마 적용 (DOM 로드 전)
(function() {
    // 기본 다크 모드 CSS 변수 즉시 적용
    const root = document.documentElement;
    const defaultDarkTheme = {
        '--bg-primary': '#0f172a',
        '--bg-secondary': '#1e293b',
        '--bg-tertiary': '#334155',
        '--text-primary': '#f8fafc',
        '--text-secondary': '#cbd5e1',
        '--text-muted': '#94a3b8',
        '--border-color': '#374151',
        '--border-hover': '#4b5563',
        '--card-bg': '#1e293b',
        '--card-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        '--input-bg': '#374151',
        '--input-border': '#4b5563',
        '--button-primary': '#3b82f6',
        '--button-primary-hover': '#2563eb',
        '--button-secondary': '#6b7280',
        '--button-secondary-hover': '#9ca3af',
        '--success-color': '#10b981',
        '--warning-color': '#f59e0b',
        '--error-color': '#ef4444',
        '--info-color': '#06b6d4',
        '--gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '--gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        '--gradient-start': '#7C3AED',
        '--gradient-end': '#DB2777',
        '--navbar-bg': 'rgba(15, 23, 42, 0.95)',
        '--sidebar-bg': '#1e293b',
        '--modal-bg': 'rgba(0, 0, 0, 0.7)',
        '--overlay-bg': 'rgba(0, 0, 0, 0.8)',
        '--scrollbar-track': '#1e293b',
        '--scrollbar-thumb': '#475569',
        '--scrollbar-thumb-hover': '#64748b',
        '--hover-bg': '#2d3748',
        '--primary': '#4a35e8',
        '--dark-bg': '#121620',
        '--card-hover': '#232939'
    };
    
    Object.entries(defaultDarkTheme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
    
    // body에 기본 테마 클래스 추가
    if (document.body) {
        document.body.setAttribute('data-theme', 'dark');
        document.body.classList.add('theme-dark');
    }
    
    console.log('⚡ 기본 다크 테마 즉시 적용됨');
})();

// DOM 로드 완료 시 테마 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
    
    // 전역 접근 가능하도록 설정
    window.themeManager = themeManager;
    
    // 페이지 로딩 완료 표시
    document.body.classList.add('theme-loaded');
    
    console.log('🚀 테마 매니저 DOM 로드 완료');
});

// 페이지 완전 로드 후 추가 초기화
window.addEventListener('load', () => {
    if (themeManager) {
        console.log('📄 페이지 완전 로드됨 - 테마 매니저 상태 확인');
        console.log('현재 테마:', themeManager.getCurrentTheme());
    }
});

// 테마 관련 유틸리티 함수들
window.ThemeUtils = {
    /**
     * 현재 테마가 다크 모드인지 확인
     */
    isDarkMode() {
        return themeManager?.currentTheme === 'dark';
    },

    /**
     * 현재 테마가 라이트 모드인지 확인
     */
    isLightMode() {
        return themeManager?.currentTheme === 'light';
    },

    /**
     * 테마 토글
     */
    toggle() {
        themeManager?.toggleTheme();
    },

    /**
     * 특정 테마로 설정
     */
    setTheme(themeName) {
        return themeManager?.setTheme(themeName);
    },

    /**
     * 현재 테마 정보
     */
    getCurrentTheme() {
        return themeManager?.getCurrentTheme();
    }
};

// 테마 변경 이벤트 리스너 예제
document.addEventListener('themeChange', (e) => {
    console.log('테마 변경됨:', e.detail);
    
    // 여기에 테마 변경 시 실행할 추가 로직 구현 가능
    // 예: 차트 다시 그리기, 이미지 변경 등
});
