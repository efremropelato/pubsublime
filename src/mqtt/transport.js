import net from 'net';
import { generate, ParserBuild } from 'mqtt-packet';

const MqttSender = (socket, session, router) => {
  this.send = function (data) {
    router.emit('session.Tx', session, data)
    socket.write(generate(data))
  }

  this.close = function () {
    socket.end()
  }
}

export const MqttServer = (gate, options) => {
  const router = gate.getRouter()
  const _server = net.Server(function (socket) {
    const session = gate.createSession()
    const sender = new MqttSender(socket, session, router)

    const parser = ParserBuild()

    parser.on('packet', function (data) {
      const ctx = gate.createContext(session, sender)
      router.emit('session.Rx', session, data)
      session.handle(ctx, data)
    })

    socket.on('data', function (chunk) {
      parser.parse(chunk)
    })

    socket.on('end', function () {
    })

    socket.on('close', function () {
      session.cleanup()
    })
  })
  _server.listen(options)
}
