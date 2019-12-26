'use strict'

const { Controller } = require('egg')
const { sleep } = require('../utils/index')

class UserController extends Controller {
  async index() {
    const { ctx } = this
    await sleep(Math.random())
    ctx.body = [
      {
        id: 1,
        name: 'yugasun',
        site: 'yugasun.com'
      }
    ]
  }

  async create() {
    const { ctx } = this
    const user = ctx.request.body
    await sleep(Math.random())
    ctx.body = {
      id: 1,
      ...user
    }
  }

  async show() {
    const { ctx } = this
    const id = ctx.params.id
    await sleep(Math.random())
    ctx.body = {
      id: id,
      name: 'yugasun',
      site: 'yugasun.com'
    }
  }
}

module.exports = UserController
