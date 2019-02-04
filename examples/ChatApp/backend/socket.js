on('default', async (data, socket) => {
  socket.send(data)
})

on('message', async (data, socket) => {
  socket.send(data)
})
