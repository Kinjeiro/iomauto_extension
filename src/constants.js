const COMMANDS = {
  SEARCH_ANSWERS: 'search_answers'
}

const MODULE_STATUS = {
  START_SERVICE: 'START_SERVICE',
  NEW: 'NEW',
  SEARCHING: 'SEARCH',
  WAIT_QA_FORM: 'WAIT_QA_FORM',
  READY: 'READY',
  EXECUTING: 'EXECUTING',
  DONE: 'DONE',
  ERROR: 'ERROR',
}


const DEFAULT_CONFIG = {
  answerDelayMin: 11000,
  answerDelayMax: 40000,
  answerPercentMin: 85,
  answerPercentMax: 100,
}
const currentConfig = DEFAULT_CONFIG

function updateConfig(part) {
  Object.assign(currentConfig, part)
  return currentConfig
}
function getConfig() {
  return currentConfig
}

// todo @ANKU @LOW - переместить в конфиг
// const IS_DEBUG = false
const IS_DEBUG = true

// const MODULE_STATUS_TEXT_MAP = {
//   [MODULE_STATUS.NEW]: [],
//   [MODULE_STATUS.SEARCHING]: ['...', '#ffd200'],
//   [MODULE_STATUS.READY]: ['|>', '#00ff07'],
//   [MODULE_STATUS.EXECUTING]: ['|>...', '#ffd200'],
//   [MODULE_STATUS.DONE]: ['DONE', '#165af3'],
//   [MODULE_STATUS.ERROR]: ['ER', '#6c0029'],
// }

const ACTIONS = {
  FETCH: 'FETCH',

  LOCAL_DB_SEARCH_TOPICS: 'LOCAL_DB_SEARCH_TOPICS',
  LOCAL_DB_GET_ANSWERS: 'LOCAL_DB_GET_ANSWERS',
}


/*"id": "5qассоциированная спинальная мышечная атрофия по утвержденным клиническим рекомендациям2024",
  "title": "5q-ассоциированная спинальная мышечная атрофия (по утвержденным клиническим рекомендациям)-2024",
  "createDate": "2024-12-02T13:41:35.993Z",
  "updateDate": "2024-12-02T13:41:35.993Z",
  "questions": [
  {
    "number": "1",
    "question": "Золотым стандартом молекулярно- генетического исследования при СМА 5q является",
    "correctAnswers": [
      "анализ числа копий генов SМN1 и SМN2"
    ]
  },*/
function modelQuestion({
  number,
  question,
  correctAnswers,
}) {
  return {
    number,
    question,
    correctAnswers,
  }
}

function modelTopic({
  id,
  title,
  createDate,
  updateDate,
  questions,
  from,
}) {
  return {
    id,
    title,
    createDate,
    updateDate,
    questions,
    from,
  }
}

module.exports = {
  ACTIONS,
  COMMANDS,
  MODULE_STATUS,
  DEFAULT_CONFIG,
  currentConfig,
  updateConfig,
  getConfig,
  IS_DEBUG,
  modelQuestion,
  modelTopic,
}
