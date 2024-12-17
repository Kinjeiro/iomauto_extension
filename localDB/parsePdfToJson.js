const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

const {
  normalizeTextCompare,
  latinToViewCyrillic
} = require('../src/inject/normalize')
const { modelTopic } = require('../src/constants')

const {
  logError,
  parseFromSingleLineData
} = require('./parseText')



// Путь к вашему PDF файлу
const pdfDirPath = path.join(__dirname, '../../ответы - pdf')
// const pdfPath = path.join(__dirname, '../../НМО ОТВЕТЫ/003 Отв Аденоматозный полипозный синдром.pdf')
const localDBPath = path.join(__dirname, '../src/bg/localBase.json')

function parseFromPdf(pdfText) {
  const text = pdfText
    .replace(/\r?\n/g, '||')
    .replace(/' '/g, ' ')
    .replace(/Тест с ответами по теме/, '')
    // появлеется попап с таким текстом
    .replace(/Хотите получать уведомления о новых тестах\?/g, '')
    // в середине текста бывают
    .replace(/CайтЗаботаЗдоровьеМедицинаТесты.*?ПОИСК/g, '')

  // .*? - вопросительный знак переводит из жадного (greed) по умолчанию режима в ленивый (lazy), то есть до первого найденного
  // https://learn.javascript.ru/regexp-greedy-and-lazy
  // let questionMatch = /\s*(.*?) Вашему вниманию представляется .*?(nmomed_bot)(.*?)(Специaльнoсть|Специальность|Специальности|Специaльнoсти|Если Вы уважаете наш)/i
  // let questionMatch = /\s*(.*?) Вашему вниманию представляется .*?(nmomed_bot(.*?ПОИСК)?)(.*?)(Специaльнoсть|Специальность|Специальности|Специaльнoсти|Если Вы уважаете наш)/i
  // let questionMatch = /(.*?)Вашему вниманию представляется.*?(nmomed_bot(.*?ПОИСК)?).*?(1\..*?)(Специaльнoсть|Специальность|Специальности|Специaльнoсти|Если Вы уважаете наш)/i
  let questionMatch = /(.*?)Вашему вниманию представляется.*?(nmomed_bot).*?(1\..*?)(Специaльнoсть|Специальность|Специальности|Специaльнoсти|Если Вы уважаете наш)/i
    .exec(text)

  // if (!questionMatch) {
  //   // бывают без специальности
  //   // questionMatch = /Тест с ответами по теме ((.|\n)*) Вашему вниманию представляется .* 1\.\s([«a-zA-ZЁёА-я0-9])(.*)(Если Вы уважаете наш)/
  //   questionMatch = /Тест с ответами по теме ((.|\n)*) Вашему вниманию представляется .*?(nmomed_bot)(.*)(Если Вы уважаете наш)/
  //     .exec(text)
  // }

  if (!questionMatch || !questionMatch[4]) {
    logError('Ошибка парсинга темы', pdfText)
    debugger
  }

  const themeName = latinToViewCyrillic(
    questionMatch[1]
      .replace(/\|\|/g, ' ')
      .replace(/[«»]/g, '')
      .trim()
  )
  // const questionsBlock = latinToViewCyrillic('1. ' + questionMatch[3] + questionMatch[4])
  const questionsBlock = latinToViewCyrillic(
    questionMatch[3]
      .replace(/\|\|/g, '\n')
      .trim()
  ).trim()

  console.log('Тема: ', themeName)
  const questionsAndAnswers = parseFromSingleLineData(questionsBlock)

  const now = new Date()
  const themeItem = modelTopic({
    id: normalizeTextCompare(themeName, true),
    title: themeName,
    createDate: now,
    updateDate: now,
    /*number,
    question,
    answers,
    correctAnswers,*/
    questions: questionsAndAnswers,
  })

  return themeItem
}

async function runParseAllPdfs() {
  // Чтение PDF файла
  // let dataBuffer = fs.readFileSync(pdfPath)

  const files = fs.readdirSync(pdfDirPath);

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
  // сделаем обработку последовательно
  for (const file of files) {
    let dataBuffer = fs.readFileSync(path.join(pdfDirPath, file))
    const data = await pdf(dataBuffer)
    console.log('\n\nФайл: ', file)
    // Извлечение текста из PDF
    const themeItem = parseFromPdf(data.text)
    result.push(themeItem)
  }

  fs.writeFileSync(localDBPath, JSON.stringify(result, null, 2), 'utf-8')
}

runParseAllPdfs()
