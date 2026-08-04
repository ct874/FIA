import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (Postman, curl, server-to-server calls) — allow.
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`))
      }
    },
  }),
)
app.use(express.json())
app.use(morgan(env.isProduction ? 'combined' : 'dev'))

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'FIA API is running' })
})

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
