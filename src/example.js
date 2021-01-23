import http from 'http';
import express from 'express';
import { FoxRouter } from './fox_router';

const PORT = process.env.PORT || 5000

const app = express()
app.get('/', (req, res) => res.send('Hello World!'))

const httpServer = http.createServer(app)
httpServer.listen(PORT, () => console.log(`Listening on ${ PORT }`))

const router = new FoxRouter()
router.listenWAMP({server: httpServer, path: "/wamp"})