import {Outlet} from "react-router-dom";
import AppHeader from "../components/AppHeader";

const Root = () => {
    return (
        <div>
            <AppHeader/>
            <Outlet/>
        </div>
    );
};

export default Root;