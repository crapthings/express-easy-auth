const { expect } = require('chai')
const axios = require('axios')

const BASE_URL = 'http://localhost:3000/api'
const STATUS_URL = `${BASE_URL}/status`
const UNREGISTER_URL = `${BASE_URL}/unregister`
const REGISTER_URL = `${BASE_URL}/register`
const LOGIN_URL = `${BASE_URL}/login`
const TOKEN_LOGIN_URL = `${BASE_URL}/token`
const CHANGE_PASSWORD_URL = `${BASE_URL}/password`

describe('auth api', async function() {

  const username = 'user123'

  let token = null

  it('Status should be OK', async function () {
    const { data } = await axios.get(STATUS_URL)
    expect(data.api).to.be.true
    expect(data.db).to.be.true
  })

  it('Unregister an user', async function () {
    const { data } = await axios.post(UNREGISTER_URL, { username })
    expect(data).to.equal('OK')
  })

  it('Register user', async function() {
    const { data } = await axios.post(REGISTER_URL, { username, password: username })
    expect(data.username).to.be.a('string')
    expect(data.token).to.be.a('string')
  })

  it('Login user with password', async function() {
    const { data } = await axios.post(LOGIN_URL, { username, password: username })
    expect(data.username).to.be.a('string')
    expect(data.token).to.be.a('string')
    token = data.token
  })

  it('Login user with token', async function() {
    const { data } = await axios.post(TOKEN_LOGIN_URL, { token })
    expect(data.username).to.equal(username)
    expect(data.token).to.equal(token)
  })

  it('Change user password', async function() {
    const { data } = await axios.post(CHANGE_PASSWORD_URL, { username, password: username, newPassword: 'test' })
    expect(data).to.equal('OK')
  })

  it('Login user with new password', async function() {
    const { data } = await axios.post(LOGIN_URL, { username, password: 'test' })
    expect(data.username).to.be.a('string')
    expect(data.token).to.be.a('string')
  })

})
