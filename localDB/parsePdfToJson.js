const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

const parseFormat24Forcare = require('./formats/parser24forcate')
const { parseFormat24ForcarePdfOld } = require('./formats/parser24forcate')


// Путь к вашему PDF файлу
const pdfDirPath = path.join(__dirname, '../../ответы - pdf')
// const pdfPath = path.join(__dirname, '../../НМО ОТВЕТЫ/003 Отв Аденоматозный полипозный синдром.pdf')
const localDBPath = path.join(__dirname, '../src/bg/files/localBasePdfs.json')



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
  for await (let file of files) {
    let dataBuffer = fs.readFileSync(path.join(pdfDirPath, file))
    const data = await pdf(dataBuffer)
    console.log('\n\nФайл: ', file)
    // Извлечение текста из PDF
    const themeItem = parseFormat24ForcarePdfOld(data.text)
    result.push(themeItem)
  }

  debugger
  fs.writeFileSync(localDBPath, JSON.stringify(result, null, 2), 'utf-8')
}

runParseAllPdfs()
