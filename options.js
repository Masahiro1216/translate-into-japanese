document.addEventListener('DOMContentLoaded', restoreOptionsLocalStorage);

function saveOptionsLocalStorage(e) {
  e.preventDefault();
  const awsAccessKey = document.getElementById('aws_access_key').value;
  const awsSecretKey = document.getElementById('aws_secret_key').value;
  const awsRegion = document.getElementById('aws_region').value;

  chrome.storage.local.set({
    awsAccessKey: awsAccessKey,
    awsSecretKey: awsSecretKey,
    awsRegion: awsRegion
  }, () => {
    console.log('Options saved');
    const messageElement = document.getElementById('message');
    messageElement.innerText = `以下の情報を設定しました。\nAWS Access Key: ${awsAccessKey}\nAWS Secret Key: ${awsSecretKey}\nAWS Region: ${awsRegion}`;
  });
}

function restoreOptionsLocalStorage() {
  chrome.storage.local.get(['awsAccessKey', 'awsSecretKey', 'awsRegion'], (result) => {
    document.getElementById('aws_access_key').value = result.awsAccessKey || '';
    document.getElementById('aws_secret_key').value = result.awsSecretKey || '';
    document.getElementById('aws_region').value = result.awsRegion || '';
  });

  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', saveOptionsLocalStorage);
  } else {
    console.error('Form not found');
  }
}
