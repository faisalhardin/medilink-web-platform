import {jwtDecode} from "jwt-decode";
import { JWT_TOKEN_KEY, MEDILINK_USER } from "constants/constants";

// Function to save a JWT token to localStorage
export const saveToken = (token: string): void => {
    localStorage.setItem("jwtToken", token);
};

// Function to retrieve the JWT token from localStorage
export const getToken = (): string | null => {
    return sessionStorage.getItem(JWT_TOKEN_KEY);
};

// Function to remove the JWT token from localStorage
export const removeToken = (): void => {
    localStorage.removeItem("jwtToken");
};

export const storeAuthentication = (token: string) : void => {

    try {
       let  userClaims = jwtDecode<JwtClaims>(token);
       sessionStorage.setItem(JWT_TOKEN_KEY, token);
       sessionStorage.setItem(MEDILINK_USER, JSON.stringify(userClaims));
    } catch (error) {
        console.error("Failed to decode JWT:", error);
    }
}