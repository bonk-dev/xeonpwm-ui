import {Outlet} from "react-router-dom";
import AppHeader from "../components/AppHeader";

const Root = () => {
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