on('connect', async (data, socket) => {
  socket.send(data)
})

on('default', async (data, socket) => {
  socket.send(data)
})
