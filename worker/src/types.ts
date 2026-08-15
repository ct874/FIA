// Shared Hono app typing — `Variables` is what middleware attaches to the
// request context (mirrors Express's `req.superAdminId`/`req.schoolId`).
import type { Env } from './env'

export interface Variables {
  superAdminId?: string
  schoolId?: string
}

export type AppEnv = {
  Bindings: Env
  Variables: Variables
}
