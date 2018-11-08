/* eslint no-console: 0 */
const request = require('request')

const mailChimpAPI = process.env.MAILCHIMP_API_KEY
const mailChimpListID = process.env.MAILCHIMP_LIST_ID
const mcRegion = process.env.MAILCHIMP_REGION

module.exports.landingPageFunction = (event, context, callback) => {
  // eslint-disable-line
  console.log('Function ran!')
  const formData = JSON.parse(event.body)
  const { email } = formData

  if (!formData) {
    console.log('No form data supplied')
    return callback('fail')
  }

  if (!email) {
    console.log('No EMAIL supplied')
    return callback('fail')
  }

  if (!mailChimpListID) {
    console.log('No LIST_ID supplied')
    return callback('fail')
  }

  const data = {
    email_address: email,
    status: 'subscribed',
    merge_fields: {}
  }

  const subscriber = JSON.stringify(data)
  console.log('start to mailchimp', subscriber)

  request(
    {
      method: 'POST',
      url: `https://${mcRegion}.api.mailchimp.com/3.0/lists/${mailChimpListID}/members`,
      body: subscriber,
      headers: {
        Authorization: `apikey ${mailChimpAPI}`,
        'Content-Type': 'application/json'
      }
    },
    (error, response, body) => {
      if (error) {
        return callback(error, null)
      }
      const bodyObj = JSON.parse(body)

      if (
        response.statusCode < 300 ||
        (bodyObj.status === 400 && bodyObj.title === 'Member Exists')
      ) {
        console.log('success added to list in mailchimp')
        return callback(null, {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
          body: JSON.stringify({
            status: 'saved email ⊂◉‿◉つ'
          })
        })
      }

      console.log('error from mailchimp', response.body.detail)
      return callback('fail')
    }
  )
}
