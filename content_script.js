// Setting up AWS credentials
chrome.storage.sync.get(['awsAccessKey', 'awsSecretKey', 'awsRegion'], (data) => {
  const AWS_ACCESS_KEY = data.awsAccessKey || '';
  const AWS_SECRET_KEY = data.awsSecretKey || '';
  const AWS_REGION = data.awsRegion || '';

  AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
    region: AWS_REGION
  });

  const translate = new AWS.Translate();

  // Function to translate text
  function translateText(text, callback) {
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'ja',
      Text: text
    };

    translate.translateText(params, (err, data) => {
      if (err) {
        console.error(err, err.stack);
      } else {
        callback(data.TranslatedText);
      }
    });
  }

  // Speech recognition using Web Speech API
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let recognitionActive = false;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcriptionText = event.results[i][0].transcript;
      const isFinal = event.results[i].isFinal;

      if (transcriptionText !== '' && isFinal) {
        console.log('Transcription text:', transcriptionText);

        translateText(transcriptionText, (translatedText) => {
          chrome.runtime.sendMessage({
            action: 'showTranslatedText',
            translatedText: translatedText
          });
        });
      }
    }
  };

  function startRecognition() {
    recognitionActive = true;
    recognition.start();
  }

  function stopRecognition() {
    recognitionActive = false;
    recognition.stop();
  }

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };

  recognition.onstart = () => {
    console.log('Speech recognition started');
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
    if (recognitionActive) {
      setTimeout(() => {
        recognition.start();
      }, 100);
    }
  };

  // Creating and displaying custom popups
  function createPopup() {
    const popup = document.createElement('div');
    popup.id = 'translation-popup';
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';
    popup.style.top = '10px';
    popup.style.right = '10px';
    popup.style.width = '400px';
    popup.style.height = '200px';
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid black';
    popup.style.padding = '10px';
    popup.style.overflow = 'hidden';
    popup.style.resize = 'both';

    // Create a container containing buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';

    const startButton = document.createElement('button');
    startButton.innerText = 'Start';
    startButton.addEventListener('click', startRecognition);
    buttonContainer.appendChild(startButton);

    const stopButton = document.createElement('button');
    stopButton.innerText = 'Stop';
    stopButton.addEventListener('click', stopRecognition);
    buttonContainer.appendChild(stopButton);

    popup.appendChild(buttonContainer);

    const header = document.createElement('h1');
    header.innerText = 'Translated Text:';
    popup.appendChild(header);

    const translatedTextElement = document.createElement('div');
    translatedTextElement.id = 'translated-text';
    translatedTextElement.style.height = 'calc(100% - 40px)';
    translatedTextElement.style.overflow = 'auto';
    translatedTextElement.style.fontSize = '11px';

    // Retain existing translation results, if any
    if (chrome.runtime.lastError === undefined) {
      chrome.runtime.sendMessage({ action: 'getTranslatedText' }, (response) => {
        if (response) {
          translatedTextElement.innerText = response + '\n';
        }
      });
    }

    popup.appendChild(translatedTextElement);
    document.body.appendChild(popup);

    header.style.cursor = 'move';
    header.onmousedown = (event) => {
      event.preventDefault();
      const offsetX = event.clientX - popup.getBoundingClientRect().left;
      const offsetY = event.clientY - popup.getBoundingClientRect().top;

      const onMouseMove = (event) => {
        popup.style.left = `${event.clientX - offsetX}px`;
        popup.style.top = `${event.clientY - offsetY}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
  }


  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showTranslatedText') {
      const popup = document.getElementById('translation-popup');
      const translatedTextElement = popup.querySelector('#translated-text');

      translatedTextElement.innerText += request.translatedText + '\n';

      setTimeout(() => {
        translatedTextElement.scrollTop = translatedTextElement.scrollHeight;
      }, 0);

      chrome.runtime.sendMessage({
        action: 'saveTranslatedText',
        translatedText: translatedTextElement.innerText
      });
    }
  });

  document.addEventListener('DOMContentLoaded', createPopup);
});
