import {useUpdateEffect} from "react-use";
import {useCallback, useEffect, useRef, useState} from "react";
import {pwmClient, setupClient} from "../api/PwmHubClient";
import {
    Divider,
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
import currentTempPlugin from "../plugins/currentTempPlugin";

Chart.register(dragPlugin);
Chart.register(currentTempPlugin);

const getDtPercentage = (dutyCycle, max) => 1 - (dutyCycle / max);
const getDutyCycle = (percentage, max) => Math.floor(max * (1 - percentage));

const scatterData = {
    datasets: [
        {
            label: 'Temperature points',
            data: [
                {
                    x: -10,
                    y: 10
                },
                {
                    x: 15,
                    y: 10
                },
                {
                    x: 50,
                    y: 60
                },
                {
                    x: 110,
                    y: 60
                }
            ],
            backgroundColor: '#0060df',
            pointHitRadius: 25,
            radius: 10
        },
    ],
};

const Dashboard = () => {
    const [maxDutyCycle, setMaxDutyCycle] = useState(255);
    const [dtPercentage, setDtPercentage] = useState(0.20);
    const [dutyCycleToSend, setDutyCycleToSend] = useState(170);
    const [isManualModeOn, setIsManualModeOn] = useState(true);
    const [currentTemp, setCurrentTemp] = useState(0);

    useEffect(() => {
        setupClient('http://localhost:5117');
        pwmClient().connect()
            .then(async (madeNewConnection) => {
                if (!madeNewConnection) return;

                pwmClient().onDutyCycleChanged(onDutyCycleChanged);
                pwmClient().onMaxDutyCycleChanged(onMaxDutyCycleChanged);
                pwmClient().onTemperatureChanged(onTemperatureChanged);

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

    const onTemperatureChanged = (temperature) => {
        console.debug(`New temperature: ${temperature}`);
        setCurrentTemp(temperature);
    };

    useEffect(() => {
        chartRef.current.update();
    }, [currentTemp]);

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
                round: 0,
                onDragStart: (e, setIndex, index, value) => {
                    if (index === 0 || index === chartRef.current.data.datasets[setIndex].data.length - 1) {
                        return false;
                    }
                },
                onDrag: (e, setIndex, index, value) => {
                    const set = chartRef.current.data.datasets[setIndex].data;
                    if (index === 1) {
                        set[0].y = value.y;
                    }
                    else if (index === chartRef.current.data.datasets[setIndex].data.length - 2) {
                        set[set.length - 1].y = value.y;
                    }
                },
                onDragEnd: (e, setIndex, index, value) => {
                    const dataset = chartRef.current.data.datasets[setIndex].data;
                    dataset.sort((a, b) => {
                        return a.x - b.x;
                    });

                    dataset[0].y = dataset[1].y;
                    dataset[dataset.length - 1].y = dataset[dataset.length - 2].y;

                    chartRef.current.update('none');
                }
            },
            currentTempPlugin: {
                ...currentTempPlugin,
                getCurrentTemp: () => {
                    return currentTemp;
                }
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

            const dataArr = chart.data.datasets[0].data;
            const existingPoint = dataArr.find(d => d.x === dataX);

            if (existingPoint != null) {
                if (existingPoint.y === dataY) {
                    dataArr.splice(dataArr.indexOf(existingPoint), 1);
                }
                else {
                    existingPoint.y = dataY;
                }
            }
            else {
                dataArr.push({
                    x: dataX,
                    y: dataY
                });

                dataArr.sort((a, b) => {
                    return a.x - b.x;
                });
            }

            chartRef.current.update('none');
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

            <Divider/>

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

            <Divider/>

            <section>
                <h2>Automatic control</h2>
                <p className={'text-sm text-stone-500'}>Click on the chart to add a new point. Click on an existing point to delete it.</p>
                <Scatter data={scatterData} options={scatterOptions} ref={chartRef}/>
            </section>
        </article>
    );
};

export default Dashboard;