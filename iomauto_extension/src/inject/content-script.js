// const MODULE_STATUS = {
//   NEW: 'NEW',
//   SEARCHING: 'SEARCH',
//   READY: 'READY',
//   EXECUTING: 'EXECUTION',
//   DONE: 'DONE',
//   ERROR: 'ERROR',
// }

// import { MODULE_STATUS } from '../bg/background'

console.log('Start from content-scripts')

// todo @ANKU @LOW - убрать в настройки
// const DEFAULT_URL = 'https://24forcare.com/search/?query=%D0%9E%D1%81%D1%82%D1%80%D1%8B%D0%B9+%D0%BA%D0%BE%D1%80%D0%BE%D0%BD%D0%B0%D1%80%D0%BD%D1%8B%D0%B9+%D1%81%D0%B8%D0%BD%D0%B4%D1%80%D0%BE%D0%BC+%D0%B1%D0%B5%D0%B7+%D0%BF%D0%BE%D0%B4%D1%8A%D0%B5%D0%BC%D0%B0+%D1%81%D0%B5%D0%B3%D0%BC%D0%B5%D0%BD%D1%82%D0%B0+ST+%D1%8D%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BA%D0%B0%D1%80%D0%B4%D0%B8%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D1%8B+%28%D0%BF%D0%BE+%D1%83%D1%82%D0%B2%D0%B5%D1%80%D0%B6%D0%B4%D0%B5%D0%BD%D0%BD%D1%8B%D0%BC+%D0%BA%D0%BB%D0%B8%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%BC+%D1%80%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D0%B0%D1%86%D0%B8%D1%8F%D0%BC%29'
const DEFAULT_URL = 'https://24forcare.com/'


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

function answersParsing(doc = document) {
  const mapResult = {}
  // const startElement = 10
  // const endElement = 197
  let question = ''

  const rowEls = doc.querySelectorAll('body > section > div > div > div.col-md.mw-820')
  if (rowEls.length === 0) {
    console.log('ОШИБКА - не найдены ответы в интернете', doc.querySelector('body > section'))
    debugger
    throw new Error('ОШИБКА - не найдены ответы в интернете')
  } else {
    rowEls[0].childNodes
      .forEach((item, index) => {
        if (item.nodeName === 'H3') {
          // todo убрать номер вопроса
          question = item.textContent.replaceAll(/^\d+\. /g, '')
        } else if (question && item.nodeName === 'P' && item.childNodes.length > 0) {
          const answers = []

          item.querySelectorAll('strong').forEach((aItem) => {
            if (aItem) {
              answers.push(aItem.textContent
                // убрать 1) и + в конце и кавычки в начале и в конце
                .replaceAll(/^"/g, '')
                .replaceAll(/^\d+\) /g, '')
                .replaceAll(/[\.\;\+"]+$/g, '')
              )
            }
          })
          // // HACK выбираем первый ответ
          // // todo может не быть ответов жирным не выделено)
          // if (answers.length === 0) {
          //   answers.push(
          //     item.childNodes[0].textContent
          //       .replaceAll(/^\d+\) /g, '')
          //       .replaceAll(/[\.\;\+]+$/g, '')
          //   )
          // }

          // одинаковые вопросы есть с разными вариантами
          // mapResult[question] = answers
          mapResult[question] = [
            ...(mapResult[question] || []),
            ...answers
          ]
        }
      })
  }

  console.log(mapResult)
  // console.log(JSON.stringify(mapResult))

  return mapResult
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

async function searchAnswers(certName, linkToAnswers = undefined) {
  console.log('ТЕМА:\n', certName)

  let linkToAnswersFinal = linkToAnswers
  if (!linkToAnswersFinal) {
    console.log('Поиск...')

    // const htmlWithSearch = await (await fetch(DEFAULT_URL + 'search/?' + new URLSearchParams({
    //   query: certName,
    //   // credentials: "include"
    // }).toString())).text()

    // todo @ANKU @LOW - может вообще обрезать по длине чтобы лучше искалось
    // убираем год - так как часто 2021 в базе ответов нет
    const certNameFinal = certName.replaceAll(/\s?-?\s?\d{4}$/gi, '')
    const htmlWithSearch = await fetchFromExtension(DEFAULT_URL + 'search/?' + new URLSearchParams({
      query: certNameFinal,
      // credentials: "include"
    }).toString())
    const parserSearch = new DOMParser();
    const docSearch = parserSearch.parseFromString(htmlWithSearch, 'text/html');

    // todo @ANKU @CRIT @MAIN - todo несколько вариантов ответов
    // const anchor = docSearch.querySelector(
    //   '#pdopage > .rows > * > .item > .item-name')

    const anchors = docSearch.querySelectorAll('.item-name')
    let foundLinks = []
    console.log('Найдены темы в базе данных:')
    anchors.forEach((findLink, index) => {
      const linkTitle = findLink.getAttribute('title').trim()
      console.log((index + 1) + ') ' + linkTitle)
      if (linkTitle.indexOf(certNameFinal) >= 0) {
        foundLinks.push(findLink)
      }
    })
    const anchor = foundLinks[0]

    if (!anchor) {
      throw new Error('Не найдены ответы в базе данных на данную тему')
    }
    console.log('Выбрали: ' + anchor.getAttribute('title').trim())
    linkToAnswersFinal = DEFAULT_URL + anchor.getAttribute("href")

    // console.log('ССЫЛКА на ОТВЕТЫ:\n', linkToAnswersFinal)
    console.log('ССЫЛКА на ОТВЕТЫ:\n', anchor.getAttribute("href"))
  }

  // const htmlWithAnswers = await (await fetchFromExtension(linkToAnswersFinal)).text()
  const htmlWithAnswers = await fetchFromExtension(linkToAnswersFinal)
  const parser2 = new DOMParser()
  const docAnswers = parser2.parseFromString(htmlWithAnswers, 'text/html')

  return answersParsing(docAnswers)
}



function startExecute(mapResult) {
  // todo ограничение на 10000
  // const input =  window.prompt('JSON c ответами')
  // const mapResult = JSON.parse(input)

  const allKeys = Object.keys(mapResult)
  console.log(mapResult)

  function compare(inputDataStr, pageStr) {
    // могут быть не заглавные, могут быть запятые лишние в конце
    // поэтому обрежем в конце
    // return inputDataStr.match(pageStr.substr(0, pageStr.length - 1))
    // return inputDataStr.match(pageStr)
    // return pageStr.indexOf(inputDataStr) >= 0

    // return pageStr.replaceAll(/[\.\;\+]+$/g, '') === inputDataStr
    return pageStr.replaceAll(/[, \.\;\)\+]/g, '') === inputDataStr.replaceAll(/[, \.\;\)\+]/g, '')
  }


  let intervalTimerId
  let pageQuestionNumber = 1
  let prevQuestion

  function stopProcess(error, ...args) {
    clearInterval(intervalTimerId);

    if (error) {
      logErrorNotification(error, ...args)
    } else {
      chrome.storage.sync.set({
        moduleStatus: MODULE_STATUS.DONE,
        error: undefined,
      })
    }
  }

  function checkAnswer() {
    try {
      const question = document.querySelector('#questionAnchor > div > lib-question > mat-card > div > mat-card-title > div')
        .textContent

      if (prevQuestion !== question) {
        // todo @ANKU @LOW - так как таймер 2000 резуоттат может не успеть поставится и запускается поврно
        console.log('Вопрос ' + pageQuestionNumber + ': ', question)
      }

      const foundKey = allKeys.find((key) => compare(key, question))


      if (foundKey) {
        const findAnswers = mapResult[foundKey]
        // console.log('Найдены ответы: ', findAnswers)
        console.log(findAnswers)

        let randomPageAnswers = []

        let hasAnyAnswer = false
        findAnswers.forEach((answer) => {
          // нужно каждый раз искать, так как форма обновляется после проставление ответа
          const answersEls = document.querySelectorAll('mat-checkbox')
          if (answersEls.length > 0) {
            // НЕСКОЛЬКО ОТВЕТОВ
            randomPageAnswers = [
              answersEls[0]?.querySelector('span'),
              answersEls[1]?.querySelector('span')
            ]
            answersEls.forEach((checkboxEl) => {
              const isChecked = checkboxEl.className.indexOf('mat-mdc-checkbox-checked') >= 0
              const checboxSpanEl = checkboxEl.querySelector('span')
              if (isChecked) {
                hasAnyAnswer = true
              } else if (compare(answer, checboxSpanEl.textContent)) {
                hasAnyAnswer = true
                checboxSpanEl.click()
              }
            })
          } else {
            // ОДИН ОТВЕТ
            const radioEls = document.querySelectorAll('mat-radio-button')
            randomPageAnswers = radioEls[0] ? [
              radioEls[0]?.querySelector('span'),
            ] : []
            radioEls.forEach((radioEl) => {
              const isChecked = radioEl.className.indexOf('mat-mdc-radio-checked') >= 0
              const checboxSpanEl = radioEl.querySelector('span')
              if (isChecked) {
                hasAnyAnswer = true
              } else if (compare(answer, checboxSpanEl.textContent)) {
                hasAnyAnswer = true
                checboxSpanEl.click()
              }
            })
          }
        })

        // todo @ANKU @LOW - на сайте нету болдов с ответами, поэтому делаем хак просто оставляем без ответа
        if (findAnswers.length === 0) {
          logError(
            'ОШИБКА! На сайте нету правильного ответа на вопрос\n',
            foundKey,
          )
          hasAnyAnswer = true
        }

        // todo @ANKU @LOW - добавить варнинг икоку
        // todo @ANKU @LOW - @hack - делаем хак, что если не найдены ответы, выберем первый вариант, чтобы продолжить
        if (!hasAnyAnswer) {
          logError(
            'ОШИБКА! НЕ найден ответ на вопрос\n',
            foundKey,
          )
          if (randomPageAnswers.length > 0) {
            randomPageAnswers.forEach((randomAnswer) => randomAnswer?.click())
            hasAnyAnswer = true
          }
        }

        if (!hasAnyAnswer) {
          stopProcess('НЕ найден ответ на вопрос. ВЫБЕРИТЕ ответы сами', question, findAnswers)
          debugger
        } else {
          //const buttonApplyEl = document.querySelector('#questionAnchor > div > lib-question > mat-card > div > mat-card-actions > div > button.question-buttons-primary.mdc-button.mdc-button--raised.mat-mdc-raised-button.mat-primary.mat-mdc-button-base.ng-star-inserted')
          const buttonApplyEl = document.querySelector('mat-card-actions button.question-buttons-primary.mdc-button.mat-primary')

          if (intervalTimerId && buttonApplyEl.textContent === 'Завершить тестирование') {
            stopProcess();
            console.log('КОНЕЦ. ПРОЙДЕНО ' + pageQuestionNumber + 'ответов.')
          } else {
            //buttonApplyEl.click()
            //pageQuestionNumber += 1

            setTimeout(() => {
              buttonApplyEl.click()

              if (prevQuestion !== question) {
                pageQuestionNumber += 1
              }
              prevQuestion = question
            }, 300)
          }
        }
      } else {
        stopProcess('Не найден вопрос в ответах: ' + question, '\n', mapResult)
        debugger
      }
    } catch (e) {
      stopProcess('ОШИБКА исполнения', e)
      debugger
    }

  }

  intervalTimerId = setInterval(checkAnswer, 2000)

  // setTimeout(checkAnwser, 1500)
  // setTimeout(checkAnwser, 3000)
  // setTimeout(checkAnwser, 4500)
  // setTimeout(checkAnwser, 6000)

  //checkAnwser()
}

let searchStartIntervalId
let finalMapResult
async function searchByCertName(linkToAnswers = undefined) {
  // pc - mat-card-title - mat-mdc-card-title mat-card-title-quiz-custom
  const titleEl = document.querySelector('mat-panel-title')
    // mobile - mat-panel-title - mat-expansion-panel-header-title expansion-panel-title ng-tns-c16-8
    || document.querySelector('mat-card-title')

  if (titleEl) {
    const certName = titleEl.textContent
      .trim()
      .replaceAll(/^( )+/g,'')
      .replaceAll(/ - Предварительное тестирование$/g,'')
      // todo
      .replaceAll(/ - Итоговое тестирование$/g,'')

    log('Название, ', certName)
    return certName
  } else {
    log('Не найдено название текста')
    // debugger
    // throw new Error('НЕ НАЙДЕНО НАЗВАНИЕ ТЕСТА')
  }
}

// function runManual() {
//   startExecute(finalMapResult)
// }
//
// async function run(linkToAnswers = undefined) {
//   await searchByCertName(linkToAnswers)
//   runManual()
// }

// run()
// run('link')



window.onload = function() {
  // можно также использовать window.addEventListener('load', (event) => {

  // use null-safe operator since chrome.runtime
  // is lazy inited and might return undefined
  setTimeout(() => {
    if (chrome.runtime?.id && chrome.storage?.sync) {
      chrome.storage.sync.set({
        moduleStatus: MODULE_STATUS.NEW,
        error: undefined,
      })
    }
  }, 1000)
}
// window.addEventListener("unload", function() {
//   // navigator.sendBeacon("/analytics", JSON.stringify(analyticsData));
//   chrome.storage.sync.set({
//     moduleStatus: MODULE_STATUS.NEW,
//   })
// })
window.onbeforeunload = function() {
  if (chrome.runtime?.id) {
    chrome.storage.sync.set({
      // moduleStatus: MODULE_STATUS.NEW,
      moduleStatus: undefined,
    })
  }
  return false
}

async function searchStart(linkToAnswers = undefined) {
  try {
    // chrome.storage.sync.set({
    //   moduleStatus: MODULE_STATUS.NEW,
    // })
    log('Поиска заголовка с названием темы...')
    const certName = await searchByCertName()

    const hasQAs = document.querySelector('#questionAnchor')

    if (certName && hasQAs) {
      clearInterval(searchStartIntervalId)
      chrome.storage.sync.set({
        moduleStatus: MODULE_STATUS.SEARCHING,
      })

      finalMapResult = await searchAnswers(certName, linkToAnswers)

      chrome.storage.sync.set({
        moduleStatus: MODULE_STATUS.READY,
      })
    }
    // startExecute(answersMap)
  } catch (e) {
    clearInterval(searchStartIntervalId)
    console.log('ОШИБКА ЗАПУСКА:\n', e)
    chrome.storage.sync.set({
      moduleStatus: MODULE_STATUS.ERROR,
      error: e.message,
    })
  }
}

searchStartIntervalId = setInterval(searchStart, 1000)

chrome.storage.sync.onChanged.addListener(async (changes) => {
  console.log('cs: changed: ', changes)

  if (changes?.moduleStatus?.newValue === MODULE_STATUS.EXECUTING) {
    startExecute(finalMapResult)
  }
})

// chrome.action.onClicked.addListener(async (tab) => {
//   chrome.storage.sync.set({
//     moduleStatus: MODULE_STATUS.EXECUTING,
//   })
//
//   console.log('ANKU DONE')
//   await startExecute(finalMapResult)
//
//   chrome.storage.sync.set({
//     moduleStatus: MODULE_STATUS.DONE,
//   })
// })

// // Retriving user options
// chrome.extension.sendMessage({}, function (settings) {
//   initOnHashChangeAction(settings['Domains'])
//   initShortcuts(settings['Shortcut'], settings['BackgroundShortcut'], settings['MuteShortcut'])
//
//   initListViewShortcut()
//   initForInbox()
// })
//
// chrome.runtime.onMessage.addListener(function (req) {
//   var element = req['muteURL'] ? document.querySelector('[href="' + req['muteURL'] + '"]') : null
//
//   if (element) {
//     element.innerText = "Muted!"
//   }
// })
//
// function initForInbox() {
//   window.idled = true
// }
//
// function initOnHashChangeAction(domains) {
//   var allDomains = '//github.com,'
//   if(domains) allDomains += domains
//
//   // Take string -> make array -> make queries -> avoid nil -> join queries to string
//   var selectors = allDomains.replace(/\s/g, '').split(',').map(function (name) {
//     if (name.length) return (".AO [href*='" + name + "']")
//   }).filter(function (name) { return name }).join(", ")
//
//   intervals = []
//
//   // Find GitHub link and append it to tool bar on hashchange
//   window.onhashchange = function () {
//     fetchAndAppendGitHubLink()
//   }
//
//   function fetchAndAppendGitHubLink () {
//     // In case previous intervals got interrupted
//     clearAllIntervals()
//
//     var retryForActiveMailBody = setInterval(function () {
//       var mail_body = Array.prototype.filter.call(document.querySelectorAll('.nH.hx'), function () { return this.clientHeight != 0 })[0]
//
//       if (mail_body ) {
//         var github_links = reject_unwanted_paths(mail_body.querySelectorAll(selectors))
//
//         // Avoid multple buttons
//         Array.prototype.forEach.call(document.querySelectorAll('.github-link, .github-mute'), function (ele) {
//           ele.remove()
//         })
//
//         if (github_links.length ) {
//           var url = github_links[github_links.length-1].href
//           var muteLink
//
//           // skip notification unsubscribe links:
//           if (url.match('notifications/unsubscribe')) {
//             var muteURL = url
//             url = github_links[github_links.length-2].href
//             muteLink = document.createElement('a')
//             muteLink.className = 'github-mute T-I J-J5-Ji T-I-Js-Gs mA mw T-I-ax7 L3 YV'
//             muteLink.innerText = 'Mute thread'
//             muteLink.href = muteURL
//
//             muteLink.addEventListener('click', function (evt) {
//               evt.preventDefault()
//               chrome.extension.sendMessage({url: muteURL, active: false, mute: true})
//               muteLink.innerHTML = '&ctdot;'
//             })
//           }
//
//           // Go to thread instead of diffs or file views
//           if (url.match(/^(.+\/(issue|pull)\/\d+)/)) url = url.match(/^(.+\/(issue|pull)\/\d+)/)[1]
//           var link = document.createElement('a')
//           link.href = url
//           link.className = 'github-link T-I J-J5-Ji T-I-Js-Gs mA mw T-I-ax7 L3 YV'
//           link.target = '_blank'
//           link.innerText = 'View on GitHub'
//
//           document.querySelector('.iH > div').appendChild(link)
//
//           if (muteLink) {
//             document.querySelector('.iH > div').appendChild(muteLink)
//           }
//
//           window.idled = true
//
//           document.getElementsByClassName('github-link')[0].addEventListener("DOMNodeRemovedFromDocument", function (ev) {
//             fetchAndAppendGitHubLink()
//           }, false)
//         }
//
//         clearInterval(retryForActiveMailBody)
//       } else if ( !document.querySelector('.nH.hx') ) {
//         // Not in a mail view
//         clearInterval(retryForActiveMailBody)
//       }
//     }, 100)
//
//     intervals.push(retryForActiveMailBody)
//   }
// }
//
// function initShortcuts(shortcut, backgroundShortcut, muteShortcut) {
//   document.addEventListener('keydown', function (event) {
//     // Shortcut: bind user's combination, if a button exist and event not in a textarea
//     if (document.querySelector('.gE')) {
//       document.querySelector('.gE').classList.remove('github-link')
//     }
//
//     Array.prototype.forEach.call(document.querySelectorAll('.scroll-list-item-open .gE, .scroll-list-item-highlighted .gE'), function (ele) {
//       ele.classList.add('github-link')
//     })
//
//     if (processRightCombinationBasedOnShortcut(shortcut, event) && window.idled && getVisible(document.getElementsByClassName('github-link')) && notAnInput(event.target)) {
//       triggerGitHubLink(false)
//     }
//
//     // Bacground Shortcut: bind user's combination, if a button exist and event not in a textarea
//     if (processRightCombinationBasedOnShortcut(backgroundShortcut, event) && window.idled && getVisible(document.getElementsByClassName('github-link')) && notAnInput(event.target)) {
//       triggerGitHubLink(true)
//     }
//
//     // Mute Shortcut: bind user's combination, if a button exist and event not in a textarea
//     if (processRightCombinationBasedOnShortcut(muteShortcut, event) && window.idled && getVisible(document.getElementsByClassName('github-mute')) && notAnInput(event.target)) {
//       getVisible(document.getElementsByClassName('github-mute')).click()
//     }
//   })
// }
//
// function initListViewShortcut(regexp) {
//   document.addEventListener('keypress', function (event) {
//     // Shortcut: bind ctrl + return
//     var selected = getVisible(document.querySelectorAll('.zA[tabindex="0"]'))
//     if (event.ctrlKey && event.keyCode == 13 && selected ) {
//       generateUrlAndGoTo(selected)
//     }
//   })
// }
//
// // Trigger the appended link in mail view
// function triggerGitHubLink (backgroundOrNot) {
//   // avoid link being appended multiple times
//   window.idled = false
//   var link = getVisible(document.getElementsByClassName('github-link'))
//   chrome.extension.sendMessage({url: link.href, active: !backgroundOrNot})
//
//   setTimeout( function (){ window.idled = true }, 100)
// }
//
// // Go to selected email GitHub thread
// function generateUrlAndGoTo (selected) {
//   var gotoaction = selected.querySelectorAll('.aKS [role="button"]')[0]
//
//   if(gotoaction) {
//     gotoaction.dispatchEvent(fakeEvent('mousedown', true))
//   }
// }
//
// //
// // Helpers
// //
//
// function processRightCombinationBasedOnShortcut (shortcut, event) {
//   // Processing shortcut from preference
//   combination = shortcut.replace(/\s/g, '').split('+')
//
//   keys = ['shift', 'alt', 'meta', 'ctrl']
//   trueOrFalse = []
//
//   // If a key is in the combination, push the value to trueOrFalse array, and delete it from the combination
//   keys.map(function (key) {
//     index = combination.indexOf(key)
//     if(index >= 0) {
//       if(key == "shift") trueOrFalse.push(event.shiftKey)
//       if(key == "alt")   trueOrFalse.push(event.altKey)
//       if(key == "meta")  trueOrFalse.push(event.metaKey)
//       if(key == "ctrl")  trueOrFalse.push(event.ctrlKey)
//
//       combination.splice(index, 1)
//     }
//   })
//
//   // If there is a keyCode left, add that to the mix.
//   if(combination.length) trueOrFalse.push(event.keyCode.toString() == combination[0])
//
//   // Evaluate trueOrFalse by looking for the existence of False
//   return trueOrFalse = (trueOrFalse.indexOf(false) < 0)
// }
//
// // .click() doesn't usually work as expected
// function fakeEvent (event, bubbles) {
//   var click = new MouseEvent(event, {bubbles: bubbles})
//   return click
// }
//
// function linkWithUrl (url) {
//   var l = document.createElement('a')
//   l.href = url
//   l.target = "_blank"
//   return l
// }
//
// function getVisible (nodeList) {
//   if(nodeList.length) {
//     var node
//     for(var i=0; i < nodeList.length; i++) {
//       if(typeof node === 'undefined' && (nodeList[i].offsetHeight > 0 || nodeList[i].clientWidth > 0 || nodeList[i].clientHeight > 0)) {
//         node = nodeList[i]
//         break
//       }
//     }
//     return node
//   }
// }
//
// function notAnInput (element) {
//   return !element.className.match(/editable/) && element.tagName != "TEXTAREA" && element.tagName != "INPUT"
// }
//
// function clearAllIntervals () {
//   intervals.map(function (num) {
//     clearInterval(num)
//     delete intervals[intervals.indexOf(num)]
//   })
// }
//
// // Reject unsubscribe, subscription and verification management paths
// // Make sure the keywords((un)subscribe) can still be repository names
// function reject_unwanted_paths (links) {
//   var paths = ['\/\/[^\/]*\/mailers\/unsubscribe\?',
//                '\/\/[^\/]*\/.*\/.*\/unsubscribe_via_email',
//                '\/\/[^\/]*\/.*\/.*\/subscription$',
//                '\/\/[^\/]*\/.*\/.*\/emails\/.*\/confirm_verification\/.*']
//   var regexp = new RegExp(paths.join('|'))
//   return Array.prototype.filter.call(links, function (link) {
//     if(!link.href.match(regexp)) return this
//   })
// }

