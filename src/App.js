import {NextUIProvider} from "@nextui-org/react";
import {Route, Routes, useLocation, useNavigate} from "react-router-dom";
import Root from "./routes/Root";
import Dashboard from "./routes/Dashboard";
import Settings from "./routes/Settings";
import {useEffect} from "react";
import Login from "./routes/Login";

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.debug(location);
        if (location.pathname === '/') {
            navigate('/dashboard');
        }
    }, [location, navigate]);

    return (
        <NextUIProvider navigate={navigate}>
            <Routes>
                <Route path={"/login"} element={<Login/>}/>
                <Route path={"/"} element={<Root/>}>
                    <Route path={"/dashboard"} element={<Dashboard/>}/>
                    <Route path={"/settings"} element={<Settings/>}/>
                </Route>
            </Routes>
        </NextUIProvider>
    );
};

export default App;