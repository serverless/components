'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.set('content-type', 'text/html')
    await ctx.render('index.html', {
      msg: 'hi, egg',
    });
  }
}

module.exports = HomeController;
