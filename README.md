# soop-jooha

이주하 시그 검색기입니다. Vercel 배포와 Firebase Firestore 관리를 기준으로 구성되어 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

Firebase 환경변수가 없으면 기존 `list.json`을 읽는 기본 목록 모드로 실행됩니다.

## Vercel 설정

Vercel에서 GitHub 저장소를 가져온 뒤 프로젝트 이름을 `soop-jooha`로 지정하면 기본 주소는 다음과 같습니다.

```text
https://soop-jooha.vercel.app
```

Framework Preset은 Vite로 자동 감지됩니다.

## Firebase 환경변수

Vercel Project Settings > Environment Variables에 아래 값을 등록합니다.

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

값은 Firebase Console > Project settings > Your apps > Web app config에서 확인합니다.

## Firestore

데이터 컬렉션은 `signatures`입니다.

문서 필드:

```json
{
  "id": 100,
  "title": "whistle",
  "alias": ["휘슬"]
}
```

관리자 쓰기 권한은 `admins/{uid}` 문서가 있는 로그인 사용자에게만 허용합니다. 관리자 계정으로 한 번 로그인한 뒤 화면에 표시되는 UID를 Firebase Console에서 `admins` 컬렉션 문서 ID로 추가하세요.

Firestore Rules는 `firebase.rules`를 사용합니다.
