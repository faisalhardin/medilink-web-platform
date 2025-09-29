

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

export const UNIT_TYPE_OPTIONS = [
    { value: 'piece', label: 'Piece', type: 'item' },
    { value: 'box', label: 'Box', type: 'item' },
    { value: 'bottle', label: 'Bottle', type: 'item' },
    { value: 'pack', label: 'Pack', type: 'item' },
    { value: 'vial', label: 'Vial', type: 'item' },
    { value: 'ampule', label: 'Ampule', type: 'item' },
    { value: 'tablet', label: 'Tablet', type: 'item' },
    { value: 'capsule', label: 'Capsule', type: 'item' },
    { value: 'ml', label: 'Milliliter (ml)', type: 'item' },
    { value: 'l', label: 'Liter (L)', type: 'item' },
    { value: 'g', label: 'Gram (g)', type: 'item' },
    { value: 'kg', label: 'Kilogram (kg)', type: 'item' },
    { value: 'hr', label: 'Hour (hr)', type: 'treatment' },
    { value: 'tooth', label: 'Tooth', type: 'treatment' },
    { value: 'jaw', label: 'Jaw', type: 'treatment' },
    { value: 'session', label: 'Session', type: 'treatment' },
    { value: 'area', label: 'Area', type: 'treatment' },
    { value: 'procedure', label: 'Procedure', type: 'treatment' },
  ];