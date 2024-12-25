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

function parseFormatSeregiTxtSingle(fileName, strings, trustLevel, canBeEmpty) {
  const globalMatch = /\n?^(.*)(\n\n)?((\n|.)+)/m.exec(
    strings.replace(/\r/g, '')
  )

  if (!globalMatch) {
    debugger
  }

  const topicTitle = normalizeTopicTitle(globalMatch[1])
  console.log('Тема: ', topicTitle)

  const questionsBlock = globalMatch[3] + '\n ' // для поиска

  // (.*\n)((^\+.*?\n)*)(\n\n)?(?=[^+])
  const questionsRegexp = /(.+\n)((^[+-].*?\n)*)\n?(?=[^\n])/gm

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
      } else {
        // пустые или минусы пока не обрабатываем
      }
    })
    if (!canBeEmpty && answers.length === 0) {
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

function parseFormatSeregiTxt(fileName, multiTopics, trustLevel) {
  let multiTopicsFinal = multiTopics
    .replace(/\r/g, '')
    .replace(/[  ]\n/gm, '\n')
    // Кирилл Богомолов, [24.12.2024 20:34]
    .replace(/^.*, \[\d{2}\.\d{2}\.\d{4} \d{1,2}:\d{1,2}\]\n/mg, '') // уберем телеграмм Анна В., [25.12.2024 21:32]
    .replace(/\n\n\n/gm, '')

  if (multiTopicsFinal.indexOf('#ответы') < 0) {
    multiTopicsFinal = '#ответы\n\n' + multiTopicsFinal
  }
  multiTopicsFinal = multiTopicsFinal + '#ответы\n\n' // в конце для поиска

  const topicRegexp = /^#ответы\n\n?((\n|.)+?)(?=#ответы\n\n)/gm

  const topics = []

  let topicMatch
  while ((topicMatch = topicRegexp.exec(multiTopicsFinal)) !== null) {
    const topic = parseFormatSeregiTxtSingle(fileName, topicMatch[1], trustLevel, true)
    topics.push(topic)
  }

   return topics
}

module.exports = {
  parseFormatSeregiTxt,
}


