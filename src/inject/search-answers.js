import { modelTopicSearchItem } from './adapters/models'
import { normalizeTextCompare, normalizeTopicId } from './normalize'
import { IOMError, log, logDebug, logError } from './utils'

import { ADAPTER_24_FORCARE_COM } from './adapters/adapter-24forscare'
import { ADAPTER_INDEX_DB } from './adapters/adapter-local-indexdb'
import { ADAPTER_RESHNMO_RU } from './adapters/adapter-reshnmo'
import { ADAPTER_NMO_TEST_ONLINE } from './adapters/adapter-nmo-test-online'


// ======================================================
// PROGRAM
// ======================================================
// todo @ANKU @LOW - убрать в настройки
// const DEFAULT_URL =
// 'https://24forcare.com/search/?query=%D0%9E%D1%81%D1%82%D1%80%D1%8B%D0%B9+%D0%BA%D0%BE%D1%80%D0%BE%D0%BD%D0%B0%D1%80%D0%BD%D1%8B%D0%B9+%D1%81%D0%B8%D0%BD%D0%B4%D1%80%D0%BE%D0%BC+%D0%B1%D0%B5%D0%B7+%D0%BF%D0%BE%D0%B4%D1%8A%D0%B5%D0%BC%D0%B0+%D1%81%D0%B5%D0%B3%D0%BC%D0%B5%D0%BD%D1%82%D0%B0+ST+%D1%8D%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BA%D0%B0%D1%80%D0%B4%D0%B8%D0%BE%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D1%8B+%28%D0%BF%D0%BE+%D1%83%D1%82%D0%B2%D0%B5%D1%80%D0%B6%D0%B4%D0%B5%D0%BD%D0%BD%D1%8B%D0%BC+%D0%BA%D0%BB%D0%B8%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%BC+%D1%80%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D0%B0%D1%86%D0%B8%D1%8F%D0%BC%29'
// const SEARCH_URL = 'https://24forcare.com/'


const SEARCH_ADAPTERS = [
  ADAPTER_INDEX_DB,
  ADAPTER_NMO_TEST_ONLINE,
  ADAPTER_RESHNMO_RU,
  ADAPTER_24_FORCARE_COM,
]

const SEARCH_MATCHES = [
  // 1) убираем год - так как часто 2021 в базе ответов нет
  // -2021
  // (searchTerm) => searchTerm
  //   .replaceAll(/["«»]/gi, '') // c " на сайте плохо ищется
  (searchTerm) => normalizeTextCompare(searchTerm, true)
    .replaceAll(/\s?-?\s?\d{4}$/gi, ''), // убираем в конце год

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

export async function searchAnswers(certName) {
  log('ТЕМА:\n', certName)
  const fullTitleHash = normalizeTopicId(certName)

  let resultTopicSearchItem
  if (!resultTopicSearchItem) {
    // const htmlWithSearch = await (await fetch(DEFAULT_URL + 'search/?' + new URLSearchParams({
    //   query: certName,
    //   // credentials: "include"
    // }).toString())).text()

    // { title: topic }
    const topicsAllMap = {}

    // const anchorAll = []
    // const anchorAllTitles = []
    let topicPosition
    let prevSearch = certName

    for (let i = 0; !topicPosition && i < SEARCH_MATCHES.length; i++) {
      const matcher = SEARCH_MATCHES[i]

      const certNameFinal = matcher(certName, prevSearch)
      log('Поиск...\n', certNameFinal)

      let isFound = false

      for (let siteIndex = 0; siteIndex < SEARCH_ADAPTERS.length; siteIndex++) {
        const adapter = SEARCH_ADAPTERS[siteIndex]
        // const {
        //   isLocal,
        //   domainUrl,
        //   getUrlTopics,
        //   /* linkTitle, fullUrl, source, localItemId */
        //   findTopicsAnchors,
        // } = SEARCH_SITES[siteIndex]

        log(adapter.isLocal ? 'Локальная база' : `Сайт - ${adapter.domainUrl}`)

        let topicSearchItems
        try {
          topicSearchItems = await adapter.findTopicItems(certNameFinal, fullTitleHash)
        } catch (e) {
          logError(e)
          topicSearchItems = []
        }

        // if (isLocal) {
        //   log('Локальная база')
        //
        //   anchors = await findTopicsAnchors(undefined, certNameFinal)
        //   console.log('ANKU , anchors', anchors)
        //   debugger
        // } else {
        //   log('Сайт - ', domainUrl)
        //
        //   const searchUrl = domainUrl + getUrlTopics(certNameFinal)
        //   log(searchUrl)
        //   const htmlWithSearch = await fetchFromExtension(searchUrl)
        //   const parserSearch = new DOMParser()
        //   const docSearch = parserSearch.parseFromString(htmlWithSearch, 'text/html')
        //
        //   anchors = await findTopicsAnchors(docSearch, certNameFinal)
        // }

        let foundLinks = []

        if (topicSearchItems.length) {
          log('Найдены темы в базе данных:')

          topicSearchItems.forEach((item, index) => {
            const topicSearchItem = modelTopicSearchItem(item)
            const {
              linkTitle,
              content,
              source,
            } = topicSearchItem
            // const linkTitle = findLink.getAttribute('title')

            // anchorAll.push(findLink)
            // anchorAllTitles.push(linkTitle)
            const linkTitleFinal = `[${source}] ${linkTitle}`
            const hasAlreadyThisName = topicsAllMap[linkTitleFinal]
            if (!hasAlreadyThisName) {
              // берем всегда первое полное совпадение, а то бывает 2 теста одинаково называются
              // к примеру "Профилактика онкологических заболеваний"
              // topicsAllMap[linkTitleFinal] = content
              topicsAllMap[linkTitleFinal] = topicSearchItem
              log((index + 1) + ') ' + linkTitle)

              const linkHash = normalizeTopicId(linkTitle)
              const shortTitleHash = normalizeTopicId(certNameFinal)
              // так как мы обрезаем поиск то тут нужно более точно уже искать совпадение
              // log('Сравниваем\n',normalizeTextCompare(linkTitle), '\n', normalizeTextCompare(certNameFinal))
              if (linkHash.indexOf(shortTitleHash) >= 0) {
                // todo @ANKU @LOW - можно переделать вообще на boolean
                // убрали год и есть ли похожие
                foundLinks.push(content)

                if (linkHash === fullTitleHash) {
                  // проставляем только если точное совпадение вместе с годом
                  topicPosition = Object.keys(topicsAllMap).length
                } else {
                  logDebug('Сравнение не полное\n', linkHash, linkHash.length, '\n', fullTitleHash, fullTitleHash.length)
                }
              } else {
                logDebug('Сравнение не короткое\n', linkHash, linkHash.length, '\n', shortTitleHash, shortTitleHash.length)
              }
            } else {
              logDebug('Уже такая тема есть')
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
        if (typeof topicPosition !== 'undefined') {
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
      if (Object.keys(topicsAllMap).length > 0) {
        // что-то нашлось, прерываем поиск
        // ИЛИ ответы были найдены, но ни один не подошел.
        // Можно заканчивать искать, так как поиски идут от более конкретного к аюстрактному
        break
      }

      prevSearch = certNameFinal
    }

    // если было несколько вариантов или не найден
    const topicAllTitles = Object.keys(topicsAllMap)
    if (!topicPosition && topicAllTitles.length) {
      const userChoice = prompt(
        `ВНИМАНИЕ! Точной темы НЕ НАЙДЕНО в базе ответов!\n
Можете попробовать выбрать один из похожих, НО там может не быть некоторых ответов:\n
${
  topicAllTitles
    .map((title, index) => `${index + 1}) ${title}`)
    .join('\n')
}`,
        `${topicPosition || 1}`,
      )

      if (userChoice) {
        topicPosition = parseInt(userChoice, 10)
      }
    }

    if (!topicPosition) {
      alert('К сожалению, на данную тему сейчас НЕ НАШЛОСЬ ответов в базе данных\n\n' +
        // 'Если на сайте ' + domainUrl + ' есть такая тема, пожалуйста,\n' +
        'Если найдете на сайтах ответы, пожалуйста,\n' +
        'сообщите нам в группу https://t.me/iomauto\n' +
        'Возможно ошибка в самом плагине и мы постараемся его починить')

      throw new IOMError('Не найдены ответы в базе данных на данную тему')
    }

    // index = position - 1
    log('Выбрали: ' + topicAllTitles[topicPosition - 1])
    resultTopicSearchItem = topicsAllMap[topicAllTitles[topicPosition - 1]]
    // log('ССЫЛКА на ОТВЕТЫ:\n', resultTopicSearchItem)
  }

  // const htmlWithAnswers = await (await fetchFromExtension(linkToAnswersFinal)).text()
  const resultAdapter = SEARCH_ADAPTERS.find(({ id }) => resultTopicSearchItem.source === id)
  const answersMap = await resultAdapter.findAnswersMap(resultTopicSearchItem.content)

  log('ОТВЕТЫ\n', answersMap)
  return answersMap

  // if (isSiteEngine(contentIdentificationFinal)) {
  //   const htmlWithAnswers = await fetchFromExtension(contentIdentificationFinal)
  //   const parser2 = new DOMParser()
  //   const docAnswers = parser2.parseFromString(htmlWithAnswers, 'text/html')
  //
  //   const siteEngine = SEARCH_ADAPTERS.find(({ domainUrl }) =>
  //     contentIdentificationFinal.indexOf(domainUrl) === 0)
  //   // return answersParsing(docAnswers)
  //   return await siteEngine.findAnswersMap(docAnswers)
  // } else {
  //   // local item id
  //   const localEngine = SEARCH_ADAPTERS.find(({ isLocal }) => isLocal)
  //   return localEngine.findAnswersMap(undefined, contentIdentificationFinal)
  // }
}

