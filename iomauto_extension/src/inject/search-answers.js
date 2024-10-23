// ======================================================
// PROGRAM
// ======================================================
// todo @ANKU @LOW - убрать в настройки
// const DEFAULT_URL =
// 'https://24forcare.com/search/?query=%D0%9E%D1%81%D1%82%D1%80%D1%8B%D0%B9+%D0%BA%D0%BE%D1%80%D0%BE%D0%BD%D0%B0%D1%80%D0%BD%D1%8B%D0%B9+%D1%81%D0%B8%D0%BD%D0%B4%D1%80%D0%BE%D0%BC+%D0%B1%D0%B5%D0%B7+%D0%BF%D0%BE%D0%B4%D1%8A%D0%B5%D0%BC%D0%B0+%D1%81%D0%B5%D0%B3%D0%BC%D0%B5%D0%BD%D1%82%D0%B0+ST+%D1%8D%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BA%D0%B0%D1%80%D0%B4%D0%B8%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D1%8B+%28%D0%BF%D0%BE+%D1%83%D1%82%D0%B2%D0%B5%D1%80%D0%B6%D0%B4%D0%B5%D0%BD%D0%BD%D1%8B%D0%BC+%D0%BA%D0%BB%D0%B8%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%BC+%D1%80%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D0%B0%D1%86%D0%B8%D1%8F%D0%BC%29'
const SEARCH_URL = 'https://24forcare.com/'

function answersParsing(doc = document) {
  const mapResult = {}
  // const startElement = 10
  // const endElement = 197
  let question = ''

  const rowEls = doc.querySelectorAll('body > section > div > div > div.col-md.mw-820')
  if (rowEls.length === 0) {
    log('ОШИБКА - не найдены ответы в интернете', doc.querySelector('body > section'))
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

          item.querySelectorAll('strong')
            .forEach((aItem) => {
              if (aItem) {
                answers.push(aItem.textContent
                  // убрать 1) и + в конце и кавычки в начале и в конце
                  .replaceAll(/^"/g, '')
                  .replaceAll(/^\d+\) /g, '')
                  .replaceAll(/[\.\;\+"]+$/g, ''),
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

const SEARCH_MATCHES = [
  // 1) убираем год - так как часто 2021 в базе ответов нет
  // -2021
  // (searchTerm) => searchTerm.replaceAll(/\s?-?\s?\d{4}$/gi, ''),

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
    let anchorPosition
    let prevSearch = certName

    for (let i = 0; !anchor && i < SEARCH_MATCHES.length; i++) {
      const matcher = SEARCH_MATCHES[i]

      const certNameFinal = matcher(certName, prevSearch)

      console.log('Поиск...\n', certNameFinal)
      const htmlWithSearch = await fetchFromExtension(SEARCH_URL + 'search/?' + new URLSearchParams({
        query: certNameFinal,
        // credentials: "include"
      }).toString())
      const parserSearch = new DOMParser()
      const docSearch = parserSearch.parseFromString(htmlWithSearch, 'text/html')

      // todo @ANKU @CRIT @MAIN - todo несколько вариантов ответов
      // const anchor = docSearch.querySelector(
      //   '#pdopage > .rows > * > .item > .item-name')

      const anchors = docSearch.querySelectorAll('.item-name')
      let foundLinks = []

      if (anchors.length) {
        log('Найдены темы в базе данных:')
        anchors.forEach((findLink, index) => {
          const linkTitle = findLink.getAttribute('title')
            .replaceAll('Тест с ответами по теме', '')
            .trim()
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
            if (normalizeTextCompare(linkTitle) === normalizeTextCompare(certName)) {
              foundLinks.push(findLink)
              anchorPosition = Object.keys(anchorAllMap).length
            } else {
              log('Сравнение\n', normalizeTextCompare(linkTitle), '\n', normalizeTextCompare(certName))
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
        break
      } else if (foundLinks.length === 1) {
        anchor = foundLinks[0]
      }
      prevSearch = certNameFinal
    }

    // если было несколько вариантов или не найден
    const anchorAllTitles = Object.keys(anchorAllMap)
    if (!anchor && anchorAllTitles.length) {
      const userChoice = prompt(
        `ВНИМАНИЕ! Точной темы НЕ НАЙДЕНО в базе ответов!\n
Можете попробовать выбрать один из похожих, НО там может не быть некоторых ответов:\n
${
  anchorAllTitles
    .map((title, index) => `${index + 1}) ${title}`)
    .join('\n')
}`,
        `${anchorPosition || 1}`,
      )

      if (userChoice) {
        // index = position - 1
        anchor = anchorAllMap[anchorAllTitles[parseInt(userChoice, 10) - 1]]
      }
    }

    if (!anchor) {
      throw new IOMError('Не найдены ответы в базе данных на данную тему')
    }
    log('Выбрали: ' + anchor.getAttribute('title').trim())
    linkToAnswersFinal = SEARCH_URL + anchor.getAttribute('href')

    // console.log('ССЫЛКА на ОТВЕТЫ:\n', linkToAnswersFinal)
    log('ССЫЛКА на ОТВЕТЫ:\n', anchor.getAttribute('href'))
  }

  // const htmlWithAnswers = await (await fetchFromExtension(linkToAnswersFinal)).text()
  const htmlWithAnswers = await fetchFromExtension(linkToAnswersFinal)
  const parser2 = new DOMParser()
  const docAnswers = parser2.parseFromString(htmlWithAnswers, 'text/html')

  return answersParsing(docAnswers)
}
