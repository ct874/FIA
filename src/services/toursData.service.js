import { fetchToursRequest, createTourRequest, deleteTourRequest } from '../api/tours.api'

export async function fetchTours() {
  const { data } = await fetchToursRequest()
  return data.data
}

export async function createTour(payload) {
  const { data } = await createTourRequest(payload)
  return data.data
}

export async function deleteTour(tourId, password) {
  const { data } = await deleteTourRequest(tourId, password)
  return data.data
}
