const fs = require('fs')
const path = require('path')
const { modelQuestion } = require('../src/constants')


function log(...message) {
  console.log(...message)
}
function logErrorSilent(...message) {
  console.error(...message)
}
function logError(...message) {
  logErrorSilent(...message)
  debugger
  // throw new Error(message[0])
}


function parseFromSingleLineData(questionsBlock, ignoreAnswerNumber = false) {
  // questionsBlock = questionsBlock.replace(/\r?\n/g, ' ')

  // Регулярное выражение для поиска тем вопросов
  // const questionRegex = /^\d+\.\s*(.+?)(?=\s*\d+\.)/gm;
  // const questionRegex = /(\d+)\.\s*(.+?)(\d+\).+?)(?=(\d+\.\s)|$)/g;
  // const questionRegex = /(\d+)\.\s+(.+?)\s(\d+\)\s.+?)(?=(\s\d+\.\s)|$)/g;
  //  26. Типичным при В12 дефицитной анемии является: 1) одутловатость лица, 2) усиленная мимика, 3) амимичность, 4) бледность кожи и видимых слизистых, 5) бледно- желтушный цвет кожи, 6) «малиновый лаковый язык» – сглаженность сосочков языка. Выберите наиболее полную и правильную комбинацию ответов 1) 1, 3, 5, 6;+ 2) 1, 3, 5; 3) 1, 2, 4, 6; 4) 1, 3, 4. 27. Характерным диагностическим
  // const questionRegex = /(\d+)\.\s+(.+?[^:,])\s(\d+\)\s.+?)(?=(\s\d+\.\s)|$)/g
  // const questionRegex = /(\d+)\.\s+(.+?[^,])\s(\d+\)\s.+?)(?=(\s\d+\.\s)|$)/g

  questionsBlock = questionsBlock + '\n0. ' // чтобы поиск работал
  const questionRegex = /^(\d+)\. ((.|\n)*?)(\d\) (.|\n)*?)(?=(^\d+\. ))/mg
  // Регулярное выражение для поиска вариантов ответов // 1) +1; 2) 0; 3) -2; 4) +2.+
  // const answerRegex = /\s*\d+\)\s*(.+?)(?=\s*\d+\)|$)/g
  const answerRegex = /^\d+\) ((.|\n)*?)(?=^\d+\) )/mg

  const questionsAndAnswers = [];
  let questionMatch;

  let prevQuestionNumber
  // Поиск вопросов и их вариантов ответов
  while ((questionMatch = questionRegex.exec(questionsBlock)) !== null) {
    const questionNumber = parseInt(questionMatch[1].trim(), 10)
    const question = questionMatch[2]
      .replace(/\n/g, ' ')
      .trim()
      .replace(/[«»]/g, '')
    const answersBlock = questionMatch[4].trim() + '\n0) ' // для поиска

    // Получаем следующий текст после вопроса для извлечения вариантов ответов
    // const nextSegment = data.slice(questionMatch.index + questionMatch[0].length)
    let answerMatch;

    // const answers = [];
    const correctAnswers = [];

    // Ищем варианты ответов в следующем сегменте
    while ((answerMatch = answerRegex.exec(answersBlock)) !== null) {
      const answer = answerMatch[1]
        .replace(/\n/g, ' ')
        .trim()

      // const answerNormalize = answer.replace(/[;+.]*$/g, '')
      // if (answer.indexOf('+') > 0) {
      //   correctAnswers.push(answerNormalize)
      // }
      // // answers.push(answerNormalize)

      // 1) +1; 2) 0; 3) -2; 4) +2.+
      if (answer[answer.length - 1] === '+') {
        correctAnswers.push(
          answer
            .substring(0, answer.length - 1)
            .trim()
            // заменяем последние символы
            .replace(/[;.]$/g, '')
        )
      }
    }

    if (correctAnswers.length === 0) {
      logError('Ошибка: не найдены правильные ответы\n', questionNumber, question)
    }
    if (!ignoreAnswerNumber && prevQuestionNumber && (prevQuestionNumber + 1 !== questionNumber)) {
      logError('Ошибка: неправильная последовательность вопросов\n', questionNumber, question)
    }

    prevQuestionNumber = questionNumber

    questionsAndAnswers.push(modelQuestion({
      number: questionNumber,
      question,
      // answers,
      correctAnswers,
    }))
  }

  if (
    questionsAndAnswers.length < 20
    // || questionsAndAnswers.length % 5 !== 0
  ) {
    logError('Ошибка парсинга кол-ва вопросов')
  }

  return questionsAndAnswers
}



function testParseText() {
  // Чтение содержимого файла
  fs.readFile(path.join(__dirname, './files/Test.txt'), 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return;
    }

    const questionsAndAnswers = parseFromSingleLineData(data)

    // Вывод результатов
    console.log("Вопросы и ответы:")
    questionsAndAnswers.forEach((item, index) => {
      console.log(`Вопрос ${index + 1}: ${item.question}`)
      console.log("Варианты ответов:")
      item.answers.forEach((answer, ansIndex) => {
        console.log(`${ansIndex + 1}) ${answer}`)
      })
      console.log("") // Пустая строка для разделения вопросов
    })
  })
}

module.exports = {
  log,
  logError,
  logErrorSilent,
  parseFromSingleLineData,
}
