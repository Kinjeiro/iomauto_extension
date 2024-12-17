import { getHtmlDocument } from '../utils'
import { answersParsing24forcare } from './adapter-24forscare'
import { modelSearchAdapter, modelTopicSearchItem } from './models'


export const ADAPTER_RESHNMO_RU_ID = 'reshnmo.ru'

export const ADAPTER_RESHNMO_RU = modelSearchAdapter({
  /*
  https://reshnmo.ru/?s=%D0%BE%D1%81%D1%82%D1%80%D1%8B%D0%B9+%D0%B3%D0%B5%D0%BF%D0%B0%D1%82%D0%B8%D1%82+%D0%92

  document.querySelectorAll('.post-card__title a')

  https://reshnmo.ru/testy-nmo/test-s-otvetami-po-teme-ostryy-gepatit-v-ogv-u-detey-po-utverzhdennym-klinicheskim-rekomendatsiyam-testy-nmo-s-otvetami
  .entry-content h3
  .entry-content p strong
  */
  id: ADAPTER_RESHNMO_RU_ID,
  domainUrl: 'https://reshnmo.ru/',
  getUrlTopics(certNameFinal) {
    return '?' + new URLSearchParams({
      s: certNameFinal,
      // credentials: "include"
    }).toString()
  },
  /* linkTitle, fullUrl, source, localItemId []*/
  async findTopicItems(certName) {
    const searchPageDocument = await getHtmlDocument(this.domainUrl + this.getUrlTopics(certName))

    return Array.from(searchPageDocument.querySelectorAll('.post-card--standard .post-card__title a'))
      .map((findLink) => modelTopicSearchItem({
        source: ADAPTER_RESHNMO_RU_ID,
        linkTitle: findLink.text
          .replaceAll('Тест с ответами по теме', '')
          .replaceAll(' | Тесты НМО с ответами', '')
          .trim()
          .replaceAll(/[«»]/g, ''),
        content: findLink.getAttribute('href'),
      }))
  },
  async findAnswersMap(fullUrl) {
    const answersPageDocument = await getHtmlDocument(fullUrl)

    // там такой же парсинг h3 + p strong
    return answersParsing24forcare(
      answersPageDocument.querySelector('.entry-content').childNodes
    )
  }
})
