function log(msg, ...args) {
  console.log(msg, ...args)
}

function logError(msg, ...args) {
  console.error(msg, ...args)
  // todo @ANKU @CRIT @MAIN - добавить нотификации
}

function logErrorNotification(error, ...args) {
  chrome.storage.sync.set({
    moduleStatus: MODULE_STATUS.ERROR,
    error,
  })
  logError(error, ...args)
}

/**
 * используем sendMessage в background.js чтобы там CORS не мешал
 * chrome.runtime.onMessage.addListener(
 * @param url
 * @return {Promise<unknown>}
 */
async function fetchFromExtension(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        url,
      },
      ([okData, error]) => {
        // response.text().then((responseText) => {
        //   resolve(responseText)
        // })
        if (okData) {
          const {
            body,
            status,
            statusText,
          } = okData
          resolve(body)
        } else {
          reject(error)
        }
      },
    )
  })
}

function getRandomInt(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

class IOMError extends Error {
  constructor(message, ...otherArgs) {
    super(message);
    this.otherArgs = otherArgs;
  }
}
