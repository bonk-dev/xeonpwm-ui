import {Navigate, Outlet, useNavigate} from "react-router-dom";
import AppHeader from "../components/AppHeader";
import {pwmClient} from "../api/PwmHubClient";

const Root = () => {
    if (!pwmClient().isAuthenticated()) {
        console.debug('Not authenticated. Redirecting to /login');
        return <Navigate to={'/login'}/>
    }

    return (
        <div>
            <AppHeader/>

            <section className={'flex flex-col items-center w-full'}>
                <div className={'max-w-[1024px] w-full px-6'}>
                    <Outlet/>
                </div>
            </section>
        </div>
    );
};

export default Root;