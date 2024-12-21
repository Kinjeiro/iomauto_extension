import { IOMError, log } from './utils'
import { getConfig, MODULE_STATUS, updateConfig } from '../constants'
import { startExecute } from './execute-questions'
import { searchAnswers2 } from './search-answers'

import './content-script.css'


log('Start from content-scripts')

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

    /*
      @NOTE: Новая версия, которая суммирует все ответы
    */
    // finalMapResult = await searchAnswers(certName)
    finalMapResult = await searchAnswers2(certName)

    if (Object.keys(finalMapResult).length < 10) {
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
          'Выберите точность ответов (в процентах) \n(для прохождения теста на 3 нужно минимум 85%',
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
