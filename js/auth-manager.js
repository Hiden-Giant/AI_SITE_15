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

            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app); // Firestore로 변경

            // 세션 지속성 설정
            await setPersistence(this.auth, browserLocalPersistence);
            console.log('세션 지속성 설정 완료');

            // 전역 변수로 등록
            window.auth = this.auth;
            window.app = this.app;
            window.db = this.db; // Firestore 인스턴스

            // 인증 상태 감지
            onAuthStateChanged(this.auth, async (user) => {
                console.log('인증 상태 변경:', user ? '로그인됨' : '로그아웃됨');
                if (window.updateHeaderAuthUI) {
                    window.updateHeaderAuthUI(user);
                }
            });

            this.isInitialized = true;
            console.log('AuthManager 초기화 완료 - Firebase 상태:', {
                app: !!this.app,
                auth: !!this.auth,
                db: !!this.db,
                isInitialized: this.isInitialized
            });

            // 초기화 완료 이벤트 발생 (단일 진입점 이벤트)
            window.dispatchEvent(new CustomEvent('authManagerReady'));

            // 하위 호환: firebaseInitialized 이벤트도 함께 디스패치
            try {
                window.dispatchEvent(new CustomEvent('firebaseInitialized', {
                    detail: { app: this.app, db: this.db, auth: this.auth }
                }));
            } catch (e) {
                // no-op
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
    // 
    // 🔧 Firebase 도메인 인증 문제 해결 방법:
    // 1. Firebase 콘솔 (https://console.firebase.google.com) 접속
    // 2. 프로젝트 선택 → Authentication → Settings
    // 3. "Authorized domains" 탭에서 현재 도메인 추가:
    //    - ai-site-15.vercel.app
    //    - localhost (개발용)
    // 4. 변경사항 저장 후 몇 분 대기
    //
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
            
            // 팝업 차단 확인
            const popup = window.open('', '_blank', 'width=500,height=600');
            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
                return;
            }
            popup.close();

            const result = await signInWithPopup(this.auth, provider);
            console.log('Google 로그인 성공:', result.user);
            await this.handleSuccessfulAuth(result.user);
            
        } catch (error) {
            console.error('Google 로그인 실패:', error);
            
            let errorMessage = 'Google 로그인에 실패했습니다.';
            let showAlternative = false;
            
            if (error.code === 'auth/unauthorized-domain') {
                errorMessage = '현재 도메인에서 Google 로그인이 허용되지 않습니다.\n\n' +
                             '관리자에게 문의하거나 이메일/비밀번호로 로그인해주세요.';
                showAlternative = true;
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = '팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                errorMessage = '로그인이 취소되었습니다.';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = '이미 다른 방법으로 가입된 계정입니다.';
            }
            
            // 오류 메시지 표시
            alert(errorMessage);
            
            // 대안 로그인 방법 안내
            if (showAlternative) {
                console.log('Google 로그인 대신 이메일 로그인을 사용하세요.');
            }
            
            if (window.CommonUtils) {
                window.CommonUtils.handleError(error, 'Google 소셜 로그인');
            }
            
            throw error;
        }
    }

    // 이메일 회원가입
    async handleEmailSignup(fullName, email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // 사용자 프로필 업데이트
            await updateProfile(user, {
                displayName: fullName
            });

            // Firestore에 회원 정보 저장
            const firestore = getFirestore(this.app);
            const custNo = Date.now(); // 고유번호 생성(타임스탬프)

            await setDoc(doc(firestore, "users", user.uid), {
                custNo: custNo,
                email: email,
                name: fullName,
                country: "KR",
                language: "ko",
                memberType: "basic",
                marketingConsent: true,
                registeredDate: new Date(),
            });

            await this.handleSuccessfulAuth(user);
        } catch (error) {
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
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            await this.handleSuccessfulAuth(userCredential.user);
        } catch (error) {
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
        console.log("로그인 성공 처리 시작", user.uid);
        
        try {
            // 성공 메시지 먼저 표시
            alert('로그인에 성공했습니다!');
            
            // UI 업데이트
            if (window.updateHeaderAuthUI) {
                window.updateHeaderAuthUI(user);
            }
            
            // 즉시 모달 닫기
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
    }
};

window.handleEmailLogin = function(email, password) {
    if (window.authManager) {
        return window.authManager.handleEmailLogin(email, password);
    }
};

window.handleEmailSignup = function(fullName, email, password) {
    if (window.authManager) {
        return window.authManager.handleEmailSignup(fullName, email, password);
    }
};

window.handleLogout = function() {
    if (window.authManager) {
        return window.authManager.handleLogout();
    }
};

// AuthManager 인스턴스 생성 및 전역 등록
const authManager = new AuthManager();
window.authManager = authManager;

export default authManager; 