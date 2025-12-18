let enabled = false;

chrome.commands.onCommand.addListener(async (command) => {
    console.log("[Background] Command received:", command);

    if (command === "toggle-translate") {
        enabled = !enabled;
        console.log("[Background] Toggling translate mode to:", enabled);

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tabs || tabs.length === 0) {
                console.warn("[Background] No active tab found");
                return;
            }

            const tab = tabs[0];
            console.log("[Background] Active tab:", tab.url);

            // can't inject into chrome:// pages
            if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
                console.warn("[Background] Cannot inject into chrome:// or extension pages");
                return;
            }

            await chrome.tabs.sendMessage(tab.id, {
                type: "TOGGLE_TRANSLATE",
                enabled
            });

            console.log(`[Background] Message sent successfully. Translation mode ${enabled ? "enabled" : "disabled"}`);
        } catch (error) {
            console.error("[Background] Error:", error);
            // this happens when the page was loaded before the extension
            if (error.message.includes("Could not establish connection")) {
                console.log("[Background] 💡 Tip: Refresh this page (F5) or open a new tab to use the extension");
            } else {
                console.error("[Background] Error toggling translate:", error);
            }
        }
    }
});
