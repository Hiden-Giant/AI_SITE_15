// 공통 인증 관리 모듈
import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup,
    signInWithEmailAndPassword,
    GoogleAuthProvider, 
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';

class AuthManager {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('AuthManager 초기화 시작...');
            
            // Firebase 앱이 이미 초기화되었는지 확인
            try {
                this.app = getApp();
                console.log('기존 Firebase 앱 사용');
            } catch {
                console.log('새로운 Firebase 앱 초기화');
                this.app = initializeApp(firebaseConfig);
            }

            console.log('Firebase 앱 초기화 완료:', this.app);
            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app); // Firestore로 변경
            console.log('Firebase Auth 및 Firestore 초기화 완료');

            // 세션 지속성 설정
            await setPersistence(this.auth, browserLocalPersistence);
            console.log('세션 지속성 설정 완료');

            // 전역 변수로 등록
            window.auth = this.auth;
            window.app = this.app;
            window.db = this.db; // Firestore 인스턴스
            console.log('전역 변수 등록 완료');

            // 인증 상태 감지
            onAuthStateChanged(this.auth, async (user) => {
                console.log('=== 인증 상태 변경 감지 ===');
                console.log('사용자 정보:', user ? {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    emailVerified: user.emailVerified
                } : '로그아웃');
                
                if (window.updateHeaderAuthUI) {
                    console.log('updateHeaderAuthUI 함수 호출');
                    window.updateHeaderAuthUI(user);
                } else {
                    console.warn('updateHeaderAuthUI 함수가 정의되지 않았습니다.');
                }
                
                // 인증 상태를 localStorage에 저장
                if (user) {
                    localStorage.setItem('authUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName
                    }));
                    console.log('사용자 정보를 localStorage에 저장했습니다.');
                } else {
                    localStorage.removeItem('authUser');
                    console.log('localStorage에서 사용자 정보를 제거했습니다.');
                }
            });

            this.isInitialized = true;
            console.log('AuthManager 초기화 완료 - 모든 서비스 준비됨');

            // 초기화 완료 이벤트 발생 (단일 진입점 이벤트)
            window.dispatchEvent(new CustomEvent('authManagerReady'));
            console.log('authManagerReady 이벤트 발생');

            // 하위 호환: firebaseInitialized 이벤트도 함께 디스패치
            try {
                window.dispatchEvent(new CustomEvent('firebaseInitialized', {
                    detail: { app: this.app, db: this.db, auth: this.auth }
                }));
                console.log('firebaseInitialized 이벤트 발생');
            } catch (e) {
                console.log('firebaseInitialized 이벤트 발생 실패:', e);
            }

        } catch (error) {
            console.error('AuthManager 초기화 실패:', error);
            if (window.CommonUtils) {
                window.CommonUtils.handleError(error, 'AuthManager 초기화', false);
            } else {
                console.error('AuthManager 초기화 실패:', error);
            }
        }
    }

    // Google 소셜 로그인
    async handleSocialLogin(providerName) {
        if (providerName !== 'google') return;

        // Firebase가 초기화되었는지 확인
        if (!this.auth || !this.isInitialized) {
            console.error('Firebase가 아직 초기화되지 않았습니다.');
            alert('로그인 시스템을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            console.log('Google 로그인 시작...');
            
            const result = await signInWithPopup(this.auth, provider);
            console.log('Google 로그인 성공:', result.user);
            await this.handleSuccessfulAuth(result.user);
            
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            
            let errorMessage = 'Google 로그인에 실패했습니다.';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = '로그인이 취소되었습니다.';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = '이미 다른 방법으로 가입된 계정입니다.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = '네트워크 연결을 확인해주세요.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
            }
            
            if (window.CommonUtils) {
                window.CommonUtils.handleError(error, 'Google 소셜 로그인');
            } else {
                alert(errorMessage);
            }
            
            throw error;
        }
    }

    // 이메일 회원가입
    async handleEmailSignup(fullName, email, password) {
        try {
            console.log('=== handleEmailSignup 함수 시작 ===');
            console.log('회원가입 시도:', { fullName, email, password: '***' });
            console.log('Firebase Auth 상태:', { 
                auth: !!this.auth, 
                isInitialized: this.isInitialized 
            });
            
            // 입력값 검증 강화
            if (!fullName || typeof fullName !== 'string') {
                throw new Error('유효하지 않은 이름입니다.');
            }
            
            if (!email || typeof email !== 'string') {
                throw new Error('유효하지 않은 이메일 주소입니다.');
            }
            
            if (!password || typeof password !== 'string') {
                throw new Error('유효하지 않은 비밀번호입니다.');
            }
            
            // 이름 형식 검증
            if (fullName.trim().length < 2) {
                throw new Error('이름은 최소 2자 이상이어야 합니다.');
            }
            
            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                throw new Error('올바른 이메일 형식이 아닙니다.');
            }
            
            // 이메일 길이 검증
            if (email.trim().length > 254) {
                throw new Error('이메일 주소가 너무 깁니다.');
            }
            
            // 비밀번호 길이 검증
            if (password.length < 6) {
                throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
            }
            
            // 값 정리
            const cleanFullName = fullName.trim();
            const cleanEmail = email.trim();
            const cleanPassword = password;
            
            console.log('검증된 입력값:', { fullName: cleanFullName, email: cleanEmail, password: '***' });
            
            if (!this.auth || !this.isInitialized) {
                throw new Error('Firebase Auth가 초기화되지 않았습니다.');
            }
            
            console.log('Firebase Auth 초기화 확인됨, 회원가입 시도...');
            const userCredential = await createUserWithEmailAndPassword(this.auth, cleanEmail, cleanPassword);
            console.log('이메일 회원가입 성공:', userCredential.user);
            
            // 사용자 프로필 업데이트
            await updateProfile(userCredential.user, {
                displayName: cleanFullName
            });
            console.log('사용자 프로필 업데이트 완료');
            
            // Firestore에 사용자 정보 저장
            const userDoc = doc(this.db, 'users', userCredential.user.uid);
            await setDoc(userDoc, {
                uid: userCredential.user.uid,
                email: cleanEmail,
                displayName: cleanFullName,
                createdAt: new Date(),
                lastLoginAt: new Date(),
                isActive: true
            });
            console.log('Firestore 사용자 정보 저장 완료');

            await this.handleSuccessfulAuth(userCredential.user);
        } catch (error) {
            console.error('이메일 회원가입 실패 상세:', {
                code: error.code,
                message: error.message,
                email: email,
                authState: {
                    auth: !!this.auth,
                    isInitialized: this.isInitialized
                }
            });
            
            if (window.CommonUtils) {
                window.CommonUtils.handleError(error, '이메일 회원가입');
            } else {
                console.error('이메일 회원가입 실패:', error);
            }
            throw error;
        }
    }

    // 이메일 로그인
    async handleEmailLogin(email, password) {
        try {
            console.log('=== handleEmailLogin 함수 시작 ===');
            console.log('이메일 로그인 시도:', { email, password: '***' });
            console.log('Firebase Auth 상태:', { 
                auth: !!this.auth, 
                isInitialized: this.isInitialized,
                currentUser: this.auth?.currentUser 
            });
            console.log('signInWithEmailAndPassword 함수 확인:', typeof signInWithEmailAndPassword);
            
            // 입력값 검증 강화
            if (!email || typeof email !== 'string') {
                throw new Error('유효하지 않은 이메일 주소입니다.');
            }
            
            if (!password || typeof password !== 'string') {
                throw new Error('유효하지 않은 비밀번호입니다.');
            }
            
            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                throw new Error('올바른 이메일 형식이 아닙니다.');
            }
            
            // 이메일 길이 검증
            if (email.trim().length > 254) {
                throw new Error('이메일 주소가 너무 깁니다.');
            }
            
            // 비밀번호 길이 검증
            if (password.length < 6) {
                throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
            }
            
            // 값 정리
            const cleanEmail = email.trim();
            const cleanPassword = password;
            
            console.log('검증된 입력값:', { email: cleanEmail, password: '***' });
            
            if (!this.auth || !this.isInitialized) {
                throw new Error('Firebase Auth가 초기화되지 않았습니다.');
            }
            
            console.log('Firebase Auth 초기화 확인됨, 로그인 시도...');
            const userCredential = await signInWithEmailAndPassword(this.auth, cleanEmail, cleanPassword);
            console.log('이메일 로그인 성공:', userCredential.user);
            await this.handleSuccessfulAuth(userCredential.user);
            return userCredential.user;
        } catch (error) {
            console.error('=== 이메일 로그인 실패 상세 ===');
            console.error('오류 객체:', error);
            console.error('오류 코드:', error.code);
            console.error('오류 메시지:', error.message);
            console.error('오류 스택:', error.stack);
            console.error('이메일:', email);
            console.error('Auth 상태:', {
                auth: !!this.auth,
                isInitialized: this.isInitialized,
                authType: typeof this.auth
            });
            
            if (window.CommonUtils) {
                window.CommonUtils.handleError(error, '이메일 로그인');
            } else {
                console.error('이메일 로그인 실패:', error);
            }
            throw error;
        }
    }

    // 로그아웃
    async handleLogout() {
        try {
            await signOut(this.auth);
            console.log('로그아웃 성공');
        } catch (error) {
            if (window.CommonUtils) {
                window.CommonUtils.handleError(error, '로그아웃');
            } else {
                console.error('로그아웃 실패:', error);
            }
            throw error;
        }
    }

    // 인증 성공 후 공통 처리
    async handleSuccessfulAuth(user) {
        console.log("=== 로그인 성공 처리 시작 ===", user.uid);
        
        try {
            // UI 업데이트
            if (window.updateHeaderAuthUI) {
                console.log('updateHeaderAuthUI 함수 호출 시작');
                window.updateHeaderAuthUI(user);
                console.log('updateHeaderAuthUI 함수 호출 완료');
            } else {
                console.warn('updateHeaderAuthUI 함수가 정의되지 않았습니다.');
            }
            
            // 모달 완전히 닫기
            const loginModal = document.getElementById('loginModal');
            const signupModal = document.getElementById('signupModal');
            
            if (loginModal) {
                loginModal.classList.remove('show');
                loginModal.style.display = 'none';
                console.log('로그인 모달 닫기 완료');
            }
            if (signupModal) {
                signupModal.classList.remove('show');
                signupModal.style.display = 'none';
                console.log('회원가입 모달 닫기 완료');
            }
            
            // 성공 메시지 표시
            setTimeout(() => {
                alert('로그인에 성공했습니다!');
                console.log('로그인 성공 알림 표시 완료');
            }, 100);
            
            // 페이지 상태 확인
            setTimeout(() => {
                console.log('=== 로그인 후 페이지 상태 확인 ===');
                console.log('현재 인증 상태:', {
                    auth: !!window.auth,
                    currentUser: window.auth?.currentUser,
                    authManager: !!window.authManager,
                    isInitialized: window.authManager?.isInitialized
                });
                
                // 헤더 UI 상태 확인
                const authButtons = document.getElementById('authButtons');
                const profileMenu = document.getElementById('profileMenu');
                console.log('헤더 UI 상태:', {
                    authButtons: authButtons ? authButtons.style.display : 'not found',
                    profileMenu: profileMenu ? profileMenu.style.display : 'not found'
                });
            }, 500);
            
            console.log('인증 성공 처리 완료');
            
        } catch (error) {
            console.error('인증 성공 처리 중 오류:', error);
        }
    }

    // 에러 메시지 변환
    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return '이미 사용 중인 이메일 주소입니다.';
            case 'auth/invalid-email':
                return '유효하지 않은 이메일 주소입니다.';
            case 'auth/operation-not-allowed':
                return '이메일/비밀번호 로그인이 비활성화되어 있습니다.';
            case 'auth/weak-password':
                return '비밀번호가 너무 약합니다.';
            case 'auth/user-disabled':
                return '해당 계정이 비활성화되었습니다.';
            case 'auth/user-not-found':
                return '등록되지 않은 이메일 주소입니다.';
            case 'auth/wrong-password':
                return '잘못된 비밀번호입니다.';
            default:
                return '인증 중 오류가 발생했습니다.';
        }
    }
}

// 전역 함수들
window.handleSocialLogin = function(provider) {
    if (window.authManager) {
        return window.authManager.handleSocialLogin(provider);
    } else {
        // AuthManager가 아직 초기화되지 않은 경우 대기
        return new Promise((resolve, reject) => {
            window.addEventListener('authManagerReady', () => {
                if (window.authManager) {
                    resolve(window.authManager.handleSocialLogin(provider));
                } else {
                    reject(new Error('AuthManager 초기화 실패'));
                }
            }, { once: true });
        });
    }
};

window.handleEmailLogin = function(email, password) {
    if (window.authManager) {
        return window.authManager.handleEmailLogin(email, password);
    } else {
        return new Promise((resolve, reject) => {
            window.addEventListener('authManagerReady', () => {
                if (window.authManager) {
                    resolve(window.authManager.handleEmailLogin(email, password));
                } else {
                    reject(new Error('AuthManager 초기화 실패'));
                }
            }, { once: true });
        });
    }
};

window.handleEmailSignup = function(fullName, email, password) {
    if (window.authManager) {
        return window.authManager.handleEmailSignup(fullName, email, password);
    } else {
        return new Promise((resolve, reject) => {
            window.addEventListener('authManagerReady', () => {
                if (window.authManager) {
                    resolve(window.authManager.handleEmailSignup(fullName, email, password));
                } else {
                    reject(new Error('AuthManager 초기화 실패'));
                }
            }, { once: true });
        });
    }
};

window.handleLogout = function() {
    if (window.authManager) {
        return window.authManager.handleLogout();
    } else {
        return new Promise((resolve, reject) => {
            window.addEventListener('authManagerReady', () => {
                if (window.authManager) {
                    resolve(window.authManager.handleLogout());
                } else {
                    reject(new Error('AuthManager 초기화 실패'));
                }
            }, { once: true });
        });
    }
};

// 폼 제출 처리 함수들 (공통 모듈)
window.handleLoginFormSubmit = function(event) {
    event.preventDefault();
    console.log('=== 로그인 폼 제출 처리 시작 ===');
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!emailInput || !passwordInput) {
        console.error('입력 필드를 찾을 수 없습니다.');
        return false;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    console.log('폼에서 추출한 값:', { email, password: password ? '***' : '(비어있음)' });
    
    if (!email) {
        alert('이메일 주소를 입력해주세요.');
        emailInput.focus();
        return false;
    }
    
    if (!password) {
        alert('비밀번호를 입력해주세요.');
        passwordInput.focus();
        return false;
    }
    
    // AuthManager를 통한 로그인 시도
    if (window.handleEmailLogin) {
        console.log('handleEmailLogin 함수 호출:', { email, password: '***' });
        window.handleEmailLogin(email, password)
            .then(user => {
                console.log('로그인 성공:', user);
                // 모달 닫기
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.classList.remove('show');
                    loginModal.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('로그인 실패:', error);
                alert(error.message || '로그인에 실패했습니다.');
            });
    } else {
        console.error('handleEmailLogin 함수를 찾을 수 없습니다.');
        alert('로그인 시스템을 초기화할 수 없습니다.');
    }
    
    return false;
};

window.handleSignupSubmit = function(event) {
    event.preventDefault();
    console.log('=== 회원가입 폼 제출 처리 시작 ===');
    
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    
    if (!fullNameInput || !emailInput || !passwordInput) {
        console.error('회원가입 입력 필드를 찾을 수 없습니다.');
        return false;
    }
    
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('회원가입 폼 제출:', { fullName, email, password: '***' });
    
    // 입력값 검증
    if (!fullName) {
        alert('이름을 입력해주세요.');
        fullNameInput.focus();
        return false;
    }
    
    if (!email) {
        alert('이메일 주소를 입력해주세요.');
        emailInput.focus();
        return false;
    }
    
    if (!password) {
        alert('비밀번호를 입력해주세요.');
        passwordInput.focus();
        return false;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('올바른 이메일 형식을 입력해주세요.');
        emailInput.focus();
        return false;
    }
    
    // 비밀번호 길이 검증
    if (password.length < 6) {
        alert('비밀번호는 최소 6자 이상이어야 합니다.');
        passwordInput.focus();
        return false;
    }
    
    // 이름 길이 검증
    if (fullName.length < 2) {
        alert('이름은 최소 2자 이상이어야 합니다.');
        fullNameInput.focus();
        return false;
    }
    
    // AuthManager를 통한 회원가입 시도
    if (window.handleEmailSignup) {
        console.log('handleEmailSignup 함수 호출:', { fullName, email, password: '***' });
        window.handleEmailSignup(fullName, email, password)
            .then(user => {
                console.log('회원가입 성공:', user);
                // 모달 닫기
                const signupModal = document.getElementById('signupModal');
                if (signupModal) {
                    signupModal.classList.remove('show');
                    signupModal.style.display = 'none';
                }
                alert('회원가입에 성공했습니다!');
            })
            .catch(error => {
                console.error('회원가입 실패:', error);
                alert(error.message || '회원가입에 실패했습니다.');
            });
    } else {
        console.error('handleEmailSignup 함수를 찾을 수 없습니다.');
        alert('회원가입 시스템을 초기화할 수 없습니다.');
    }
    
    return false;
};

// 모달 관련 함수들 (공통 모듈)
window.showLoginModal = function() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'flex';
        loginModal.classList.add('show');
    }
};

window.showSignupModal = function() {
    const signupModal = document.getElementById('signupModal');
    if (signupModal) {
        signupModal.style.display = 'flex';
        signupModal.classList.add('show');
    }
};

window.closeLoginModal = function() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('show');
        loginModal.style.display = 'none';
    }
};

window.closeSignupModal = function() {
    const signupModal = document.getElementById('signupModal');
    if (signupModal) {
        signupModal.classList.remove('show');
        signupModal.style.display = 'none';
    }
};

// 비밀번호 표시/숨김 토글 (공통 모듈)
window.togglePasswordVisibility = function(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
};

// AuthManager 인스턴스 생성 및 전역 등록
const authManager = new AuthManager();
window.authManager = authManager;

export default authManager; 