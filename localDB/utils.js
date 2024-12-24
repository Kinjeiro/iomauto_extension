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

function getDateStr(date = new Date()) {
  return date.toISOString().substring(0, 10)
}

module.exports = {
  log,
  logError,
  logErrorSilent,
  getDateStr,
}
