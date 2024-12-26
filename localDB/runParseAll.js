const path = require('path')

const { TRUST_LEVEL } = require('../src/constants')

const { parseFormatResultPage } = require('./formats/parserResultPage')
const {
  parseFormat24ForcareKostyaDocs,
  parseFormat24ForcarePdfOld
} = require('./formats/parser24forcate')
const { parseFormatResultPageHtml } = require('../src/inject/parserResultPageHtml')
const { parseAnyFiles } = require('./parseAnyFiles')
const { parseFormatSeregiTxt } = require('./formats/parserSeregiTxt')

function createDate(year, month, day) {
  return new Date(year, month - 1, day + 1)
}

async function runParseAll() {
  await parseAnyFiles(
    [
      // path.join(__dirname, '../../ответы - из чата/2024-12-24 -- формат Результаты/')
      // path.join(__dirname, '../../ответы - из чата/2024-12-25 -- формат Результаты/')
    ],
    undefined,
    parseFormatResultPage,
    createDate(2024, 12, 25),
    TRUST_LEVEL.LOW,
    parseFormatResultPageHtml,
  )

  await parseAnyFiles(
    [
      path.join(__dirname, '../../ответы - из чата/2024-12-25 -- формат чат как Сереги/test'),
      path.join(__dirname, '../../ответы - из чата/2024-12-25 -- формат чат как Сереги/'),
    ],
    undefined,
    parseFormatSeregiTxt,
    createDate(2024, 12, 25),
    TRUST_LEVEL.LOW,
  )

  // await parseAnyFiles(
  //   [
  //     path.join(__dirname, '../../ответы - из чата/формат Сереги/'),
  //   ],
  //   undefined,
  //   parseFormatSeregiTxt,
  //   createDate(2024, 12, 24),
  // )


  // await parseAnyFiles(
  //   [path.join(__dirname, '../../ответы - pdf')],
  //   undefined,
  //   parseFormat24ForcarePdfOld,
  //   createDate(2024, 12, 10),
  // )

  // await parseAnyFiles(
  //   [
  //     path.join(__dirname, '../../ответы от Константина/диск'),
  //     path.join(__dirname, '../../ответы от Константина/диск/2024г английские а и о/'),
  //     path.join(__dirname, '../../ответы от Константина/диск/Новая папка (5)/'),
  //     path.join(__dirname, '../../ответы от Константина/диск/добавил/'),
  //     path.join(__dirname, '../../ответы от Константина/диск/Дополнение ответов/'),
  //   ],
  //   [
  //     'myans.txt',
  //   ],
  //   parseFormat24ForcareKostyaDocs,
  //   createDate(2024, 12, 20),
  // )
  //
  // await parseAnyFiles(
  //   [path.join(__dirname, '../../ответы от Константина/диск/дополнение от 23.12/')],
  //   undefined,
  //   parseFormat24ForcareKostyaDocs,
  //   createDate(2024, 12, 24),
  // )
}

runParseAll()
