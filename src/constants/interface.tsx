
interface JwtClaims {
    sub?: string;
    exp: number;
    iat: number;
    aud?: string;
    iss?: string;
    [key: string]: any;
}