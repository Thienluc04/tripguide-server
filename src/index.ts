import express from 'express'
import { defaultErrorHandler } from './middlewares/error.middleware'
import authRouter from './routes/auth.routes'
import databaseService from './services/database.services'
import { Request } from 'express'
import cors from 'cors'
import userRouter from './routes/users.routes'
import mediaRouter from './routes/media.routes'
import { initFolder } from './utils/file'

const app = express()
const port = 4000

initFolder()

databaseService.connect()

app.use(cors<Request>())
app.use(express.json())
app.use('/auth', authRouter)
app.use('/users', userRouter)
app.use('/medias', mediaRouter)
app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log('Tripguide server is starting on port ' + port)
})
