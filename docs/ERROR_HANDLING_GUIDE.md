# AI Curator 에러 처리 표준화 가이드

## 개요

이 문서는 AI Curator 프로젝트에서 일관된 에러 처리 패턴을 구현하기 위한 가이드입니다.

## 핵심 원칙

1. **일관성**: 모든 에러는 동일한 방식으로 처리
2. **사용자 친화적**: 기술적 에러를 이해하기 쉬운 메시지로 변환
3. **로깅**: 개발자를 위한 상세한 에러 정보 수집
4. **복구**: 가능한 경우 사용자가 에러를 해결할 수 있는 방법 제시

## CommonUtils 에러 처리 함수들

### 1. handleError(error, context, showUserMessage)

기본적인 에러 처리 함수입니다.

```javascript
try {
    // 위험한 작업
    await someAsyncOperation();
} catch (error) {
    window.CommonUtils.handleError(error, '사용자 인증', true);
}
```

**매개변수:**
- `error`: 에러 객체
- `context`: 에러가 발생한 컨텍스트 (예: '인증', '데이터 로드', '파일 업로드')
- `showUserMessage`: 사용자에게 에러 메시지를 표시할지 여부 (기본값: true)

### 2. getUserFriendlyErrorMessage(error, context)

에러를 사용자 친화적인 메시지로 변환합니다.

```javascript
const userMessage = window.CommonUtils.getUserFriendlyErrorMessage(error, 'auth');
```

### 3. asyncWrapper(asyncFn, context, showUserMessage)

비동기 함수를 자동으로 에러 처리로 래핑합니다.

```javascript
const safeAsyncFunction = window.CommonUtils.asyncWrapper(
    async function() { /* 원본 함수 */ },
    '데이터 처리'
);

// 사용
await safeAsyncFunction();
```

### 4. handlePromiseError(promise, context, showUserMessage)

Promise의 에러를 자동으로 처리합니다.

```javascript
const safePromise = window.CommonUtils.handlePromiseError(
    fetch('/api/data'),
    'API 호출'
);
```

## 에러 처리 패턴 예시

### 기본 패턴

```javascript
// ❌ 이전 방식
try {
    const result = await someOperation();
} catch (error) {
    console.error('에러 발생:', error);
    alert('오류가 발생했습니다.');
}

// ✅ 새로운 표준 방식
try {
    const result = await someOperation();
} catch (error) {
    window.CommonUtils.handleError(error, '작업 실행');
}
```

### Firebase 인증 에러 처리

```javascript
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        // CommonUtils가 자동으로 사용자 친화적 메시지 생성
        window.CommonUtils.handleError(error, '사용자 로그인');
        throw error; // 상위에서 추가 처리 가능
    }
}
```

### 폼 검증 에러 처리

```javascript
function validateForm(formData) {
    const errors = [];
    
    if (!formData.email) {
        errors.push('이메일을 입력해주세요.');
        window.CommonUtils.handleValidationError(
            document.getElementById('email'),
            '이메일을 입력해주세요.'
        );
    }
    
    if (errors.length > 0) {
        // 에러 요약 표시
        showErrorSummary(errors);
        return false;
    }
    
    return true;
}
```

## 에러 컨텍스트 정의

일관된 에러 추적을 위해 다음 컨텍스트들을 사용합니다:

- `auth`: 인증 관련 에러
- `database`: 데이터베이스 관련 에러
- `storage`: 파일 저장소 관련 에러
- `network`: 네트워크 관련 에러
- `validation`: 입력 검증 에러
- `ui`: 사용자 인터페이스 관련 에러
- `api`: 외부 API 호출 에러

## 에러 메시지 스타일 가이드

### 에러 메시지 작성 원칙

1. **사용자 중심**: 기술적 용어 대신 사용자가 이해할 수 있는 언어 사용
2. **구체적**: 무엇이 잘못되었는지 명확하게 설명
3. **해결 방법 제시**: 가능한 경우 사용자가 취할 수 있는 조치 안내
4. **친근한 톤**: 공격적이지 않고 도움이 되는 톤 유지

### 좋은 에러 메시지 예시

- ✅ "비밀번호가 올바르지 않습니다. 다시 확인해주세요."
- ✅ "네트워크 연결을 확인하고 다시 시도해주세요."
- ✅ "파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요."

### 피해야 할 에러 메시지 예시

- ❌ "Error 500: Internal Server Error"
- ❌ "Something went wrong"
- ❌ "Unknown error occurred"

## 에러 로깅 및 모니터링

### 개발 환경에서의 에러 정보

개발 환경(localhost)에서는 다음과 같은 상세 정보가 콘솔에 표시됩니다:

```javascript
🚨 에러 상세 정보
┌─────────────────┬─────────────────────────────────────┐
│ timestamp       │ 2024-01-15T10:30:45.123Z          │
│ context         │ 사용자 로그인                       │
│ message         │ Firebase: Error (auth/user-not-found) │
│ code            │ auth/user-not-found                 │
│ url             │ http://localhost:3000/login        │
│ userAgent       │ Mozilla/5.0...                     │
└─────────────────┴─────────────────────────────────────┘
```

### 에러 통계 수집

에러 발생 빈도와 패턴을 추적하기 위해 에러 통계가 자동으로 수집됩니다:

```javascript
// 에러 통계 확인
const errorStats = window.CommonUtils.storage.get('errorStats');
console.log('에러 통계:', errorStats);
```

## 마이그레이션 체크리스트

기존 코드를 새로운 에러 처리 방식으로 변경할 때 확인할 사항:

- [ ] `console.error` → `window.CommonUtils.handleError` 변경
- [ ] `alert` → `window.CommonUtils.showError` 변경
- [ ] 에러 컨텍스트 추가
- [ ] 사용자 친화적 에러 메시지 확인
- [ ] 에러 복구 로직 추가 검토

## 문제 해결

### CommonUtils가 정의되지 않은 경우

```javascript
// CommonUtils 로드 확인
if (window.CommonUtils) {
    window.CommonUtils.handleError(error, '컨텍스트');
} else {
    // 폴백 처리
    console.error('에러 발생:', error);
}
```

### 에러 메시지가 표시되지 않는 경우

1. `common.js` 파일이 HTML에 포함되어 있는지 확인
2. `common.css` 파일이 HTML에 포함되어 있는지 확인
3. 브라우저 콘솔에서 JavaScript 에러 확인

## 추가 리소스

- [Firebase 에러 코드 참조](https://firebase.google.com/docs/auth/admin/errors)
- [사용자 경험 디자인 가이드](https://www.nngroup.com/articles/error-message-guidelines/)
- [JavaScript 에러 처리 모범 사례](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
