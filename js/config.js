// Firebase 구성
export const firebaseConfig = {
  apiKey: "AIzaSyDXx5T26Q_nXeIthajrVYAa0iznbUwFcUs",
  authDomain: "ai-site-15.vercel.app",
  projectId: "ai-tools-data-b2b7b",
  storageBucket: "ai-tools-data-b2b7b.appspot.com",
  messagingSenderId: "689918528645",
  appId: "1:689918528645:web:ab332602ff388cfac52dec",
  databaseURL: "https://ai-tools-data-b2b7b-default-rtdb.firebaseio.com",
};

// Realtime Database 보안 규칙 설정 가이드
/*
{
  "rules": {
    ".read": "auth != null",  // 인증된 사용자만 읽기 가능
    ".write": "auth != null", // 인증된 사용자만 쓰기 가능
    "aiTools": {
      ".read": true,  // AI 도구 목록은 모든 사용자가 읽기 가능
      ".write": "auth != null && auth.token.admin === true" // 관리자만 쓰기 가능
    },
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",  // 자신의 데이터만 읽기 가능
        ".write": "$uid === auth.uid"   // 자신의 데이터만 쓰기 가능
      }
    }
  }
}
*/ 