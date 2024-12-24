const {
  normalizeTopicTitle,
  normalizeQuestion,
  normalizeAnswer,
  normalizeTopicId
} = require('./normalize')
const {
  modelQuestion,
  modelTopic,
} = require('../constants')


const PARSER_RESULT_PAGE_HTML = 'resultPageHtml'

function parseFormatResultPageHtml(fileName, document, trustLevel, silent) {
  const topicTitle = normalizeTopicTitle(
    (
      document.querySelector('.mat-card-title-quiz-custom')
      || document.querySelector('.mat-expansion-panel-header-title')
    )
    .textContent
    .replace(/ - Предварительное тестирование/, '')
    .replace(/ - Итоговое тестирование/, '')
  )
  console.log('Тема: ', topicTitle)

  let answersCorrect = 0
  let prevQuestionNumber

  const questions = [...document.querySelectorAll('.questionList-item')]
    .map((htmlItem) => {
      const questionNumber = parseInt(htmlItem.querySelector('.questionList-item-number').textContent.trim(), 10)
      const question = normalizeQuestion(
        htmlItem.querySelector('.questionList-item-content-title').textContent.trim()
      )

      const answers = [...htmlItem.querySelectorAll('.questionList-item-content-answer-text')]
        .map((node) => normalizeAnswer(node.textContent))

      let correct = htmlItem.querySelector('.questionList-item-status-wright')

      if (correct && answers.length === 0) {
        (silent ? console.log : console.error)('Ошибка: не найдены правильные ответы\n', questionNumber, question)
      }
      if (prevQuestionNumber && (prevQuestionNumber + 1 !== questionNumber)) {
        (silent ? console.log : console.error)('Ошибка: неправильная последовательность вопросов\n', questionNumber, question)
      }

      const questionItem = modelQuestion({
        number: questionNumber,
        question,
        answers: correct ? answers : [],
      })

      if (correct) {
        answersCorrect++
      }

      prevQuestionNumber = questionNumber

      return questionItem
    })


  const topic = modelTopic({
    id: normalizeTopicId(topicTitle),
    title: topicTitle,
    questions,
    from: PARSER_RESULT_PAGE_HTML,

    trustLevel,
    // // answersCount: Object.keys(answersMap).length,
    answersCorrect,
    // rate,
  })

  return topic
}

module.exports = {
  parseFormatResultPageHtml,
}


