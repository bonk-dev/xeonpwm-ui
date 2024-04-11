import {useCallback, useEffect, useState} from "react";
import {pwmClient, setupClient} from "./api/PwmHubClient";
import {useUpdateEffect} from "react-use";

const App = () => {
    useEffect(() => {
        setupClient('http://localhost:5117');
        pwmClient().connect()
            .then(async (madeNewConnection) => {
                if (!madeNewConnection) return;

                pwmClient().onDutyCycleChanged(onDutyCycleChanged);

                const dt = await pwmClient().getDutyCycle();
                console.debug(`DT: ${dt}`);

                setDutyCycle(dt);
            });
    }, []);

    const onDutyCycleChanged = (dutyCycle) => {
        setDutyCycle(dutyCycle);
    }

    const [dutyCycle, setDutyCycle] = useState(180);
    const [dutyCycleToSend, setDutyCycleToSend] = useState(180);
    const sendDutyCycle = useCallback(() => {
        if (isNaN(dutyCycleToSend)) {
            console.error("SetDutyCycle: not a number");
            return;
        }

        pwmClient().setDutyCycle(dutyCycleToSend)
            .then(() => {
                console.debug("Set the duty cycle");
            });
    }, [dutyCycleToSend]);

    useEffect(() => {
        setDutyCycle(dutyCycleToSend);
    }, [dutyCycleToSend]);

    useUpdateEffect(() => {
        sendDutyCycle();
    }, [sendDutyCycle]);

    return (
        <div className="App">
            <input type={'range'} min={0} max={255} value={dutyCycle} onChange={e => {
                setDutyCycleToSend(parseInt(e.target.value));
            }}/>
            <p>PWM: {dutyCycle}</p>
        </div>
    );
}

export default App;
