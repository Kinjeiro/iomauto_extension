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

// ======================================================
// UTILS
// ======================================================
// https://regex101.com/r/iW2yE3/1 - (.)(?=[\s\S]*\n[^\n]*\1(.)(?:[^\n]{2})*\n?(?![\s\S]))
// AАBВEЕKКMМHНOОPРCСTТXХaаeеoоpрcсyуxх
const LATIN_TO_VIEW_CYRILLIC = {
  A: "А",

  // (//\s+\d+.{14}(.).*)
  // '$2': 'L', $1
  'A': "А", //   913	U+0391	CE 91	Α	Greek Capital Letter Alpha
  'Β': 'В', //   914	U+0392	CE 92	Β	Greek Capital Letter Beta
  'Γ': 'Г', //   915	U+0393	CE 93	Γ	Greek Capital Letter Gamma
  'Ε': 'Е', //   917	U+0395	CE 95	Ε	Greek Capital Letter Epsilon
  'Η': 'Н', //   919	U+0397	CE 97	Η	Greek Capital Letter Eta
  'Κ': 'К', //   922	U+039A	CE 9A	Κ	Greek Capital Letter Kappa
  'Λ': 'Л', //   923	U+039B	CE 9B	Λ	Greek Capital Letter Lamda
  'Μ': 'М', //   924	U+039C	CE 9C	Μ	Greek Capital Letter Mu
  'Ο': 'О', //   927	U+039F	CE 9F	Ο	Greek Capital Letter Omicron
  'Π': 'П', //   928	U+03A0	CE A0	Π	Greek Capital Letter Pi
  'Ρ': 'Р', //   929	U+03A1	CE A1	Ρ	Greek Capital Letter Rho
  'Τ': 'Т', //   932	U+03A4	CE A4	Τ	Greek Capital Letter Tau
  'Φ': 'Ф', //   934	U+03A6	CE A6	Φ	Greek Capital Letter Phi
  'Χ': 'Х', //   935	U+03A7	CE A7	Χ	Greek Capital Letter Chi
  'γ': 'у', //   947	U+03B3	CE B3	γ	Greek Small Letter Gamma
  'κ': 'к', //   954	U+03BA	CE BA	κ	Greek Small Letter Kappa
  'ο': 'о', //   959	U+03BF	CE BF	ο	Greek Small Letter Omicron
  'ρ': 'р', //   961	U+03C1	CF 81	ρ	Greek Small Letter Rho
  'ς': 'с', //   962	U+03C2	CF 82	ς	Greek Small Letter Final Sigma
  'χ': 'х', //   967	U+03C7	CF 87	χ	Greek Small Letter Chi
  'ϐ': 'в', //   976	U+03D0	CF 90	ϐ	Greek Beta Symbol
  'ϒ': 'у', //   978	U+03D2	CF 92	ϒ	Greek Upsilon With Hook Symbol
  'ϕ': 'ф', //   981	U+03D5	CF 95	ϕ	Greek Phi Symbol
  'Ϧ': 'ь', //   998	U+03E6	CF A6	Ϧ	Coptic Capital Letter Khei
  'Ϲ': 'С', //   1017	U+03F9	CF B9	Ϲ	Greek Capital Lunate Sigma Symbol
  'Ϻ': 'М', //   1018	U+03FA	CF BA	Ϻ	Greek Capital Letter San
  'Ё': 'Е', //   1025	U+0401	D0 81	Ё	Cyrillic Capital Letter Io
  //
  'Ҋ': 'Й', //   1162	U+048A	D2 8A	Ҋ	Cyrillic Capital Letter Short I With Tail
  'ҋ': 'й', //   1163	U+048B	D2 8B	ҋ	Cyrillic Small Letter Short I With Tail

  a: "а",
  'ͣ': "а", // 867	U+0363	CD A3	ͣ	Combining Latin Small Letter A
  'Ƃ': "Б", //386	U+0182	C6 82	Ƃ	Latin Capital Letter B With Topbar
  B: "В",
  'ʙ': "в", // 665	U+0299	CA 99	ʙ	Latin Letter Small Capital B
  E: "Е",
  e: "е",
  'ͤ': "е", // 868	U+0364	CD A4	ͤ	Combining Latin Small Letter E
  'Ȅ': "E", // 516	U+0204	C8 84	Ȅ	Latin Capital Letter E With Double Grave
  'ȅ': "е", // 517	U+0205	C8 85	ȅ	Latin Small Letter E With Double Grave
  'Ʒ': "З", // 439	U+01B7	C6 B7	Ʒ	Latin Capital Letter Ezh
  'Ͷ': 'И', // 886	U+0376	CD B6	Ͷ	Greek Capital Letter Pamphylian Digamma
  'ͷ': 'и', // 887	U+0377	CD B7	ͷ	Greek Small Letter Pamphylian Digamma
  K: "К",
  k: "к",
  'ĸ': "к", // 312	U+0138	C4 B8	ĸ	Latin Small Letter Kra
  M: "М",  // нет маленькой
  H: "Н",  // нет маленькой
  'ʜ': "Н",  // 668	U+029C	CA 9C	ʜ	Latin Letter Small Capital H
  O: "О",
  o: "о",
  'ȏ': "о", // 527	U+020F	C8 8F	ȏ	Latin Small Letter O With Inverted Breve
  'ͦ': "о", // 870	U+0366	CD A6	ͦ	Combining Latin Small Letter O
  P: "Р",
  p: "р",
  C: "С",
  c: "с",
  'ͨ': "с", // 872	U+0368	CD A8	ͨ	Combining Latin Small Letter C
  T: "Т", // нет маленькой
  // 882	U+0372	CD B2	Ͳ	Greek Capital Letter Archaic Sampi
  // 883	U+0373	CD B3	ͳ	Greek Small Letter Archaic Sampi
  'Ţ': "Т", // 354	U+0162	C5 A2	Ţ	Latin Capital Letter T With Cedilla
  X: "Х",
  x: "х",
  'ͯ': "х", // 879	U+036F	CD AF	ͯ	Combining Latin Small Letter X
}
function latinToViewCyrillic(input) {
  return input.split("").map(char => LATIN_TO_VIEW_CYRILLIC[char] || char).join("");
}
function normalizeTextCompare(str, noTrim = false) {
  const result = latinToViewCyrillic(str)
    .toLocaleLowerCase() // приводим к нижнему регистру
  return noTrim
    ? result
    : result.replaceAll(/ /g, '') // убираем пробелы

}



// ======================================================
// PROGRAM
// ======================================================
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

          if (!mapResult[question]) {
            mapResult[question] = []
          }
          /*
            В ответах сразу два одинаковых вопроса, просто варианты выбора разные.
            Сделай multiple решение:
            [
               ["ответ 1", "ответ 2"],
               ["ответ 4"],
            ]
          */
          mapResult[question].push(answers)
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

const SEARCH_MATCHES = [
  // 1) убираем год - так как часто 2021 в базе ответов нет
  // -2021
  (searchTerm) => searchTerm.replaceAll(/\s?-?\s?\d{4}$/gi, ''),

  // 2)
  // Недержание мочи (по утвержденным клиническим рекомендациям)-2020
  // Недержание мочи (по клиническим рекомендациям)
  (searchTerm, prevTerm) => prevTerm.replaceAll(
    'по утвержденным клиническим рекомендациям',
    'по клиническим рекомендациям',
  ),

  // 3) заменяем все англицизмы, убираем скобки и символы
  //
  //
  (searchTerm, prevTerm) => normalizeTextCompare(prevTerm, true),

  // 3) "Взрослые" в ответах, а в вопросе уже нет
  // Доброкачественная гиперплазия предстательной железы (по утвержденным клиническим рекомендациям) - 2024
  // Доброкачественная гиперплазия предстательной железы. Взрослые (по утвержденным клиническим рекомендациям) - 2024
  (searchTerm) => normalizeTextCompare(searchTerm, true)
    .substring(0, 45)
    // обрезаем последнее слово, так как оно может быть неполным
    .replaceAll(/\s([^\s]*)$/gi, ''),

  // Гастрит и дуоденит (по утвержденным клиническим рекомендациям) - 2024
  // Гастрит и дуоденит. Взрослые (по утвержденным клиническим рекомендациям) - 2024
  (searchTerm, prevTerm) => prevTerm
    .substring(0, 20)
    // обрезаем последнее слово, так как оно может быть неполным
    .replaceAll(/\s([^\s]*)$/gi, ''),

  // Саркома Капоши (по утвержденным клиническим рекомендациям) - 2024
  // Саркома Капоши кожи (по утвержденным клиническим рекомендациям)
  (searchTerm, prevTerm) => prevTerm
    .substring(0, 15)
    // обрезаем последнее слово, так как оно может быть неполным
    .replaceAll(/\s([^\s]*)$/gi, ''),
]



async function searchAnswers(certName, linkToAnswers = undefined) {
  log('ТЕМА:\n', certName)

  let linkToAnswersFinal = linkToAnswers
  if (!linkToAnswersFinal) {
    // const htmlWithSearch = await (await fetch(DEFAULT_URL + 'search/?' + new URLSearchParams({
    //   query: certName,
    //   // credentials: "include"
    // }).toString())).text()
    const anchorAllMap = {}
    // const anchorAll = []
    // const anchorAllTitles = []
    let anchor
    let anchorIndex
    let prevSearch = certName

    for (let i = 0; !anchor && i < SEARCH_MATCHES.length; i++) {
      const matcher = SEARCH_MATCHES[i]

      const certNameFinal = matcher(certName, prevSearch)

      console.log('Поиск...\n', certNameFinal)
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

      if (anchors.length) {
        log('Найдены темы в базе данных:')
        anchors.forEach((findLink, index) => {
          const linkTitle = findLink.getAttribute('title').trim()
          // anchorAll.push(findLink)
          // anchorAllTitles.push(linkTitle)
          const hasAlreadyThisName = anchorAllMap[linkTitle]
          if (!hasAlreadyThisName) {
            // берем всегда первое полное совпадение, а то бывает 2 теста одинаково называются
            // к примеру "Профилактика онкологических заболеваний"
            anchorAllMap[linkTitle] = findLink
            log((index + 1) + ') ' + linkTitle)

            // так как мы обрезаем поиск то тут нужно более точно уже искать совпадение
            // log('Сравниваем\n',normalizeTextCompare(linkTitle), '\n', normalizeTextCompare(certNameFinal))
            if (normalizeTextCompare(linkTitle).indexOf(normalizeTextCompare(certNameFinal)) >= 0) {
              foundLinks.push(findLink)
              anchorIndex = Object.keys(anchorAllMap).length
            }
          }
        })
        if (foundLinks.length === 0) {
          log('... НЕ ПОДОШЛИ ОТВЕТЫ ... для\n', normalizeTextCompare(certNameFinal))
        }
      } else {
        log('... НЕ НАЙДЕНО ...')
      }

      /*
        получилось так что есть 2020 варианты и просто без даты. И нужно как-то понять чтобы брать второй

        1) Тест с ответами по теме «Плоскоклеточный рак анального канала, анального края, перианальной кожи (по утвержденным клиническим рекомендациям)_2020»
        2) Тест с ответами по теме «Плоскоклеточный рак анального канала, анального края, перианальной кожи (по утвержденным клиническим рекомендациям)»
        Выбрали: Тест с ответами по теме «Плоскоклеточный рак анального канала, анального края, перианальной кожи (по утвержденным клиническим рекомендациям)_2020»

        В качестве временного решения могу предложить брать последний вариант, так как чаше нужно более новые тесты
      */
      // todo @ANKU @LOW - в будущем давать выбор пользователю

      // anchor = foundLinks[0]
      // anchor = foundLinks[foundLinks.length - 1]
      if (foundLinks.length > 1) {
        break;
      } else if (foundLinks.length === 1) {
        anchor = foundLinks[0]
      }
      prevSearch = certNameFinal
    }

    // если было несколько вариантов или не найден
    debugger
    const anchorAllTitles = Object.keys(anchorAllMap)
    if (!anchor && anchorAllTitles.length) {
      const userChoice = prompt(
        anchorAllTitles
          .map((title, index) => `${index + 1}) ${title}`)
          .join('\n'),
        `${(anchorIndex || 0) + 1}`,
      )

      if (userChoice) {
        anchor = anchorAllMap[anchorAllTitles[parseInt(userChoice, 10) - 1]]
      }
    }

    if (!anchor) {
      throw new IOMError('Не найдены ответы в базе данных на данную тему')
    }
    log('Выбрали: ' + anchor.getAttribute('title').trim())
    linkToAnswersFinal = DEFAULT_URL + anchor.getAttribute("href")

    // console.log('ССЫЛКА на ОТВЕТЫ:\n', linkToAnswersFinal)
    log('ССЫЛКА на ОТВЕТЫ:\n', anchor.getAttribute("href"))
  }

  // const htmlWithAnswers = await (await fetchFromExtension(linkToAnswersFinal)).text()
  const htmlWithAnswers = await fetchFromExtension(linkToAnswersFinal)
  const parser2 = new DOMParser()
  const docAnswers = parser2.parseFromString(htmlWithAnswers, 'text/html')

  return answersParsing(docAnswers)
}


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

class IOMError extends Error {
  constructor(message, ...otherArgs) {
    super(message);
    this.otherArgs = otherArgs;
  }
}

function getRandomInt(min, max) {
  return Math.round(Math.random() * (max - min) + min);
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
      throw new IOMError('Неправильная верстка блока вопросов')
    }
    const question = questionEl.textContent

    if (prevQuestion !== question) {
      // todo @ANKU @LOW - так как таймер 2000 результат может не успеть поставится и запускается поврно
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
      // заголовок - ссылка на span
    }

    const testAnswer = (el, checkedClassName) => {
      const isChecked = el.className.indexOf(checkedClassName) >= 0
      // подходит как для множества так и для одно элемента
      const spanEl = el.querySelector('span')
      const answerFromPage = spanEl.textContent

      pageAnswersMap[answerFromPage] = spanEl

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
            setTimeout(() => spanEl.click(), 100)
            return true
          }
        }
        const result = findAnswers?.some((answersVariant, variantIndex) => {
          return answersVariant.some((answer) => {
            const isCorrect = compareAnswer(answer, answerFromPage)
            if (
              // если нужно сделать ошибку, то выбираем неправильный вариант для клика
              pageQuestionNumber === randomOneMistakeNumber && !isCorrect
              || isCorrect
            ) {
              hasAnyAnswer = true
              spanEl.click()
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
      // после каждого клика обновляются дом и нужно элементы заново искать
      for(let i=0; i < answersEls.length; i++) {
        testAnswer(
          document.querySelectorAll('.mat-mdc-checkbox')[i],
          'mat-mdc-checkbox-checked'
        )
      }
    } else {
      // ОДИН ОТВЕТ
      const radioEls = document.querySelectorAll('.mat-mdc-radio-button')
      radioEls.forEach((radioEl, index) => {
        testAnswer(radioEl, 'mat-mdc-radio-checked')
      })
    }

    if (!hasAnyAnswer) {
      const manualAnswers = prompt(
        'На вопрос:\n' + question
        + '\nне найден ответы. Выберите сами '
        + (isMultiple ? 'НЕСКОЛЬКО (через пробел) номеров ответов' : 'ОДИН номер ответ') + ':\n\n'
        + Object.keys(pageAnswersMap).map((qu, index) => `${index + 1}) ${qu}`).join('\n'),
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
                pageAnswersMap[title].click()
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
  async function checkAnswerWrapper() {
    try {
      const isEnd = await checkAnswer()
      if (!isEnd) {
        // todo @ANKU @LOW - вынеси это в настройки
        // запускаем проверку еще раз пока не дойдем до последней кнопки
        const randomAnswerDelay = getRandomInt(6000, 11000)
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


let intervalRunSearchQAForm
async function runSearchQAForm() {
  const hasQAs = document.querySelector('#questionAnchor')

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

window.onload = function() {
  // можно также использовать window.addEventListener('load', (event) => {

  // use null-safe operator since chrome.runtime
  // is lazy inited and might return undefined
  setTimeout(() => {
    if (chrome.runtime?.id && chrome.storage?.sync) {
      // сначала нужно сбросить background статус
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
      moduleStatus: MODULE_STATUS.START_SERVICE,
      error: undefined,
    })
  }
  return false
}

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
        log('Подстановка значений...')
        startExecute(finalMapResult)
        break
    }
  })()
})
