import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const medilinkAPIURL = import.meta.env.VITE_MEDILINK_API_BASE_URL

const  LoginPage = () => {

    const googleLogin = useGoogleLogin({
      onSuccess: async (codeResponse) => {

        try {
          const tokenResponse = await axios.get(
            `${medilinkAPIURL}/v1/auth/google/callback?code=${codeResponse.code}`
          );
          if (tokenResponse.data.data.token) {
            sessionStorage.setItem("jwt_token", tokenResponse.data.data.token);
            console.log("JWT token stored successfully.");
          } else {
            console.error("Token not received in response.");
          }
        } catch (error) {
          console.error("Error during token retrieval:", error);
        }
      },
      onError: (error) => console.error("Login failed:", error),
      flow: "auth-code",
    })
    return (
        <>
      <div>
        <button onClick={()=> googleLogin()}> Login </button>
      </div>    
    </>
    )
    
}

export default LoginPage;