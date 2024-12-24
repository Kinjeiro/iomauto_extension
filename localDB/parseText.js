const fs = require('fs')
const path = require('path')
const { modelQuestion } = require('../src/constants')
const {
  normalizeQuestion,
  normalizeAnswer
} = require('../src/inject/normalize')






//
//
// function testParseText() {
//   // Чтение содержимого файла
//   fs.readFile(path.join(__dirname, './files/Test.txt'), 'utf8', (err, data) => {
//     if (err) {
//       console.error(err)
//       return;
//     }
//
//     const questionsAndAnswers = parse24ForcareQuestions(data)
//
//     // Вывод результатов
//     console.log("Вопросы и ответы:")
//     questionsAndAnswers.forEach((item, index) => {
//       console.log(`Вопрос ${index + 1}: ${item.question}`)
//       console.log("Варианты ответов:")
//       item.answers.forEach((answer, ansIndex) => {
//         console.log(`${ansIndex + 1}) ${answer}`)
//       })
//       console.log("") // Пустая строка для разделения вопросов
//     })
//   })
// }
//
// module.exports = {
//   log,
//   logError,
//   logErrorSilent,
//   parseFromSingleLineData: parse24ForcareQuestions,
// }
