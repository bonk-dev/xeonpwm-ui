import {Button, Input} from "@nextui-org/react";
import {PopiconsLockDuotone} from "@popicons/react";
import {useCallback, useEffect, useState} from "react";
import {pwmClient} from "../api/PwmHubClient";
import {useNavigate} from "react-router-dom";
import {clearToken} from "../api/KeyStorage";
import {useEffectEvent} from "../hooks/useEffectEvent";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleOnLoginClick = useCallback((name, pass) => {
        setError(null);
        setIsLoading(true);

        pwmClient()
            .login(name, pass)
            .then(() => {
                console.debug('logged in');
                setIsLoading(false);
                setError(null);

                pwmClient()
                    .connect()
                    .then(madeNewConn => {
                        if (madeNewConn) {
                            navigate('/dashboard');
                        }
                    })
                    .catch(e => {
                        console.error(e);

                        if (e.message === 'Unauthorized') {
                            clearToken();
                            navigate('/login');
                        }
                    })
            })
            .catch(e => {
                console.error(e);
                console.log("Login failed");

                setIsLoading(false);
                setError('Login failed');
            });
    }, [navigate]);

    const handleOnKeyDown = useEffectEvent(e => {
        if (e.key === 'Enter') {
            handleOnLoginClick(username, password);
        }
    }, [handleOnLoginClick]);

    useEffect(() => {
        document.addEventListener('keydown', handleOnKeyDown);
        return () => {
            console.debug('removing');
            window.removeEventListener('keydown', handleOnKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <article className={'flex flex-col justify-center items-center w-full h-screen'}>
            <header className={'mb-4'}>
                <h1 className={'text-3xl'}>XEON PWM Login</h1>
            </header>

            <form className={'flex flex-col justify-center items-center w-full'}>
                <Input
                    isRequired
                    type={'text'}
                    label={'Username'}
                    className={'max-w-xs mb-3'}
                    value={username}
                    onValueChange={setUsername}
                    autoComplete={'username'}/>
                <Input
                    isRequired
                    type={'password'}
                    label={'Password'}
                    className={'max-w-xs mb-3'}
                    value={password}
                    onValueChange={setPassword}
                    autoComplete={'current-password'}/>

                {error != null ? (
                    <p className={'text-danger mb-3'}>{error}</p>
                ) : null}

                <Button
                    color={'primary'}
                    variant={'ghost'}
                    startContent={<PopiconsLockDuotone/>}
                    onClick={() => handleOnLoginClick(username, password)}
                    isLoading={isLoading}>
                    Login
                </Button>
            </form>
        </article>
    );
};

export default Login;