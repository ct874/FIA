import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { ensureDefaultSuperAdmin } from './services/superAdminBootstrap.service.js'
import { ensureSeedTours, refreshTourCache } from './services/tours.service.js'
import app from './app.js'

async function start() {
  await connectDB()

  const { created, loginId } = await ensureDefaultSuperAdmin()
  if (created) {
    console.log(`[bootstrap] Default Super Admin "${loginId}" created`)
  } else {
    console.log(`[bootstrap] Super Admin "${loginId}" already exists, skipping creation`)
  }

  // Seed AWS/Robotics/Music into the Tour collection (idempotent, a no-op
  // once already seeded) then load the live catalog into
  // constants/tours.js's mutable exports — every tour-aware module already
  // imports those directly, so this is the one place that needs to run
  // before the app starts accepting requests.
  await ensureSeedTours()
  await refreshTourCache()

  app.listen(env.port, () => {
    console.log(`[server] FIA API listening on port ${env.port} (${env.nodeEnv})`)
  })
}

start()
