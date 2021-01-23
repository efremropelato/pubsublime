import metaUser from "./metauser";
import WampGate from "./wamp/gate";
import MqttGate from "./mqtt/gate";
import WampServer from "./wamp/transport";
import MqttServer from "./mqtt/transport";
import WsMqttServer from "./mqtt/ws_transport";
import Router from "./router";

export class FoxRouter extends Router {
  constructor() {
    super();
    metaUser.registerHandlers(this);
  }

  listenWAMP(wsOptions, authHandler) {
    const gate = new WampGate(this);
    if (authHandler) {
      gate.setAuthHandler(authHandler);
    }
    return new WampServer(gate, wsOptions);
  }

  listenMQTT(wsOptions, authHandler) {
    const gate = new MqttGate(this);
    if (authHandler) {
      gate.setAuthHandler(authHandler);
    }
    return new MqttServer(gate, wsOptions);
  }

  listenWsMQTT(wsOptions, authHandler) {
    const gate = new MqttGate(this);
    if (authHandler) {
      gate.setAuthHandler(authHandler);
    }
    return new WsMqttServer(gate, wsOptions);
  }
}
