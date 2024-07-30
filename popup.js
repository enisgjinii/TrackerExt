// Logging function
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] ${message}`);
}

// Error handling function
function handleError(error, context) {
    log(`Error in ${context}: ${error.message}`, 'error');
    console.error(error);
    // You could also send this error to a server for logging
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        log('Popup opened, requesting visit data');
        chrome.runtime.sendMessage({action: 'getVisitData'}, function(response) {
            if (chrome.runtime.lastError) {
                handleError(chrome.runtime.lastError, 'getVisitData message');
            } else if (response) {
                updateUI(response);
            } else {
                log('No visit data received', 'warn');
                updateUI({});
            }
        });

        document.getElementById('exportJSON').addEventListener('click', exportJSON);
        document.getElementById('exportCSV').addEventListener('click', exportCSV);
        document.getElementById('openOptions').addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    } catch (error) {
        handleError(error, 'DOMContentLoaded event');
    }
});

function updateUI(visitData) {
    try {
        log('Updating UI with visit data');
        const summary = document.getElementById('summary');
        const totalTime = Object.values(visitData).reduce((sum, site) => sum + site.activeTime, 0);
        summary.textContent = `Total active time: ${formatTime(totalTime)}`;

        const topSites = document.getElementById('topSites');
        topSites.innerHTML = '<h2>Top 5 Sites</h2>';
        const sortedSites = Object.entries(visitData).sort((a, b) => b[1].activeTime - a[1].activeTime).slice(0, 5);
        sortedSites.forEach(([domain, data], index) => {
            const percentage = (data.activeTime / totalTime * 100).toFixed(2);
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.width = `${percentage}%`;
            bar.textContent = `${index + 1}. ${domain} (${formatTime(data.activeTime)})`;
            topSites.appendChild(bar);
        });

        const siteList = document.getElementById('siteList');
        siteList.innerHTML = '<h2>All Sites</h2>';
        for (const [domain, data] of Object.entries(visitData)) {
            const listItem = document.createElement('div');
            listItem.className = 'site-item';
            listItem.textContent = `${domain}: ${formatTime(data.activeTime)} (${data.visits} visits)`;
            siteList.appendChild(listItem);
        }
        log('UI update completed');
    } catch (error) {
        handleError(error, 'updateUI');
    }
}

function formatTime(ms) {
    try {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    } catch (error) {
        handleError(error, 'formatTime');
        return 'Error formatting time';
    }
}

function exportJSON() {
    try {
        log('Exporting data as JSON');
        chrome.storage.sync.get(['visitData'], function(result) {
            if (chrome.runtime.lastError) {
                handleError(chrome.runtime.lastError, 'exportJSON storage get');
                return;
            }
            const dataStr = JSON.stringify(result.visitData);
            downloadFile(dataStr, 'site_tracker_data.json', 'application/json');
        });
    } catch (error) {
        handleError(error, 'exportJSON');
    }
}

function exportCSV() {
    try {
        log('Exporting data as CSV');
        chrome.storage.sync.get(['visitData'], function(result) {
            if (chrome.runtime.lastError) {
                handleError(chrome.runtime.lastError, 'exportCSV storage get');
                return;
            }
            let csvContent = "Domain,Total Time (ms),Active Time (ms),Visits,Category\n";
            for (const [domain, data] of Object.entries(result.visitData)) {
                csvContent += `${domain},${data.totalTime},${data.activeTime},${data.visits},${data.category}\n`;
            }
            downloadFile(csvContent, 'site_tracker_data.csv', 'text/csv');
        });
    } catch (error) {
        handleError(error, 'exportCSV');
    }
}

function downloadFile(content, fileName, contentType) {
    try {
        log(`Downloading file: ${fileName}`);
        const a = document.createElement("a");
        const file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
        log('File download initiated');
    } catch (error) {
        handleError(error, 'downloadFile');
    }
}