// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase!')
})

// exports.handleEvent = functions.database.ref('/events/{eventId}')
//   .onWrite((event) => {
//     // Grab the current value of what was written to the Realtime Database.
//     const eventData = event.data.val()
//     console.log('Event Data', eventData)
//   //  const uppercase = original.toUpperCase();
//     // You must return a Promise when performing asynchronous tasks inside a Functions such as
//     // writing to the Firebase Realtime Database.
//     // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
//     //return event.data.ref.parent.child('uppercase').set(uppercase);
//   })

//
