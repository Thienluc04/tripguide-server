import express from 'express'
import { defaultErrorHandler } from './middlewares/error.middleware'
import authRouter from './routes/auth.routes'
import databaseService from './services/database.services'
import { Request } from 'express'
import cors from 'cors'

const app = express()
const port = 4000

databaseService.connect()

app.use(cors<Request>())
app.use(express.json())
app.use('/auth', authRouter)
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log('Tripguide server is started on port ' + port)
})
