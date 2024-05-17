import {useUpdateEffect} from "react-use";
import {useCallback, useEffect, useRef, useState} from "react";
import {pwmClient, setupClient} from "../api/PwmHubClient";
import {
    getKeyValue,
    Slider,
    Switch
} from "@nextui-org/react";
import {PopiconsBinSolid} from "@popicons/react";
import 'chart.js/auto';
import {Chart} from "chart.js";
import { getRelativePosition } from "chart.js/helpers";
import dragPlugin from 'chartjs-plugin-dragdata';
import {Scatter} from "react-chartjs-2";

Chart.register(dragPlugin);

const getDtPercentage = (dutyCycle, max) => 1 - (dutyCycle / max);
const getDutyCycle = (percentage, max) => Math.floor(max * (1 - percentage));

const scatterData = {
    datasets: [
        {
            label: 'Temperature points',
            data: [
                {
                    x: 15,
                    y: 10
                },
                {
                    x: 50,
                    y: 60
                },
            ],
            backgroundColor: '#0060df',
            pointHitRadius: 25,
        },
    ],
};

const Dashboard = () => {
    const [maxDutyCycle, setMaxDutyCycle] = useState(255);
    const [dtPercentage, setDtPercentage] = useState(0.20);
    const [dutyCycleToSend, setDutyCycleToSend] = useState(170);
    const [isManualModeOn, setIsManualModeOn] = useState(true);

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

        if (isNaN(dutyCycleToSend)) {
            console.error("SetDutyCycle: not a number");
            return;
        }

        const dtCycle = dutyCycleToSend;
        pwmClient().setDutyCycle(dtCycle)
            .then(() => {
                console.debug("Set the duty cycle to " + dtCycle);
            });
    }, [dutyCycleToSend]);

    // Update the visible du
    useEffect(() => {
        setDtPercentage(getDtPercentage(dutyCycleToSend, maxDutyCycle));
    }, [dutyCycleToSend, maxDutyCycle]);

    useUpdateEffect(() => {
        sendDutyCycle();
    }, [sendDutyCycle]);

    const renderCell = useCallback((autoEntry, key) => {
        switch (key) {
            case 'remove':
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <PopiconsBinSolid className={'text-danger cursor-pointer text-lg'}/>
                    </div>
                );
            default:
                return getKeyValue(autoEntry, key);
        }
    }, []);

    const scatterOptions = {
        showLine: true,
        dragData: true,
        plugins: {
            dragData: {
                ...dragPlugin,
                dragX: true,
                dragY: true,
                round: 0
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Temperature [°C]'
                },
                dragData: true,
            },
            y: {
                beginAtZero: true,
                dragData: true,
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'PWM %'
                }
            }
        },
        onClick(e) {
            const chart = chartRef.current;
            const canPosition = getRelativePosition(e, chartRef.current);

            const dataX = Math.round(chart.scales.x.getValueForPixel(canPosition.x));
            const dataY = Math.round(chart.scales.y.getValueForPixel(canPosition.y));

            console.debug(`X: ${dataX}; Y: ${dataY}`);

            chart.data.datasets[0].data.push({
                x: dataX,
                y: dataY
            })
            chart.update();
        }
    };

    const chartRef = useRef();
    useEffect(() => {
        console.debug(chartRef.current.data);
    }, []);

    return (
        <article className={'page space-y-5'}>
            <h1 className={'text-2xl'}>Dashboard</h1>
            <Switch isSelected={isManualModeOn} onValueChange={setIsManualModeOn}>Manual mode</Switch>

            <section>
                <h2>Manual control</h2>
                <Slider
                    label="PWM"
                    step={0.01}
                    maxValue={1}
                    minValue={0}
                    defaultValue={0.2}
                    value={dtPercentage}
                    onChange={v => setDutyCycleToSend(getDutyCycle(v, maxDutyCycle))}
                    formatOptions={{ style: 'percent' }}
                    className="max-w-md" isDisabled={!isManualModeOn}
                />
            </section>
            <section>
                <h2>Automatic control</h2>
                <Scatter data={scatterData} options={scatterOptions} ref={chartRef}/>
            </section>
        </article>
    );
};

export default Dashboard;