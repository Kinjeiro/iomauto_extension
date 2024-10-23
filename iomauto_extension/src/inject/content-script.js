// const MODULE_STATUS = {
//   NEW: 'NEW',
//   SEARCHING: 'SEARCH',
//   READY: 'READY',
//   EXECUTING: 'EXECUTION',
//   DONE: 'DONE',
//   ERROR: 'ERROR',
// }
// import { fetchFromExtension, log, logError, logErrorNotification, getRandomInt } from './utils'
// import { searchAnswers } from './search-answers'

console.log('Start from content-scripts')

// const normalizeTextCompare = globalThis.normalizeTextCompare


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

let answerDelayMin = 6000
let answerDelayMax = 11000

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
let finalMapResult
async function runSearchAnswers() {
  const certName = await searchByCertName()
  if (certName) {
    clearInterval(intervalRunSearchAnswers)

    finalMapResult = await searchAnswers(certName)

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
      clearInterval(intervalRunSearchAnswers)
      clearInterval(intervalRunSearchQAForm)

      console.log('ОШИБКА ЗАПУСКА:\n', e)
      chrome.storage.sync.set({
        moduleStatus: MODULE_STATUS.ERROR,
        // todo @ANKU @LOW - почему-то ошибка не обновляется proxy?
        error: e.message,
      })
    }
  }
}

const runSearchAnswersWrapper = errorWrapper(runSearchAnswers)
const runSearchQAFormWrapper = errorWrapper(runSearchQAForm)

chrome.storage.sync.onChanged.addListener(async (changes) => {
  await errorWrapper(() => {
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
        const answerDelay = prompt(
          'Выберите диапазон случайно задержи между ответами, в секундах (минимально 2 секунды)\n(Нажмите Enter чтобы оставить РЕКОМЕНДОВАННЫЕ 6-11 секунд)',
          '6-11',
        )
        const [min, max] = answerDelay.replaceAll(/ /g, '').split('-')
        answerDelayMin = Math.max(parseInt(min, 10) * 1000, 2000)
        answerDelayMax = max ? Math.max(parseInt(max, 10) * 1000, answerDelayMin) : answerDelayMin
        log('Задержка между ответами от ', answerDelayMin, ' до ', answerDelayMax)

        log('Подстановка значений...')
        startExecute(finalMapResult)
        break
    }
  })()
})
