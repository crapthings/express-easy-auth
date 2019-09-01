const _ = require('lodash')
const moment = require('moment')
const bcrypt = require('bcryptjs')
const nanoid = require('nanoid')
const { check } = require('express-validator')


const hashSync = context => bcrypt.hashSync(context, bcrypt.genSaltSync(10))

module.exports = function ({ db, router }) {

  const authCollection = db.collection('auth')

  return router

    .get('/status', async function (req, res, next) {
      return res.json({
        api: true,
        db: db.serverConfig.isConnected(),
      })
    })

    .post('/register', [
        check('username').isString(),
        check('password').isString(),
      ], async function (req, res, next) {
      const { username, password } = req.body

      const isAuthExist = await authCollection.findOne({ username })

      if (isAuthExist)
        return next('username already exists')

      const token = nanoid()
      const expiredAt = new Date()

      await authCollection.insertOne({
        username,
        password: hashSync(password),
        isEnabled: true,
        createdAt: new Date(),
        tokens: [{ token, expiredAt }]
      })

      return res.json({ username, token })
    })

    .post('/login', [
        check('username').isString(),
        check('password').isString(),
      ], async function (req, res, next) {
      const { username, password } = req.body

      const isAuthExist = await authCollection.findOne({ username })

      if (!isAuthExist)
        return next('username doesn\'t exist')

      if (!isAuthExist.isEnabled)
        return next('user is disabled')

      const isSamePassword = await bcrypt.compare(password, isAuthExist.password)

      if (!isSamePassword)
        return next('wrong password')

      const { EXPIRED_IN_DAYS } = process.env
      const token = nanoid()
      const expiredAt = moment(new Date()).add(parseInt(EXPIRED_IN_DAYS), 'd').startOf('day').toDate()

      await authCollection.findOneAndUpdate({ username }, {
        $push: { 'tokens': { token, expiredAt } }
      })

      return res.json({ username, token })
    })

    .post('/token', [
        check('token').isString()
      ], async function (req, res, next) {
      const { token } = req.body

      const isTokenExist = await authCollection.findOne({ 'tokens.token': token })

      if (!isTokenExist)
        return next('token doesn\'t exist')

      const isTokenExpired = _.chain(isTokenExist)
        .get('tokens')
        .find({ token })
        .value()

      const expired = moment(isTokenExpired.expiredAt).diff(new Date(), 'days')

      if (expired <= 0) {
        await authCollection.findOneAndUpdate({ 'tokens.token': token }, {
          $pull: { 'tokens': { token } }
        })

        return next('token has expired')
      }

      return res.json({ username: isTokenExist.username, token })
    })

    .post('/password', [
        check('username').isString(),
        check('password').isString(),
        check('newPassword').isString(),
      ], async function (req, res, next) {
      const { username, password, newPassword } = req.body

      const isAuthExist = await authCollection.findOne({ username })

      if (!isAuthExist)
        return next('username doesn\'t exist')

      const isSamePassword = await bcrypt.compare(password, isAuthExist.password)

      if (!isSamePassword)
        return next('wrong password')

      const hash = hashSync(newPassword)

      await authCollection.findOneAndUpdate({ username }, {
        $set: {
          'password': hash,
          'tokens': [],
        }
      })

      return res.sendStatus(200)
    })

    .post('/unregister', async function (req, res, next) {
      const { _id, username } = req.body

      const query = {}

      if (_id) {
        query._id = _id
      }

      if (username) {
        query.username = username
      }

      await authCollection.removeOne(query)

      res.sendStatus(200)
    })

    .post('/disable', [
        check('username').isString(),
      ], async function (req, res, next) {
      const { username } = req.body
      await authCollection.updateOne({ username }, { $set: { isEnabled: false } })
      res.sendStatus(200)
    })

    .post('/enable', [
        check('username').isString(),
      ], async function (req, res, next) {
      const { username } = req.body
      await authCollection.updateOne({ username }, { $set: { isEnabled: true } })
      res.sendStatus(200)
    })

    .get('/count', async function (req, res, next) {
      const { username } = req.body
      const count = await authCollection.estimatedDocumentCount()
      res.json({ count })
    })

}
