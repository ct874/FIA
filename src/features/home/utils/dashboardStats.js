export function computeCompletedSchoolsSummary(schools) {
  const count = schools.length
  const totalTarget = schools.reduce((sum, school) => sum + school.target, 0)
  const totalResponses = schools.reduce((sum, school) => sum + school.responses, 0)
  const avgCsat = count ? schools.reduce((sum, school) => sum + school.avgCsat, 0) / count : 0
  const avgNps = count ? schools.reduce((sum, school) => sum + school.nps, 0) / count : 0

  return {
    completedSchools: count,
    totalTarget,
    totalResponses,
    avgCsat: Number(avgCsat.toFixed(1)),
    avgNps: Math.round(avgNps),
  }
}
