const LoginPage = () => {

    const handlerLogin = () => {
        window.location.href = "http://127.0.0.1:8080/v1/auth/google";
      }
    return (
        <>
      <div>
        <button onClick={handlerLogin}>
          Login with Google
        </button>
      </div>    
    </>
    )
    
}

export default LoginPage;