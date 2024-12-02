export function log(msg, ...args) {
  console.log(msg, ...args)
}
export function logDebug(msg, ...args) {
  console.log('DEBUG: ', msg, ...args)
}

export function logError(msg, ...args) {
  console.error(msg, ...args)
}

export function logErrorNotification(error, ...args) {
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
export async function fetchFromExtension(url) {
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
          // todo @ANKU @LOW - иногда долго сайт отвечает, сделать оповещение и запустить еще раз
          reject(error)
        }
      },
    )
  })
}

export function getRandomInt(min, max) {
  return Math.round(Math.random() * (max - min) + min)
}

export class IOMError extends Error {
  errorMsg
  constructor(message, ...otherArgs) {
    super(message);
    // todo @LOW - почему-то .message возвращает undefined
    this.errorMsg = message
    this.otherArgs = otherArgs;
  }
}
