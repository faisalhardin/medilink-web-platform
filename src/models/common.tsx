export  interface CommonResponse<T> {
    data?: T,
    message?: string,
}

export interface CommonQueryParams {
    q?: string;
    from_time?: string;
    to_time?: string;
    offset?: number;
    limit?: number;
}