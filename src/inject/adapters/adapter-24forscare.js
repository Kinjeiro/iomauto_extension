import { normalizeAnswer, normalizeQuestion, normalizeTopicId } from '../normalize'
import { getHtmlDocument, log } from '../utils'
import { modelSearchAdapter, modelTopicSearchItem } from './models'


export const ADAPTER_24_FORCARE_COM_ID = '24forcare.com'

export function answersParsing24forcare(rowEls = []) {
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
          question = normalizeQuestion(item.textContent)
        } else if (question && item.nodeName === 'P' && item.childNodes.length > 0) {
          const answers = []

          item.querySelectorAll('strong')
            .forEach((aItem) => {
              if (aItem) {
                answers.push(normalizeAnswer(aItem.textContent))
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

          // if (!mapResult[question]) {
          //   mapResult[question] = []
          // }
          /*
            В ответах сразу два одинаковых вопроса, просто варианты выбора разные.
            Сделай multiple решение:
            [
               ["ответ 1", "ответ 2"],
               ["ответ 4"],
            ]
          */
          mapResult[question] = answers
        }
      })
  }

  return mapResult
}

export const ADAPTER_24_FORCARE_COM = modelSearchAdapter({
  id: ADAPTER_24_FORCARE_COM_ID,
  domainUrl: 'https://24forcare.com/',
  getUrlTopics(certName) {
    return this.domainUrl + 'search/?' + new URLSearchParams({
      query: certName,
      // credentials: "include"
    }).toString()
  },
  /* linkTitle, fullUrl, source, localItemId []*/
  async findTopicItems(certName, searchFullTopicId) {
    const searchPageDocument = await getHtmlDocument(this.getUrlTopics(certName))

    const searchItems = Array.from(searchPageDocument.querySelectorAll('.item-name'))
      .map((findLink) => modelTopicSearchItem({
        source: ADAPTER_24_FORCARE_COM_ID,
        linkTitle: findLink.text
          .replaceAll('Тест с ответами по теме', '')
          .trim()
          .replaceAll(/[«»]/g, ''),
        content: 'https://24forcare.com/' + findLink.getAttribute('href'),
      }))

    const result = []
    for await (const searchItem of searchItems) {
      const topicId = normalizeTopicId(searchItem.linkTitle)
      if (topicId === searchFullTopicId) {
        // нужно проверить результаты, так как есть страница, а ответов на нее нет
        const answersMap = await this.findAnswersMap(searchItem.content)
        if (Object.keys(answersMap).length < 10) {
          log('На сайте ' + this.domainUrl + ' в этой теме УЖЕ НЕТ ответов', answersMap)
        } else {
          result.push({
            ...searchItem,
            content: answersMap,
          })
        }
      } else {
        result.push(searchItem)
      }
    }

    return result
  },
  async findAnswersMap(fullUrl) {
    if (typeof fullUrl !== 'string') {
      // это answersMap, которую мы загрузили ранее
      return fullUrl
    }

    const answersPageDocument = await getHtmlDocument(fullUrl)

    return answersParsing24forcare(
      answersPageDocument.querySelector('body > section > div > div > div.col-md.mw-820').childNodes
    )
  }
})
