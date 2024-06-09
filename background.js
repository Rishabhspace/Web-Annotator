chrome.commands.onCommand.addListener((command) => {
  if (command === "highlight") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "highlight" });
    });
  } else if (command === "add-note") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "add-note" });
    });
  }
});
