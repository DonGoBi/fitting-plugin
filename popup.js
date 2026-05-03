document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle-extension');
    const statusText = document.getElementById('status-text');

    function updateUI(isEnabled) {
        statusText.innerText = isEnabled ? "RUNNING" : "DISABLED";
        statusText.style.color = isEnabled ? "#00d4ff" : "#666";
    }

    // 1. 초기 상태 로드
    chrome.storage.local.get(['enabled'], (res) => {
        const isEnabled = res.enabled !== false; // 기본값 On
        toggle.checked = isEnabled;
        updateUI(isEnabled);
    });

    // 2. 스위치 변경 이벤트
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.local.set({ enabled: isEnabled }, () => {
            updateUI(isEnabled);
            console.log("Status saved:", isEnabled);
        });
    });
});