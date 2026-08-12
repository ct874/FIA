import axiosClient from './axiosClient'

export const fetchToursRequest = () => axiosClient.get('/tours')

export const createTourRequest = ({ tourName, durationMinutes, password }) =>
  axiosClient.post('/tours', { tourName, durationMinutes, password })

export const deleteTourRequest = (tourId, password) =>
  axiosClient.delete(`/tours/${encodeURIComponent(tourId)}`, { data: { password } })
