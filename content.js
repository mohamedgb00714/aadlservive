// Function to retrieve NIN and NSS from local storage

const getStoredValues = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['A17', 'nin', 'nss', 'tel'], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });
  };
  
  // Function to fill form fields if elements are detected
  const fillForm = async () => {
    try {
      const { A17, nin, nss, tel } = await getStoredValues();
      
      const A17Element = document.getElementById('A17');
      const ninElement = document.getElementById('A22');
      const nssElement = document.getElementById('A27');
      const telElelent = document.getElementById('A13');
      
      if (nin && nss && ninElement && nssElement) {
        A17Element.value = A17;
        ninElement.value = nin;
        nssElement.value = nss;
        telElelent.value = tel;
        document.querySelector('#A91_1').click()
      }
    } catch (error) {
      console.error('Error retrieving values from local storage:', error);
    }
  };
  
  // Function to check auto-reload status and stop reloading if necessary
  const checkAutoReloadStatus = () => {
    chrome.runtime.sendMessage({ action: "getAutoReloadStatus" }, (response) => {
      const { isRunning } = response;
      if (isRunning) {
        stopAutoReload();
      }
    });
  };
  
  // Mutation observer to watch for changes in the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        fillForm();
        checkAutoReloadStatus(); // Check auto-reload status on DOM changes
      }
    });
  });
  
  // Start observing the document body for changes
  observer.observe(document.body, { childList: true, subtree: true });function stopAutoReload() {
    chrome.runtime.sendMessage({ action: "stopAutoReload" }, (res) => {
      console.log(res);
  
      // Create a notification to inform the user that auto-reload has stopped
      
    });
 
  }
  
  // Initial check in case elements are already present
  fillForm();
  checkAutoReloadStatus();
  // Enable pointer events for all elements on the page
document.querySelectorAll('*').forEach(function(element) {
  element.style.pointerEvents = 'auto';
});
// Remove attributes from the body that prevent mouse interaction
document.body.removeAttribute('oncontextmenu');
document.body.removeAttribute('oncopy');
document.body.removeAttribute('oncut');
document.body.removeAttribute('onpaste');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    fillForm();
    sendResponse({ success: true });
  }
  return true;
});