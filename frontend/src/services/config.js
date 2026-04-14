const DEFAULT_BASE_URL = 'https://s84-0426-urbaniq-datascience-oracle.onrender.com'

const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const selectedBaseUrl = (envBaseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')

export const API_PREFIX = '/api/v1'
export const BASE_URL = selectedBaseUrl.endsWith(API_PREFIX)
	? selectedBaseUrl.slice(0, -API_PREFIX.length)
	: selectedBaseUrl

export const API_BASE_URL = selectedBaseUrl.endsWith(API_PREFIX)
	? selectedBaseUrl
	: `${BASE_URL}${API_PREFIX}`
