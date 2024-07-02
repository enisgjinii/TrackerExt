let activityData = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, url, timeSpent } = message;

    if (action === 'start') {
        if (!activityData[url]) {
            activityData[url] = { totalTime: 0, visits: 0 };
        }
        activityData[url].visits += 1;
    } else if (action === 'stop') {
        if (activityData[url]) {
            activityData[url].totalTime += timeSpent;
        }
    }

    chrome.storage.local.set({ activityData });
});

chrome.tabs.onActivated.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'reset' });
    });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['activityData'], (result) => {
        activityData = result.activityData || {};
    });
});
