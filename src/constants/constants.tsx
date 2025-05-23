

export const MEDILINK_API_BASE_URL = import.meta.env.VITE_MEDILINK_API_BASE_URL

export const JWT_TOKEN_KEY = "medilink_token_key"
export const MEDILINK_USER = "medilink_user"


// path to institution
export const INSTITUTION_PATH = `${MEDILINK_API_BASE_URL}/v1/institution`

// path to patients
export const PATIENT_PATH = `${MEDILINK_API_BASE_URL}/v1/patient`

// path to visits
export const PATIENT_VISIT_PATH = `${MEDILINK_API_BASE_URL}/v1/visit`

// path to visit detail
export const PATIENT_VISIT_DETAIL_PATH = `${MEDILINK_API_BASE_URL}/v1/visit-detail`

// path to journey
export const JOURNEY_URL_PATH = `${MEDILINK_API_BASE_URL}/v1/journey`