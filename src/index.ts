import dotenv from 'dotenv'
dotenv.config()
import { app } from './server'
const port = process.env.PORT ? Number(process.env.PORT) : 4000
app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`)
})
