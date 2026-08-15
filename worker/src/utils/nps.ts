// Ported verbatim from server/src/utils/nps.js. NPS is never a simple
// average — Promoters(9-10)/Passives(7-8)/Detractors(0-6) of valid 0-10
// scores; %Promoters - %Detractors. AFE export's educator_nps is the RAW
// score, deliberately NOT this formula (see constants/afeExport.ts).
export interface NpsSummary {
  promoters: number
  passives: number
  detractors: number
  totalResponses: number
  promoterPercentage: number | null
  detractorPercentage: number | null
  nps: number | null
}

function computeNpsFromCounts(promoters: number, detractors: number, totalResponses: number) {
  if (totalResponses === 0) {
    return { promoterPercentage: null as number | null, detractorPercentage: null as number | null, nps: null as number | null }
  }
  const promoterPercentage = Number(((promoters / totalResponses) * 100).toFixed(2))
  const detractorPercentage = Number(((detractors / totalResponses) * 100).toFixed(2))
  const nps = Number((promoterPercentage - detractorPercentage).toFixed(2))
  return { promoterPercentage, detractorPercentage, nps }
}

export function summarizeNpsResponses(scores: Array<number | null | undefined>): NpsSummary {
  const validScores = (scores || []).filter((value): value is number => value !== null && value !== undefined)
  const promoters = validScores.filter((score) => score >= 9).length
  const passives = validScores.filter((score) => score >= 7 && score <= 8).length
  const detractors = validScores.filter((score) => score <= 6).length
  const totalResponses = validScores.length
  const { promoterPercentage, detractorPercentage, nps } = computeNpsFromCounts(promoters, detractors, totalResponses)

  return { promoters, passives, detractors, totalResponses, promoterPercentage, detractorPercentage, nps }
}

export function calculateNps(scores: Array<number | null | undefined>): number | null {
  return summarizeNpsResponses(scores).nps
}

export function calculateNpsFromCounts(promoters: number, detractors: number, totalResponses: number): number | null {
  return computeNpsFromCounts(promoters, detractors, totalResponses).nps
}
