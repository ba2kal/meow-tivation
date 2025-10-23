// DOM Elements
const generatedCat = document.getElementById('generatedCat');
const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const shareButton = document.getElementById('shareButton');
const newQuoteButton = document.getElementById('newQuoteButton');
const toast = document.getElementById('toast');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadQuoteData();
    attachEventListeners();
});

/**
 * sessionStorage에서 명언 데이터 로드
 */
function loadQuoteData() {
    try {
        const storedData = sessionStorage.getItem('dailyQuoteData');

        if (!storedData) {
            console.warn('저장된 명언 데이터가 없습니다. 메인 페이지로 리다이렉트합니다.');
            redirectToHome();
            return;
        }

        const parsedData = JSON.parse(storedData);

        // n8n 응답 구조 처리: { success: true, data: {...} }
        let data;
        if (parsedData.success !== undefined && parsedData.data) {
            // n8n 응답 형식인 경우
            if (parsedData.success === false) {
                console.error('API 응답 실패:', parsedData);
                showErrorAndRedirect();
                return;
            }
            data = parsedData.data;
        } else {
            // 기존 평평한 구조 (하위 호환성)
            data = parsedData;
        }

        displayQuoteData(data);
    } catch (error) {
        console.error('데이터 로드 중 오류 발생:', error);
        showErrorAndRedirect();
    }
}

/**
 * 명언 데이터를 화면에 표시
 */
function displayQuoteData(data) {
    // 이미지 로드
    if (data.imageUrl) {
        // Base64 이미지 또는 URL 처리
        const imageUrl = validateImageUrl(data.imageUrl);
        generatedCat.src = imageUrl;
        generatedCat.alt = '오늘의 고양이';

        // 이미지 로드 실패 시 placeholder 표시
        generatedCat.onerror = () => {
            generatedCat.src = createPlaceholderCatImage();
            console.warn('이미지 로드 실패, placeholder 사용');
        };
    } else {
        generatedCat.src = createPlaceholderCatImage();
    }

    // 명언 텍스트 표시
    if (data.quote) {
        quoteText.textContent = data.quote;

        // 텍스트 애니메이션 효과
        animateText(quoteText);
    } else {
        quoteText.textContent = '명언을 불러올 수 없습니다.';
    }

    // 저자/출처 표시
    if (data.author) {
        quoteAuthor.textContent = `- ${data.author}`;
    } else {
        quoteAuthor.textContent = '';
    }

    // 타임스탬프 표시 (있는 경우)
    displayTimestamp(data.timestamp);
}

/**
 * 이벤트 리스너 등록
 */
function attachEventListeners() {
    shareButton.addEventListener('click', handleShareButtonClick);
    newQuoteButton.addEventListener('click', handleNewQuoteButtonClick);
}

/**
 * 공유하기 버튼 클릭 핸들러
 */
async function handleShareButtonClick() {
    try {
        const storedData = sessionStorage.getItem('dailyQuoteData');
        if (!storedData) {
            throw new Error('공유할 데이터가 없습니다.');
        }

        const data = JSON.parse(storedData);
        const shareText = `${data.quote}\n- ${data.author}\n\nMeow-tivation에서 받은 오늘의 명언 🐱`;

        // Web Share API 지원 여부 확인
        if (navigator.share) {
            await navigator.share({
                title: '오늘의 명언 - Meow-tivation',
                text: shareText,
                url: window.location.href,
            });
        } else {
            // Web Share API를 지원하지 않는 경우 클립보드에 복사
            await copyToClipboard(shareText);
            showToast('클립보드에 복사되었습니다!');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('공유 중 오류 발생:', error);
            showToast('공유에 실패했습니다.', 'error');
        }
    }
}

/**
 * 새로운 명언 버튼 클릭 핸들러
 */
function handleNewQuoteButtonClick() {
    // sessionStorage 데이터 삭제
    sessionStorage.removeItem('dailyQuoteData');

    // 메인 페이지로 리다이렉트
    window.location.href = 'index.html';
}

/**
 * 클립보드에 텍스트 복사
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback: 구형 브라우저 지원
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    } catch (error) {
        throw new Error('클립보드 복사 실패');
    }
}

/**
 * Toast 알림 표시
 */
function showToast(message, type = 'success') {
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;

    if (type === 'error') {
        toastIcon.textContent = '❌';
        toast.style.background = '#FFB3B3';
    } else {
        toastIcon.textContent = '✅';
        toast.style.background = '#B8F4D9';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * 텍스트 애니메이션 효과
 */
function animateText(element) {
    const text = element.textContent;
    element.textContent = '';
    element.style.opacity = '0';

    let index = 0;
    const interval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
        } else {
            clearInterval(interval);
        }
    }, 30);

    // 전체 텍스트 페이드인
    setTimeout(() => {
        element.style.opacity = '1';
        element.style.transition = 'opacity 0.5s ease-in';
    }, 100);
}

/**
 * 이미지 URL 검증 및 처리
 */
function validateImageUrl(imageUrl) {
    if (!imageUrl) {
        return createPlaceholderCatImage();
    }

    // 이미 data URI 형식인 경우 (Base64 포함)
    if (imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    // HTTP/HTTPS URL인 경우
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // 그 외의 경우 (상대 경로 등)
    return imageUrl;
}

/**
 * 타임스탬프 표시
 */
function displayTimestamp(timestamp) {
    const timestampElement = document.getElementById('timestamp');

    if (!timestampElement || !timestamp) {
        return;
    }

    try {
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        timestampElement.textContent = formattedDate;
        timestampElement.style.display = 'block';
    } catch (error) {
        console.warn('타임스탬프 파싱 실패:', error);
        timestampElement.style.display = 'none';
    }
}

/**
 * Placeholder 고양이 이미지 생성 (SVG)
 */
function createPlaceholderCatImage() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
            <rect width="500" height="500" fill="#FFF8F9"/>
            <circle cx="250" cy="250" r="150" fill="#FFB3D9" opacity="0.3"/>
            <text x="250" y="300" font-size="150" text-anchor="middle" fill="#FF8EC7">🐱</text>
        </svg>
    `;
    // UTF-8 문자열을 안전하게 Base64로 인코딩
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * 메인 페이지로 리다이렉트
 */
function redirectToHome() {
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

/**
 * 에러 표시 후 메인 페이지로 리다이렉트
 */
function showErrorAndRedirect() {
    quoteText.textContent = '명언을 불러오는 중 오류가 발생했습니다.';
    quoteAuthor.textContent = '';
    generatedCat.src = createPlaceholderCatImage();

    setTimeout(() => {
        redirectToHome();
    }, 2000);
}

// 유틸리티: 에러 로깅
window.addEventListener('error', (event) => {
    console.error('전역 에러 감지:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
});
