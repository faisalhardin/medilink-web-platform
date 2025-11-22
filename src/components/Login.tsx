import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const  LoginButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
   
    return (
        <>
      <div>
        <button onClick={()=> navigate('/login')}> {t('auth.login')} </button>
      </div>    
    </>
    )
    
}

export default LoginButton;