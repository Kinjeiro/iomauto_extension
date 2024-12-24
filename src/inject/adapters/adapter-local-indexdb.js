import { ACTIONS, modelQuestion, modelTopic } from '../../constants'
import { modelSearchAdapter, modelTopicSearchItem } from './models'


export const ADAPTER_INDEX_DB_ID = 'local'

export const ADAPTER_INDEX_DB = modelSearchAdapter({
  id: ADAPTER_INDEX_DB_ID,
  isLocal: true,

  /* linkTitle, fullUrl, source []*/
  async findTopicItems(searchTerm) {
    const {
      records,
      // total: records.length,
      // success: !error,
      // error,
    } = await chrome.runtime.sendMessage(
      undefined,
      {
        action: ACTIONS.LOCAL_DB_SEARCH_TOPICS,
        payload: searchTerm
          .replace('по утвержденным клиническим рекомендациям', '')
          .trim(),
      },
      // (response) => {
      //   console.log('ANKU ,response',response)
      //   debugger
      //   return response
      // }
    )
    const questionsMap = records.reduce((result, record) => {
      const topic = modelTopic(record)

      result.push(modelTopicSearchItem({
        source: ADAPTER_INDEX_DB_ID,
        linkTitle: topic.title,
        content: topic.questions,
      }))
      //
      // if (!/\d{4}$/.test(topic.title)) {
      //   // если не оканчивается на год - добавим 2020 для точности
      //   // так как раньше темы назывались без года
      //   result.push(modelTopicSearchItem({
      //     source: ADAPTER_INDEX_DB_ID,
      //     linkTitle: topic.title + ' 2020',
      //     content: topic.questions,
      //   }))
      // }

      return result
    }, [])

    return questionsMap
  },
  async findAnswersMap(content) {
    // в content мы выше запихнули уже массив theme.questions
    return content.reduce((resultMap, questionItem) => {
      const question = modelQuestion(questionItem)
      // бывает одинаковые вопросы и разные ответы, поэтому сделали массив массивов
      // resultMap[question.question] = question.correctAnswers
      resultMap[question.question] = question.answers
      return resultMap
    }, {})
  }
})
