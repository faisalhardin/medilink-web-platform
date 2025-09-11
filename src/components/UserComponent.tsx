import { useCookies } from 'react-cookie';

const UserComponent = () => {
    const [cookies] = useCookies(['medilink_auth_token']); // Replace 'session_id' with your cookie name

    return (
        <div>
            <h1>Session ID: {cookies.medilink_auth_token}</h1>
        </div>
    );
};

export default UserComponent;
