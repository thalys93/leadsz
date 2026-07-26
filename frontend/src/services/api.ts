import axios from "axios"

const apiUrl = import.meta.env.VITE_API_URL
const apiVersion = import.meta.env.VITE_API_VERSION || "v0"

const baseURL = apiUrl
  ? `${apiUrl}/${apiVersion}/`
  : "http://localhost:3001/api/v0/"

const api = axios.create({ baseURL })

api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem("auth-storage")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const token = parsed?.state?.token ?? parsed?.token
        if (token) config.headers.Authorization = `Bearer ${token}`
      } catch {
        // ignore parse errors
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
