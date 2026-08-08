import { calculateNpsFromCounts } from '../../../utils/nps'

export function computeCompletedSchoolsSummary(schools) {
  const count = schools.length
  const totalTarget = schools.reduce((sum, school) => sum + school.target, 0)
  const totalResponses = schools.reduce((sum, school) => sum + school.responses, 0)

  // Weighted CSAT: sum every row's underlying score total and response
  // count first, divide once at the end — NOT an average of each row's
  // already-rounded avgCsat. Rows with more responses correctly count for
  // more, per the platform's official CSAT formula (see src/utils/csat.js).
  const totalCsatScore = schools.reduce((sum, school) => sum + (school.csatScoreSum || 0), 0)
  const totalCsatResponses = schools.reduce((sum, school) => sum + (school.csatResponseCount || 0), 0)
  const avgCsat = totalCsatResponses > 0 ? totalCsatScore / totalCsatResponses : 0

  // Weighted NPS: sum every row's underlying promoter/detractor/total-
  // response counts first, then compute % Promoters - % Detractors ONCE at
  // the combined level — NOT an average of each row's already-computed NPS
  // value (that would weigh a row with 2 responses the same as a row with
  // 200). See src/utils/nps.js for the official formula.
  const totalNpsPromoters = schools.reduce((sum, school) => sum + (school.npsPromoters || 0), 0)
  const totalNpsDetractors = schools.reduce((sum, school) => sum + (school.npsDetractors || 0), 0)
  const totalNpsResponses = schools.reduce((sum, school) => sum + (school.npsTotalResponses || 0), 0)
  const avgNps = calculateNpsFromCounts(totalNpsPromoters, totalNpsDetractors, totalNpsResponses) ?? 0

  return {
    completedSchools: count,
    totalTarget,
    totalResponses,
    avgCsat: Number(avgCsat.toFixed(1)),
    avgNps: Math.round(avgNps),
  }
}
