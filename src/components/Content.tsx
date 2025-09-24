
import LoginButton from "@components/Login";
import UserComponent from "./UserComponent";

const Content = () => {
    return (
        <div className="overflow-y-auto">
            <LoginButton/>
            <UserComponent/>
        </div>
    )
}

export default Content;