let timeout = 0;

// Function to update UI based on auto-reload status
const updateUI = async () => {
  const { autoReloadRunning } = await getStoredValues();
  const toggleButton = document.getElementById("toggleButton");
  const status = document.getElementById("status");

  if (autoReloadRunning) {
    toggleButton.textContent = "Stop";
    toggleButton.classList.add("stop"); // Add 'stop' class for red background
    status.textContent = "Status: Running";

    document.querySelector(".loader").classList.add("running");
  } else {
    toggleButton.textContent = "Start";
    toggleButton.classList.remove("stop"); // Remove 'stop' class for green background
    status.textContent = "Status: Not Running";
    document.querySelector(".loader").classList.remove("running");
  }
}; // Function to retrieve stored values from local storage
const getStoredValues = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(
      ["A17", "nin", "nss", "tel", "autoReloadRunning"],
      (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      }
    );
  });
};
// Function to start auto-reload process
const startAutoReload = async () => {
  let { A17, nin, nss, tel } = await getStoredValues();
  A17 = document.getElementById("A17").value || A17;
  nss = document.getElementById("nss").value || nss;
  nin = document.getElementById("nin").value || nin;
  tel = document.getElementById("tel").value || tel;

  // Store the values in local storage (in case they've been updated)
  chrome.storage.local.set({ A17, nin, nss, tel });

  // Send message to background.js to start auto reload
  chrome.runtime.sendMessage({ action: "startAutoReload", force: true });

  // Update UI
  updateUI();
};

// Function to stop auto-reload process
const stopAutoReload = () => {
  // Send message to background.js to stop auto reload
  chrome.runtime.sendMessage({ action: "stopAutoReload" });

  // Update UI
  updateUI();
};

document.addEventListener("DOMContentLoaded", () => {
  // Add event listener to toggleButton
  document.getElementById("toggleButton").addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { action: "getAutoReloadStatus" },
      (response) => {
        const { isRunning } = response;

        if (isRunning) {
          stopAutoReload();
        } else {
          startAutoReload();
        }
      }
    );
  });

  // Populate inputs and initialize UI based on current state
  getStoredValues()
    .then(({ A17, nin, nss, tel }) => {
      document.getElementById("A17").value = A17 || "";
      document.getElementById("nss").value = nss || "";
      document.getElementById("nin").value = nin || "";
      document.getElementById("tel").value = tel || "";

      updateUI(); // Initialize UI based on auto-reload status
    })
    .catch((error) => {
      console.error("Error retrieving values from local storage:", error);
    });
});
document.addEventListener("DOMContentLoaded", (event) => {
  // Reset local storage when reset button is clicked
  document.getElementById("resetButton").addEventListener("click", function () {
    chrome.storage.local.clear();
    document.getElementById("A17").value = "";
    document.getElementById("nss").value = "";
    document.getElementById("nin").value = "";
    document.getElementById("tel").value = "";
    const origin = "https://aadl3inscription2024.dz";

    chrome.browsingData.remove(
      {
        origins: [origin],
      },
      {
        cache: true,
        cookies: true,
        fileSystems: true,
        indexedDB: true,
        localStorage: true,
        serviceWorkers: true,
        webSQL: true,
      },
      () => {
        alert("Data cleared for " + origin);
      }
    );
  });
  const A17 = document.getElementById("A17");
  const nin = document.getElementById("nin");
  const nss = document.getElementById("nss");
  const tel = document.getElementById("tel");

  // Listen to change event on the select element
  A17.addEventListener("change", (event) => {
    const selectedValue = event.target.value;
    console.log(`Selected value: ${selectedValue}`);
    chrome.storage.local.set({ A17: selectedValue });
  });

  // Listen to input events on the text inputs
  nin.addEventListener("input", (event) => {
    const ninValue = event.target.value;
    console.log(`NIN value: ${ninValue}`);
    chrome.storage.local.set({ nin: ninValue });
  });

  nss.addEventListener("input", (event) => {
    const nssValue = event.target.value;
    console.log(`NSS value: ${nssValue}`);
    chrome.storage.local.set({ nss: nssValue });
  });

  tel.addEventListener("input", (event) => {
    const telValue = event.target.value;
    console.log(`Tel value: ${telValue}`);
    chrome.storage.local.set({ tel: telValue });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "stopAutoReload") {
    chrome.storage.local.set({ autoReloadRunning: false });
    updateUI();
    sendResponse({ success: true });
  }
  if (request.action === "countdownrestart") {
    clearTimeout(timeout);
    document.querySelector(".countdown-container1").classList.add("reloading");
    document.querySelector(".loader").classList.add("reloading");

    resetCountdown();
    timeout = setTimeout(() => {
      document
        .querySelector(".countdown-container1")
        .classList.remove("reloading");

      document.querySelector(".loader").classList.remove("reloading");
    }, 11000);
    sendResponse({ success: true });
  }
  return true;
});
document.addEventListener('DOMContentLoaded', () => {
  const profileSelect = document.getElementById('profileSelect');
  const profileName = document.getElementById('profileName');
  const saveProfileButton = document.getElementById('saveProfileButton');
  const deleteProfileButton = document.getElementById('deleteProfileButton');
  const fillFormButton = document.getElementById('fillFormButton');
  const A17 = document.getElementById("A17");
  const nin = document.getElementById("nin");
  const nss = document.getElementById("nss");
  const tel = document.getElementById("tel");

  // Load profiles from local storage
  const loadProfiles = () => {
    chrome.storage.local.get(['profiles'], (data) => {
      const profiles = data.profiles || [];
      profileSelect.innerHTML = '<option value=""  selected>Select to edit a profile</option>';
      profiles.forEach((profile, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = profile.name;
        profileSelect.appendChild(option);
      });
    });
  };

  // Save or update a profile
  saveProfileButton.addEventListener('click', () => {
    const name = profileName.value.trim();
    if (name === '') {
      alert('Profile name cannot be empty');
      return;
    }
    const profileData = {
      name,
      A17: A17.value,
      nin: nin.value,
      nss: nss.value,
      tel: tel.value,
    };
    chrome.storage.local.get(['profiles'], (data) => {
      const profiles = data.profiles || [];
      const selectedIndex = profileSelect.value;
      if (selectedIndex && selectedIndex !== '') {
        profiles[selectedIndex] = profileData;
      } else {
        profiles.push(profileData);
      }
      chrome.storage.local.set({ profiles }, loadProfiles);
      profileName.value = '';
      A17.value = '';
      nin.value = '';
      nss.value = '';
      tel.value = '';
    });
  });

  // Delete a profile
  deleteProfileButton.addEventListener('click', () => {
    const selectedIndex = profileSelect.value;
    if (selectedIndex && selectedIndex !== '') {
      chrome.storage.local.get(['profiles'], (data) => {
        const profiles = data.profiles || [];
        profiles.splice(selectedIndex, 1);
        chrome.storage.local.set({ profiles }, loadProfiles);
        profileName.value = '';
        A17.value = '';
        nin.value = '';
        nss.value = '';
        tel.value = '';
      });
    } else {
      alert('No profile selected to delete');
    }
  });

  // Load selected profile data into input fields
  profileSelect.addEventListener('change', () => {
    const selectedIndex = profileSelect.value;
    if (selectedIndex && selectedIndex !== '') {
      chrome.storage.local.get(['profiles'], (data) => {
        const profiles = data.profiles || [];
        const selectedProfile = profiles[selectedIndex];
        profileName.value = selectedProfile.name;
        A17.value = selectedProfile.A17;
        nin.value = selectedProfile.nin;
        nss.value = selectedProfile.nss;
        tel.value = selectedProfile.tel;
      });
    }
  });
  // Send form data to active tab
  fillFormButton.addEventListener('click', () => {
    fillForm();
  });

  const fillForm = () => {
    let A17 = document.getElementById("A17").value ;
    let nss = document.getElementById("nss").value ;
   let  nin = document.getElementById("nin").value ;
   let  tel = document.getElementById("tel").value ;
  
    // Store the values in local storage (in case they've been updated)
    chrome.storage.local.set({ A17, nin, nss, tel});

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log(tabs[0]);
      chrome.tabs.sendMessage(tabs[0].id, { action: 'fillForm' });
    });
  };

  // Initial load of profiles
  loadProfiles();
});
function localizePage() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.innerText = message;
    }
  });

  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(element => {
    const messageKey = element.getAttribute('data-i18n-placeholder');
    const message = chrome.i18n.getMessage(messageKey);
    if (message) {
      element.setAttribute('placeholder', message);
    }
  });
}

document.addEventListener('DOMContentLoaded', localizePage);