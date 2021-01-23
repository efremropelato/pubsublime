import { RESULT_OK, RESULT_ACK, RESULT_ERR,
  REQUEST_EVENT, REQUEST_TASK } from '../messages';
import BaseGate from '../base_gate';
import { errorCodes, RealmError } from '../realm_error';
import Context from '../context';

let handlers = {}
let cmdAck = {}

class FoxContext extends Context {
  sendInvoke (cmd) {
    this.foxSend({
      id: cmd.id,
      uri: cmd.uri,
      qid: cmd.qid,
      opt: cmd.opt,
      rsp: REQUEST_TASK,
      data: cmd.data
    })
  }

  sendResult (cmd) {
    this.foxSend({
      id: cmd.id,
      rsp: cmd.rsp,
      data: cmd.data
    })
  }

  sendEvent (cmd) {
    this.foxSend({
      id: cmd.id,
      uri: cmd.uri,
      qid: cmd.qid,
      opt: cmd.opt,
      rsp: REQUEST_EVENT,
      data: cmd.data
    })
  }

  acknowledged (cmd) {
    cmdAck[cmd.ft].call(this, cmd)
  }

  foxSend (msg, callback) {
    this.sender.send(msg, callback)
  }

  foxClose (code, reason) {
    this.sender.close(code, reason)
  }

  foxSendError (foxType, requestId, errCode, errMessage) {
    this.foxSend({
      id: requestId,
      ft: foxType,
      rsp: RESULT_ERR,
      data: { code: errCode, message: errMessage }
    })
  }
}

class FoxGate extends BaseGate {
  createContext (session, sender) {
    return new FoxContext(this._router, session, sender)
  }

  checkHeader (index) {
    if (this.msg.hasOwnProperty(index)) {
      return true
    }

    this.reject(
      errorCodes.ERROR_HEADER_IS_NOT_COMPLETED,
      'Header is not completed "' + index + '"'
    )
    return false
  }

  checkRealm (session, requestId) {
    if (!session.realm) {
      throw new RealmError(requestId, 'wamp.error.not_authorized')
    }
  }

  sendWelcome (ctx, session, cmd) {
    ctx.foxSend({
      id: cmd.id,
      rsp: RESULT_OK,
      data: {
        kv: {
          routerInfo: this.getRouter().getRouterInfo(),
          realmInfo: session.getRealmInfo()
        }
      }
    })
  }

  handle (ctx, session, msg) {
    if (typeof msg !== 'object') {
      ctx.foxClose(1003, 'protocol violation')
      return
    }
    let foxType = msg.ft
    if (!handlers[foxType]) {
      console.log('Type Not Found', msg)
      ctx.foxClose(1003, 'protocol violation')
      return
    }
    try {
      handlers[foxType].call(this, ctx, session, msg)
    } catch (err) {
      if (err instanceof RealmError) {
        ctx.foxSendError(foxType, err.requestId, err.code, err.message)
      } else {
        console.log('hyper-gate-error', foxType, err)
        throw err
      }
    }
  }
  getProtocol () {
    return 'hyper.json'
  }
}

handlers.LOGIN = (ctx, session, message) => {
  this.loginRealm(ctx, session, message)
}

handlers.ECHO = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doEcho(ctx, message)
}

cmdAck.ECHO = (cmd) => {
  this.foxSend({
    id: cmd.id,
    rsp: RESULT_OK,
    data: cmd.data
  })
}

handlers.YIELD = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doYield(ctx, message)
}

handlers.CONFIRM = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doConfirm(ctx, message)
}

cmdAck.CONFIRM = (cmd) => {
  this.foxSend({
    id: cmd.id,
    qid: cmd.qid,
    rsp: RESULT_OK,
    data: cmd.data
  })
}

handlers.REG = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doRegRpc(ctx, message)
}

cmdAck.REG = (cmd) => {
  this.foxSend({
    id: cmd.id,
    rsp: RESULT_ACK,
    data: cmd.qid // will unregister
  })
}

handlers.UNREG = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doUnRegRpc(ctx, message)
}

cmdAck.UNREG = (cmd) => {
  this.foxSend({
    id: cmd.id,
    rsp: RESULT_OK
  })
}

handlers.CALL = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doCallRpc(ctx, message)
}

handlers.TRACE = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doTrace(ctx, message)
}

cmdAck.TRACE = (cmd) => {
  this.foxSend({
    id: cmd.id,
    rsp: RESULT_ACK,
    data: cmd.qid // will unregister
  })
}

handlers.UNTRACE = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doUnTrace(ctx, message)
}

cmdAck.UNTRACE = (cmd) => {
  this.foxSend({
    id: cmd.id,
    rsp: RESULT_OK
  })
}

handlers.PUSH = (ctx, session, message) => {
  this.checkRealm(session, message.id)
  session.realm.doPush(ctx, message)
}

cmdAck.PUSH = (cmd) => {
  this.foxSend({
    id: cmd.id,
    rsp: RESULT_OK,
    data: cmd.data
  })
}

handlers.GOODBYE = (ctx, session, message) => {
  ctx.foxClose(1000, 'Server closed session')
}

export { FoxGate }
