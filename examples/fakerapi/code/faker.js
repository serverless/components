/* eslint-disable no-console */

const faker = require('faker')

module.exports.create = function create(evt, ctx, cb) {
  // Use a combination of anu API Methods at http://marak.github.io/faker.js/
  // {"category": "name", "item": "findName", "locale": "de"}
  const params = JSON.parse(evt.body)
  const { category, item, locale } = params

  // set locale
  faker.locale = 'en'
  if (locale) {
    faker.locale = locale
  }
  let fakeValue
  try {
    // call faker
    fakeValue = faker[category][item]()
    const fakeData = {
      category,
      item,
      value: fakeValue
    }
    cb(null, {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(fakeData)
    })
  } catch (err) {
    const errBody = { message: `Invalid category: '${category}' or item: '${item}' combination.` }
    console.log('Error: ', errBody)
    cb(null, {
      statusCode: 500,
      body: JSON.stringify(errBody)
    })
  }
}
