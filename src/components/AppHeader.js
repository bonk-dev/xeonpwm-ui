import {Link, Navbar, NavbarBrand, NavbarContent, NavbarItem} from "@nextui-org/react";
import {useCallback} from "react";
import {clearToken} from "../api/KeyStorage";
import {pwmClient} from "../api/PwmHubClient";
import {useNavigate} from "react-router-dom";

const AppHeader = () => {
    const navigate = useNavigate();

    const handleLogout = useCallback(() => {
        clearToken();

        Promise.all([
            pwmClient().logout(),
            pwmClient().disconnect()
        ])
            .finally(() => {
                navigate('/login');
            })
    }, [navigate]);

    return (
        <Navbar>
            <NavbarBrand>
                <p className={'font-bold text-inherit'}>XEON PWM</p>
            </NavbarBrand>
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <Link href={'/dashboard'}>Dashboard</Link>
                </NavbarItem>
                <NavbarItem>
                    <Link href={'/settings'}>Settings</Link>
                </NavbarItem>
                <NavbarItem>
                    <Link href={'#'} onClick={handleLogout}>Logout</Link>
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
};

export default AppHeader;