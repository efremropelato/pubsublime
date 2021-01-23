import QueueClient from './queueClient';

const SessionMemSender = (memServer, client) => {
  var _buffer = []
  memServer.addSender(this)

  this.send = (msg) => {
    _buffer.push(msg)
    memServer.requestFlush()
  }

  this.handleBuffer = () => {
    if (_buffer.length === 0) {
      return false
    }
    var msg = _buffer.shift()
    if (msg === null) {
      client.sender._memClose()
    } else {
      client.handle(msg)
    }
    return true
  }

  this.close = () => {
    this.send(null)
  }
}

const ClientMemSender = (memServer, gate, session, sesisonSender) => {
  var _buffer = []
  memServer.addSender(this)

  this.send = (msg) => {
    _buffer.push(msg)
    memServer.requestFlush()
  }

  this.handleBuffer = () => {
    if (_buffer.length === 0) {
      return false
    }

    let msg = _buffer.shift()
    let ctx = gate.createContext(session, sesisonSender)
    gate.handle(ctx, session, msg)

    return true
  }

  this._memClose = () => {
    session.cleanup()
  }
}

const MemServer = (gate) => {
  let _streams = []
  let _flushRequested = false

  this.requestFlush = () => {
    if (!_flushRequested) {
      _flushRequested = true
      process.nextTick(() => {
        this.processStreams()
      }).bind(this)
    }
  }

  this.processStreams = () => {
    let found

    _flushRequested = false
    found = false
    for (let i = 0; i < _streams.length; i++) {
      found = found || _streams[i].handleBuffer()
    }
    if (found) {
      this.requestFlush()
    }
  }

  this.addSender = (pipe) => {
    _streams.push(pipe)
  }

  this.createClient = (realm, connectionId) => {
    let client = new QueueClient.QueueClient(connectionId)
    let sss = new SessionMemSender(this, client)
    let serverSession = gate.createSession()
    client.sender = new ClientMemSender(this, gate, serverSession, sss)
    realm.joinSession(serverSession)
    return client
  }
}

export { MemServer }
