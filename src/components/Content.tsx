
import LoginPage from "@components/Login";
import UserComponent from "./UserComponent";

const Content = () => {
    return (
        <div className="overflow-y-auto">
            <LoginPage/>
            <UserComponent/>
        </div>
    )
}

export default Content;