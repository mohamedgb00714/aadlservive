
const targetUrl = "https://aadl3inscription2024.dz/";

const checkInterval = 10; // Check every 20 seconds

let countdown = checkInterval;
let autoReloadIntervalId = null;
let isRunning = false;
let relouttim = 0;
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onInstalled.addListener(() => {
  console.log("Auto Reload AADL extension installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startAutoReload") {
    if (message.force) {
      
    startAutoReload(message.force);
    }else
    startAutoReload();
    sendResponse({ success: true });
  } else if (message.action === "stopAutoReload") {
    stopAutoReload();
   browser.notifications.create(
      {
        type: "basic",
        iconUrl: "AADL_logo.png", // Replace with the path to your extension's icon
        title: "Auto Reload AADL",
        message: "Auto-reload has been stopped.",
        priority: 2,
      },
      (notificationId) => {
        console.log("Notification shown with ID:", notificationId);
      }
    );
    sendResponse({ success: true });
  } else if (message.action === "getAutoReloadStatus") {
    sendResponse({ isRunning });
  }
});

function startAutoReload(force=false) {
  if (!autoReloadIntervalId) {
    autoReloadIntervalId = setInterval(() => {
      updateBadge();
    }, 1000); // Check every second;
    //browser.alarms.create("checkWebsite", { periodInMinutes: checkInterval / 60 });
    checkWebsiteStatus(force);
    updateBadge();
    isRunning = true;
    saveAutoReloadStatus(true);
  }
}

function stopAutoReload() {
  if (autoReloadIntervalId) {
    clearInterval(autoReloadIntervalId);
    autoReloadIntervalId = null;
    isRunning = false;
    updateBadge();
    saveAutoReloadStatus(false);
  }
}

function saveAutoReloadStatus(status) {
 browser.storage.local.set({ autoReloadRunning: status }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error saving auto reload status:",
       browser.runtime.lastError
      );
    } else {
      console.log("Auto reload status saved successfully.");
    }
  });
}

function updateBadge() {
 browser.action.setBadgeText({ text: isRunning ? countdown.toString() : "" });
  if (isRunning)
   browser.action.setBadgeBackgroundColor({
      color: isRunning ? "#FF0000" : "",
    });

  if (isRunning && countdown > 0) {
    countdown--;
  } else if (isRunning) {
    countdown = checkInterval;
    checkWebsiteStatus();
  }
}
// Event listener for tab load completion
chrome.webNavigation.onCompleted.addListener(
  function (details) {
    console.log(`Tab ${details.tabId} loaded successfully.`);
  },
  { url: [{ urlMatches: targetUrl + "*" }] }
);

// Event listener for tab error occurrence
chrome.webNavigation.onErrorOccurred.addListener(
  function (details) {
    if (details.frameType === "outermost_frame") {
      console.log("This is the outermost frame of the webpage.");
      // Perform actions specific to the main document 
   
    console.log( details);
    console.error(`Error detected in tab ${details.tabId}: ${details.url}`);
    clearTimeout(relouttim);
    if (isRunning) {
      relouttim = setTimeout(() => {
        countdown = checkInterval;
        reloadTab(details.tabId);
      }, 10000);
     browser.runtime.sendMessage({ action: "countdownrestart" });
    } 
    } else {
      console.log("This is a nested frame (iframe) within the webpage.");
      // Perform actions specific to nested frames
     }
  },
  { url: [{ urlMatches: targetUrl + "*" }] }
);

// Function to check website status and initiate reload if necessary
function checkWebsiteStatus(force=false) {
 
  console.log("Checking website status...");
 browser.tabs.query({ url: targetUrl + "*" }, (tabs) => {
    if (tabs.length > 0) {
      tabs.forEach((tab) => {
        console.log(tab);
        console.log(`Checking status of tab ${tab.tabId}`);
        if (isRunning || force) {
          countdown = checkInterval;
          reloadTab(tab.tabId);
        }
        // Optionally, you can add more specific checks here if needed
      });
    } else {
      console.log("No tabs found with the target URL.");
     browser.tabs.create({ url: "https://aadl3inscription2024.dz/AR/Inscription-desktop.php" });
    }
  });
}

function reloadTab(tabId) {
  if (isRunning)
   browser.tabs.reload(tabId, { bypassCache: true }, () => {
      console.log(`Tab ${tabId} reloaded.`);
    });
}
