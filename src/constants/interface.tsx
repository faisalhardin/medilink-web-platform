
interface JwtClaims {
    sub?: string;
    exp: number;
    iat: number;
    aud?: string;
    iss?: string;
    uuid?: string;
    name?: string;
    email?: string;
    institution_id?: number;
    institution_name?: string;
    roles?: Array<{ role_id: number; name: string }>;
    permissions?: string[];
    [key: string]: any;
}