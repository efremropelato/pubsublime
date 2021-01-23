import { EventEmitter } from 'events';

import { REALM_CREATED, SESSION_TX, SESSION_RX, SESSION_WARNING } from './messages';
import tools from './tools';
import { BaseRealm, MemEngine } from './realm';
import { MemKeyValueStorage } from './memkv';

export class Router extends EventEmitter {
  constructor () {
    super()
    this._realms = new Map()
    this._sessions = new Map()

    this.on(SESSION_TX, function (session, data) {
      this.trace('[' + session.sessionId + '] >', data)
    })

    this.on(SESSION_RX, function (session, msg) {
      this.trace('[' + session.sessionId + '] <', msg)
    })

    this.on('session.debug', function (session, msg) {
      this.trace('[' + session.sessionId + '] ', msg)
    })

    this.on(SESSION_WARNING, function (session, msg, data) {
      this.trace('[' + session.sessionId + ']', msg, data)
    })
    this.setLogTrace(false)
  }

  setLogTrace (trace) {
    if (trace) {
      this.trace = function () {
        console.log.apply(console, arguments)
      }
    } else {
      this.trace = function () {}
    }
  }

  makeSessionId () {
    return tools.randomId()
  }

  registerSession (session) {
    if (!this._sessions.has(session.sessionId)) {
      this._sessions.set(session.sessionId, session)
      this.emit('connection', session)
    } else {
      throw new Error('session id already registered ' + session.sessionId)
    }
  }

  removeSession (session) {
    if (this._sessions.has(session.sessionId)) {
      this._sessions.delete(session.sessionId)
    }
  }

  getSession (sessionId) {
    return this._sessions.get(sessionId)
  }

  getRouterInfo () {
    return {}
  }

  createRealm (realmName) {
    const engine = new MemEngine()
    const realm = new BaseRealm(this, realmName, engine)
    realm.registerKeyValueEngine(['#'], new MemKeyValueStorage())
    return realm
  }

  getRealm (realmName, callback) {
    if (this._realms.has(realmName)) {
      callback(this._realms.get(realmName))
    } else {
      const realm = this.createRealm(realmName)
      this._realms.set(realmName, realm)
      this.emit(REALM_CREATED, realm, realmName)
      callback(realm)
    }
  }
}
