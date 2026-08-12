import {
  fetchDistrictFeedbackTargetsRequest,
  saveDistrictFeedbackTargetRequest,
} from '../api/districtFeedbackTargets.api'

export async function fetchDistrictFeedbackTargets() {
  const { data } = await fetchDistrictFeedbackTargetsRequest()
  return data.data
}

export async function saveDistrictFeedbackTarget(payload) {
  const { data } = await saveDistrictFeedbackTargetRequest(payload)
  return data.data
}
