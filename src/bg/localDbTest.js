import AsyncIndexedDB from 'async-indexed-db/src'


const DATABASE_ID = 'DreamDB'
const DATABASE_TABLE_TOPICS = 'Topics'


const INDEXES = {

}

// The data definition schema. The schema is called when the old database version needs to be upgraded.
const schema = async (db) => {
  const objectStore = db.createObjectStore(
    DATABASE_TABLE_TOPICS,
    {keyPath: "id"},
  )
  objectStore.createIndex("titleIndex", "title", {unique: false})
  objectStore.createIndex("timeIndex", "time", {unique: false})
}

// create a database named "blog", and a schema defining function, and a version number.
const db = new AsyncIndexedDB(DATABASE_ID,  schema, 1)

// initialize the database.
await db.open()

// put (insert/update) a record (row) into the objectStore (IndexedDB-equivalent of Table)

async function initTest() {
  const query = db.query(DATABASE_TABLE_TOPICS)
  await query.put({
    id: 1,
    title: 'title',
    time: Date.now(),
    data: 'body'
  })
  await query.put({
    id: 2,
    title: 'tit fd',
    time: Date.now(),
    data: 'body'
  })
}

await initTest()




export async function dbSearchTopics(prefix) {
  // // get all records and iterate over them.
  // for (let record of await query.getAll()) {
  //   console.log(record)
  // }

  const query = db.query(DATABASE_TABLE_TOPICS, 'readonly')
  // const keyRange = IDBKeyRange.bound(prefix, prefix + '\uffff', false, true)
  // const cursor = await query.openCursor(keyRange)
  const cursor = await query.openCursor()

  // get a cursor and iterate over the objectStore in another thread.
  const result = []
  console.log('ANKU , cursor', cursor)
  if (cursor) {
    for await (let record of cursor) {
      if (record) {
        result.push(record.value)
        console.log(record.value)
      }
    }
  }
  return result
}

