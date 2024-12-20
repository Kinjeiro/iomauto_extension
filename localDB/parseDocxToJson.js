// const EasyDocx = require('node-easy-docx')
// const textract = require('textract')
// const textract = require('@alexcdot/textract')
// const aw = require('@aspose/words')

// const officeParser = require('officeparser')
const officeParser = require('./officeparser/officeParser')

const fs = require('fs')
const path = require('path')

const {
  normalizeTextCompare,
  latinToViewCyrillic,
  normalizeTopicId,
  normalizeTopicTitle,
} = require('../src/inject/normalize')
const {
  modelTopic,
  modelQuestion,
} = require('../src/constants')
const {
  log,
  logError,
  parseFromSingleLineData,
  logErrorSilent
} = require('./parseText')

// LOCAL - ignore github
const {
  DIR_PATHS,
  EXCLUDES_FILES
} = require('./files')

console.log('ANKU , DIR_PATHS', DIR_PATHS)

const PARSER_GOOGLE_DOCX_ID = 'googleDocs'

const SUPPORT_EXT = [
  '.doc',
  '.docx',
  '.odt',
  '.txt',
]
let absoluteFiles = DIR_PATHS.reduce((result, dir) => {
  result.push(
    ...fs.readdirSync(dir).map((fileName) => {
      const ext = path.extname(fileName)
      return (
        !ext || EXCLUDES_FILES.includes(fileName) || !SUPPORT_EXT.includes(ext)
          ? undefined
          : path.join(dir, fileName)
      )
    }).sort(),
  )
  return result
}, [])
  .filter(Boolean)

// todo @ANKU @CRIT @MAIN @debugger -
// absoluteFiles = ['d:\\__CODE_IOMAUTO__\\ответы от Константина\\диск\\2024г английские а и о\\Аллергический ринит (по утвержденным клиническим рекомендациям).docx']
console.log('ANKU , absoluteFiles', absoluteFiles)


const LOCAL_DB_PATH_DOCS = path.join(__dirname, '../src/bg/files/localBaseDocs.json')


function normalizeAnswer(answer) {
  return latinToViewCyrillic(answer)
    .replace(/\+?$/g, '') // убираем плюс
    .replace(/^\d+\)\s/g, '') // убираем первую цифру
    .replace(/[;.]$/g, '')
}

function parseFromDocx(fileName, docStrings) {
  const topicTitle = normalizeTopicTitle(fileName)
  console.log('Тема: ', topicTitle)

  const docStringsFinal = (
    // на первом вопросе бывает съедается первая цифра
    '1. ' + docStrings.replace(/^\s*\d?\.?\s?/, '')
  )
    .replace(/\r\n/g, '\n') // убираем txt переходы
    .replace(/\n\n/g, '\n') // убираем пустые строки
    .replace(/ /g, ' ') // убираем пробельные символы
    .replace(/^(\d+)-\s/mg, '$1\) ') // заменяем черту
    .replace(/^(?!\d+?[.)]\s).*$/mg, '') // убираем рекламу, все что не начинается с цифр и скобок

  // многие документы имеют такой вид
    /*
    1. Когнитивные нарушения при болезни Ниманна-Пика тип С характеризируются
      1) уменьшением скорости обработки информации.+
      1) снижением словесной памяти.+
      1) снижением исполнительной функции.+
   * */
  const questionsAndAnswers = parseFromSingleLineData(docStringsFinal, true)

  const now = new Date()
  const topic = modelTopic({
    id: normalizeTopicId(topicTitle),
    title: topicTitle,
    createDate: now,
    updateDate: now,
    /*number,
    question,
    answers,
    correctAnswers,*/
    questions: questionsAndAnswers,
    from: PARSER_GOOGLE_DOCX_ID,
  })

  return topic
}

// function parseFromDocxOld(fileName, docsJson) {
//   const topicName = latinToViewCyrillic(
//     fileName
//       .replace(/\d+\.\s+/g, '')
//       .trim()
//   )
//   console.log('Тема: ', topicName)
//
//
//   const questionsAndAnswers = []
//
//   let prevQuestionNumber
//   for(let i = 0; i < docsJson.length; i = i + 2) {
//     const questionStr = docsJson[i].text
//     if (!questionStr) {
//       return
//     }
//
//     let match = /(\d+)\.\s(.*)/.exec(questionStr)
//
//     if (!match) {
//       if (i === 0) {
//         // на первом вопросе бывает съедается первая цифра
//         match = /(\d+)\.\s(.*)/.exec(`1. ${questionStr.replace(/^.\s/, '')}`)
//
//         if (!match) {
//           console.log('ANKU , questionStr', questionStr)
//           debugger
//         }
//       }
//       console.log('ANKU , questionStr', questionStr)
//       // бывает еще и реклама - пропускаем ее
//       return
//     }
//
//     const questionNumber = parseInt(match[1], 10)
//     const question = latinToViewCyrillic(match[2])
//     const answers = docsJson[i+1].items
//
//     const correctAnswers = []
//     let prevFullLine = ''
//     // на 1 больше итерация чтобы prevFullLine последнюю задействовать
//     for (let indexAnswers = 0; indexAnswers < answers.length + 1; indexAnswers++) {
//       const answer = answers[indexAnswers]
//       if (answer) {
//         // format bold и может быть и color не связанный с ответом
//         const { format, text } = answer
//
//         if (!/^\d+\)/.test(text) ) {
//           // бывает строки парсятся и разрываются строка - соединяем с предыдущей
//           prevFullLine += text
//           return
//         }
//       }
//
//       if (/\+$/.test(prevFullLine)) {
//         correctAnswers.push(normalizeAnswer(prevFullLine))
//       }
//
//       prevFullLine = answer && answer.text
//     }
//
//     if (correctAnswers.length === 0) {
//       logError('Ошибка: не найдены правильные ответы', question)
//     }
//     if (prevQuestionNumber && (prevQuestionNumber + 1 !== questionNumber)) {
//       logError('Ошибка: неправильная последовательность вопросов', question)
//     }
//
//     questionsAndAnswers.push(modelQuestion({
//       number: questionNumber,
//       question,
//       correctAnswers,
//     }))
//
//     prevQuestionNumber = questionNumber
//   }
//
//   if (questionsAndAnswers.length < 20) {
//     logError('Ошибка парсинга кол-ва вопросов')
//   }
//
//   const now = new Date()
//   const topic = modelTopic({
//     id: normalizeTextCompare(topicName, true),
//     title: topicName,
//     createDate: now,
//     updateDate: now,
//     /*number,
//     question,
//     answers,
//     correctAnswers,*/
//     questions: questionsAndAnswers,
//   })
//
//   return topic
// }

// function extract(filePath) {
//   return new Promise((resolve, reject) => {
//     textract.fromFileWithPath(
//       filePath,
//       {
//         // https://www.npmjs.com/package/textract#configuration
//         preserveLineBreaks: true,
//       },
//       function( error, text ) {
//         if (error) {
//           reject(error)
//         } else {
//           resolve(text)
//         }
//       },
//     )
//   })
// }

async function runParseAllDocxs() {
  // Чтение PDF файла
  // let dataBuffer = fs.readFileSync(pdfPath)

  // const files = ['Карцинома_Меркеля_по_утвержденным_клиническим_рекомендациям_2019.txt'];

  // const result = await Promise.all(files.map(async (file) => {
  //   let dataBuffer = fs.readFileSync(path.join(pdfDirPath, file))
  //   const data = await pdf(dataBuffer)
  //   console.log('\n\nФайл: ', file)
  //   // Извлечение текста из PDF
  //   const themeItem = parseFromPdf(data.text)
  //
  //   // console.log(JSON.stringify(themeItem, null, 2))
  //   return themeItem
  // }))

  const result = []
  const resultIncorrectName = []

  // сделаем обработку последовательно
  for await (let filePath of absoluteFiles) {
    const extension = path.extname(filePath)
    const fileName = path.basename(filePath, extension)

    if (fileName.indexOf('~') >= 0) {
      resultIncorrectName.push(filePath)
      debugger
    }

    // const filePath = path.join(docxDirPath, '169 Менингококковая инфекция у детей (по утвержденным клиническим рекомендациям).odt')
    // const filePath = path.join(docxDirPath, '162 Макулярная дегенерация возрастная (по утвержденным клиническим рекомендациям).odt')
    console.log('\n\nФайл: ', filePath)

    // не разделяет ответы на строчки - а это очень вредно так как есть строчки очень специфичные
    // const data = await extract(filePath)

    // не разделяет ответы на строчки - а это очень вредно так как есть строчки очень специфичные
    // работает на ноде с ?? - https://node.green/#ES2021-features-Logical-Assignment-----basic-support
    // поддерживает с nodejs 15.14
    /*
      для docx
                        // .map(paragraphNode => {
                        .reduce((result, paragraphNode) => {
                            // Find text nodes with w:t tags
                            // const xmlTextNodeList = paragraphNode.getElementsByTagName("w:t");
                            // Join the texts within this paragraph node without any spaces or delimiters.
                            // return Array.from(xmlTextNodeList)
                            //         .filter(textNode => textNode.childNodes[0] && textNode.childNodes[0].nodeValue)
                            //         .map(textNode => textNode.childNodes[0].nodeValue)
                                    // .join("");


                          // разделять по br
                          const allItems = Array.from(paragraphNode.childNodes || []).reduce((result, element) => {
                            result.push(...Array.from(element.childNodes || []))
                            return result
                          }, [])
                          console.log('ANKU , allItems', allItems)

                          const resultT = []
                          let prevItem = ''
                          for (let i = 0; i < allItems.length; i++) {
                            const item = allItems[i]
                            if (item.nodeName === 'w:br') {
                              resultT.push(prevItem)
                              // обнуляем
                              prevItem = ''
                            }

                            if (item.nodeName === 'w:t') {
                              // приплюсовываем к предыдущему значению
                              prevItem += item.childNodes[0].nodeValue
                            }
                          }
                          resultT.push(prevItem) // последний элемент добавляем

                          result.push(...resultT)
                          return result
                        }, [])
                        // Join each paragraph text with a new line delimiter.
                        .join(config.newlineDelimiter ?? "\n")

      для odt
      @NOTE: Нужен фикс
        const allowedTextTags = ["text:p", "text:h"];
        на
        const allowedTextTags = ["text:p", "text:h", "text:span"];
    */
    try {
      const fileStrings = await officeParser.parseOfficeAsync(filePath)

      if (fileStrings.trim().length === 0) {
        logErrorSilent('Пустой файл', fileName)
      } else {
        const topic = parseFromDocx(fileName, fileStrings)
        log(topic.questions.length)
        result.push(topic)
      }
    } catch (e) {
      if (
           e.message.indexOf("[OfficeParser]: Error: end of central directory record signature not found") === 0
        || e.message.indexOf("[OfficeParser]: Error: End of central directory record signature not found") === 0
      ) {
        logErrorSilent('Пустой файл', fileName)
      } else {
        debugger
        throw e
      }
    }




    // // не парсит odt
    // const easyDocx = new EasyDocx({
    //   path: filePath,
    // })
    // const topicJson = await easyDocx.parseDocx()
    //
    // // Извлечение текста из PDF
    // if (topicJson.length === 0) {
    //   logError('Пустой файл', file)
    // } else {
    //   const topic = parseFromDocx(file, topicJson)
    //   result.push(topic)
    // }

  }

  debugger
  fs.writeFileSync(LOCAL_DB_PATH_DOCS, JSON.stringify(result, null, 2), 'utf-8')

  fs.writeFileSync(path.join(__dirname, './incorrectNames.txt'), resultIncorrectName.join('\n'))
}

runParseAllDocxs()
