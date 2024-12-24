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


const PARSER_RESULT_PAGE_TXT = 'resultPageTxt'

function parseFormatResultPage(fileName, strings, trustLevel) {
  const topicTitle = normalizeTopicTitle(fileName)
  console.log('Тема: ', topicTitle)

  // const resultPageRegexp = /ответов\n(\d+) из .*\nОценка\n(\d+)(.|\n)*?(^1$(.|\n)*)/m
  // const resultPageRegexp = /Протокол тестирования(\n|.)*?(^1$(.|\n)*)/m
  const resultPageRegexp = /(Протокол тестирования(\n|.)*?)?(^1\s*?$(.|\n)*)/m

  const resultPageMatch = resultPageRegexp.exec(strings)
  // const answersCorrect = parseInt(resultPageMatch[1], 10)
  // const rate = parseInt(resultPageMatch[2], 10)
  const questionsBlock = (resultPageMatch[3]
    .replace('Вернуться к обучению', '')
    .replace(/^https:.*?$/gm, '') // https://iomqt-vo.edu.rosminzdrav.ru/quiz-wrapper/...
    .replace(/^\d{2}\.\d{2}\.\d{4}.*?$/gm, '') // 11.12.2024, 21:10Тестирование НМИФО
    + '\n0') // для удобного парсинга
    .replace(/^\s*$/gm, '')
    .replace(/\n\n/gm, '\n')

  // const questionsRegexp = /^(\d+)\n((.|\n)*?)(Требовалось выбрать НЕСКОЛЬКО правильных ответов\n((\n|.)*?))?\n(.*?)\n(.*?)\n(?=^(\d+)$)/gm
  // const questionsRegexp = /^(\d{1,2})\s?\n((.|\n)*?)(Требовалось выбрать НЕСКОЛЬКО правильных ответов\n((\n|.)*?))?(.*?)\n(Верно|Не верно)\s?\n/gm
  const questionsRegexp = /^(\d{1,2})\s?\n((.|\n)*?)(Требовалось выбрать НЕСКОЛЬКО правильных ответов\n((\n|.)*?))?\n(.*?)\n(.*?)\n(?=^\d+\s?$)/gm
  // добавить \n0 чтобы поиск работал

  let questions = []
  let questionMatch
  let prevQuestionNumber
  let answersCorrect = 0

  while ((questionMatch = questionsRegexp.exec(questionsBlock)) !== null) {
    const questionNumber = parseInt(questionMatch[1], 10)
    const question = normalizeQuestion(questionMatch[2])
    // const fewAnswers = questionMatch[5]
    // let lastAnswer = questionMatch[7]
    // let correct = questionMatch[8]

    let isCorrect
    const answers = []
    const lines = [
      // если разрыв, то correct может улететь вверх
      ...(questionMatch[5] || '').split('\n'),
      questionMatch[7],
      questionMatch[8],
    ].forEach((line) => {
      if (line.trim() === 'Верно') {
        isCorrect = true
        answersCorrect++
      } else if (line.trim() === 'Не верно') {
        isCorrect = false
      } else if (line) {
        answers.push(normalizeAnswer(line))
      }
    })
    if (typeof isCorrect === 'undefined') {
      logError('Неправильно распарсилось')
    }
    if (answers.length === 0) {
      logError('Ошибка: не найдены правильные ответы\n', questionNumber, question)
    }
    if (prevQuestionNumber && (prevQuestionNumber + 1 !== questionNumber)) {
      logError('Ошибка: неправильная последовательность вопросов\n', questionNumber, question)
    }

    questions.push(modelQuestion({
      number: questionNumber,
      question,
      correctAnswers: isCorrect ? answers : [],
      // todo @ANKU @LOW - можно потом добавить wrongAnswers
    }))

    prevQuestionNumber = questionNumber
  }

  const topic = modelTopic({
    id: normalizeTopicId(topicTitle),
    title: topicTitle,
    questions,
    from: PARSER_RESULT_PAGE_TXT,

    trustLevel,
    // answersCount: Object.keys(answersMap).length,
    answersCorrect,
    // rate,
  })

  return topic
}

module.exports = {
  parseFormatResultPage,
}


