function compareAnswer(inputDataStr, pageStr) {
  // могут быть не заглавные, могут быть запятые лишние в конце
  // поэтому обрежем в конце
  // return inputDataStr.match(pageStr.substr(0, pageStr.length - 1))
  // return inputDataStr.match(pageStr)
  // return pageStr.indexOf(inputDataStr) >= 0

  // return pageStr.replaceAll(/[\.\;\+]+$/g, '') === inputDataStr
  // нормализация

  // Была маленькая буква
  // Профилактика онкологических заболеваний
  // начинать скрининг при среднестатистическом риске рака толстой кишки необходимо с возраста
  return normalizeTextCompare(pageStr) === normalizeTextCompare(inputDataStr)
}

function startExecute(mapResult) {
  // todo ограничение на 10000
  // const input =  window.prompt('JSON c ответами')
  // const mapResult = JSON.parse(input)

  const allKeys = Object.keys(mapResult)
  // 50% что будет ошибка в одном из вопросов
  let randomOneMistakeNumber
  if (getRandomInt(0, 1) === 1) {
    randomOneMistakeNumber = getRandomInt(1, allKeys.length)
    log('БУДЕТ ДОПУЩЕНА СПЕЦИАЛЬНО ОШИБКА в вопросе №' + (randomOneMistakeNumber))
  }

  let pageQuestionNumber = 1
  let prevQuestion

  function checkAnswer() {
    // todo @ANKU @LOW - вынести в настройки
    // const questionEl = document.querySelector('#questionAnchor > div > lib-question > mat-card > div > mat-card-title > div')
    const questionEl = document.querySelector('.question-title-text')
    if (!questionEl) {
      debugger
      throw new IOMError('Неправильная верстка блока вопросов')
    }
    const question = questionEl.textContent

    if (prevQuestion !== question) {
      // todo @ANKU @LOW - так как таймер 2000 результат может не успеть поставится и запускается повторно
      log('Вопрос ' + pageQuestionNumber + ': ', question)
    }

    let findAnswers
    const foundKey = allKeys.find((key) => compareAnswer(key, question))
    if (foundKey) {
      findAnswers = mapResult[foundKey]
      // console.log('Найдены ответы: ', findAnswers)
      log(findAnswers[0], findAnswers[1])
    } else {
      logError('Не найден вопрос в ответах: ' + question, '\n', mapResult)
    }


    let hasAnyAnswer = false
    const pageAnswersMap = {
      // заголовок - функция на ссылку на span
    }

    const testAnswer = (getEl, checkedClassName) => {
      const isChecked = getEl().className.indexOf(checkedClassName) >= 0
      const getSpan = () => getEl().querySelector('span')

      // подходит как для множества так и для одно элемента
      const answerFromPage = getSpan().textContent

      // нужно каждый раз заново искать дом
      pageAnswersMap[answerFromPage] = getSpan

      if (isChecked) {
        hasAnyAnswer = true
        return true
      } else {
        /*
         В ответах сразу два одинаковых вопроса, просто варианты выбора разные.
         Сделали multiple решение - массив массивов:
         [
         ["ответ 1", "ответ 2"],
         ["ответ 4"],
         ]
         */
        if (pageQuestionNumber === randomOneMistakeNumber) {
          if (typeof findAnswers === 'undefined' || findAnswers.length === 0 || findAnswers[0].length === 0) {
            // нету ответов - выбираем первый результат
            hasAnyAnswer = true
            setTimeout(() => getSpan().click(), 100)
            return true
          }
        }
        const result = findAnswers?.some((answersVariant, variantIndex) => {
          return answersVariant.some((answer) => {
            const isCorrect = compareAnswer(answer, answerFromPage)
            // logDebug('isCorrect', isCorrect, pageQuestionNumber, randomOneMistakeNumber)
            if (
              // если нужно сделать ошибку, то выбираем неправильный вариант для клика
              pageQuestionNumber === randomOneMistakeNumber && !isCorrect
              || isCorrect
            ) {
              hasAnyAnswer = true
              getSpan().click()
              return true
            }
          })
          // if (hasAnyAnswer) {
          //   // если нашли ответы прекращаем вариантов блоков ответов перебирать
          //   return true
          // } else if (variantIndex < findAnswers.length - 1) {
          //   log('Пробуем подставить другой блок ответов:\n', findAnswers[variantIndex + 1])
          // }
        })

        hasAnyAnswer = hasAnyAnswer || result
        return result
      }
    }

    // нужно каждый раз искать, так как форма обновляется после проставление ответа
    const answersEls = document.querySelectorAll('.mat-mdc-checkbox')
    const isMultiple = answersEls.length > 0
    if (answersEls.length > 0) {
      // НЕСКОЛЬКО ОТВЕТОВ
      for(let i=0; i < answersEls.length; i++) {
        testAnswer(
          // после каждого клика обновляются дом и нужно элементы заново искать
          ((index) => document.querySelectorAll('.mat-mdc-checkbox')[index]).bind(undefined, i),
          'mat-mdc-checkbox-checked'
          // todo @ANKU @LOW - есть бага что если 4 ответа, успевают проставляться только 3
          // Болезнь Фабри (по утвержденным клиническим рекомендациям) - 2024
          // Вопрос 29:  К ложноположительным результатам может приводить
        )
      }
    } else {
      // ОДИН ОТВЕТ
      const radioEls = document.querySelectorAll('.mat-mdc-radio-button')
      radioEls.forEach((radioEl, i) => {
        testAnswer(
          // radioEl,
          ((index) => document.querySelectorAll('.mat-mdc-radio-button')[index]).bind(undefined, i),
          'mat-mdc-radio-checked',
        )
      })
    }

    if (!hasAnyAnswer) {
      const manualAnswers = prompt(
        `НЕ НАЙДЕН ответ на вопрос:
"${question}"

Возможно ответов на весь тест сейчас вообще НЕТ в базе данных.
Можете попробовать сами выбрать ${isMultiple ? 'НЕСКОЛЬКО (через пробел) номеров ответов' : 'ОДИН номер ответа'}:

${Object.keys(pageAnswersMap).map((qu, index) => `${index + 1}) ${qu}`).join('\n')}`,
        // default
        isMultiple ? '1 2' : '1',
      )

      if (manualAnswers) {
        manualAnswers
          .split(' ')
          .forEach((manualIndexPlus) => {
            // todo @ANKU @LOW - нужно последовательно через паузу запуска клики
            Object.keys(pageAnswersMap).forEach((title, index) => {
              if (index === (manualIndexPlus - 1)) {
                // вызываем поиск элемента, так как если их много дом каждый раз меняется
                const getSpanInner = pageAnswersMap[title]
                getSpanInner().click()
                hasAnyAnswer = true
              }
            })
          })
      }
    }

    if (!hasAnyAnswer) {
      debugger
      throw new IOMError('НЕ найден ответ на вопрос. ВЫБЕРИТЕ ответы сами', question, findAnswers)
    } else {
      // ЖМЕМ кнопку ДАЛЬШЕ

      //const buttonApplyEl = document.querySelector('#questionAnchor > div > lib-question > mat-card > div > mat-card-actions > div > button.question-buttons-primary.mdc-button.mdc-button--raised.mat-mdc-raised-button.mat-primary.mat-mdc-button-base.ng-star-inserted')
      const buttonApplyEl = document.querySelector('mat-card-actions button.question-buttons-primary.mdc-button.mat-primary')

      if (buttonApplyEl.textContent === 'Завершить тестирование') {
        log('КОНЕЦ. ПРОЙДЕНО ' + pageQuestionNumber + 'ответов.')
        return true
      } else {
        //buttonApplyEl.click()
        //pageQuestionNumber += 1

        setTimeout(() => {
          buttonApplyEl.click()

          if (prevQuestion !== question) {
            pageQuestionNumber += 1
          }
          prevQuestion = question
        }, getRandomInt(1200, 2400))
      }
    }

    return false
  }
  function checkAnswerWrapper() {
    try {
      const isEnd = checkAnswer()
      if (!isEnd) {
        // todo @ANKU @LOW - вынеси это в настройки
        // запускаем проверку еще раз пока не дойдем до последней кнопки
        const randomAnswerDelay = getRandomInt(answerDelayMin, answerDelayMax)
        log('Задержка ответа:', randomAnswerDelay)
        setTimeout(checkAnswerWrapper, randomAnswerDelay)
      } else {
        chrome.storage.sync.set({
          moduleStatus: MODULE_STATUS.DONE,
          error: undefined,
        })
      }
    } catch (e) {
      logErrorNotification(e.message, ...(e.otherArgs || []))
    }
  }

  checkAnswerWrapper()
  // intervalTimerId = setInterval(checkAnswer, 2000)

  // setTimeout(checkAnwser, 1500)
  // setTimeout(checkAnwser, 3000)
  // setTimeout(checkAnwser, 4500)
  // setTimeout(checkAnwser, 6000)

  //checkAnwser()
}
