import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: '/api',  // ← changed from http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // If the API standard structure uses `{ success: true, data: [...] }`,
    // unwrap it directly so `res.data` in components returns the actual payload.
    if (response.data && response.data.success === true && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token')
      Cookies.remove('role')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
