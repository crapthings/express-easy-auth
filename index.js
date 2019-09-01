require('dotenv').config()

const {
  MONGO_URL,
  PORT,
  EXPIRED_IN_DAYS,
} = process.env

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const server = express()
const router = express.Router()

const registerDatabse = require('./db')
const registerRoutes = require('./routes')

server.use(cors())
server.use(bodyParser.urlencoded({ extended: false }))
server.use(bodyParser.json())

const registerServer = async function () {
  const { db, authCollection } = await registerDatabse({ MONGO_URL })
  server.use('/api', registerRoutes({ db, authCollection, router }))
  server.listen(PORT, function () {
    console.log(`Express-Easy-Auth is listening on port`, PORT)
  })
}

registerServer()
