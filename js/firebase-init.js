// Firebase 초기화 및 인증 관리를 위한 중앙화된 모듈
import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup,
    signInWithRedirect,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    updateProfile,
    onAuthStateChanged,
    signOut,
    getRedirectResult
} from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';
import { ensureMemberDbEntry } from './member-db-helper.js';

// Firebase 앱 초기화
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log('Firebase 초기화 성공');
} catch (error) {
    if (error.code !== 'app/duplicate-app') {
        console.error('Firebase 초기화 오류:', error);
        throw error;
    }
    console.log('이미 초기화된 Firebase 앱 사용');
    app = getApp(); // 이미 초기화된 앱이 있다면 가져오기
}

// Auth 및 Firestore 인스턴스
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase 인증 객체를 window에 노출 (비모듈 스크립트에서 접근할 수 있도록)
window.auth = auth;
window.db = db;

// Google 제공자 설정
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// 인증 상태 변경 리스너 설정
export function initAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('사용자 로그인 상태:', user);
            updateUIForAuthState(user);
        } else {
            console.log('로그인된 사용자 없음');
            updateUIForAuthState(null);
        }
    });
}

// UI 업데이트 함수
function updateUIForAuthState(user) {
    const authButtons = document.getElementById('authButtons');
    const profileMenu = document.getElementById('profileMenu');
    const profileName = document.getElementById('profileName');
    const profileInitial = document.getElementById('profileInitial');

    if (user) {
        if (authButtons) authButtons.style.display = 'none';
        if (profileMenu) profileMenu.style.display = 'flex';
        if (profileName) profileName.textContent = user.displayName || user.email.split('@')[0];
        if (profileInitial) profileInitial.textContent = (user.displayName || user.email)[0].toUpperCase();
        console.log('[updateUIForAuthState] user:', user);
        ensureMemberDbEntry(user);
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (profileMenu) profileMenu.style.display = 'none';
    }
}

// 인증 성공 후 공통 처리 함수
async function handleSuccessfulAuth(user) {
    try {
        updateUIForAuthState(user);
        
        // 모달 닫기
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        if (loginModal) loginModal.classList.remove('show');
        if (signupModal) signupModal.classList.remove('show');
        
        console.log('인증 성공:', user);
    } catch (error) {
        console.error('인증 정보 저장 실패:', error);
    }
}

// 로그인 함수들
export async function handleEmailLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleSuccessfulAuth(userCredential.user);
    } catch (error) {
        console.error('이메일 로그인 실패:', error);
        throw error;
    }
}

export async function handleEmailSignup(fullName, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, {
            displayName: fullName
        });

        await handleSuccessfulAuth(user);
    } catch (error) {
        console.error('이메일 회원가입 실패:', error);
        throw error;
    }
}

export async function handleSocialLogin(provider) {
    try {
        if (provider !== 'google') {
            throw new Error('지원하지 않는 로그인 제공자입니다.');
        }
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error('Google 로그인 실패:', error);
        throw error;
    }
}

export async function handleLogout() {
    try {
        await signOut(auth);
        updateUIForAuthState(null);
        console.log('로그아웃 성공');
    } catch (error) {
        console.error('로그아웃 실패:', error);
        throw error;
    }
}

// 로그아웃 함수도 window에 노출
window.handleLogout = handleLogout;

// 현재 사용자 가져오기
export function getCurrentUser() {
    return auth.currentUser;
}

// Firebase 인증 및 로그인 유지 초기화 함수
export async function initializeFirebaseAuth() {
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            await handleSuccessfulAuth(result.user);
        }
    } catch (e) {}

    onAuthStateChanged(auth, (user) => {
        if (user) {
            updateUIForAuthState(user);
        } else {
            updateUIForAuthState(null);
        }
    });
}

// Firebase 인스턴스 내보내기
export { app, auth, db }; 