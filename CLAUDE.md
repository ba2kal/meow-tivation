# Meow-tivation 🐱✨

## 프로젝트 개요

현대인들의 일상에 힐링과 동기부여를 제공하는 웹사이트입니다. 귀여운 고양이 캐릭터가 매일 새로운 명언과 함께 사용자를 응원합니다.

## 핵심 기능

### 1. 메인 페이지 (index.html)
- 귀여운 고양이 이미지 디스플레이
- "오늘의 명언" 버튼
- 심플하고 따뜻한 UI/UX

### 2. 결과 페이지 (result.html)
- AI가 생성한 귀여운 고양이 애니메이션 이미지
- 위인들의 명언 또는 책의 문장
- 공유 기능 (선택적)

### 3. AI 생성 프로세스
- n8n 워크플로우를 통한 통합
- 이미지 생성: AI 이미지 생성 모델 활용
- 명언 생성: GPT 기반 명언 큐레이션

## 기술 스택

### 프론트엔드
- HTML5
- CSS3 (애니메이션 및 반응형 디자인)
- JavaScript (ES6+)

### WAS 서버 (보안 계층)
- Vercel Serverless Functions (Node.js)
- Express-style API Routes
- Rate Limiting 미들웨어 (IP별 요청 제한)
- 환경변수 기반 보안 (API 키 보호)

### 백엔드/통합
- n8n (워크플로우 자동화)
- n8n Webhook (WAS 서버 ↔ AI 서비스 연동)

### AI 서비스
- 이미지 생성: DALL-E 3 / Stable Diffusion / Midjourney API
- 텍스트 생성: OpenAI GPT-4 / Claude API

## 프로젝트 구조

```
meow-tivation/
├── CLAUDE.md              # 프로젝트 문서
├── N8N_GUIDE.md          # n8n 워크플로우 구성 가이드
├── DEPLOYMENT.md         # 배포 가이드 (Vercel)
├── package.json          # Node.js 의존성 및 스크립트
├── vercel.json           # Vercel 배포 설정
├── .env.local.example    # 환경변수 예시 파일
├── .gitignore            # Git 제외 파일
├── index.html            # 메인 페이지
├── result.html           # 결과 페이지
├── api/                  # Vercel Serverless Functions
│   ├── quote.js          # 명언 생성 API 엔드포인트
│   └── middleware/
│       └── rateLimit.js  # Rate Limiting 미들웨어
├── public/               # 정적 파일
│   └── assets/
│       ├── images/       # 이미지 파일
│       │   └── default-cat.png
│       └── fonts/        # 웹 폰트
├── styles/
│   ├── main.css          # 메인 페이지 스타일
│   └── result.css        # 결과 페이지 스타일
└── scripts/
    ├── main.js           # 메인 페이지 로직 (WAS API 호출)
    └── result.js         # 결과 페이지 로직
```

## 구현 계획

### Phase 1: 기본 구조 설정 ✅
- [x] 프로젝트 폴더 구조 생성
- [x] HTML 페이지 기본 마크업
- [x] CSS 스타일링 (모바일 우선 반응형)
- [x] 기본 JavaScript 이벤트 핸들링

### Phase 2: WAS 서버 구성 ✅ (보안 강화)
- [x] Vercel Serverless Functions 구조 설정
- [x] API 엔드포인트 구현 (`/api/quote`)
- [x] Rate Limiting 미들웨어 구현 (1분당 5회)
- [x] 환경변수로 n8n API 키 보호
- [x] 에러 핸들링 및 CORS 설정
- [x] 프론트엔드 WAS API 연동

### Phase 3: n8n 워크플로우 구성 (진행 중)
- [ ] n8n 워크플로우 생성
  - Webhook 트리거 설정
  - AI 이미지 생성 노드
  - AI 명언 생성 노드
  - 응답 포맷팅
- [ ] 프론트엔드 ↔ WAS ↔ n8n 연동 테스트

### Phase 4: 배포 및 테스트
- [ ] Vercel 배포
- [ ] 환경변수 설정
- [ ] 프로덕션 테스트
- [ ] Rate Limiting 동작 확인

### Phase 5: 추가 기능 (선택적)
- [ ] Upstash Redis로 Rate Limiting 업그레이드
- [ ] 명언 저장/즐겨찾기 기능
- [ ] 소셜 미디어 공유 버튼 개선
- [ ] 다크 모드 지원
- [ ] 명언 히스토리 갤러리

## n8n 워크플로우 설계

> **📘 상세 가이드**: n8n 워크플로우 구성에 대한 자세한 내용은 [N8N_GUIDE.md](./N8N_GUIDE.md)를 참조하세요.

### Webhook 입력
```json
{
  "trigger": "daily_quote"
}
```

### 워크플로우 단계
1. **Webhook 트리거**: POST 요청 수신
2. **명언 생성 노드** (HTTP Request to GPT API):
   - 프롬프트: "하루를 힘차게 시작할 수 있는 위인 명언이나 책의 감동적인 문장을 하나 추천해줘. 한국어로 작성하고, 출처도 함께 알려줘."
3. **이미지 생성 노드** (HTTP Request to Image API):
   - 프롬프트: "A cute, fluffy cat with big sparkly eyes, kawaii style, pastel colors, motivational pose, digital art, high quality"
4. **응답 포맷팅**:
   ```json
   {
     "quote": "명언 텍스트",
     "author": "출처/저자",
     "imageUrl": "생성된 이미지 URL",
     "timestamp": "생성 시간"
   }
   ```

### Webhook 응답
```json
{
  "success": true,
  "data": {
    "quote": "어제보다 나은 오늘을 만드는 것, 그것이 진정한 성공이다.",
    "author": "랄프 왈도 에머슨",
    "imageUrl": "https://example.com/generated-cat.png",
    "timestamp": "2025-10-21T07:00:00Z"
  }
}
```

## API 연동 가이드

### 아키텍처 흐름

```
1. 프론트엔드 (index.html)
   ↓ fetch('/api/quote')
2. WAS 서버 (api/quote.js)
   ↓ Rate Limiting 체크
   ↓ fetch(process.env.N8N_WEBHOOK_URL)
3. n8n 워크플로우
   ↓ AI 이미지 생성
   ↓ AI 명언 생성
   ↓ 응답 포맷팅
4. WAS 서버
   ↓ 응답 검증
5. 프론트엔드
   ↓ 결과 표시
```

### 프론트엔드에서 WAS API 호출

```javascript
// scripts/main.js
async function fetchDailyQuote(category = null) {
  try {
    const response = await fetch('/api/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'daily_quote',
        category: category
      }),
    });

    // Rate Limit 에러 처리
    if (response.status === 429) {
      const errorData = await response.json();
      throw new Error(
        `너무 많은 요청이 발생했습니다.\n${errorData.retryAfter}초 후에 다시 시도해주세요.`
      );
    }

    if (!response.ok) {
      throw new Error('서버 오류가 발생했습니다.');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('명언 생성 중 오류 발생:', error);
    throw error;
  }
}
```

### WAS 서버에서 n8n 호출

```javascript
// api/quote.js
const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.N8N_API_KEY}`
  },
  body: JSON.stringify({
    trigger: 'daily_quote',
    category: category,
    timestamp: new Date().toISOString()
  })
});
```

## 사용자 흐름

1. 사용자가 메인 페이지 접속
2. "오늘의 명언" 버튼 클릭
3. 로딩 애니메이션 표시 (고양이가 생각하는 애니메이션)
4. n8n 워크플로우 호출 → AI 이미지 + 명언 생성
5. 결과 페이지로 리다이렉트 (또는 모달)
6. 생성된 고양이 이미지와 명언 표시
7. (선택) 공유하기 또는 다시 생성하기

## 디자인 컨셉

### 컬러 팔레트
- **주색상**: 파스텔 핑크 (#FFB3D9)
- **보조색**: 파스텔 옐로우 (#FFF8B8)
- **포인트**: 민트 그린 (#B8F4D9)
- **배경**: 아이보리 (#FFFEF9)
- **텍스트**: 다크 그레이 (#333333)

### 폰트
- 한글: Noto Sans KR / Pretendard
- 영문: Poppins / Inter
- 명언 강조: 손글씨 느낌의 폰트 (Gowun Batang)

### 애니메이션
- 버튼 호버: 부드러운 scale + shadow 효과
- 페이지 전환: fade-in 효과
- 고양이 이미지: 살짝 흔들리는 애니메이션

## 배포 전략

> **📘 상세 가이드**: 배포 방법에 대한 자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

### 호스팅 플랫폼: Vercel (선택됨)

**선택 이유:**
- ✅ Serverless Functions 완벽 지원
- ✅ 정적 파일 + API 통합 배포
- ✅ 무료 티어로 충분 (월 100GB 대역폭, 100,000 요청)
- ✅ 자동 HTTPS 및 글로벌 CDN
- ✅ GitHub 연동으로 자동 배포
- ✅ 환경변수 관리 UI 제공

### 배포 방법

#### 방법 1: Vercel CLI (권장)
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### 방법 2: Vercel 대시보드
1. GitHub 저장소 연동
2. 환경변수 설정 (`N8N_WEBHOOK_URL`, `N8N_API_KEY`)
3. Deploy 버튼 클릭

### 대안 플랫폼
1. **Netlify Functions**: Vercel과 유사
2. **Railway**: 컨테이너 기반, DB 통합
3. **Render**: 무료 DB 포함

### 도메인 제안
- meow-tivation.com
- catquotes.daily
- pawsitive-vibes.com

## 보안 아키텍처 🔒

### 보안 개선 사항

#### 1. WAS 서버 프록시 패턴
```
[프론트엔드] → [WAS 서버] → [n8n]
             (API 키 보호)
```

**이전 (보안 취약):**
```javascript
// ❌ 클라이언트에서 직접 n8n 호출
fetch('https://n8n-instance.com/webhook/abc123', { ... })
// 문제: n8n URL 및 API 키 노출
```

**개선 후:**
```javascript
// ✅ WAS 서버 경유
fetch('/api/quote', { ... })
// n8n URL은 서버 환경변수에만 존재
```

#### 2. API 키 보호
- **환경변수 사용**: `.env.local` 및 Vercel 환경변수
- **Git 제외**: `.gitignore`에 `.env.local` 추가
- **클라이언트 노출 방지**: 서버 코드에서만 접근

#### 3. Rate Limiting
- **IP별 요청 제한**: 1분당 5회
- **비용 제어**: AI API 호출 비용 관리
- **남용 방지**: DDoS 및 무분별한 사용 차단
- **응답 헤더**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

#### 4. CORS 설정
- 서버에서 제어 가능
- 특정 도메인만 허용 (옵션)
- Preflight 요청 처리

### 보안 고려사항

### 성능 최적화
- 이미지 lazy loading
- 캐싱 전략 (동일한 명언 재사용 방지)
- CDN 활용

### 에러 처리
- AI 생성 실패 시 대체 명언 제공
- 네트워크 오류 시 사용자 친화적 메시지
- Fallback 고양이 이미지 준비

## 향후 확장 가능성

1. **사용자 계정**: 즐겨찾기 및 히스토리 저장
2. **다국어 지원**: 영어, 일본어 등
3. **테마 선택**: 고양이 외 다른 동물 (강아지, 토끼 등)
4. **알림 기능**: 매일 정해진 시간에 새 명언 알림
5. **소셜 기능**: 명언 공유 및 커뮤니티
6. **모바일 앱**: React Native / Flutter 변환

## 라이선스

MIT License

## 연락처 및 기여

프로젝트 관련 문의 및 기여는 GitHub Issues를 통해 진행해주세요.

---

**Made with 💝 by Cat Lovers for Everyone**
