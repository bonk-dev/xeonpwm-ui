import {NextUIProvider} from "@nextui-org/react";
import {Route, Routes, useNavigate} from "react-router-dom";
import Root from "./routes/Root";
import Auto from "./routes/Auto";
import Manual from "./routes/Manual";
import Settings from "./routes/Settings";

const App = () => {
    const navigate = useNavigate();

    return (
        <NextUIProvider navigate={navigate}>
            <Routes>
                <Route path={"/"} element={<Root/>}>
                    <Route path={"/auto"} element={<Auto/>}/>
                    <Route path={"/manual"} element={<Manual/>}/>
                    <Route path={"/settings"} element={<Settings/>}/>
                </Route>
            </Routes>
        </NextUIProvider>
    );
};

export default App;