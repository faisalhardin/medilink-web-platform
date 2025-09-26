

export const MEDILINK_API_BASE_URL = import.meta.env.VITE_MEDILINK_API_BASE_URL

export const JWT_TOKEN_KEY = "medilink_token_key"
export const MEDILINK_USER = "medilink_user"
export const REFRESH_TOKEN = "medilink_refresh_token"


// path to institution
export const INSTITUTION_PATH = `/v1/institution`
export const PRODUCT_URL_PATH = `${INSTITUTION_PATH}/product`

// path to patients
export const PATIENT_PATH = `/v1/patient`

// path to visits
export const PATIENT_VISIT_PATH = `/v1/visit`
export const PATIENT_VISIT_PRODUCT_ORDER_PATH = `${PATIENT_VISIT_PATH}/product`

// path to visit detail
export const PATIENT_VISIT_DETAIL_PATH = `/v1/visit-detail`

// path to journey
export const JOURNEY_URL_PATH = `/v1/journey`

// url to auth
export const AUTH_URL = `${MEDILINK_API_BASE_URL}/v1/auth`