# n8n 워크플로우 구성 가이드 📋

Meow-tivation 프로젝트를 위한 n8n 워크플로우 완전 가이드입니다.

## 목차
1. [워크플로우 개요](#워크플로우-개요)
2. [전체 흐름도](#전체-흐름도)
3. [노드별 상세 설정](#노드별-상세-설정)
4. [카테고리별 프롬프트](#카테고리별-프롬프트)
5. [에러 핸들링](#에러-핸들링)
6. [테스트 및 배포](#테스트-및-배포)

---

## 워크플로우 개요

### 처리 방식
- **비동기 처리**: 프론트엔드는 즉시 로딩 상태를 표시하고, n8n은 백그라운드에서 AI 생성 작업 수행
- **순차 처리**: 명언 생성 → 명언 분석 → 이미지 프롬프트 생성 → 이미지 생성

### 처리 시간 예상
- 명언 생성: 2-5초
- 이미지 생성: 10-30초
- **총 예상 시간**: 15-35초

---

## 전체 흐름도

```
[1] Webhook 트리거
      ↓
[2] 카테고리 확인 및 분기
      ↓
[3] 명언 생성 (OpenAI GPT-4 / Claude)
      ↓
[4] 명언 분석 및 이미지 프롬프트 생성
      ↓
[5] 이미지 생성 (DALL-E 3 / Stable Diffusion)
      ↓
[6] 응답 데이터 포맷팅
      ↓
[7] Webhook 응답 또는 DB 저장
```

---

## 노드별 상세 설정

### 1️⃣ Webhook 노드 (트리거)

**노드 타입**: `Webhook`

**설정**:
```yaml
HTTP Method: POST
Path: /meow-quote
Response Mode: When Last Node Finishes
Response Code: 200
```

**입력 데이터 구조**:
```json
{
  "trigger": "daily_quote",
  "category": "motivation",  // null or "comfort", "motivation", "happiness", etc.
  "timestamp": "2025-10-21T07:00:00Z"
}
```

**n8n 표현식**:
- 카테고리 추출: `{{ $json.body.category }}`
- 타임스탬프: `{{ $json.body.timestamp }}`

---

### 2️⃣ IF 노드 (카테고리 분기)

**노드 타입**: `IF`

**조건 설정**:
```yaml
Condition 1: {{ $json.body.category }} is not empty
  True → 카테고리별 명언 생성
  False → 랜덤 명언 생성
```

---

### 3️⃣ 명언 생성 노드 (OpenAI / Claude)

#### Option A: OpenAI GPT-4

**노드 타입**: `OpenAI`

**모델 설정**:
```yaml
Resource: Chat
Model: gpt-4-turbo
Temperature: 0.8
Max Tokens: 300
```

**시스템 프롬프트**:
```
당신은 사람들에게 영감을 주는 명언 큐레이터입니다.
위인들의 명언이나 유명한 책의 문장 중에서
사용자가 원하는 카테고리에 맞는 감동적인 문장을 추천해주세요.
```

**사용자 프롬프트** (카테고리 있을 때):
```
카테고리: {{ $json.body.category }}

위 카테고리에 맞는 한국어 명언을 하나 추천해주세요.
다음 형식으로 응답해주세요:

명언: [명언 전문]
저자: [저자명 또는 출처]
```

**사용자 프롬프트** (카테고리 없을 때):
```
하루를 힘차게 시작할 수 있는 위인 명언이나 책의 감동적인 문장을 하나 추천해주세요.
한국어로 작성하고, 다음 형식으로 응답해주세요:

명언: [명언 전문]
저자: [저자명 또는 출처]
```

#### Option B: Claude API

**노드 타입**: `HTTP Request`

**엔드포인트**:
```
POST https://api.anthropic.com/v1/messages
```

**헤더**:
```json
{
  "x-api-key": "YOUR_CLAUDE_API_KEY",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json"
}
```

**바디**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 300,
  "messages": [
    {
      "role": "user",
      "content": "카테고리: {{ $json.body.category }}\n\n위 카테고리에 맞는 한국어 명언을 하나 추천해주세요.\n\n명언:\n저자:"
    }
  ]
}
```

---

### 4️⃣ 명언 파싱 및 저장 노드

**노드 타입**: `Code` (JavaScript)

**코드**:
```javascript
// OpenAI 응답 파싱
const response = $input.first().json.choices[0].message.content;

// 명언과 저자 추출
const quoteMatch = response.match(/명언:\s*(.+)/);
const authorMatch = response.match(/저자:\s*(.+)/);

const quote = quoteMatch ? quoteMatch[1].trim() : '';
const author = authorMatch ? authorMatch[1].trim() : '알 수 없음';

// 카테고리 정보 유지
const category = $('Webhook').item.json.body.category || 'random';

return {
  quote: quote,
  author: author,
  category: category
};
```

---

### 5️⃣ 이미지 프롬프트 생성 노드

**노드 타입**: `Code` (JavaScript)

**목적**: 생성된 명언의 분위기에 맞는 고양이 이미지 프롬프트 생성

**코드**:
```javascript
const quote = $input.first().json.quote;
const category = $input.first().json.category;

// 카테고리별 고양이 + 배경 + 상황 통합 프롬프트 매핑
const scenePrompts = {
  comfort: 'A gentle fluffy cat wrapped in a soft warm blanket, sitting by a cozy window with rain outside, warm indoor lighting with fairy lights, steaming cup of tea nearby, soft pillows and plants in the background, comforting and peaceful atmosphere, pastel pink and cream colors',

  motivation: 'An energetic cat standing on top of a mountain peak at sunrise, victorious pose with one paw raised high, inspiring landscape with clouds below, golden sun rays breaking through, motivational atmosphere with bright orange and blue sky, determined expression',

  happiness: 'A cheerful cat jumping playfully in a beautiful flower garden, colorful butterflies flying around, bright sunny day with blue sky, rainbow in the background, joyful atmosphere, vibrant pastel colors with pink, yellow, and mint green flowers',

  challenge: 'A brave adventurer cat wearing a tiny backpack, standing at the entrance of a mystical forest path, determined expression looking forward, morning mist and sunlight filtering through trees, inspiring journey ahead, courageous atmosphere with deep greens and golden light',

  success: 'A proud cat wearing a small golden crown, sitting on a velvet cushion surrounded by achievement medals and trophies, confetti falling from above, celebratory balloons in the background, victorious atmosphere with gold, purple, and sparkles',

  love: 'An adorable cat surrounded by floating hearts and flowers, sitting in a dreamy pink cloud background, soft romantic lighting, cherry blossom petals falling gently, warm loving atmosphere with pastel pink, lavender, and rose gold colors',

  wisdom: 'A wise scholarly cat wearing tiny round glasses, sitting in an ancient library surrounded by old books and scrolls, warm candlelight illuminating the scene, bookshelves stretching into the background, thoughtful atmosphere with warm brown, gold, and deep blue tones',

  peace: 'A serene cat in meditation pose sitting on a smooth stone in a zen garden, surrounded by carefully raked sand patterns, bamboo plants and small water fountain nearby, peaceful Japanese garden atmosphere, soft natural lighting with mint green, white, and earth tones',

  random: 'A cute friendly cat with sparkly eyes sitting in a magical wonderland, soft pastel rainbow background with floating bubbles and stars, whimsical and dreamy atmosphere, cheerful lighting with pink, blue, and yellow pastel colors'
};

const scenePrompt = scenePrompts[category] || scenePrompts.random;

// 전체 이미지 프롬프트 (스타일 가이드 포함)
const imagePrompt = `${scenePrompt}, kawaii anime illustration style, highly detailed, beautiful composition, soft lighting, high quality digital art, 4k resolution, cute and heartwarming, professional artwork`;

return {
  quote: $input.first().json.quote,
  author: $input.first().json.author,
  category: category,
  imagePrompt: imagePrompt
};
```

---

### 6️⃣ 이미지 생성 노드

#### Option A: OpenAI DALL-E 3

**노드 타입**: `OpenAI`

**설정**:
```yaml
Resource: Image
Operation: Generate
Model: dall-e-3
Size: 1024x1024
Quality: standard
Style: vivid
```

**프롬프트**:
```
{{ $json.imagePrompt }}
```

#### Option B: Stable Diffusion (via Replicate)

**노드 타입**: `HTTP Request`

**엔드포인트**:
```
POST https://api.replicate.com/v1/predictions
```

**헤더**:
```json
{
  "Authorization": "Token YOUR_REPLICATE_API_KEY",
  "Content-Type": "application/json"
}
```

**바디**:
```json
{
  "version": "stability-ai/sdxl",
  "input": {
    "prompt": "{{ $json.imagePrompt }}",
    "negative_prompt": "ugly, distorted, low quality, blurry",
    "num_outputs": 1,
    "width": 1024,
    "height": 1024
  }
}
```

---

### 7️⃣ 이미지 URL 추출 노드

**노드 타입**: `Code` (JavaScript)

**코드 (DALL-E 3)**:
```javascript
const imageUrl = $input.first().json.data[0].url;

return {
  quote: $('이미지 프롬프트 생성').item.json.quote,
  author: $('이미지 프롬프트 생성').item.json.author,
  category: $('이미지 프롬프트 생성').item.json.category,
  imageUrl: imageUrl,
  timestamp: new Date().toISOString()
};
```

---

### 8️⃣ 응답 포맷팅 노드

**노드 타입**: `Set` 또는 `Code`

**최종 응답 형식**:
```json
{
  "success": true,
  "data": {
    "quote": "{{ $json.quote }}",
    "author": "{{ $json.author }}",
    "category": "{{ $json.category }}",
    "imageUrl": "{{ $json.imageUrl }}",
    "timestamp": "{{ $json.timestamp }}"
  }
}
```

---

## 카테고리별 프롬프트

### 위로 (comfort)
```
당신이 힘든 시간을 보내고 있는 사람에게 위로가 되는 명언을 추천해주세요.
마음을 따뜻하게 해주고 힘이 되는 문장이면 좋겠습니다.

명언:
저자:
```

### 동기부여 (motivation)
```
목표를 향해 나아가는 사람에게 동기를 부여할 수 있는 명언을 추천해주세요.
열정과 도전 정신을 일깨워주는 문장이면 좋겠습니다.

명언:
저자:
```

### 행복 (happiness)
```
일상의 작은 행복을 느낄 수 있게 해주는 명언을 추천해주세요.
긍정적이고 밝은 에너지를 주는 문장이면 좋겠습니다.

명언:
저자:
```

### 도전 (challenge)
```
새로운 도전을 앞둔 사람에게 용기를 줄 수 있는 명언을 추천해주세요.
두려움을 극복하고 앞으로 나아갈 힘을 주는 문장이면 좋겠습니다.

명언:
저자:
```

### 성공 (success)
```
성공과 성취에 관한 명언을 추천해주세요.
목표 달성의 의미와 가치를 일깨워주는 문장이면 좋겠습니다.

명언:
저자:
```

### 사랑 (love)
```
사랑과 관계의 소중함을 느낄 수 있는 명언을 추천해주세요.
따뜻한 마음과 감사함을 전하는 문장이면 좋겠습니다.

명언:
저자:
```

### 지혜 (wisdom)
```
인생의 지혜와 통찰이 담긴 명언을 추천해주세요.
깊은 생각을 하게 만드는 철학적인 문장이면 좋겠습니다.

명언:
저자:
```

### 평온 (peace)
```
마음의 평화와 고요함을 느낄 수 있는 명언을 추천해주세요.
현재에 집중하고 내면의 안정을 찾는 데 도움이 되는 문장이면 좋겠습니다.

명언:
저자:
```

---

## 에러 핸들링

### 1. 명언 생성 실패 시

**노드 타입**: `IF` (에러 체크)

**폴백 명언 설정**:
```javascript
const fallbackQuotes = {
  comfort: {
    quote: '힘든 시간은 언제나 지나갑니다. 당신은 생각보다 강합니다.',
    author: 'Meow-tivation'
  },
  motivation: {
    quote: '지금 시작하지 않으면 평생 시작하지 못합니다.',
    author: 'Meow-tivation'
  },
  // ... 각 카테고리별 폴백 명언
};

const category = $json.category || 'motivation';
return fallbackQuotes[category];
```

### 2. 이미지 생성 실패 시

**기본 고양이 이미지 URL 설정**:
```javascript
const defaultCatImages = [
  'https://placekitten.com/1024/1024',
  'https://cataas.com/cat/cute'
];

return {
  quote: $json.quote,
  author: $json.author,
  imageUrl: defaultCatImages[0],
  timestamp: new Date().toISOString()
};
```

### 3. 전체 워크플로우 타임아웃

**설정 권장값**: 60초

**타임아웃 응답**:
```json
{
  "success": false,
  "error": "명언 생성 중 시간이 초과되었습니다. 다시 시도해주세요.",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

---

## 최적화 팁

### 1. 캐싱 전략

**Redis 노드 추가** (선택사항):
- 동일한 카테고리 요청 시 최근 생성된 명언 재사용
- TTL: 1시간 설정

```javascript
// 캐시 키 생성
const cacheKey = `quote:${category}:${Math.floor(Date.now() / 3600000)}`;

// 캐시 확인 → 있으면 반환, 없으면 생성
```

### 2. 병렬 처리

현재는 순차 처리이지만, 성능 개선을 원한다면:
- 명언 생성과 기본 고양이 이미지 생성을 병렬로 실행
- 명언 완성 후 이미지 프롬프트 재생성 및 교체

### 3. 로깅 및 모니터링

**Webhook 응답 전 로깅 노드 추가**:
```javascript
console.log({
  timestamp: new Date().toISOString(),
  category: $json.category,
  processingTime: Date.now() - startTime,
  success: true
});
```

---

## 테스트 및 배포

### 1. 로컬 테스트

**테스트 JSON**:
```json
{
  "trigger": "daily_quote",
  "category": "motivation",
  "timestamp": "2025-10-21T07:00:00Z"
}
```

**cURL 명령어**:
```bash
curl -X POST https://your-n8n-instance.com/webhook/meow-quote \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "daily_quote",
    "category": "motivation",
    "timestamp": "2025-10-21T07:00:00Z"
  }'
```

### 2. 프론트엔드 연동

**scripts/main.js에서 설정**:
```javascript
const CONFIG = {
    N8N_WEBHOOK_URL: 'https://your-n8n-instance.com/webhook/meow-quote',
    LOADING_MIN_TIME: 2000,
};
```

### 3. CORS 설정

n8n Webhook 노드에서:
```yaml
Response Headers:
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type
```

---

## 비용 예상

### OpenAI API
- GPT-4 Turbo: $0.01 / 1K tokens (약 300 tokens/요청)
- DALL-E 3: $0.04 / 이미지
- **예상 비용**: 약 $0.05 / 요청

### 월간 사용량 예상 (100명 사용자)
- 일 평균 사용: 100회
- 월 총 사용: 3,000회
- **예상 월 비용**: $150

### 비용 절감 팁
1. 캐싱으로 중복 요청 감소
2. 저렴한 모델 사용 (GPT-3.5 Turbo)
3. Stable Diffusion (Replicate) 사용

---

## 문제 해결 (Troubleshooting)

### Q1. 이미지가 생성되지 않아요
- DALL-E 3 API 키 확인
- 프롬프트에 금지된 단어 포함 여부 확인
- 대체 이미지 서비스 사용 (Stable Diffusion)

### Q2. 명언이 한국어가 아니에요
- 시스템 프롬프트에 "반드시 한국어로 응답" 명시
- Temperature 값 조정 (0.8 → 0.5)

### Q3. 응답 시간이 너무 길어요
- 이미지 생성 품질 조정 (standard로 변경)
- 타임아웃 시간 연장
- 비동기 처리 고려 (결과를 DB 저장 후 폴링)

---

## 다음 단계

1. ✅ n8n 워크플로우 생성
2. ✅ OpenAI API 키 설정
3. ✅ 테스트 실행
4. ✅ 프론트엔드 연동
5. ⬜ 모니터링 대시보드 구축
6. ⬜ 사용자 피드백 수집

---

**작성일**: 2025-10-21
**버전**: 1.0
**문의**: GitHub Issues

Happy Coding! 🐱✨
