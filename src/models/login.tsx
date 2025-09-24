export interface LoginResponse {
    access_token: string;
    refresh_token: string;
}

export interface RefreshTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}