const path = require('path')
const express = require('express')

const app = express()

app.use(express.static(path.join(__dirname, './dist')))

const server = app.listen(process.env.PORT, () => {
  console.log('Server Ready!', 'localhost:' + process.env.PORT)
})

// Set up websocket server
const ws = require('ws')

const wss = new ws.Server({
  server: server,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    }
  }
})

const heartbeat = (connection) => {
  connection.isAlive = true
}

// Send out all data to all other clients
wss.on('connection', (connection) => {
  connection.isAlive = true

  connection.on('message', (data) => {
    const decode = JSON.parse(data)

    if (decode.type === 'pong') {
      heartbeat(connection)
    }

    if (decode.type === 'message') {
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(data)
        }
      })
    }
  })
})

const ping = () => {
  wss.clients.forEach(client => {
    if (client.isAlive === false) {
      return client.terminate()
    }

    client.isAlive = false

    client.send(JSON.stringify({
      type: 'ping'
    }))
  })
}

const interval = setInterval(ping, 5000)
