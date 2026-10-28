const API_BASE = import.meta.env.PROD
  ? `${import.meta.env.BASE_URL}api`
  : '/api'

export default API_BASE
