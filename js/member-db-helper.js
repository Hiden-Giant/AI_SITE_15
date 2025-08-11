import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { memberDbConfig } from '../config.js';

// 별도 app 인스턴스 생성 (중복 방지)
function getMemberApp() {
  const appName = 'memberApp';
  const exist = getApps().find(app => app.name === appName);
  if (exist) return exist;
  return initializeApp(memberDbConfig, appName);
}

// 회원번호 생성 (5자리 고정 + 7자리 랜덤)
function generateMemberNo() {
  const fixed = "24879";
  let random = "";
  for (let i = 0; i < 7; i++) random += Math.floor(Math.random() * 10);
  return fixed + random;
}

// Firestore 기반으로 회원 정보 저장 로직을 리팩토링하거나, 필요 없다면 함수 전체를 주석처리/삭제
// 회원 DB에 회원번호 중복 체크 및 저장
export async function ensureMemberDbEntry(user) {
  try {
    console.log('[ensureMemberDbEntry] called', user);
    if (!user || !user.email) return;

    const memberApp = getMemberApp();
    // const memberDb = getDatabase(memberApp); // Firestore 사용 시 필요 없음

    // 모든 회원 데이터 조회
    // const membersRef = ref(memberDb, "/"); // Firestore 사용 시 필요 없음
    // const snapshot = await get(membersRef); // Firestore 사용 시 필요 없음
    // let members = snapshot.exists() ? snapshot.val() : {}; // Firestore 사용 시 필요 없음

    // 이미 등록된 이메일이 있으면 아무것도 하지 않음
    // for (const [key, value] of Object.entries(members)) { // Firestore 사용 시 필요 없음
    //   if (value.email === user.email) return; // Firestore 사용 시 필요 없음
    // } // Firestore 사용 시 필요 없음

    // 중복 없는 회원번호 생성
    // let newMemberNo, isUnique = false; // Firestore 사용 시 필요 없음
    // while (!isUnique) { // Firestore 사용 시 필요 없음
    //   newMemberNo = generateMemberNo(); // Firestore 사용 시 필요 없음
    //   if (!members[newMemberNo]) isUnique = true; // Firestore 사용 시 필요 없음
    // } // Firestore 사용 시 필요 없음

    // 회원 정보 저장
    // await set(ref(memberDb, newMemberNo), { // Firestore 사용 시 필요 없음
    //   company_name: user.displayName || "", // Firestore 사용 시 필요 없음
    //   company_url: "", // Firestore 사용 시 필요 없음
    //   cust_no: newMemberNo, // Firestore 사용 시 필요 없음
    //   email: user.email, // Firestore 사용 시 필요 없음
    //   id: user.email, // Firestore 사용 시 필요 없음
    //   member_type: "basic", // Firestore 사용 시 필요 없음
    //   name: user.displayName || user.email.split("@")[0], // Firestore 사용 시 필요 없음
    //   registered_date: new Date().toISOString().replace("T", " ").substring(0, 19) // Firestore 사용 시 필요 없음
    // }); // Firestore 사용 시 필요 없음
  } catch (e) {
    console.error('[ensureMemberDbEntry] error:', e);
  }
} 