document.addEventListener('DOMContentLoaded', loadSettings);

function loadSettings() {
    chrome.storage.sync.get(['categories', 'limits', 'productiveDomains'], function (result) {
        const categories = result.categories || [];
        const limits = result.limits || {};
        const productiveDomains = result.productiveDomains || [];

        updateCategoryList(categories);
        updateLimitList(categories, limits);
        updateProductiveDomainList(productiveDomains);
    });

    document.getElementById('addCategory').addEventListener('click', addCategory);
    document.getElementById('addProductiveDomain').addEventListener('click', addProductiveDomain);
    document.getElementById('save').addEventListener('click', saveSettings);
}

function updateCategoryList(categories) {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const div = document.createElement('div');
        div.textContent = category;
        categoryList.appendChild(div);
    });
}

function updateLimitList(categories, limits) {
    const limitList = document.getElementById('limitList');
    limitList.innerHTML = '';
    categories.forEach(category => {
        const div = document.createElement('div');
        const input = document.createElement('input');
        input.type = 'number';
        input.value = limits[category] || 0;
        input.id = `limit-${category}`;
        div.textContent = `${category}: `;
        div.appendChild(input);
        div.appendChild(document.createTextNode(' minutes'));
        limitList.appendChild(div);
    });
}

function updateProductiveDomainList(productiveDomains) {
    const domainList = document.getElementById('productiveDomainList');
    domainList.innerHTML = '';
    productiveDomains.forEach(domain => {
        const div = document.createElement('div');
        div.textContent = domain;
        domainList.appendChild(div);
    });
}

function addCategory() {
    const newCategory = document.getElementById('newCategory').value;
    chrome.storage.sync.get(['categories'], function (result) {
        const categories = result.categories || [];
        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            chrome.storage.sync.set({ categories: categories }, function () {
                updateCategoryList(categories);
                updateLimitList(categories, {});
                document.getElementById('newCategory').value = '';
            });
        }
    });
}

function addProductiveDomain() {
    const newDomain = document.getElementById('newProductiveDomain').value;
    chrome.storage.sync.get(['productiveDomains'], function (result) {
        const productiveDomains = result.productiveDomains || [];
        if (newDomain && !productiveDomains.includes(newDomain)) {
            productiveDomains.push(newDomain);
            chrome.storage.sync.set({ productiveDomains: productiveDomains }, function () {
                updateProductiveDomainList(productiveDomains);
                document.getElementById('newProductiveDomain').value = '';
            });
        }
    });
}

function saveSettings() {
    chrome.storage.sync.get(['categories'], function (result) {
        const categories = result.categories || [];
        const limits = {};
        categories.forEach(category => {
            const limit = document.getElementById(`limit-${category}`).value;
            limits[category] = parseInt(limit);
        });
        chrome.storage.sync.set({ limits: limits }, function () {
            alert('Settings saved');
        });
    });
}