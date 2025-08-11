// Firestore 기반 즐겨찾기/회원 처리로 전환된 이후, 이 파일은 더 이상 RTDB를 사용하지 않습니다.
// 남아있는 전역 호출 호환을 위해 Firestore로 동작하도록 최소 구현만 제공합니다.

async function initMemberAndFavoriteTracking() {
  try {
    const auth = window.auth;
    if (!auth) return;
    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
    onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      // Firestore에 회원 도큐먼트 존재 보장 (users/{uid})
      try {
        const db = window.db;
        const { doc, setDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const userDocRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          await setDoc(userDocRef, { email: user.email || '', created_at: new Date().toISOString() });
        }
      } catch (e) {
        console.error('회원 정보 보장 실패:', e);
      }
    });
  } catch (e) {
    console.error('initMemberAndFavoriteTracking 오류:', e);
  }
}

async function saveFavoriteTool(toolId) {
  try {
    const auth = window.auth;
    const db = window.db;
    if (!auth?.currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const favRef = doc(db, 'users', auth.currentUser.uid, 'favorites', toolId);
    await setDoc(favRef, { savedAt: new Date().toISOString() }, { merge: true });
    console.log('즐겨찾기 저장 완료:', toolId);
  } catch (e) {
    console.error('즐겨찾기 저장 실패:', e);
  }
}

window.initMemberAndFavoriteTracking = initMemberAndFavoriteTracking;
window.saveFavoriteTool = saveFavoriteTool;

