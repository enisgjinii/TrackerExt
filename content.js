// Variables to track the start time and current URL
let startTime;
let currentURL;

// Function to start tracking the current URL and time
function startTracking() {
    try {
        currentURL = window.location.href;
        startTime = Date.now();
        console.log(`Started tracking: ${currentURL}`);
        chrome.runtime.sendMessage({ action: 'start', url: currentURL, startTime });
    } catch (error) {
        console.error('Error starting tracking:', error);
    }
}

// Function to stop tracking and send the time spent to the background script
function stopTracking() {
    try {
        if (currentURL) {
            const timeSpent = Date.now() - startTime;
            console.log(`Stopped tracking: ${currentURL} | Time spent: ${timeSpent}ms`);
            chrome.runtime.sendMessage({ action: 'stop', url: currentURL, timeSpent });
            startTime = null;
            currentURL = null;
        }
    } catch (error) {
        console.error('Error stopping tracking:', error);
    }
}

// Event listener for visibility change to track when the tab becomes active/inactive
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        startTracking();
    } else {
        stopTracking();
    }
});

// Event listener for page unload to ensure tracking is stopped
window.addEventListener('beforeunload', stopTracking);

// Function to handle URL changes within the same tab
function handleUrlChange() {
    if (window.location.href !== currentURL) {
        stopTracking();
        startTracking();
    }
}

// Set an interval to check for URL changes
setInterval(handleUrlChange, 1000);

// Initial call to start tracking when the script loads
startTracking();

// Function to handle messages from the background script or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'requestStatus') {
        const currentStatus = {
            url: currentURL,
            startTime,
            active: document.visibilityState === 'visible'
        };
        sendResponse(currentStatus);
    }
});

// Error handling for cases where extension context might be invalidated
try {
    chrome.runtime.sendMessage({ action: 'init' });
} catch (error) {
    console.error('Error initializing extension context:', error);
}

// Enhanced error logging for debugging purposes
window.addEventListener('error', (event) => {
    console.error('Global error captured:', event.message, 'at', event.filename, 'line', event.lineno);
});

// Additional utility functions for future enhancements
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
}

function logActivity(action, url, time) {
    console.log(`${action} tracking for ${url} at ${new Date(time).toLocaleString()}`);
}

// Example of a function to handle custom user events (e.g., button clicks)
function handleUserEvent(event) {
    console.log(`User event: ${event.type} on ${event.target.tagName}`);
}

// Attach event listeners for user interactions if needed
document.addEventListener('click', handleUserEvent);
document.addEventListener('keydown', handleUserEvent);

console.log('Web activity tracking script initialized.');
