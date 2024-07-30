let visitData = {};
let activeTabId = null;
let lastActiveTime = Date.now();
let isTracking = true;

chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.runtime.onStartup.addListener(initializeExtension);

function initializeExtension() {
    chrome.storage.sync.get(['visitData', 'categories', 'limits'], (result) => {
        visitData = result.visitData || {};
        initializeTracking();
        setupAlarms();
        setupIdleDetection();
    });
}

function initializeTracking() {
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
}

function handleTabActivated(activeInfo) {
    activeTabId = activeInfo.tabId;
    lastActiveTime = Date.now();
    updateActiveTime();
}

function handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
        const domain = new URL(tab.url).hostname;
        if (!visitData[domain]) {
            visitData[domain] = { totalTime: 0, activeTime: 0, visits: 0, category: 'Uncategorized' };
        }
        visitData[domain].visits++;
        saveVisitData();
    }
}

function updateActiveTime() {
    if (!isTracking) return;

    chrome.tabs.get(activeTabId, (tab) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }

        if (tab && tab.url) {
            const domain = new URL(tab.url).hostname;
            const now = Date.now();
            const activeTime = now - lastActiveTime;
            if (visitData[domain]) {
                visitData[domain].activeTime += activeTime;
                saveVisitData();
            }
            lastActiveTime = now;
        }
    });
}

function saveVisitData() {
    chrome.storage.sync.set({ visitData: visitData }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error saving visit data:', chrome.runtime.lastError);
        }
    });
}

function setupAlarms() {
    chrome.alarms.create('updateActiveTime', { periodInMinutes: 1 });
    chrome.alarms.create('dailyReset', { when: getNextMidnight(), periodInMinutes: 1440 });
}

function setupIdleDetection() {
    chrome.idle.setDetectionInterval(300); // 5 minutes
    chrome.idle.onStateChanged.addListener(handleIdleState);
}

function handleIdleState(state) {
    isTracking = (state === 'active');
    if (isTracking) {
        lastActiveTime = Date.now();
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateActiveTime') {
        updateActiveTime();
    } else if (alarm.name === 'dailyReset') {
        performDailyReset();
    }
});

function performDailyReset() {
    for (let domain in visitData) {
        visitData[domain].totalTime += visitData[domain].activeTime;
        visitData[domain].activeTime = 0;
    }
    saveVisitData();
    checkDailyLimits();
}

function checkDailyLimits() {
    chrome.storage.sync.get(['categories', 'limits'], (result) => {
        const categories = result.categories || [];
        const limits = result.limits || {};

        for (let category of categories) {
            let categoryTime = 0;
            for (let domain in visitData) {
                if (visitData[domain].category === category) {
                    categoryTime += visitData[domain].totalTime;
                }
            }

            if (limits[category] && categoryTime > limits[category] * 60000) {
                showNotification(`Daily limit exceeded for ${category}`, `You've spent more than ${limits[category]} minutes on ${category} websites today.`);
            }
        }
    });
}

function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: title,
        message: message
    });
}

function getNextMidnight() {
    let midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVisitData') {
        sendResponse(visitData);
    }
});