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

### 백엔드/통합
- n8n (워크플로우 자동화)
- n8n Webhook (프론트엔드 ↔ AI 서비스 연동)

### AI 서비스
- 이미지 생성: DALL-E 3 / Stable Diffusion / Midjourney API
- 텍스트 생성: OpenAI GPT-4 / Claude API

## 프로젝트 구조

```
meow-tivation/
├── CLAUDE.md              # 프로젝트 문서
├── N8N_GUIDE.md          # n8n 워크플로우 구성 가이드
├── index.html             # 메인 페이지
├── result.html            # 결과 페이지
├── assets/
│   ├── images/           # 정적 이미지 파일
│   │   └── default-cat.png
│   └── fonts/            # 웹 폰트
├── styles/
│   ├── main.css          # 메인 페이지 스타일
│   └── result.css        # 결과 페이지 스타일
└── scripts/
    ├── main.js           # 메인 페이지 로직
    └── result.js         # 결과 페이지 로직
```

## 구현 계획

### Phase 1: 기본 구조 설정
- [x] 프로젝트 폴더 구조 생성
- [ ] HTML 페이지 기본 마크업
- [ ] CSS 스타일링 (모바일 우선 반응형)
- [ ] 기본 JavaScript 이벤트 핸들링

### Phase 2: n8n 워크플로우 구성
- [ ] n8n 워크플로우 생성
  - Webhook 트리거 설정
  - AI 이미지 생성 노드
  - AI 명언 생성 노드
  - 응답 포맷팅
- [ ] 프론트엔드 API 연동 테스트

### Phase 3: UI/UX 개선
- [ ] 로딩 애니메이션 추가
- [ ] 에러 핸들링 및 사용자 피드백
- [ ] 부드러운 페이지 전환 효과
- [ ] 접근성 개선 (ARIA 레이블 등)

### Phase 4: 추가 기능 (선택적)
- [ ] 명언 저장/즐겨찾기 기능
- [ ] 소셜 미디어 공유 버튼
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

### 프론트엔드에서 n8n 호출

```javascript
async function getDailyQuote() {
  const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ trigger: 'daily_quote' })
  });

  const data = await response.json();
  return data;
}
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

### 호스팅 옵션
1. **Vercel**: 정적 사이트 호스팅 (추천)
2. **Netlify**: CI/CD 통합
3. **GitHub Pages**: 무료 호스팅

### 도메인 제안
- meow-tivation.com
- catquotes.daily
- pawsitive-vibes.com

## 보안 및 고려사항

### API 키 보호
- n8n 워크플로우 내에서 API 키 관리
- 프론트엔드에서는 n8n Webhook URL만 호출
- CORS 설정 확인

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
