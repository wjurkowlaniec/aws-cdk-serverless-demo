'use strict'

exports.handler = function (event, context, callback) {
  var response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-9',
    },
    body: '<p>Hello world!</p>',
  }
  console.log(response)
  console.log("Elo")
  callback(null, response)
}
