import {
  fetchTargetProgressRequest,
  fetchTargetDistrictOptionsRequest,
  verifySetTargetAccessRequest,
  saveTargetRequest,
} from '../api/targets.api'

export async function fetchTargetProgress() {
  const { data } = await fetchTargetProgressRequest()
  return data.data
}

export async function fetchTargetDistrictOptions() {
  const { data } = await fetchTargetDistrictOptionsRequest()
  return data.data
}

export async function verifySetTargetAccess(password) {
  const { data } = await verifySetTargetAccessRequest(password)
  return data.data
}

export async function saveTarget(payload) {
  const { data } = await saveTargetRequest(payload)
  return data.data
}
