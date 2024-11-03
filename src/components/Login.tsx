import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const  LoginPage = () => {

    const googleLogin = useGoogleLogin({
      onSuccess: async (codeResponse) => {

        try {
          const tokenResponse = await axios.get(
            `http://127.0.0.1:8080/v1/auth/google/callback?code=${codeResponse.code}`
          );
          if (tokenResponse.data.token) {
            sessionStorage.setItem("jwt_token", tokenResponse.data.token);
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