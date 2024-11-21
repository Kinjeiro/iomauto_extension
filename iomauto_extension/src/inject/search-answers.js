// ======================================================
// PROGRAM
// ======================================================
// todo @ANKU @LOW - убрать в настройки
// const DEFAULT_URL =
// 'https://24forcare.com/search/?query=%D0%9E%D1%81%D1%82%D1%80%D1%8B%D0%B9+%D0%BA%D0%BE%D1%80%D0%BE%D0%BD%D0%B0%D1%80%D0%BD%D1%8B%D0%B9+%D1%81%D0%B8%D0%BD%D0%B4%D1%80%D0%BE%D0%BC+%D0%B1%D0%B5%D0%B7+%D0%BF%D0%BE%D0%B4%D1%8A%D0%B5%D0%BC%D0%B0+%D1%81%D0%B5%D0%B3%D0%BC%D0%B5%D0%BD%D1%82%D0%B0+ST+%D1%8D%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BA%D0%B0%D1%80%D0%B4%D0%B8%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D1%8B+%28%D0%BF%D0%BE+%D1%83%D1%82%D0%B2%D0%B5%D1%80%D0%B6%D0%B4%D0%B5%D0%BD%D0%BD%D1%8B%D0%BC+%D0%BA%D0%BB%D0%B8%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%BC+%D1%80%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D0%B0%D1%86%D0%B8%D1%8F%D0%BC%29'
const SEARCH_URL = 'https://24forcare.com/'

const SEARCH_SITES = [
  {
    /*
    https://reshnmo.ru/?s=%D0%BE%D1%81%D1%82%D1%80%D1%8B%D0%B9+%D0%B3%D0%B5%D0%BF%D0%B0%D1%82%D0%B8%D1%82+%D0%92

    document.querySelectorAll('.post-card__title a')

    https://reshnmo.ru/testy-nmo/test-s-otvetami-po-teme-ostryy-gepatit-v-ogv-u-detey-po-utverzhdennym-klinicheskim-rekomendatsiyam-testy-nmo-s-otvetami
    .entry-content h3
    .entry-content p strong
    */
    domainUrl: 'https://reshnmo.ru/',
    getUrlTopics: (certNameFinal) => {
      return '?' + new URLSearchParams({
        s: certNameFinal,
        // credentials: "include"
      }).toString()
    },
    findTopicsAnchors: (searchPageDocument) => {
      return Array.from(searchPageDocument.querySelectorAll('.post-card--standard .post-card__title a'))
        .map((findLink) => ({
          fullUrl: findLink.getAttribute('href'),
          linkTitle: findLink.text
            .replaceAll('Тест с ответами по теме', '')
            .replaceAll(' | Тесты НМО с ответами', '')
            .trim()
            .replaceAll(/[«»]/g, ''),
        }))
    },
    findAnswersMap: (answersPageDocument) => {
      // там такой же парсинг h3 + p strong
      return answersParsing24forcare(
        answersPageDocument.querySelector('.entry-content').childNodes
      )
    }
  },
  {
    domainUrl: 'https://24forcare.com/',
    getUrlTopics: (certNameFinal) => {
      return 'search/?' + new URLSearchParams({
        query: certNameFinal,
        // credentials: "include"
      }).toString()
    },
    findTopicsAnchors: (searchPageDocument) => {
      return Array.from(searchPageDocument.querySelectorAll('.item-name'))
        .map((findLink) => ({
          fullUrl: 'https://24forcare.com/' + findLink.getAttribute('href'),
          linkTitle: findLink.text
            .replaceAll('Тест с ответами по теме', '')
            .trim()
            .replaceAll(/[«»]/g, ''),
        }))
    },
    findAnswersMap: (answersPageDocument) => {
      return answersParsing24forcare(
        answersPageDocument.querySelector('body > section > div > div > div.col-md.mw-820').childNodes
      )
    }
  },
]


function answersParsing24forcare(rowEls = []) {
  const mapResult = {}
  // const startElement = 10
  // const endElement = 197
  let question = ''

  // const rowEls = doc.querySelectorAll('body > section > div > div > div.col-md.mw-820')
  if (rowEls.length === 0) {
    log('ОШИБКА - не найдены ответы в интернете')
    debugger
    throw new Error('ОШИБКА - не найдены ответы в интернете')
  } else {
    rowEls
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
  (searchTerm) => searchTerm
    .replaceAll(/["«»]/gi, '') // c " на сайте плохо ищется
    .replaceAll(/\s?-?\s?\d{4}$/gi, ''),

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
  (searchTerm, prevTerm) => normalizeTextCompare(prevTerm, true)
    .replaceAll('по клиническим рекомендациям', ''),

  // 3) "Взрослые" в ответах, а в вопросе уже нет
  // Доброкачественная гиперплазия предстательной железы (по утвержденным клиническим рекомендациям) - 2024
  // Доброкачественная гиперплазия предстательной железы. Взрослые (по утвержденным клиническим рекомендациям) - 2024
  (searchTerm) => normalizeTextCompare(searchTerm, true)
    .replaceAll(/""«»/gi, '')
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
    let anchorPosition
    let prevSearch = certName

    for (let i = 0; !anchorPosition && i < SEARCH_MATCHES.length; i++) {
      const matcher = SEARCH_MATCHES[i]

      const certNameFinal = matcher(certName, prevSearch)
      log('Поиск...\n', certNameFinal)

      let isFound = false

      for (let siteIndex = 0; siteIndex < SEARCH_SITES.length; siteIndex++) {
        const {
          domainUrl,
          getUrlTopics,
          findTopicsAnchors,
        } = SEARCH_SITES[siteIndex]

        log('Сайт - ', domainUrl)

        const searchUrl = domainUrl + getUrlTopics(certNameFinal)
        log(searchUrl)
        const htmlWithSearch = await fetchFromExtension(searchUrl)
        const parserSearch = new DOMParser()
        const docSearch = parserSearch.parseFromString(htmlWithSearch, 'text/html')


        // todo @ANKU @CRIT @MAIN - todo несколько вариантов ответов
        // const anchor = docSearch.querySelector(
        //   '#pdopage > .rows > * > .item > .item-name')

        const anchors = findTopicsAnchors(docSearch)
        let foundLinks = []

        if (anchors.length) {
          log('Найдены темы в базе данных:')
          anchors.forEach(({ linkTitle, fullUrl }, index) => {
            // const linkTitle = findLink.getAttribute('title')

            // anchorAll.push(findLink)
            // anchorAllTitles.push(linkTitle)
            const hasAlreadyThisName = anchorAllMap[linkTitle]
            if (!hasAlreadyThisName) {
              // берем всегда первое полное совпадение, а то бывает 2 теста одинаково называются
              // к примеру "Профилактика онкологических заболеваний"
              anchorAllMap[linkTitle] = fullUrl
              log((index + 1) + ') ' + linkTitle)

              const linkHash = normalizeTextCompare(linkTitle)
              const shortTitleHash = normalizeTextCompare(certNameFinal)
              const fullTitleHash = normalizeTextCompare(certName)
              // так как мы обрезаем поиск то тут нужно более точно уже искать совпадение
              // log('Сравниваем\n',normalizeTextCompare(linkTitle), '\n', normalizeTextCompare(certNameFinal))
              if (linkHash.indexOf(shortTitleHash) >= 0) {
                // убрали год и есть ли похожие
                foundLinks.push(fullUrl)

                if (linkHash === fullTitleHash) {
                  // проставляем только если точное совпадение вместе с годом
                  anchorPosition = Object.keys(anchorAllMap).length
                } else {
                  log('Сравнение не полное\n', linkHash, linkHash.length, '\n', fullTitleHash, fullTitleHash.length)
                }
              } else {
                log('Сравнение не короткое\n', linkHash, linkHash.length, '\n', shortTitleHash, shortTitleHash.length)
              }
            } else {
              log('Уже такая тема есть')
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
        if (typeof anchorPosition !== 'undefined') {
          // точно нашлось
          isFound = true
          break
        }
        // if (foundLinks.length > 1 || anchors.length) {
        //   // что-то нашлось, прерываем поиск
        //   // ИЛИ ответы были найдены, но ни один не подошел.
        //   // Можно заканчивать искать, так как поиски идут от более конкретного к аюстрактному
        //   break
        // }
      }

      if (isFound) {
        break;
      }
      if (Object.keys(anchorAllMap).length > 0) {
        // что-то нашлось, прерываем поиск
        // ИЛИ ответы были найдены, но ни один не подошел.
        // Можно заканчивать искать, так как поиски идут от более конкретного к аюстрактному
        break
      }

      prevSearch = certNameFinal
    }

    // если было несколько вариантов или не найден
    const anchorAllTitles = Object.keys(anchorAllMap)
    if (!anchorPosition && anchorAllTitles.length) {
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
        anchorPosition = parseInt(userChoice, 10)
      }
    }

    if (!anchorPosition) {
      alert('К сожалению, на данную тему сейчас НЕ НАШЛОСЬ ответов в базе данных\n\n' +
        // 'Если на сайте ' + domainUrl + ' есть такая тема, пожалуйста,\n' +
        'Если найдете на сайтах ответы, пожалуйста,\n' +
        'сообщите нам в группу https://t.me/iomauto\n' +
        'Возможно ошибка в самом плагине и мы постараемся его починить')

      throw new IOMError('Не найдены ответы в базе данных на данную тему')
    }

    // index = position - 1
    log('Выбрали: ' + anchorAllTitles[anchorPosition - 1])
    const fullUrl = anchorAllMap[anchorAllTitles[anchorPosition - 1]]
    linkToAnswersFinal = fullUrl
    log('ССЫЛКА на ОТВЕТЫ:\n', fullUrl)
  }

  // const htmlWithAnswers = await (await fetchFromExtension(linkToAnswersFinal)).text()
  const htmlWithAnswers = await fetchFromExtension(linkToAnswersFinal)
  const parser2 = new DOMParser()
  const docAnswers = parser2.parseFromString(htmlWithAnswers, 'text/html')

  const siteEngine = SEARCH_SITES.find(({ domainUrl }) =>
    linkToAnswersFinal.indexOf(domainUrl) === 0)
  // return answersParsing(docAnswers)
  return siteEngine.findAnswersMap(docAnswers)
}
