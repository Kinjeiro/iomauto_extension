import { ACTIONS, modelQuestion, modelTopic } from '../../constants'
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
  async findTopicItems(certName) {
    const searchPageDocument = await getHtmlDocument(this.getUrlTopics(certName))

    return Array.from(searchPageDocument.querySelectorAll('.item-name'))
      .map((findLink) => modelTopicSearchItem({
        source: ADAPTER_24_FORCARE_COM_ID,
        linkTitle: findLink.text
          .replaceAll('Тест с ответами по теме', '')
          .trim()
          .replaceAll(/[«»]/g, ''),
        content: 'https://24forcare.com/' + findLink.getAttribute('href'),
      }))
  },
  async findAnswersMap(fullUrl) {
    const answersPageDocument = await getHtmlDocument(fullUrl)

    return answersParsing24forcare(
      answersPageDocument.querySelector('body > section > div > div > div.col-md.mw-820').childNodes
    )
  }
})
