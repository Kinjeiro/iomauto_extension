import { parseFormatResultPageHtml } from './parserResultPageHtml'
import { IOMError, log } from './utils'
import { ACTIONS, ACTIONS_CLIENT, getConfig, MODULE_STATUS, TRUST_LEVEL, updateConfig } from '../constants'
import { startExecute } from './execute-questions'
import { searchAnswers2 } from './search-answers'

import './content-script.css'


log('Start from content-scripts')

// const normalizeTextCompare = globalThis.normalizeTextCompare


let currentModuleStatus = undefined

function serializeToSeregaFormat(topic) {
  const questionsStr = topic.questions.map((question) =>
    question.question + '\n' + question.answers.map((answer) => '+ ' + answer + '\n').join('')
  ).join('')
  return '#ответы\n' + topic.title + '\n' + questionsStr + '\n'
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    const {
      action,
      payload,
    } = request

    switch (action) {
      case ACTIONS_CLIENT.COPY_ANSWERS_CLIPBOARD: {
        const topic = parseFormatResultPageHtml(undefined, document, TRUST_LEVEL.LOW, true)

        navigator.clipboard.writeText(
          serializeToSeregaFormat(topic),
        )
          .then(function() {
            // нужно дождаться окончания копирования, чтобы не терялся фокус
            alert(
              `Ответы СКОПИРОВАНЫ в буффер обмена, положите 
Пожалуйста, созайте текстовой чат и в нем нажмите CTRL+V. Сохраните файл с названием темы. Потом зайдите в чат группы
https://t.me/iomauto
и добавьте файл в чат.

Этим Вы поможете другим. Спасибо!`
            )
          })
        break
      }
    }
    // console.log(sender.tab ?
    //   "from a content script:" + sender.tab.url :
    //   "from the extension");
    // if (request.greeting === "hello")
    //   sendResponse({farewell: "goodbye"});
  }
)
function actionUpdateStatus(moduleStatus, error, data) {
  currentModuleStatus = moduleStatus

  chrome.runtime.sendMessage({
    action: ACTIONS.MODULE_STATUS,
    payload: {
      moduleStatus,
      error,
      data,
    },
  })
}


async function searchByCertName() {
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


let intervalRunSearchQAForm
async function runSearchQAForm() {
  const hasQAs = document.querySelector('#questionAnchor')

  console.log('hasQAs', hasQAs)
  if (hasQAs) {
    clearInterval(intervalRunSearchQAForm)

    chrome.storage.sync.set({
      moduleStatus: MODULE_STATUS.READY,
    })
  }
}

let intervalRunSearchAnswers
function stop() {
  clearInterval(intervalRunSearchAnswers)
  clearInterval(intervalRunSearchQAForm)
}

function getResultRate() {
  const protocolEl = document.querySelector('.quiz-questionsList-title')
  const el = protocolEl
    ? document.querySelector('.quiz-info-col-indicators-item:nth-child(2) .text_value')
    : undefined
  return el ? parseInt(el.textContent, 10) : undefined
}

let finalMapResult
async function runSearchAnswers() {
  if (getResultRate()) {
    return
  }

  const certName = await searchByCertName()
  if (certName) {
    clearInterval(intervalRunSearchAnswers)

    /*
      @NOTE: Новая версия, которая суммирует все ответы
    */
    // finalMapResult = await searchAnswers(certName)
    finalMapResult = await searchAnswers2(certName)

    if (Object.keys(finalMapResult).length < 10) {
      window.noSomeAnswers = true
      alert('НЕ НАЙДЕНЫ ответы для темы\n Спросите в группе\nhttps://t.me/iomauto\nможет кто-то уже решал.')
      throw Error('Не найдены ответы для темы')
    }

    chrome.storage.sync.set({
      moduleStatus: MODULE_STATUS.WAIT_QA_FORM,
    })
  }
}




function init() {
  log('init')

  // use null-safe operator since chrome.runtime
  // is lazy inited and might return undefined
  if (chrome.runtime?.id && chrome.storage?.sync) {
    // сначала нужно сбросить background статус c прошлого раза
    chrome.storage.sync.set({
      moduleStatus: MODULE_STATUS.START_SERVICE,
      error: undefined,
    })

    setTimeout(() => {
      chrome.storage.sync.set({
        moduleStatus: MODULE_STATUS.NEW,
        error: undefined,
      })
    }, 500)

    let interval
    function checkResultPage() {
      const resultRate = getResultRate()
      if (resultRate) {
        clearInterval(interval) // останавливаем поиск
        stop()

        // todo @ANKU @LOW - подумать давать ли опцию всем или только если нет каких-нибудь ответов
        // if (resultRate >= 3 && window.noSomeAnswers) {
        log('resultRate', resultRate, window.noSomeAnswers)
        if (resultRate >= 3) {
          actionUpdateStatus(MODULE_STATUS.COPY_ANSWERS)
        }
      }
    }
    checkResultPage() // запускаем сразу
    interval = setInterval(checkResultPage, 1000)

  } else {
    // если background еще не готов РЕКУРСИВНО подождем еще
    setTimeout(init, 1000)
  }
}
window.onload = function() {
  // можно также использовать window.addEventListener('load', (event) => {
  log('start from onload')
  init()
}

// window.addEventListener("unload", function() {
//   // navigator.sendBeacon("/analytics", JSON.stringify(analyticsData));
//   chrome.storage.sync.set({
//     moduleStatus: MODULE_STATUS.NEW,
//   })
// })
// window.onbeforeunload = function() {
//   if (chrome.runtime?.id) {
//     log('start from onbeforeunload')
//     chrome.storage.sync.set({
//       // moduleStatus: MODULE_STATUS.NEW,
//       moduleStatus: MODULE_STATUS.START_SERVICE,
//       error: undefined,
//     })
//   }
//   return false
// }


function errorWrapper(func) {
  return async () => {
    try {
      return await func()
    } catch (e) {
      log('ОШИБКА ЗАПУСКА:\n', e)
      chrome.storage.sync.set({
        moduleStatus: MODULE_STATUS.ERROR,
        error: e instanceof IOMError ? e.errorMsg : e.message,
      })
    }
  }
}

const runSearchAnswersWrapper = errorWrapper(runSearchAnswers)
const runSearchQAFormWrapper = errorWrapper(runSearchQAForm)

chrome.storage.sync.onChanged.addListener(async (changes) => {
  await errorWrapper(async () => {
    console.log('cs: changed: ', changes)

    switch (changes?.moduleStatus?.newValue) {
      case MODULE_STATUS.NEW:
        log('Поиска заголовка с названием темы...')
        chrome.storage.sync.set({
          moduleStatus: MODULE_STATUS.SEARCHING,
        })
        intervalRunSearchAnswers = setInterval(runSearchAnswersWrapper, 1000)
        break

      case MODULE_STATUS.WAIT_QA_FORM:
        log('Ожидание блока с вопросом и ответами...')
        intervalRunSearchQAForm = setInterval(runSearchQAFormWrapper, 1000)
        break

      case MODULE_STATUS.EXECUTING:
        const config = getConfig()

        // ЗАДЕРЖКА
        let answerDelay = prompt(
          'Выберите диапазон случайно задержи между ответами, в секундах (минимально 2 секунды)\n(Нажмите Enter чтобы оставить РЕКОМЕНДОВАННЫЕ значения)',
          `${config.answerDelayMin/1000}-${config.answerDelayMax/1000}`,
        )
        const [min, max] = answerDelay.replaceAll(/ /g, '').split('-')
        const {
          answerDelayMin,
          answerDelayMax,
        } = updateConfig({
          answerDelayMin: Math.max(parseInt(min, 10) * 1000, 2000),
          answerDelayMax: max
            ? Math.max(parseInt(max, 10) * 1000, config.answerDelayMin)
            : config.answerDelayMin,
        })
        log('Задержка между ответами от ', answerDelayMin, ' до ', answerDelayMax)


        // ОШИБКИ
        answerDelay = prompt(
          'Выберите точность ответов (в процентах) \n(для прохождения теста на 3 нужно минимум 75%',
          `${config.answerPercentMin}-${config.answerPercentMax}`,
        )
        const [answerPercentMin, answerPercentMax] = answerDelay.replaceAll(/ /g, '').split('-')
        updateConfig({
          answerPercentMin: parseInt(answerPercentMin),
          answerPercentMax: parseInt(answerPercentMax || answerPercentMin),
        })


        log('Подстановка значений...')
        startExecute(finalMapResult)

        break
    }
  })()
})

