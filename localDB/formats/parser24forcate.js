const {
  logError,
} = require('../utils')
const {
  normalizeTopicTitle,
  latinToViewCyrillic,
  normalizeTopicId,
  normalizeQuestion,
  normalizeAnswer
} = require('../../src/inject/normalize')
const { modelTopic,
  modelQuestion
} = require('../../src/constants')


function parse24ForcareQuestions(questionsBlock, ignoreAnswerNumber = false) {
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
    const question = normalizeQuestion(questionMatch[2])
    const answersBlock = questionMatch[4].trim() + '\n0) ' // для поиска

    // Получаем следующий текст после вопроса для извлечения вариантов ответов
    // const nextSegment = data.slice(questionMatch.index + questionMatch[0].length)
    let answerMatch;

    // const answers = [];
    const correctAnswers = [];

    // Ищем варианты ответов в следующем сегменте
    while ((answerMatch = answerRegex.exec(answersBlock)) !== null) {
      const answerString = answerMatch[1]
        .replace(/\n/g, ' ')
        .trim()

      // const answerNormalize = answer.replace(/[;+.]*$/g, '')
      // if (answer.indexOf('+') > 0) {
      //   correctAnswers.push(answerNormalize)
      // }
      // // answers.push(answerNormalize)

      // 1) +1; 2) 0; 3) -2; 4) +2.+
      if (answerString[answerString.length - 1] === '+') {
        correctAnswers.push(normalizeAnswer(answerString))
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
      answers: correctAnswers,
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


const PARSER_24_FORCARE_PDF_OLD = 'pdfOld'
function parseFormat24ForcarePdfOld(fileName, fileStrings, trustLevel) {
  const text = fileStrings
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
    logError('Ошибка парсинга темы')
  }

  const topicTitle = normalizeTopicTitle(
    questionMatch[1]
      .replace(/\|\|/g, ' ')
  )

  // const questionsBlock = latinToViewCyrillic('1. ' + questionMatch[3] + questionMatch[4])
  const questionsBlock = latinToViewCyrillic(
    questionMatch[3]
      .replace(/\|\|/g, '\n')
      .trim()
  ).trim()

  console.log('Тема: ', topicTitle)
  const questionsAndAnswers = parse24ForcareQuestions(questionsBlock)

  const topic = modelTopic({
    id: normalizeTopicId(topicTitle),
    title: topicTitle,
    questions: questionsAndAnswers,
    from: PARSER_24_FORCARE_PDF_OLD,
    trustLevel,
  })

  return topic
}


const PARSER_24_FORCARE_KOSTYA_DOCS = 'KostyaDocs'
function parseFormat24ForcareKostyaDocs(fileName, docStrings, trustLevel) {
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
  const questionsAndAnswers = parse24ForcareQuestions(docStringsFinal, true)

  const topic = modelTopic({
    id: normalizeTopicId(topicTitle),
    title: topicTitle,
    questions: questionsAndAnswers,
    from: PARSER_24_FORCARE_KOSTYA_DOCS,
    trustLevel,
  })

  return topic
}

module.exports = {
  parseFormat24ForcarePdfOld,
  parseFormat24ForcareKostyaDocs,
}
