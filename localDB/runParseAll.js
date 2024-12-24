const path = require('path')

const { TRUST_LEVEL } = require('../src/constants')

const { parseFormatResultPage } = require('./formats/parserResultPage')
const {
  parseFormat24ForcareKostyaDocs,
  parseFormat24ForcarePdfOld
} = require('./formats/parser24forcate')
const { parseFormatResultPageHtml } = require('./formats/parserResultPageHtml')
const { parseAnyFiles } = require('./parseAnyFiles')


async function runParseAll() {
  await parseAnyFiles(
    [path.join(__dirname, '../../ответы - pdf')],
    undefined,
    parseFormat24ForcarePdfOld,
    new Date(2024, 12-1, 10)
  )

  await parseAnyFiles(
    [
      path.join(__dirname, '../../ответы от Константина/диск'),
      path.join(__dirname, '../../ответы от Константина/диск/2024г английские а и о/'),
      path.join(__dirname, '../../ответы от Константина/диск/Новая папка (5)/'),
      path.join(__dirname, '../../ответы от Константина/диск/добавил/'),
      path.join(__dirname, '../../ответы от Константина/диск/Дополнение ответов/'),
    ],
    [
      'myans.txt',
    ],
    parseFormat24ForcareKostyaDocs,
    new Date(2024, 12-1, 20)
  )

  await parseAnyFiles(
    [path.join(__dirname, '../../ответы от Константина/диск/дополнение от 23.12/')],
    undefined,
    parseFormat24ForcareKostyaDocs,
    new Date(2024, 12-1, 24)
  )

  await parseAnyFiles(
    [path.join(__dirname, '../../ответы - из чата/формат Результаты/')],
    undefined,
    parseFormatResultPage,
    new Date(2024, 12-1, 24),
    TRUST_LEVEL.LOW,
    parseFormatResultPageHtml,
  )
}

runParseAll()
