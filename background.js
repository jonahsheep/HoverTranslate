let enabled = false;

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "toggle-translate") {
        enabled = !enabled;

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tabs || tabs.length === 0) {
                console.warn("No active tab found");
                return;
            }

            const tab = tabs[0];

            // can't inject into chrome:// pages
            if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
                console.warn("Cannot inject into chrome:// or extension pages");
                return;
            }

            await chrome.tabs.sendMessage(tab.id, {
                type: "TOGGLE_TRANSLATE",
                enabled
            });

            console.log(`Translation mode ${enabled ? "enabled" : "disabled"}`);
        } catch (error) {
            // this happens when the page was loaded before the extension
            if (error.message.includes("Could not establish connection")) {
                console.log("💡 Tip: Refresh this page (F5) or open a new tab to use the extension");
            } else {
                console.error("Error toggling translate:", error);
            }
        }
    }
});
