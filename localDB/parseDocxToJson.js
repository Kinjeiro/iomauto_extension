const EasyDocx = require('node-easy-docx')

const easyDocx = new EasyDocx({
  path: './localDB/files/Мочекаменная_болезнь_Дети_по_утвержденным_клиническим_рекомендациям.docx'
})

easyDocx.parseDocx()
  .then(data => {
    // JSON data as result
    console.log(data)
  })
  .catch(err => {
    console.error(err)
  })
