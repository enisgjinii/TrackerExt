let startTime;
let currentURL;

function startTracking() {
    currentURL = window.location.href;
    startTime = Date.now();
    chrome.runtime.sendMessage({ action: 'start', url: currentURL });
}

function stopTracking() {
    if (currentURL) {
        const timeSpent = Date.now() - startTime;
        chrome.runtime.sendMessage({ action: 'stop', url: currentURL, timeSpent });
        startTime = null;
        currentURL = null;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        startTracking();
    } else {
        stopTracking();
    }
});

window.addEventListener('beforeunload', stopTracking);

startTracking();
