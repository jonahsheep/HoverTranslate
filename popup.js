// load saved preferences
chrome.storage.sync.get(['sourceLang', 'targetLang'], (result) => {
    const sourceLang = result.sourceLang || 'auto';
    const targetLang = result.targetLang || 'en';

    document.getElementById('source-lang').value = sourceLang;
    document.getElementById('target-lang').value = targetLang;
});

// save when dropdowns change
document.getElementById('source-lang').addEventListener('change', (e) => {
    chrome.storage.sync.set({ sourceLang: e.target.value });
    showSaved();
});

document.getElementById('target-lang').addEventListener('change', (e) => {
    chrome.storage.sync.set({ targetLang: e.target.value });
    showSaved();
});

function showSaved() {
    const saved = document.getElementById('saved-indicator');
    saved.classList.add('show');
    setTimeout(() => {
        saved.classList.remove('show');
    }, 1500);
}
