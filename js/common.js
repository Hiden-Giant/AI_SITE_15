/* ===== AI Curator 공통 JavaScript 파일 ===== */
/* 이 파일은 모든 HTML 페이지에서 공통으로 사용됩니다 */

// 전역 유틸리티 함수들
window.CommonUtils = {
    // 로딩 상태 관리
    showLoading: function(message = '로딩 중...') {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            const loadingText = spinner.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            spinner.classList.add('active');
        }
    },

    hideLoading: function() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('active');
        }
    },

    // 에러 메시지 표시
    showError: function(message, duration = 5000) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('active');
            
            // 자동으로 사라짐
            setTimeout(() => {
                errorElement.classList.remove('active');
            }, duration);
        }
    },

    // 성공 메시지 표시
    showSuccess: function(message, duration = 3000) {
        const successElement = document.getElementById('successMessage');
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.add('active');
            
            setTimeout(() => {
                successElement.classList.remove('active');
            }, duration);
        }
    },

    // 경고 메시지 표시
    showWarning: function(message, duration = 4000) {
        const warningElement = document.getElementById('warningMessage');
        if (warningElement) {
            warningElement.textContent = message;
            warningElement.classList.add('active');
            
            setTimeout(() => {
                warningElement.classList.remove('active');
            }, duration);
        }
    },

    // 입력 검증
    validateInput: function(input, rules = {}) {
        const value = input.value.trim();
        const errors = [];

        if (rules.required && !value) {
            errors.push('필수 입력 항목입니다.');
        }

        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`최소 ${rules.minLength}자 이상 입력해주세요.`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`최대 ${rules.maxLength}자까지 입력 가능합니다.`);
        }

        if (rules.email && !this.isValidEmail(value)) {
            errors.push('올바른 이메일 형식이 아닙니다.');
        }

        if (rules.url && !this.isValidUrl(value)) {
            errors.push('올바른 URL 형식이 아닙니다.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // 이메일 검증
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // URL 검증
    isValidUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // 디바운스 함수
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 스로틀 함수
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // 로컬 스토리지 유틸리티
    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('로컬 스토리지 저장 실패:', e);
                return false;
            }
        },

        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('로컬 스토리지 읽기 실패:', e);
                return defaultValue;
            }
        },

        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('로컬 스토리지 삭제 실패:', e);
                return false;
            }
        }
    },

    // 세션 스토리지 유틸리티
    sessionStorage: {
        set: function(key, value) {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('세션 스토리지 저장 실패:', e);
                return false;
            }
        },

        get: function(key, defaultValue = null) {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('세션 스토리지 읽기 실패:', e);
                return defaultValue;
            }
        },

        remove: function(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('세션 스토리지 삭제 실패:', e);
                return false;
            }
        }
    },

    // 날짜 포맷팅
    formatDate: function(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    // 숫자 포맷팅
    formatNumber: function(num, options = {}) {
        const defaults = {
            decimals: 2,
            thousandsSeparator: ',',
            decimalSeparator: '.'
        };
        const opts = { ...defaults, ...options };

        return Number(num).toLocaleString('ko-KR', {
            minimumFractionDigits: opts.decimals,
            maximumFractionDigits: opts.decimals
        });
    },

    // 파일 크기 포맷팅
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 모바일 디바이스 감지
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // 터치 디바이스 감지
    isTouchDevice: function() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    // 스크롤 위치 감지
    getScrollPosition: function() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    },

    // 스크롤을 맨 위로
    scrollToTop: function(behavior = 'smooth') {
        window.scrollTo({
            top: 0,
            behavior: behavior
        });
    },

    // 요소가 화면에 보이는지 확인
    isElementInViewport: function(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientHeight)
        );
    },

    // ===== 에러 처리 표준화 =====
    
    // 표준화된 에러 처리 함수
    handleError: function(error, context = '', showUserMessage = true) {
        // 에러 로깅
        console.error(`[${context}] 에러 발생:`, error);
        
        // 사용자에게 에러 메시지 표시
        if (showUserMessage) {
            const userMessage = this.getUserFriendlyErrorMessage(error, context);
            this.showError(userMessage);
        }
        
        // 에러 추적을 위한 추가 정보 수집
        this.logErrorDetails(error, context);
    },

    // 사용자 친화적 에러 메시지 생성
    getUserFriendlyErrorMessage: function(error, context = '') {
        // Firebase 관련 에러
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    return '등록되지 않은 사용자입니다.';
                case 'auth/wrong-password':
                    return '비밀번호가 올바르지 않습니다.';
                case 'auth/email-already-in-use':
                    return '이미 사용 중인 이메일입니다.';
                case 'auth/weak-password':
                    return '비밀번호가 너무 약합니다. (최소 6자)';
                case 'auth/invalid-email':
                    return '올바르지 않은 이메일 형식입니다.';
                case 'auth/too-many-requests':
                    return '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
                case 'auth/network-request-failed':
                    return '네트워크 연결을 확인해주세요.';
                case 'permission-denied':
                    return '권한이 없습니다.';
                case 'unavailable':
                    return '서비스가 일시적으로 사용할 수 없습니다.';
                case 'not-found':
                    return '요청한 데이터를 찾을 수 없습니다.';
                default:
                    return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }
        }
        
        // 일반적인 에러 메시지
        if (error.message) {
            const message = error.message.toLowerCase();
            if (message.includes('network') || message.includes('fetch')) {
                return '네트워크 연결을 확인해주세요.';
            }
            if (message.includes('timeout')) {
                return '요청 시간이 초과되었습니다.';
            }
            if (message.includes('permission') || message.includes('unauthorized')) {
                return '권한이 없습니다.';
            }
        }
        
        // 컨텍스트별 기본 메시지
        const contextMessages = {
            'auth': '인증 중 오류가 발생했습니다.',
            'database': '데이터를 불러오는 중 오류가 발생했습니다.',
            'storage': '파일 업로드 중 오류가 발생했습니다.',
            'network': '네트워크 오류가 발생했습니다.',
            'validation': '입력 정보를 확인해주세요.',
            'default': '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        };
        
        return contextMessages[context] || contextMessages.default;
    },

    // 에러 상세 정보 로깅
    logErrorDetails: function(error, context = '') {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            context: context,
            message: error.message || '알 수 없는 오류',
            stack: error.stack,
            code: error.code,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // 개발 환경에서만 상세 로깅
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.group('🚨 에러 상세 정보');
            console.table(errorInfo);
            console.groupEnd();
        }
        
        // 에러 통계 수집 (선택적)
        this.collectErrorStats(context, error.code);
    },

    // 에러 통계 수집
    collectErrorStats: function(context, errorCode) {
        try {
            const stats = this.storage.get('errorStats', {});
            const key = `${context}_${errorCode || 'unknown'}`;
            stats[key] = (stats[key] || 0) + 1;
            stats.lastUpdated = new Date().toISOString();
            this.storage.set('errorStats', stats);
        } catch (e) {
            // 에러 통계 수집 실패는 무시
        }
    },

    // 비동기 함수 래퍼 (에러 처리 자동화)
    asyncWrapper: function(asyncFn, context = '', showUserMessage = true) {
        return async function(...args) {
            try {
                return await asyncFn.apply(this, args);
            } catch (error) {
                this.handleError(error, context, showUserMessage);
                throw error; // 상위에서 처리할 수 있도록 에러 재발생
            }
        }.bind(this);
    },

    // Promise 에러 처리 래퍼
    handlePromiseError: function(promise, context = '', showUserMessage = true) {
        return promise.catch(error => {
            this.handleError(error, context, showUserMessage);
            throw error;
        });
    },

    // 폼 검증 에러 처리
    handleValidationError: function(field, message) {
        // 필드에 에러 스타일 적용
        field.classList.add('error');
        
        // 에러 메시지 표시
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        // 필드에 포커스
        field.focus();
        
        // 사용자에게 알림
        this.showWarning(message);
    },

    // 폼 에러 스타일 제거
    clearValidationError: function(field) {
        field.classList.remove('error');
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = 'none';
        }
    }
};

// 페이지 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('CommonUtils 로드 완료');
    
    // 성공/경고 메시지 요소가 없으면 생성
    if (!document.getElementById('successMessage')) {
        const successMsg = document.createElement('div');
        successMsg.id = 'successMessage';
        successMsg.className = 'success-message';
        successMsg.setAttribute('role', 'alert');
        successMsg.setAttribute('aria-live', 'polite');
        document.body.appendChild(successMsg);
    }

    if (!document.getElementById('warningMessage')) {
        const warningMsg = document.createElement('div');
        warningMsg.id = 'warningMessage';
        warningMsg.className = 'warning-message';
        warningMsg.setAttribute('role', 'alert');
        warningMsg.setAttribute('aria-live', 'polite');
        document.body.appendChild(warningMsg);
    }
});

// 전역 에러 핸들러
window.addEventListener('error', function(e) {
    console.error('전역 에러 발생:', e.error);
    if (window.CommonUtils) {
        window.CommonUtils.showError('예상치 못한 오류가 발생했습니다.');
    }
});

// Promise 에러 핸들러
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promise 에러 발생:', e.reason);
    if (window.CommonUtils) {
        window.CommonUtils.showError('비동기 작업 중 오류가 발생했습니다.');
    }
});
