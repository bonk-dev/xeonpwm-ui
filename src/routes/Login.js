import {Button, Input} from "@nextui-org/react";
import {PopiconsLockDuotone} from "@popicons/react";
import {useCallback, useState} from "react";
import {pwmClient} from "../api/PwmHubClient";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleOnLoginClick = useCallback(() => {
        setIsLoading(true);
        pwmClient()
            .login(username, password)
            .then(() => {
                console.debug('logged in')
                setIsLoading(false);
            })
            .catch(e => {
                console.error("Login failed");
                setIsLoading(false);
            });
    }, [username, password]);

    return (
        <article className={'flex flex-col justify-center items-center w-full h-screen'}>
            <header className={'mb-4'}>
                <h1 className={'text-3xl'}>XEON PWM Login</h1>
            </header>

            <Input
                isRequired
                type={'text'}
                label={'Username'}
                className={'max-w-xs mb-3'}
                value={username}
                onValueChange={setUsername}/>
            <Input
                isRequired
                type={'password'}
                label={'Password'}
                className={'max-w-xs mb-3'}
                value={password}
                onValueChange={setPassword}/>

            <Button
                color={'primary'}
                variant={'ghost'}
                startContent={<PopiconsLockDuotone/>}
                onClick={handleOnLoginClick}
                isLoading={isLoading}>
                Login
            </Button>
        </article>
    );
};

export default Login;