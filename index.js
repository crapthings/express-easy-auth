require('dotenv').config()

const {
  MONGO_URL: ENV_MONGO_URL,
  PORT: ENV_PORT,
} = process.env

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const server = express()
const router = express.Router()

server.use(cors())
server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json())

const startup = async function () {
  const { db, authCollection } = await require('./db')({ ENV_MONGO_URL })
  server.use('/api', require('./routes')({ db, authCollection, router }))
  server.listen(ENV_PORT, function () {
    console.log(`Express-Easy-Auth is listening on port`, ENV_PORT)
  })
}

startup()
