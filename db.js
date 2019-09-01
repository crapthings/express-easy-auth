const { MongoClient } = require('mongodb')

module.exports = async function ({ MONGO_URL }) {

  const mongo = await MongoClient.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  const db = mongo.db()

  const authCollection = db.collection('auth')

  authCollection.createIndexes([
    {
      key: { username: 1 },
      unique: true,
    },

    {
      key: { 'tokens.token': 1 },
    },
  ])

  return {
    db,
    authCollection,
  }

}
