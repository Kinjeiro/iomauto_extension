// todo @ANKU @LOW - @BUG_OUT - ИМПОРТЫ НЕ РАБОТАЮТ https://stackoverflow.com/questions/66406672/how-do-i-import-scripts-into-a-service-worker-using-chrome-extension-manifest-ve/66408379#66408379
// import { MODULE_STATUS_TEXT_MAP } from '../constants'
// import { MODULE_STATUS_TEXT_MAP } from '/src/constants.js'
// try {
//   importScripts('/src/constants.js');
// } catch (e) {
//   console.error(e);
// }


const manifestData = chrome.runtime.getManifest();
const VERSION = manifestData.version


async function getCurrentTab() {
  let queryOptions = {
    active: true,
    lastFocusedWindow: true,
  }
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}



export const MODULE_STATUS = {
  START_SERVICE: 'START_SERVICE',
  NEW: 'NEW',
  SEARCHING: 'SEARCH',
  WAIT_QA_FORM: 'WAIT_QA_FORM',
  READY: 'READY',
  EXECUTING: 'EXECUTING',
  DONE: 'DONE',
  ERROR: 'ERROR',
}
export const MODULE_STATUS_TEXT_MAP = {
  [MODULE_STATUS.START_SERVICE]: ['*', '#ffd200', 'Ожидаю запуска теста'],
  [MODULE_STATUS.NEW]: ['*', '#ffd200', 'Ожидаю запуска теста'],
  [MODULE_STATUS.SEARCHING]: ['...', '#ffd200', 'Поиск ответов в интернете... (5 - 30 сек)'],
  [MODULE_STATUS.WAIT_QA_FORM]: ['...', '#ffd200', 'Ожидаю формы вопросов (нажмите "Начать тест")'],
  [MODULE_STATUS.READY]: ['>', '#00ff07', 'Ответы найдены - нажмите для запуска!'],
  [MODULE_STATUS.EXECUTING]: ['>...', '#ffd200', 'Подстановка ответов... (подождите)'],
  [MODULE_STATUS.DONE]: ['DONE', '#165af3', 'Все подставлено!'],
  [MODULE_STATUS.ERROR]: ['ER', '#ec0303', 'ОШИБКА'],
}

console.log('Start background script')

// ======================================================
// STORAGE
// ======================================================
// chrome.storage?.sync?.set({
//   moduleStatus: MODULE_STATUS.START_SERVICE,
//   error: undefined,
// })

// ======================================================
// STORAGE CHANGED
// ======================================================
async function updateBadge(moduleStatusValue, error) {
  const tab = (await getCurrentTab())

  if (!tab) {
    return
  }

  const tabId = tab.id
  const [
    text,
    bgColor,
    title,
  ] = MODULE_STATUS_TEXT_MAP[moduleStatusValue]

  chrome.action.setBadgeText({ text, tabId })

  // chrome.action.setBadgeBackgroundColor({ color: bgColor || null, tabId })
  chrome.action.getBadgeBackgroundColor({
    tabId,
  }, (result) => {
    if (result || !!bgColor) {
      // нельзя ставить null если цвета не было
      chrome.action.setBadgeBackgroundColor({ color: bgColor || null, tabId })
    }
  })

  chrome.action.getTitle({
    tabId,
  }, (result) => {
    if (result || !!title) {
      const titleWithVersion = `(v${VERSION}) ${title}`
      // нельзя ставить null если текста не было
      chrome.action.setTitle({
        title: moduleStatusValue === MODULE_STATUS.ERROR
          ? `${titleWithVersion}: ${error}`
          : titleWithVersion,
        tabId,
      })
    }
  })
}

// async function initBadge() {
//   const {
//     moduleStatus,
//   } = await chrome.storage.sync.get()
//
//   console.log('ANKU init status', moduleStatus)
//   if (moduleStatus) {
//     await updateBadge(moduleStatus)
//   }
// }
// initBadge()


// ======================================================
// BADGE CLICKED
// ======================================================
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.sync.get(({
    moduleStatus,
    error,
  }) => {
    console.log('bg: action: ', moduleStatus, error)
    switch (moduleStatus) {
      case MODULE_STATUS.ERROR:
        navigator.clipboard.writeText(error)
        break;
      case MODULE_STATUS.READY:
        chrome.storage.sync.set({
          moduleStatus: MODULE_STATUS.EXECUTING,
        })
        break;
      default:
        // reset
        // todo @ANKU @LOW - нужно включать интервал заново
        chrome.storage.sync.set({
          moduleStatus: MODULE_STATUS.NEW,
          error: undefined,
        })
    }
  })
})


chrome.storage.sync.onChanged.addListener(async (changes) => {
  console.log('changed: ', changes)
  const {
    moduleStatus,
    error,
  } = changes || {}

  if (moduleStatus?.newValue || error?.newValue) {
    // если значение другое значение не поменялось, то его не будет в changes - нужно получить
    chrome.storage.sync.get(({
      moduleStatus,
      error,
    }) => {
      updateBadge(moduleStatus?.newValue || moduleStatus, error?.newValue || error)
    })
  }
})


// ======================================================
// ON MESSAGE
// ======================================================

// chrome.commands.onCommand.addListener((command) => {
//   chrome.tabs.query({
//     active: true,
//     currentWindow: true,
//   }, function (tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, { action: command })
//   })
// })

chrome.runtime.onMessage.addListener(function (runtimeMessage, sender, callback) {
  const {
    url,
    type,
    data,
  } = runtimeMessage
  console.log('runtime.onMessage: ', runtimeMessage)

  if (url) {
    fetch(url, data)
      .then(function (response) {
        return response.text()
          .then(function (text) {
            callback([
              {
                body: text,
                status: response.status,
                statusText: response.statusText,
              }, null,
            ])
          })
      }, function (error) {
        callback([null, error])
      })
  } else {
    switch (type) {
      case 'searchAnswers': {
        searchAnswers(data).then((answersMap) => {
          callback(answersMap)
        }, function (error) {
          callback([null, error])
        })
      } break;
    }
  }
  return true
})


// ======================================================
// TEMP
// ======================================================

// chrome.runtime.onInstalled.addListener(async () => {
//   let url = chrome.runtime.getURL("html/hello.html");
//   let tab = await chrome.tabs.create({ url });
//
//   chrome.storage.sync.get(['showClock'], (result) => {
//     if (result.showClock) {
//       chrome.action.setBadgeText({ text: 'ON' });
//     }
//   });
//
//   chrome.storage.sync.get(['timer'], (result) => {
//     console.log('result', result)
//     if (!result.timer) {
//       chrome.storage.sync.set({ 'timer': 1 })
//     }
//   });
// });

// request = new XMLHttpRequest
// request.open('GET', '../options/options.json', true)
// request.send()
//
// request.onload = function() {
//   data = JSON.parse(this.response)
//   for (var key in data) {
//     data[key] = data[key].val
//     if(localStorage[key]) { data[key] = localStorage[key] }
//   }
//
//   // chrome.extension.onMessage.addListener(function(req, sender, sendMessage) {
//   //   if(req.url) {
//   //     chrome.tabs.query(
//   //       {windowId: sender.tab.windowId},
//   //       function(tabs) {
//   //         var position = sender.tab.index;
//   //         for(var i = position; i < tabs.length; i++) {
//   //           if(tabs[i].openerTabId == sender.tab.id) {
//   //             position = i
//   //           }
//   //         }
//   //         var mute = req.mute
//   //         delete req.mute
//   //
//   //         req.openerTabId = sender.tab.id
//   //         req.index = position + 1
//   //         chrome.tabs.create(req, function(tab) {
//   //           if (mute) listenAndCloseTab(tab, req.url, sender.tab.id)
//   //         })
//   //       }
//   //     )
//   //   } else {
//   //     sendMessage(data)
//   //   }
//   // })
// }
//
// // function listenAndCloseTab (tab, url, originalTabId) {
// //   var listener = setInterval(function () {
// //     chrome.tabs.get(tab.id, function (tab) {
// //       if (tab.status === 'complete') {
// //         chrome.tabs.remove(tab.id)
// //         clearInterval(listener)
// //         // Unsubscription finished
// //         chrome.tabs.sendMessage(originalTabId, {muteURL: url})
// //       }
// //     })
// //   }, 500)
// // }
