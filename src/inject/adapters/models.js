// Так как у нас нету typescript зафиксируем формат через метод
export function modelTopicSearchItem({
  source,
  linkTitle,
  content,
}) {
  return {
    source,
    linkTitle,
    content,
  }
}

export function modelSearchAdapter({
  id,
  /**
   * <modelTopicSearchItem>[] (linkTitle, fullUrl, source [])
   */
  findTopicItems = (searchTerm) => Promise.resolve([]),
  /**
   * {
   *   <questionName>: <answers>[]
   * }
   */
  findAnswersMap = (contentIdentification) => Promise.resolve({}),

  // LOCAl
  isLocal = false,

  // SITE
  domainUrl = undefined,
  getUrlTopics = (content) => '',
}) {
  return {
    id,
    isLocal,
    domainUrl,
    getUrlTopics,
    findTopicItems,
    findAnswersMap,
  }
}
