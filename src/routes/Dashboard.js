import {useUpdateEffect} from "react-use";
import {useCallback, useEffect, useRef, useState} from "react";
import {pwmClient} from "../api/PwmHubClient";
import {CircularProgress, Divider, Slider, Switch} from "@nextui-org/react";
import 'chart.js/auto';
import {Chart} from "chart.js";
import {getRelativePosition} from "chart.js/helpers";
import dragPlugin from 'chartjs-plugin-dragdata';
import {Scatter} from "react-chartjs-2";
import currentTempPlugin from "../plugins/currentTempPlugin";
import {useNavigate} from "react-router-dom";

Chart.register(dragPlugin);
Chart.register(currentTempPlugin);

const getDtPercentage = (dutyCycle, max) => 1 - (dutyCycle / max);
const getDutyCycle = (percentage, max) => Math.floor(max * (1 - percentage));

const scatterData = {
    datasets: [
        {
            label: 'Temperature points',
            data: [],
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
    const [autoPoints, setAutoPoints] = useState(null);
    const navigate = useNavigate();

    const onDutyCycleChanged = useCallback((dutyCycle) => {
        const dt = getDtPercentage(dutyCycle, maxDutyCycle);
        console.debug(`CHANGED: ${dt}`);
        setDtPercentage(dt);
    }, [maxDutyCycle]);

    const onMaxDutyCycleChanged = useCallback((dutyCycle) => {
        setMaxDutyCycle(dutyCycle);
        console.debug(`New max: ${dutyCycle}`);
    }, []);

    const onTemperatureChanged = useCallback((temperature) => {
        console.debug(`New temperature: ${temperature}`);
        setCurrentTemp(temperature);
    }, []);

    const onAutoPointsChanged = useCallback((points) => {
        const newPoints = points.map(p => {
            return {
                x: p.temperature,
                y: p.pwmPercentage
            };
        });
        console.debug(newPoints);
        setAutoPoints(newPoints);
    }, []);

    const onAutoModeStatusChanged = useCallback((enabled) => {
        setIsManualModeOn(!enabled);
    }, []);

    useEffect(() => {
        const setupCallbacks = () => {
            pwmClient().onDutyCycleChanged(onDutyCycleChanged);
            pwmClient().onMaxDutyCycleChanged(onMaxDutyCycleChanged);
            pwmClient().onTemperatureChanged(onTemperatureChanged);
            pwmClient().onAutoPointsChanged(onAutoPointsChanged);
            pwmClient().onAutoModeStatusChanged(onAutoModeStatusChanged);
        };

        if (!pwmClient().isConnected()) {
            pwmClient().connect()
                .then(madeNewConn => {
                    if (!madeNewConn) return;
                    setupCallbacks();
                })
                .catch(e => {
                    console.error(e);
                    navigate('/login');
                })
        }
        else {
            setupCallbacks();
        }

        return () => {
            pwmClient().clearCallbacks();
        };
    }, [navigate, onDutyCycleChanged, onMaxDutyCycleChanged,
        onTemperatureChanged, onAutoPointsChanged, onAutoModeStatusChanged]);

    useEffect(() => {
        if (autoPoints == null) return;
        const lastIndex = autoPoints.length - 1;

        console.debug(autoPoints);

        const start = {
            x: -10,
            y: autoPoints[0].y
        };
        const end = {
            x: 110,
            y: autoPoints[autoPoints.length - 1].y
        };
        chartRef.current.data.datasets[0].data = [start, ...autoPoints, end];
        chartRef.current.update();
    }, [autoPoints]);

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

    // noinspection JSUnusedGlobalSymbols
    const scatterOptions = {
        showLine: true,
        dragData: true,
        plugins: {
            dragData: {
                ...dragPlugin,
                dragX: true,
                dragY: true,
                round: 0,
                onDragStart: (e, setIndex, index) => {
                    // noinspection JSUnresolvedReference
                    if (index === 0 || index === chartRef.current.data.datasets[setIndex].data.length - 1) {
                        return false;
                    }
                },
                onDrag: (e, setIndex, index, value) => {
                    // noinspection JSUnresolvedReference
                    const set = chartRef.current.data.datasets[setIndex].data;
                    if (index === 1) {
                        set[0].y = value.y;
                    }
                    else if (index === chartRef.current.data.datasets[setIndex].data.length - 2) {
                        set[set.length - 1].y = value.y;
                    }
                },
                onDragEnd: (e, setIndex, index, value) => {
                    // noinspection JSUnresolvedReference
                    const dataset = chartRef.current.data.datasets[setIndex].data;
                    dataset.sort((a, b) => {
                        return a.x - b.x;
                    });

                    dataset[0].y = dataset[1].y;
                    dataset[dataset.length - 1].y = dataset[dataset.length - 2].y;

                    // noinspection JSUnresolvedReference
                    chartRef.current.update('none');
                    pwmClient().saveAutoPoints(dataset)
                        .then(() => {
                            console.debug('Saved auto points:');
                            console.debug(dataset);
                        });
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

            pwmClient().saveAutoPoints(dataArr)
                .then(() => {
                    console.debug('Saved auto points:');
                    console.debug(dataArr);
                });
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
            <Switch isSelected={isManualModeOn} onValueChange={v => {
                setIsManualModeOn(v);
                pwmClient().setAutoModeStatus(!v)
                    .then(() => {
                        console.debug("Changed auto mode status");
                    });
            }}>Manual mode</Switch>

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
                    onChange={v => {
                        if (!isManualModeOn) return;
                        setDutyCycleToSend(getDutyCycle(v, maxDutyCycle))
                    }}
                    formatOptions={{ style: 'percent' }}
                    className="max-w-md" isDisabled={!isManualModeOn}
                />
            </section>

            <Divider/>

            <section className={'relative'}>
                <h2>Automatic control</h2>
                <p className={'text-sm text-stone-500'}>Click on the chart to add a new point. Click on an existing point to delete it.</p>
                <Scatter data={scatterData} options={scatterOptions} ref={chartRef}/>

                {autoPoints == null ? (
                    <div className={'w-full h-full absolute top-0 left-0 flex justify-center items-center flex-col backdrop-blur select-none'}>
                        <CircularProgress aria-labelledby={'auto-progress-message'}/>
                        <p id={'auto-progress-message'}>Loading auto temperature points</p>
                    </div>
                ) : null}
            </section>
        </article>
    );
};

export default Dashboard;