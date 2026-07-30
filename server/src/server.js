import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { ensureDefaultSuperAdmin } from './services/superAdminBootstrap.service.js'
import app from './app.js'

async function start() {
  await connectDB()

  const { created, loginId } = await ensureDefaultSuperAdmin()
  if (created) {
    console.log(`[bootstrap] Default Super Admin "${loginId}" created`)
  } else {
    console.log(`[bootstrap] Super Admin "${loginId}" already exists, skipping creation`)
  }

  app.listen(env.port, () => {
    console.log(`[server] FIA API listening on port ${env.port} (${env.nodeEnv})`)
  })
}

start()
