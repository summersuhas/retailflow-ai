import axios from 'axios'

const api = axios.create({
  baseURL: 'https://retailflow-ai.onrender.com',
})

export default api