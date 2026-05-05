import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: '/local/api',  // ← changed from http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // Token is sent automatically via HttpOnly cookie
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
      // Call logout endpoint to clear httpOnly token
      fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
        Cookies.remove('role')
        Cookies.remove('userId')
        Cookies.remove('name')
        window.location.href = '/login'
      })
    }
    return Promise.reject(error)
  }
)

export default api
