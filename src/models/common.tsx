export  interface CommonResponse<T> {
    data?: T,
    message?: string,
}

export interface CommonQueryParams {
    q: string;
}