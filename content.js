// simple vars to track state
let translateEnabled = false;
let tooltip = null;
let sourceLang = 'auto';
let targetLang = 'en';

// load preferences from storage
chrome.storage.sync.get(['sourceLang', 'targetLang'], (result) => {
    if (result.sourceLang) sourceLang = result.sourceLang;
    if (result.targetLang) targetLang = result.targetLang;
});

// listen for toggle messages
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TOGGLE_TRANSLATE") {
        translateEnabled = msg.enabled;
        if (!translateEnabled) removeTooltip();

        showNotification(translateEnabled ? "Translation Mode ON" : "Translation Mode OFF", translateEnabled);
    }
});

// translate using MyMemory API (free, no key needed)
async function translateText(text, source = sourceLang, target = targetLang) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        if (data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText;
        } else {
            throw new Error('Translation unavailable');
        }
    } catch (error) {
        console.error("Translation error:", error);
        return "Translation failed";
    }
}

// show the tooltip popup
function showTooltip(x, y, original, translated) {
    removeTooltip();

    tooltip = document.createElement("div");
    tooltip.className = "popup-translate-ui";

    tooltip.innerHTML = `
    <div class="popup-header">
      <span class="popup-close">×</span>
    </div>
    <div class="popup-body">
      <div class="popup-translation">${escapeHtml(translated)}</div>
    </div>
  `;

    // position it near the selection
    const safeX = Math.min(x, window.innerWidth - 200);
    const safeY = Math.min(y + 20, window.innerHeight - 100);

    tooltip.style.top = `${safeY}px`;
    tooltip.style.left = `${safeX}px`;

    // setup close button handler
    const closeBtn = tooltip.querySelector(".popup-close");
    closeBtn.onclick = function (e) {
        e.stopPropagation();
        e.preventDefault();
        removeTooltip();
        return false;
    };

    // prevent popup clicks from triggering translation
    tooltip.onclick = function (e) {
        e.stopPropagation();
    };

    tooltip.onmouseup = function (e) {
        e.stopPropagation();
    };

    document.body.appendChild(tooltip);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function removeTooltip() {
    if (tooltip) {
        tooltip.remove();
        tooltip = null;
    }
}

// show toast notification
function showNotification(message, isEnabled) {
    const toast = document.createElement("div");
    toast.className = "translate-toast";
    toast.textContent = message;

    if (isEnabled) {
        toast.classList.add("toast-enabled");
    } else {
        toast.classList.add("toast-disabled");
    }

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    // remove after 2 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// hover translation - with debounce to avoid lag
let hoverTimeout = null;
document.addEventListener("mouseover", async (e) => {
    if (!translateEnabled) return;

    // don't translate the popup itself!
    if (e.target.closest('.popup-translate-ui')) return;

    if (hoverTimeout) clearTimeout(hoverTimeout);

    const text = e.target.innerText?.trim();
    if (!text) return;
    if (text.includes(" ")) return; // only single words
    if (text.length > 35) return;

    // wait a bit before translating
    hoverTimeout = setTimeout(async () => {
        const translated = await translateText(text, sourceLang, targetLang);
        showTooltip(e.pageX, e.pageY, text, translated);
    }, 300);
});

// selection translation
document.addEventListener("mouseup", async (e) => {
    if (!translateEnabled) return;

    // ignore clicks on popup
    if (e.target.closest('.popup-translate-ui')) return;

    const selected = window.getSelection().toString().trim();
    if (!selected) return;
    if (selected.length > 500) return;

    const translated = await translateText(selected, sourceLang, targetLang);
    showTooltip(e.pageX, e.pageY, selected, translated);
});
