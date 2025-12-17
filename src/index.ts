import dotenv from 'dotenv'
dotenv.config()
import { app } from './server'
import http from 'http'
import { initRealtime } from './realtime'
const port = process.env.PORT ? Number(process.env.PORT) : 4000
const server = http.createServer(app)
initRealtime(server)
server.listen(port, () => {
  console.log(`API running at http://localhost:${port}`)
})
