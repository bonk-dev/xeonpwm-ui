import {useUpdateEffect} from "react-use";
import {useCallback, useEffect, useState} from "react";
import {pwmClient, setupClient} from "../api/PwmHubClient";
import {Slider} from "@nextui-org/react";

const getDtPercentage = (dutyCycle, max) => 1 - (dutyCycle / max);
const getDutyCycle = (percentage, max) => Math.floor(max * (1 - percentage));

const Dashboard = () => {
    const [maxDutyCycle, setMaxDutyCycle] = useState(255);
    const [dtPercentage, setDtPercentage] = useState(0.20);
    const [percentageToSend, setPercentageToSend] = useState(0.2);

    useEffect(() => {
        setupClient('http://localhost:5117');
        pwmClient().connect()
            .then(async (madeNewConnection) => {
                if (!madeNewConnection) return;

                pwmClient().onDutyCycleChanged(onDutyCycleChanged);
                pwmClient().onMaxDutyCycleChanged(onMaxDutyCycleChanged);

                const dt = await pwmClient().getDutyCycle();
                console.debug(`DT: ${dt}`);

                setDtPercentage(getDtPercentage(dt, maxDutyCycle));
            });
    }, []);

    const onDutyCycleChanged = (dutyCycle) => {
        const dt = getDtPercentage(dutyCycle, maxDutyCycle);
        console.debug(`CHANGED: ${dt}`);
        setDtPercentage(dt);
    }

    const onMaxDutyCycleChanged = (dutyCycle) => {
        setMaxDutyCycle(dutyCycle);
        console.debug(`New max: ${dutyCycle}`);
    }

    const sendDutyCycle = useCallback(() => {
        if (!pwmClient().isConnected()) {
            console.debug(`SetDutyCycle: not connected`);
            return;
        }

        if (isNaN(percentageToSend)) {
            console.error("SetDutyCycle: not a number");
            return;
        }

        const dtCycle = getDutyCycle(percentageToSend, maxDutyCycle);
        if (dtCycle < 180) {
            console.debug("night alert: " + dtCycle);
            return;
        }
        pwmClient().setDutyCycle(dtCycle)
            .then(() => {
                console.debug("Set the duty cycle to " + dtCycle);
            });
    }, [percentageToSend]);

    // Update the visible du
    useEffect(() => {
        setDtPercentage(percentageToSend);
    }, [percentageToSend]);

    useUpdateEffect(() => {
        sendDutyCycle();
    }, [sendDutyCycle]);

    return (
        <article className={'page'}>
            <h1>Dashboard</h1>
            <section>
                <h2>Manual control</h2>
                <Slider
                    label="PWM"
                    step={0.01}
                    maxValue={1}
                    minValue={0}
                    defaultValue={0.2}
                    value={dtPercentage}
                    onChange={v => setPercentageToSend(v)}
                    formatOptions={{ style: 'percent' }}
                    className="max-w-md"
                />
            </section>
            <button onClick={() => setDtPercentage(Math.random())}>ghjgjgh</button>
        </article>
    );
};

export default Dashboard;