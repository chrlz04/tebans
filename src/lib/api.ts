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
  (response) => response,
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