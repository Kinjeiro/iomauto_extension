import { modelTopic } from '../constants'


let db

const DATABASE_ID = 'DreamDB'
const STORE_TOPICS = 'Topics'


async function initDatabase() {
  // todo @ANKU @CRIT @MAIN - подумать как лучше обновлять базу
  // const records = localBaseArray.map(modelTopic)
  const records = [
    ...require('./files/localBasePdfs.json'),
    ...require('./files/localBaseDocs.json')
  ]

  // console.log('ANKU , records', records.sort((a, b) => a.id > b.id))
  // debugger

  // const records = [
  //   modelTopic({ id: 1, name: 'title' }),
  //   { id: 2, name: 'tit de' },
  // ]
  // insertRecords(records, true)
  await insertRecords(records)
}

// todo @ANKU @LOW - обернуть для удобства
function promiseForRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      resolve(
        event?.target?.result
        || request.result // open
      );
    };
    request.onerror = (event) => {
      reject(
        event?.target?.error
        || event?.target?.errorCode
        || request.error
      );
    };
  });
}

const DB_INDEXES = {
  // 'id': 'id',
  // 'title': 'title'
}

async function start() {
  // удаляем старую
  await promiseForRequest(indexedDB.deleteDatabase(DATABASE_ID))

  const request = indexedDB.open(DATABASE_ID, 1)
  request.onupgradeneeded = function(event) {
    db = event.target.result
    const objectStore = db.createObjectStore(STORE_TOPICS, { keyPath: 'id' })
    // objectStore.createIndex(DB_INDEXES.id, DB_INDEXES.id, { unique: true }); // Индекс для поиска по имени
    // objectStore.createIndex(DB_INDEXES.title, DB_INDEXES.title, { unique: true }); // Индекс для поиска по имени
    // objectStore.createIndex('updateDate', 'updateDate', { unique: false })
  }
  db = await promiseForRequest(request)

  console.log("БАЗА ПОДКЛЮЧЕНА")

  await initDatabase()
}



function getStore({
  mode = 'readonly',
  getRequest,
  onComplete,
  onError,
} = {}) {
  const transaction = db.transaction([STORE_TOPICS], mode)
  const objectStore = transaction.objectStore(STORE_TOPICS)

  transaction.oncomplete = onComplete
  transaction.onerror = onError ? (event) => onError(event.target.error) : undefined

  return objectStore
}


async function insertRecords(records, silent) {
  const store = getStore({
    mode: 'readwrite',
    onComplete: () => console.log("All records added successfully"),
    onError: (error) => console.log("Transaction error:", error),
  })

  for (const record of records) {
  // records.forEach(record => {
    try {
      if (record.questions.length > 0) {
        await promiseForRequest(store.put(record))
        console.log("+ ", record.questions.length, record.title)
      }
    } catch (e) {
      if (!silent) {
        console.error("Error adding record:", record, '\n',e)
      }
      debugger
    }
  }
}




export function dbGetAllTopics(callback) {
  const request = getStore().getAll()

  request.onsuccess = function(event) {
    console.log("Все записи:", event.target.result)
    callback(event.target.result)
  }

  request.onerror = function(event) {
    console.error("Ошибка при получении всех записей:", event.target.error)
    callback(undefined, event.target.error)
  }
}

export function dbSearchTopicsByName(prefix, callback) {
  console.log('ANKU поиск ', prefix)


  // todo @ANKU @CRIT @MAIN -
  // // Hold reference to the cursor request, since its `success` event is triggered when we iterate through the cursor
  // const cursorReq = store.index("promptIdIndex").openCursor(null,'next');
  // let cursor = await promiseForRequest(cursorReq);
  // while (cursor) {
  //   // ... use `cursor`
  //
  //   cursor.continue();
  //   await promiseForRequest(cursorReq);
  // }



  // const storeIndex = getStore().index(DB_INDEXES.title)
  const storeIndex = getStore()

  // Определяем диапазон ключей: от prefix до prefix + '\uffff'
  const keyRange = IDBKeyRange.bound(prefix, prefix + '\uffff', false, true)
  const request = storeIndex.openCursor(keyRange)


  const result = []
  request.onsuccess = function(event) {
    const cursor = event.target.result

    // console.log('ANKU , cursor', cursor)
    if (cursor) {
      const record = modelTopic(cursor.value)
      console.log(`${cursor.key}: ${record.title}`);
      result.push(cursor.value)
      // Переход к следующему элементу - request.onsuccess
      cursor.continue();
    } else {
      // закончили поиск - отправляем
      callback(result)
    }

    // while (cursor) {
    //   console.log("Найдена запись:", cursor.value)
    //   result.push(cursor.value)
    //   cursor.continue(); // Переход к следующему элементу - request.onsuccess
    // }
    // console.log("Поиск завершен")
    // callback(result)
  }

  request.onerror = function(event) {
    console.error("Ошибка при поиске:", event.target.error)
    callback(undefined, event.target.error)
  }
}

export function getLastUpdatedRecord() {
  const indexTable = getStore().index('lastUpdatedIndex')

  const request = indexTable.openCursor(null, 'prev'); // Открываем курсор в обратном порядке

  request.onsuccess = function(event) {
    const cursor = event.target.result
    if (cursor) {
      console.log("Последняя обновленная запись:", cursor.value)
    } else {
      console.log("Нет записей")
    }
  }

  request.onerror = function(event) {
    console.error("Ошибка при получении последней записи:", event.target.error)
  }
}



// todo @ANKU @LOW - test
async function set(db, storeName, key, value) {
  // Wrap the code that uses indexedDB in a promise because that is
  // the only way to use indexedDB together with promises and
  // async/await syntax. Note this syntax is much less preferred than
  // using the promise-returning function pattern I used in the previous
  // section of this answer.
  const promise = new Promise((resolve, reject) => {
    let result
    const tx = db.transaction(storeName, 'readwrite')
    tx.oncomplete = _ => resolve(result)
    tx.onerror = event => reject(event.target.error)
    const store = tx.objectStore(storeName)

    const request = store.put({data: key, value: value})
    request.onsuccess = _ => result = request.result
  })

  // We have executed the promise, but have not awaited it yet. So now we
  // await it. We can use try/catch here too, if we want, because the
  // await will translate the promise rejection into an exception. Of course,
  // this is also rather silly because we are doing the same thing as just
  // allowing an uncaught exception to exit the function early.
  let result
  try {
    result = await promise
  } catch(error) {
    console.log(error)
    return
  }

  // Now do something with the result
  console.debug('The result is', result)
  return result
}


start()
