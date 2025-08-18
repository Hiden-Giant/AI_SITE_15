/**
 * PC/모바일 화면 구분 및 표시 수정
 * PC 버전에서 모바일 화면이 나오는 문제 해결
 */

class PCMobileFix {
    constructor() {
        this.isPC = this.checkIsPC();
        this.init();
    }

    /**
     * PC 환경인지 확인
     */
    checkIsPC() {
        // 화면 너비가 1025px 이상이거나 데스크톱 환경 감지
        const isWideScreen = window.innerWidth >= 1025;
        const isDesktop = !this.isMobileDevice();
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // PC 환경 조건: 넓은 화면이거나 데스크톱이면서 터치가 아닌 경우
        return isWideScreen || (isDesktop && !isTouchDevice);
    }

    /**
     * 모바일 디바이스인지 확인
     */
    isMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = [
            'mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
            'windows phone', 'opera mini', 'iemobile'
        ];
        
        return mobileKeywords.some(keyword => userAgent.includes(keyword));
    }

    /**
     * 초기화
     */
    init() {
        this.applyPCStyles();
        this.addResponsiveClasses();
        this.fixViewport();
        this.bindEvents();
        
        console.log(`PCMobileFix: ${this.isPC ? 'PC' : 'Mobile'} 환경으로 감지됨`);
    }

    /**
     * PC 스타일 적용
     */
    applyPCStyles() {
        if (this.isPC) {
            document.documentElement.classList.add('pc-mode');
            document.documentElement.classList.remove('mobile-mode');
            
            // PC 전용 스타일 강제 적용
            this.forcePCStyles();
        } else {
            document.documentElement.classList.add('mobile-mode');
            document.documentElement.classList.remove('pc-mode');
        }
    }

    /**
     * PC 스타일 강제 적용
     */
    forcePCStyles() {
        const style = document.createElement('style');
        style.id = 'pc-force-styles';
        style.textContent = `
            /* PC 모드 강제 스타일 */
            .pc-mode .container {
                max-width: 1400px !important;
                margin: 0 auto !important;
                padding: 0 2rem !important;
            }
            
            .pc-mode .grid--2 { 
                grid-template-columns: repeat(2, 1fr) !important; 
            }
            .pc-mode .grid--3 { 
                grid-template-columns: repeat(3, 1fr) !important; 
            }
            .pc-mode .grid--4 { 
                grid-template-columns: repeat(4, 1fr) !important; 
            }
            .pc-mode .grid--5 { 
                grid-template-columns: repeat(5, 1fr) !important; 
            }
            .pc-mode .grid--6 { 
                grid-template-columns: repeat(6, 1fr) !important; 
            }
            
            .pc-mode .nav {
                flex-direction: row !important;
                gap: 2rem !important;
            }
            
            .pc-mode .nav__item {
                padding: 0.5rem 1rem !important;
            }
            
            .pc-mode .card {
                margin: 1rem !important;
                padding: 1.5rem !important;
            }
            
            .pc-mode .btn {
                min-height: 44px !important;
                width: auto !important;
            }
            
            .pc-mode .modal {
                max-width: 600px !important;
                margin: 2rem auto !important;
            }
            
            /* PC에서 모바일 전용 요소 숨김 */
            .pc-mode .mobile-only {
                display: none !important;
            }
            
            /* PC 전용 요소 표시 */
            .pc-mode .pc-only {
                display: block !important;
            }
        `;
        
        // 기존 스타일이 있으면 제거
        const existingStyle = document.getElementById('pc-force-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
    }

    /**
     * 반응형 클래스 추가
     */
    addResponsiveClasses() {
        const body = document.body;
        
        if (this.isPC) {
            body.classList.add('pc-layout');
            body.classList.remove('mobile-layout');
        } else {
            body.classList.add('mobile-layout');
            body.classList.remove('pc-layout');
        }
        
        // 화면 크기에 따른 클래스 추가
        this.addScreenSizeClasses();
    }

    /**
     * 화면 크기별 클래스 추가
     */
    addScreenSizeClasses() {
        const width = window.innerWidth;
        const body = document.body;
        
        // 기존 화면 크기 클래스 제거
        body.classList.remove('screen-xs', 'screen-sm', 'screen-md', 'screen-lg', 'screen-xl', 'screen-2xl');
        
        // 새로운 화면 크기 클래스 추가
        if (width < 640) {
            body.classList.add('screen-xs');
        } else if (width < 768) {
            body.classList.add('screen-sm');
        } else if (width < 1024) {
            body.classList.add('screen-md');
        } else if (width < 1280) {
            body.classList.add('screen-lg');
        } else if (width < 1920) {
            body.classList.add('screen-xl');
        } else {
            body.classList.add('screen-2xl');
        }
    }

    /**
     * 뷰포트 수정
     */
    fixViewport() {
        if (this.isPC) {
            // PC에서는 뷰포트를 고정하여 모바일 스타일이 적용되지 않도록 함
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=1400, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
            }
        }
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 화면 크기 변경 감지
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // 페이지 로드 완료 후 추가 스타일 적용
        window.addEventListener('load', () => {
            this.applyPostLoadStyles();
        });
        
        // DOM 변경 감지
        this.observeDOMChanges();
    }

    /**
     * 리사이즈 처리
     */
    handleResize() {
        const wasPC = this.isPC;
        this.isPC = this.checkIsPC();
        
        if (wasPC !== this.isPC) {
            this.applyPCStyles();
            this.addResponsiveClasses();
            this.fixViewport();
        }
        
        this.addScreenSizeClasses();
    }

    /**
     * 페이지 로드 후 스타일 적용
     */
    applyPostLoadStyles() {
        if (this.isPC) {
            // PC에서 추가로 적용할 스타일
            this.applyAdditionalPCStyles();
        }
    }

    /**
     * 추가 PC 스타일 적용
     */
    applyAdditionalPCStyles() {
        const style = document.createElement('style');
        style.id = 'pc-additional-styles';
        style.textContent = `
            /* PC 추가 스타일 */
            .pc-mode .section {
                padding: 3rem 0 !important;
            }
            
            .pc-mode .hero {
                padding: 4rem 0 !important;
            }
            
            .pc-mode .grid {
                gap: 2rem !important;
            }
            
            .pc-mode .card:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
            }
            
            .pc-mode .btn:hover {
                transform: translateY(-2px) !important;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2) !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * DOM 변경 감지
     */
    observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 새로운 요소가 추가되면 PC 스타일 적용
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.applyStylesToElement(node);
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

    /**
     * 특정 요소에 스타일 적용
     */
    applyStylesToElement(element) {
        if (this.isPC && element.classList) {
            // PC에서 그리드 요소 스타일 적용
            if (element.classList.contains('grid')) {
                element.style.display = 'grid';
                element.style.gap = '2rem';
            }
            
            // PC에서 컨테이너 스타일 적용
            if (element.classList.contains('container')) {
                element.style.maxWidth = '1400px';
                element.style.margin = '0 auto';
                element.style.padding = '0 2rem';
            }
        }
    }

    /**
     * 디바운스 함수
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * PC 모드 강제 활성화
     */
    forcePCMode() {
        this.isPC = true;
        this.applyPCStyles();
        this.addResponsiveClasses();
        this.fixViewport();
        console.log('PCMobileFix: PC 모드 강제 활성화됨');
    }

    /**
     * 모바일 모드 강제 활성화
     */
    forceMobileMode() {
        this.isPC = false;
        this.applyPCStyles();
        this.addResponsiveClasses();
        this.fixViewport();
        console.log('PCMobileFix: 모바일 모드 강제 활성화됨');
    }

    /**
     * 현재 상태 정보 반환
     */
    getStatus() {
        return {
            isPC: this.isPC,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
        };
    }
}

// 전역 객체로 등록
window.PCMobileFix = PCMobileFix;

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.pcMobileFix = new PCMobileFix();
});

// 즉시 실행 (DOM이 로드되기 전에도 작동)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pcMobileFix = new PCMobileFix();
    });
} else {
    window.pcMobileFix = new PCMobileFix();
}
