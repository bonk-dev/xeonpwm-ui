import {useCallback, useEffect, useState} from "react";
import {pwmClient, setupClient} from "./api/PwmHubClient";
import {useUpdateEffect} from "react-use";

const App = () => {
    useEffect(() => {
        setupClient('http://localhost:5117');
        pwmClient().onDutyCycleChanged(onDutyCycleChanged);
        pwmClient().connect()
            .then(async () => {
                const dt = await pwmClient().getDutyCycle();
                console.debug(`DT: ${dt}`);

                // TODO: Avoid sending duty cycle on connect
                setDutyCycle(dt);
            });
    }, []);

    const onDutyCycleChanged = (dutyCycle) => {
        setDutyCycle(dutyCycle);
    }

    const [dutyCycle, setDutyCycle] = useState("180");
    const sendDutyCycle = useCallback(() => {
        const cycleInt = parseInt(dutyCycle);
        if (isNaN(cycleInt)) {
            console.error("SetDutyCycle: not a number");
            return;
        }

        pwmClient().setDutyCycle(cycleInt)
            .then(() => {
                console.debug("Set the duty cycle");
            });
    }, [dutyCycle]);

    useUpdateEffect(() => {
        sendDutyCycle();
    }, [sendDutyCycle]);

    return (
        <div className="App">
            <input type={'range'} min={0} max={255} value={dutyCycle} onChange={e => {
                setDutyCycle(e.target.value);
            }}/>
            <p>PWM: {dutyCycle}</p>
        </div>
    );
}

export default App;
