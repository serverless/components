on('default', async (data, socket) => {
  socket.log(`incoming client request ${data}`)
  socket.send(`default received: ${data}`)
})

on('message', async (data, socket) => {
  socket.send(`message received: ${data}`)
})
