import util from "util";
import net from "net";
import msgpack from "msgpack-lite";
import { SESSION_TX, SESSION_RX, SESSION_WARNING } from "../messages";
import { QueueClient } from "./queueClient";

const ServerNetSender = (socket, session, router) => {
  // var encodeStream = msgpack.createEncodeStream()
  // encodeStream.pipe(socket)
  this.send = (msg, callback) => {
    router.emit(SESSION_TX, session, JSON.stringify(msg));
    socket.write(msgpack.encode(msg));
    // encodeStream.write(msg);
    // encodeStream.end(); does not sending without end, but disconnections
  };

  this.close = (code, reason) => {
    socket.end();
  };
};

const NetServer = (gate, options) => {
  const router = gate.getRouter();
  const _server = net.Server((socket) => {
    const session = gate.createSession();
    const sender = new ServerNetSender(socket, session, router);
    const decodeStream = msgpack.createDecodeStream();

    socket.pipe(decodeStream).on("data", (msg) => {
      const ctx = gate.createContext(session, sender);
      try {
        router.emit(SESSION_RX, session, JSON.stringify(msg));
        session.handle(ctx, msg);
      } catch (e) {
        router.emit(SESSION_WARNING, session, "invalid message", msg);
        session.close(1003, "protocol violation");
        console.log(e);
      }
    });

    socket.on("end", () => {});

    socket.on("close", () => {
      session.cleanup();
    });
  });
  _server.listen(options);

  return _server;
};

const ClientNetSender = (socket) => {
  this.send = (msg, callback) => {
    socket.write(msgpack.encode(msg));
  };

  this.close = (code, reason) => {
    socket.end();
  };
};

const ClientSocket = (params) => {
  QueueClient.call(this);
  const socket = new net.Socket();
  let client;
  let decoder;

  socket.on("data", (chunk) => {
    decoder.decode(chunk);
  });

  socket.on("close", () => {
    console.log("Connection closed");
    setTimeout(this.connect, 2000);
  });

  socket.on("end", () => {
    console.log("Connection ended");
  });

  socket.on("error", (err) => {
    console.log("Connection ERROR", err);
    // setTimeout(this.connect, 2000)
  });

  socket.on("connect", () => {
    console.log("EVENT-CONNECT");
    client = new QueueClient();
    client.sender = new ClientNetSender(socket);

    decoder = new msgpack.Decoder();
    decoder.on("data", (msg) => {
      client.handle(msg);
    });
    this.onopen(client);
  });

  this.onopen = () => {};

  this.connect = () => {
    socket.connect(params.port, params.host);
  };
};
util.inherits(ClientSocket, QueueClient);

export { NetServer, ClientSocket };
