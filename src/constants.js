export const COMMANDS = {
  SEARCH_ANSWERS: 'search_answers'
}

export const MODULE_STATUS = {
  START_SERVICE: 'START_SERVICE',
  NEW: 'NEW',
  SEARCHING: 'SEARCH',
  WAIT_QA_FORM: 'WAIT_QA_FORM',
  READY: 'READY',
  EXECUTING: 'EXECUTING',
  DONE: 'DONE',
  ERROR: 'ERROR',
}


export const DEFAULT_CONFIG = {
  answerDelayMin: 6000,
  answerDelayMax: 11000
}
export const currentConfig = DEFAULT_CONFIG

export function updateConfig(part) {
  Object.assign(currentConfig, part)
  return currentConfig
}
export function getConfig(key = undefined) {
  return key ? currentConfig[key] : currentConfig
}


// const MODULE_STATUS_TEXT_MAP = {
//   [MODULE_STATUS.NEW]: [],
//   [MODULE_STATUS.SEARCHING]: ['...', '#ffd200'],
//   [MODULE_STATUS.READY]: ['|>', '#00ff07'],
//   [MODULE_STATUS.EXECUTING]: ['|>...', '#ffd200'],
//   [MODULE_STATUS.DONE]: ['DONE', '#165af3'],
//   [MODULE_STATUS.ERROR]: ['ER', '#6c0029'],
// }

