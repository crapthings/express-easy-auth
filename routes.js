const _ = require('lodash')
const moment = require('moment')
const bcrypt = require('bcryptjs')
const nanoid = require('nanoid')

const hashSync = context => bcrypt.hashSync(context, bcrypt.genSaltSync(10))

module.exports = function ({ db, router }) {

  const authCollection = db.collection('auth')

  return router

    .get('/status', async function (req, res, next) {
      return res.sendStatus(200)
    })

    .post('/register', async function (req, res, next) {
      const { username, password } = req.body
      const isUsernameExist = await authCollection.findOne({ username })
      if (isUsernameExist) return next('username already exists')

      const token = nanoid()
      const expiredAt = new Date()

      const authDoc = {
        username,
        password: hashSync(password),
        createdAt: new Date(),
        tokens: [{ token, expiredAt }]
      }

      await authCollection.insertOne(authDoc)

      const result = {
        username,
        token,
      }

      return res.json({ result })
    })

    .post('/login', async function (req, res, next) {
      const { username, password } = req.body

      const isUsernameExist = await authCollection.findOne({ username })

      if (!isUsernameExist)
        return next('username doesn\'t exist')

      const _hash = _.get(isUsernameExist, 'password')

      const isSamePassword = await bcrypt.compare(password, _hash)

      if (!isSamePassword)
        return next('wrong password')

      const currentUser = _.omit(isUsernameExist, ['password', 'tokens'])

      const token = nanoid()
      const expiredAt = moment(new Date()).add(process.env.EXPIRED_IN_DAYS || 15, 'd').startOf('day').toDate()

      await authCollection.findOneAndUpdate({ _id: isUsernameExist._id }, {
        $push: { 'tokens': { token, expiredAt } }
      })

      const result = {
        username,
        token,
      }

      return res.json({ result })
    })

    .post('/token', async function (req, res, next) {
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

      const result = {
        username: isTokenExist.username,
        token,
      }

      return res.json({ result })
    })

    .post('/password', async function (req, res, next) {
      const { password, newPassword } = req.body

      if (!this.currentUser)
        return next('failed to change password')

      const { _id } = this.currentUser

      const isUserExist = await Users.findOne({ _id })

      if (!isUserExist)
        return next('username doesn\'t exist')

      const _hash = _.get(isUserExist, 'services.hash')

      const isSamePassword = await bcrypt.compare(password, _hash)

      if (!isSamePassword)
        return next('wrong password')

      const hash = hashSync(newPassword)

      await Users.findOneAndUpdate({ _id: isUserExist._id }, {
        $set: {
          'password': hash,
          'tokens': [],
        }
      })

      return res.sendStatus(200)
    })

}
