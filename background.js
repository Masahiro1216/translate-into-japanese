chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecognition') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startRecognition' });
    });
  } else if (request.action === 'stopRecognition') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'stopRecognition' });
    });
  } else if (request.action === 'showTranslatedText') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'showTranslatedText', translatedText: request.translatedText });
    });
  }
});
