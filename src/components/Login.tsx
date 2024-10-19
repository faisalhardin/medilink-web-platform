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
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    
    </>
    )
    
}

export default LoginPage;