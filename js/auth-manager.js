// 공통 인증 관리 모듈
import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
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
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
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
            // Firebase 앱이 이미 초기화되었는지 확인
            try {
                this.app = getApp();
            } catch {
                this.app = initializeApp(firebaseConfig);
            }

            this.auth = getAuth(this.app);
            this.db = getFirestore(this.app); // Firestore로 변경

            // 세션 지속성 설정
            await setPersistence(this.auth, browserLocalPersistence);

            // 전역 변수로 등록
            window.auth = this.auth;
            window.app = this.app;
            window.db = this.db; // Firestore 인스턴스

            // 인증 상태 감지
            onAuthStateChanged(this.auth, async (user) => {
                if (window.updateHeaderAuthUI) {
                    window.updateHeaderAuthUI(user);
                }
            });

            this.isInitialized = true;
            console.log('AuthManager 초기화 완료');

            // 초기화 완료 이벤트 발생
            window.dispatchEvent(new CustomEvent('authManagerReady'));

        } catch (error) {
            console.error('AuthManager 초기화 실패:', error);
        }
    }

    // Google 소셜 로그인
    async handleSocialLogin(providerName) {
        if (providerName !== 'google') return;

        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const result = await signInWithPopup(this.auth, provider);
            await this.handleSuccessfulAuth(result.user);
        } catch (error) {
            console.error('소셜 로그인 실패:', error);
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
            console.error('이메일 회원가입 실패:', error);
            throw error;
        }
    }

    // 이메일 로그인
    async handleEmailLogin(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            await this.handleSuccessfulAuth(userCredential.user);
        } catch (error) {
            console.error('이메일 로그인 실패:', error);
            throw error;
        }
    }

    // 로그아웃
    async handleLogout() {
        try {
            await signOut(this.auth);
            console.log('로그아웃 성공');
        } catch (error) {
            console.error('로그아웃 실패:', error);
            throw error;
        }
    }

    // 인증 성공 후 공통 처리
    async handleSuccessfulAuth(user) {
        console.log("로그인 성공 처리 시작", user.uid);
        
        try {
            // UI 업데이트
            if (window.updateHeaderAuthUI) {
                window.updateHeaderAuthUI(user);
            }
            
            // 모달 닫기
            const loginModal = document.getElementById('loginModal');
            const signupModal = document.getElementById('signupModal');
            if (loginModal) loginModal.classList.remove('show');
            if (signupModal) signupModal.classList.remove('show');
            
            // Firestore 저장 로직만 유지 (필요시)
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