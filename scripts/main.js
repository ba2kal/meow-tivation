// Configuration
const CONFIG = {
    // TODO: n8n 워크플로우 생성 후 실제 Webhook URL로 교체하세요
    N8N_WEBHOOK_URL: 'http://localhost:5678/webhook-test/meow-tivation/create',
    LOADING_MIN_TIME: 2000, // 최소 로딩 시간 (밀리초)
};

// DOM Elements
let quoteButton;
let loadingOverlay;
let catImage;
let categoryCards;

// State
let selectedCategory = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 초기화
    quoteButton = document.getElementById('quoteButton');
    loadingOverlay = document.getElementById('loadingOverlay');
    catImage = document.getElementById('catImage');
    categoryCards = document.querySelectorAll('.category-card');

    initializePage();
    attachEventListeners();
});

/**
 * 페이지 초기화
 */
function initializePage() {
    // 이미지 로드 실패 시에만 placeholder 설정
    catImage.addEventListener('error', () => {
        console.warn('기본 고양이 이미지 로드 실패, placeholder 사용');
        catImage.src = createPlaceholderCatImage();
    });
}

/**
 * 이벤트 리스너 등록
 */
function attachEventListeners() {
    quoteButton.addEventListener('click', handleQuoteButtonClick);

    // 카테고리 카드 클릭 이벤트
    categoryCards.forEach(card => {
        card.addEventListener('click', handleCategoryClick);
    });
}

/**
 * 카테고리 카드 클릭 핸들러
 */
function handleCategoryClick(event) {
    const clickedCard = event.currentTarget;
    const category = clickedCard.dataset.category;

    // 이미 선택된 카테고리를 다시 클릭하면 선택 해제
    if (selectedCategory === category) {
        clickedCard.classList.remove('active');
        selectedCategory = null;
    } else {
        // 모든 카드에서 active 클래스 제거
        categoryCards.forEach(card => card.classList.remove('active'));

        // 클릭한 카드에 active 클래스 추가
        clickedCard.classList.add('active');
        selectedCategory = category;
    }
}

/**
 * "오늘의 명언" 버튼 클릭 핸들러
 */
async function handleQuoteButtonClick() {
    try {
        // 로딩 시작
        showLoading();

        // n8n 워크플로우 호출
        const startTime = Date.now();
        const result = await fetchDailyQuote(selectedCategory);

        // 최소 로딩 시간 보장 (UX 개선)
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, CONFIG.LOADING_MIN_TIME - elapsedTime);
        await delay(remainingTime);

        // 결과 페이지로 이동
        navigateToResult(result);
    } catch (error) {
        console.error('명언 생성 중 오류 발생:', error);
        hideLoading();
        showErrorMessage(error.message);
    }
}

/**
 * n8n 워크플로우를 통해 명언 및 이미지 생성
 */
async function fetchDailyQuote(category = null) {
    // n8n Webhook URL이 설정되지 않은 경우
    if (CONFIG.N8N_WEBHOOK_URL === 'YOUR_N8N_WEBHOOK_URL_HERE') {
        console.warn('n8n Webhook URL이 설정되지 않았습니다. 테스트 데이터를 사용합니다.');
        return getMockData(category);
    }

    const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            trigger: 'daily_quote',
            category: category,
            timestamp: new Date().toISOString()
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP 오류! 상태 코드: ${response.status}`);
    }

    const data = await response.json();

    // 응답 데이터 검증
    if (!data.success || !data.data) {
        throw new Error('잘못된 응답 형식입니다.');
    }

    return data.data;
}

/**
 * 테스트용 목 데이터
 */
function getMockData(category = null) {
    const quotesByCategory = {
        comfort: [
            { quote: '힘든 시간은 언제나 지나갑니다. 그리고 당신은 더 강해져 있을 것입니다.', author: '파울로 코엘료', imageUrl: 'https://placekitten.com/500/500' },
            { quote: '당신의 상처는 빛이 들어오는 곳입니다.', author: '루미', imageUrl: 'https://placekitten.com/500/501' },
        ],
        motivation: [
            { quote: '지금 하지 않으면 평생 하지 못한다.', author: '나이키', imageUrl: 'https://placekitten.com/501/500' },
            { quote: '성공은 매일매일의 작은 노력들이 쌓여서 만들어진다.', author: '로버트 콜리어', imageUrl: 'https://placekitten.com/501/501' },
        ],
        happiness: [
            { quote: '행복은 습관이다. 그것을 몸에 지니라.', author: '허버트', imageUrl: 'https://placekitten.com/502/500' },
            { quote: '행복의 문이 하나 닫히면 다른 문이 열린다.', author: '헬렌 켈러', imageUrl: 'https://placekitten.com/502/501' },
        ],
        challenge: [
            { quote: '도전 없이는 성장도 없다.', author: '조지 버나드 쇼', imageUrl: 'https://placekitten.com/503/500' },
            { quote: '당신이 할 수 있다고 믿든, 할 수 없다고 믿든 당신은 옳다.', author: '헨리 포드', imageUrl: 'https://placekitten.com/503/501' },
        ],
        success: [
            { quote: '성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. 중요한 것은 계속할 용기다.', author: '윈스턴 처칠', imageUrl: 'https://placekitten.com/504/500' },
            { quote: '어제보다 나은 오늘을 만드는 것, 그것이 진정한 성공이다.', author: '랄프 왈도 에머슨', imageUrl: 'https://placekitten.com/504/501' },
        ],
        love: [
            { quote: '사랑은 세상을 움직이는 힘이다.', author: '찰리 채플린', imageUrl: 'https://placekitten.com/505/500' },
            { quote: '사랑받는 것도 행복이지만, 사랑하는 것은 더 큰 행복이다.', author: '톨스토이', imageUrl: 'https://placekitten.com/505/501' },
        ],
        wisdom: [
            { quote: '지식은 힘이다.', author: '프랜시스 베이컨', imageUrl: 'https://placekitten.com/506/500' },
            { quote: '현명한 사람은 기회를 만들어낸다. 기회보다 더 많이.', author: '베이컨', imageUrl: 'https://placekitten.com/506/501' },
        ],
        peace: [
            { quote: '평화는 미소로부터 시작됩니다.', author: '마더 테레사', imageUrl: 'https://placekitten.com/507/500' },
            { quote: '고요함 속에서 진정한 나를 찾을 수 있다.', author: '랄프 왈도 에머슨', imageUrl: 'https://placekitten.com/507/501' },
        ],
    };

    let quotes;

    // 카테고리가 선택되었으면 해당 카테고리의 명언만 사용
    if (category && quotesByCategory[category]) {
        quotes = quotesByCategory[category];
    } else {
        // 카테고리가 선택되지 않았으면 모든 명언 중에서 선택
        quotes = Object.values(quotesByCategory).flat();
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    return {
        ...randomQuote,
        category: category || 'random',
        timestamp: new Date().toISOString(),
    };
}

/**
 * 결과 페이지로 이동
 */
function navigateToResult(data) {
    // 데이터를 sessionStorage에 저장
    sessionStorage.setItem('dailyQuoteData', JSON.stringify(data));

    // 결과 페이지로 리다이렉트
    window.location.href = 'result.html';
}

/**
 * 로딩 오버레이 표시
 */
function showLoading() {
    loadingOverlay.classList.add('active');
    quoteButton.disabled = true;
}

/**
 * 로딩 오버레이 숨김
 */
function hideLoading() {
    loadingOverlay.classList.remove('active');
    quoteButton.disabled = false;
}

/**
 * 에러 메시지 표시
 */
function showErrorMessage(message) {
    alert(`오류가 발생했습니다:\n${message}\n\n잠시 후 다시 시도해주세요.`);
}

/**
 * Placeholder 고양이 이미지 생성 (SVG)
 */
function createPlaceholderCatImage() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="#FFB3D9" opacity="0.3"/>
            <text x="100" y="120" font-size="80" text-anchor="middle" fill="#FF8EC7">🐱</text>
        </svg>
    `;
    // UTF-8 문자열을 안전하게 Base64로 인코딩
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * 지연 함수 (Promise 기반)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 유틸리티: 에러 로깅
window.addEventListener('error', (event) => {
    console.error('전역 에러 감지:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
});
