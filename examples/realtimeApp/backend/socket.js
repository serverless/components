/* global on */
on('default', async (data, socket) => {
  socket.send(`default received: ${data}`)
})

on('message', async (data, socket) => {
  socket.send(`message received: ${data}`)
})
