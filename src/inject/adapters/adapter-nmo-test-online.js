import { transliterateForNmoTestOnline } from '../transliterateForNmoTestOnline'
import { getHtmlDocument } from '../utils'

import { modelSearchAdapter, modelTopicSearchItem } from './models'


export const ADAPTER_NMO_TEST_ONLINE_ID = 'nmo-test.online'

export const ADAPTER_NMO_TEST_ONLINE = modelSearchAdapter({
  /*
  https://reshnmo.ru/?s=%D0%BE%D1%81%D1%82%D1%80%D1%8B%D0%B9+%D0%B3%D0%B5%D0%BF%D0%B0%D1%82%D0%B8%D1%82+%D0%92

  document.querySelectorAll('.post-card__title a')

  https://reshnmo.ru/testy-nmo/test-s-otvetami-po-teme-ostryy-gepatit-v-ogv-u-detey-po-utverzhdennym-klinicheskim-rekomendatsiyam-testy-nmo-s-otvetami
  .entry-content h3
  .entry-content p strong
  */
  id: ADAPTER_NMO_TEST_ONLINE_ID,
  domainUrl: 'https://nmo-test.online/',
  getUrlTopics(certName) {
    // https://nmo-test.online/search/%D0%A0%D0%B0%D1%81%D1%81%D0%B5%D1%8F%D0%BD%D0%BD%D1%8B%D0%B9%20%D1%81%D0%BA%D0%BB%D0%B5%D1%80%D0%BE%D0%B7
    return `${this.domainUrl}search/${certName}`
  },
  /* linkTitle, fullUrl, source, localItemId []*/
  async findTopicItems(certName) {
    // todo @ANKU @LOW - переделать на getUrlTopics
    const url = this.domainUrl + transliterateForNmoTestOnline(certName) + '/'
    const topicPageDocument = await getHtmlDocument(url)

    const errorHeader = topicPageDocument.querySelector('.wp-block-heading')
    if (errorHeader && errorHeader.innerText.trim().indexOf('Упс! Страница не найдена') === 0) {
      return []
    }

    const title = topicPageDocument
      .querySelector('.wp-block-post-title')
      .innerText
      .trim()

    // там всегда один ответ
    return [
      modelTopicSearchItem({
        source: ADAPTER_NMO_TEST_ONLINE_ID,
        linkTitle: title,
        content: topicPageDocument,
      })
    ]
  },
  async findAnswersMap(topicPageDocument) {
    const answersMap = {}
    const items = topicPageDocument.querySelectorAll('.entry-content p')

    for (let i = 0; i < items.length; i = i + 2) {
      // последний заголовок может быть не нашли ответы - свяжитесь с нами
      const title = items[i].innerText
        .replace(/^\d+.\s/g, '')

      const answersNode = items[i+1]

      if (answersNode) {
        const correctAnswers = [
          ...answersNode.querySelectorAll('strong'),
          ...answersNode.querySelectorAll('b')
        ].map((node) => (
          node.innerText
            .replace(/^\d+\)\s/g, '')
            .trim()
        ))
        // массив массивов нужен
        answersMap[title] = [correctAnswers]
      }
    }

    return answersMap
  }
})
