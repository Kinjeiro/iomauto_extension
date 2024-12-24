const {
  normalizeTopicTitle,
  normalizeQuestion,
  normalizeAnswer,
  normalizeTopicId
} = require('../../src/inject/normalize')
const {
  modelQuestion,
  modelTopic,
} = require('../../src/constants')
const { logError } = require('../utils')


const PARSER_SEREGI_TXT = 'resultSeregiTxt'

function parseFormatSeregiTxt(fileName, strings, trustLevel) {
  const globalMatch = /^(.*)\n\n((\n|.)+)/gm.exec(
    strings.replace(/\r/g, '')
  )


  const topicTitle = normalizeTopicTitle(globalMatch[1])
  console.log('Тема: ', topicTitle)

  const questionsBlock = globalMatch[2]

  const questionsRegexp = /(.*)\n((\n|.)*?)\n\n/gm

  let questions = []
  let questionMatch
  let questionNumber = 1
  let answersCorrect = 0

  while ((questionMatch = questionsRegexp.exec(questionsBlock)) !== null) {
    const question = normalizeQuestion(questionMatch[1])

    let isCorrect
    const answers = []
    const lines = [
      ...(questionMatch[2] || '').split('\n'),
    ]
    lines.forEach((line) => {
      const lineStr = line.trim()
      if (lineStr.indexOf('+') >= 0) {
        isCorrect = true
        answersCorrect++
        answers.push(
          normalizeAnswer(
            lineStr.replace(/^\+ /, '')
          )
        )
      }
    })
    if (answers.length === 0) {
      logError('Ошибка: не найдены правильные ответы\n', questionNumber, question)
    }

    questions.push(modelQuestion({
      number: questionNumber,
      question,
      answers: isCorrect ? answers : [],
    }))

    questionNumber++
  }

  const topic = modelTopic({
    id: normalizeTopicId(topicTitle),
    title: topicTitle,
    questions,
    from: PARSER_SEREGI_TXT,

    trustLevel,
    // answersCount: Object.keys(answersMap).length,
    answersCorrect,
    // rate,
  })

  return topic
}

module.exports = {
  parseFormatSeregiTxt,
}


