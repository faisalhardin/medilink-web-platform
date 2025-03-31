import {jwtDecode} from "jwt-decode";
import { JWT_TOKEN_KEY, MEDILINK_USER } from "constants/constants";
import { JourneyPoint } from "@models/journey";
import { Id } from "types";

// Function to save a JWT token to localStorage
export const saveToken = (token: string): void => {
    localStorage.setItem("jwtToken", token);
};

// Function to retrieve the JWT token from localStorage
export const getToken = (): string | null => {
    return sessionStorage.getItem(JWT_TOKEN_KEY);
};

export const getStorageJourneyPoints = (): JourneyPoint[] => {
    const userPayload = sessionStorage.getItem(MEDILINK_USER) || "";
    if (userPayload) {
        try {
            const user: JwtClaims = JSON.parse(userPayload);
            return user.journey_points;
        } catch (error) {
            return []
        }
    }
    return [];
}

export const getStorageUserJourneyPointsIDAsSet = (): Set<Id> => {
    const userJourneyPointsArray = getStorageJourneyPoints();
    const userJourneyPointsSet = new Set(userJourneyPointsArray.map((journeyPoint) => {
        return journeyPoint.id;
    } ));
    return userJourneyPointsSet;

}

// Function to remove the JWT token from localStorage
export const removeToken = (): void => {
    localStorage.removeItem("jwtToken");
};

export const storeAuthentication = (token: string) : void => {

    try {
       let  userClaims = jwtDecode<JwtClaims>(token);
       sessionStorage.setItem(JWT_TOKEN_KEY, token);
       sessionStorage.setItem(MEDILINK_USER, JSON.stringify(userClaims.payload));
    } catch (error) {
        console.error("Failed to decode JWT:", error);
    }
}