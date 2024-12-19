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
    return records.map((record) => {
      const theme = modelTopic(record)
      return modelTopicSearchItem({
        source: ADAPTER_INDEX_DB_ID,
        linkTitle: theme.title,
        content: theme.questions,
      })
    })
  },
  async findAnswersMap(content) {
    // в content мы выше запихнули уже массив theme.questions
    return content.reduce((resultMap, questionItem) => {
      const question = modelQuestion(questionItem)
      // бывает одинаковые вопросы и разные ответы, поэтому сделали массив массивов
      // resultMap[question.question] = question.correctAnswers
      resultMap[question.question] = [question.correctAnswers]
      return resultMap
    }, {})
  }
})
