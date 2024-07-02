document.addEventListener('DOMContentLoaded', () => {
    displayActivityData();
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('refreshBtn').addEventListener('click', displayActivityData);

    setInterval(updateActivityData, 1000); // Update the activity data every second
});

function displayActivityData() {
    chrome.storage.local.get(['activityData'], result => {
        if (chrome.runtime.lastError) {
            console.error('Error fetching activity data:', chrome.runtime.lastError.message);
            return;
        }

        const activityData = result.activityData || {};
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = ''; // Clear existing content

        if (Object.keys(activityData).length === 0) {
            const noDataElement = document.createElement('div');
            noDataElement.textContent = 'No activity data found.';
            activityList.appendChild(noDataElement);
            return;
        }

        for (const [url, data] of Object.entries(activityData)) {
            if (!isValidURL(url)) {
                console.error(`Invalid URL format: ${url}`);
                continue; // Skip to the next iteration on invalid URL
            }

            try {
                const urlObject = new URL(url);
                const listItem = document.createElement('div');
                listItem.className = 'activity-item card p-2';

                const urlElement = document.createElement('div');
                urlElement.className = 'card-title';
                urlElement.title = url; // Add full URL as tooltip
                urlElement.textContent = urlObject.hostname; // Display only hostname

                const statsElement = document.createElement('div');
                statsElement.className = 'card-text';
                statsElement.textContent = `${formatTime(data.totalTime)} (${data.visits} visits)`;

                listItem.appendChild(urlElement);
                listItem.appendChild(statsElement);
                activityList.appendChild(listItem);
            } catch (e) {
                console.error(`Error constructing URL object: ${url}`, e);
                continue; // Skip to the next iteration on error
            }
        }
    });
}

function updateActivityData() {
    // Fetch the current URL and active tab details
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs.length === 0) return;
        const activeTab = tabs[0];
        const url = activeTab.url;

        if (!isValidURL(url)) return;

        chrome.storage.local.get(['activityData'], result => {
            if (chrome.runtime.lastError) {
                console.error('Error fetching activity data:', chrome.runtime.lastError.message);
                return;
            }

            const activityData = result.activityData || {};
            if (!activityData[url]) {
                activityData[url] = { totalTime: 0, visits: 0 };
            }

            activityData[url].totalTime += 1000; // Increment by 1 second (1000 ms)
            if (activityData[url].totalTime === 1000) {
                activityData[url].visits += 1;
            }

            chrome.storage.local.set({ activityData }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving activity data:', chrome.runtime.lastError.message);
                } else {
                    displayActivityData();
                }
            });
        });
    });
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (e) {
        return false;
    }
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
}

function exportData() {
    chrome.storage.local.get(['activityData'], result => {
        if (chrome.runtime.lastError) {
            console.error('Error fetching activity data:', chrome.runtime.lastError.message);
            return;
        }

        const activityData = result.activityData || {};
        if (Object.keys(activityData).length === 0) {
            console.log('No activity data to export.');
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8,"
            + "URL,Total Time (ms),Visits\n"
            + Object.entries(activityData).map(([url, data]) =>
                `${url},${data.totalTime},${data.visits}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "web_activity_data.csv");
        document.body.appendChild(link);
        link.click();
    });
}
