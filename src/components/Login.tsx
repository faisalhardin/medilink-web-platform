import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const  LoginPage = () => {

    const googleLogin = useGoogleLogin({
      onSuccess: async (codeResponse) => {
        const tokenResponse = await axios.get(
          `http://127.0.0.1:8080/v1/auth/google/callback?code=${codeResponse.code}`
        );
        console.log("tokenResponse",tokenResponse);
        sessionStorage.setItem("jwt_token", tokenResponse.data.token);
        sessionStorage.setItem("jwt_token", tokenResponse.data.token);

      },
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