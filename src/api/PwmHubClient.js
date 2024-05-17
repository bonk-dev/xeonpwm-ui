import {HubConnectionBuilder} from "@microsoft/signalr";

let instance = null;

class PwmHubClient
{
    constructor(host) {
        this._host = host;
        this._signalr = new HubConnectionBuilder()
            .withUrl(`${host}/hubs/pwm`)
            .build();

        this._onDutyCycleChangedCallbacks = [];
        this._onDutyCycleChanged = (dutyCycle) => {
            this._onDutyCycleChangedCallbacks.forEach(cb => {
                cb(dutyCycle);
            })
        };

        this._onMaxDutyCycleChangedCallbacks = [];
        this._onMaxDutyCycleChanged = (maxDutyCycle) => {
            this._onMaxDutyCycleChangedCallbacks.forEach(cb => {
                cb(maxDutyCycle);
            })
        };

        this._onTemperatureChangedCallbacks = [];
        this._onTemperatureChanged = (maxDutyCycle) => {
            this._onTemperatureChangedCallbacks.forEach(cb => {
                cb(maxDutyCycle);
            })
        };

        this._onAutoPointsChangedCallbacks = [];
        this._onAutoPointsChanged = (maxDutyCycle) => {
            this._onAutoPointsChangedCallbacks.forEach(cb => {
                cb(maxDutyCycle);
            })
        };


        this._signalr.on('OnDutyCycleChanged', this._onDutyCycleChanged);
        this._signalr.on('OnMaxDutyCycleChanged', this._onMaxDutyCycleChanged);
        this._signalr.on('OnTemperatureChanged', this._onTemperatureChanged);
        this._signalr.on('OnAutoPointsChanged', this._onAutoPointsChanged);
    }

    isConnected() {
        return this._signalr.state === 'Connected';
    }

    onDutyCycleChanged(callback) {
        this._onDutyCycleChangedCallbacks.push(callback);
    }

    onMaxDutyCycleChanged(callback) {
        this._onMaxDutyCycleChangedCallbacks.push(callback);
    }

    onTemperatureChanged(callback) {
        this._onTemperatureChangedCallbacks.push(callback);
    }

    onAutoPointsChanged(callback) {
        this._onAutoPointsChangedCallbacks.push(callback);
    }

    async connect() {
        console.debug(this._signalr.state)
        if (this._signalr.state === 'Connected' || this._signalr.state === 'Connecting') return false;

        await this._signalr.start();
        console.debug("Connected to PWM hub");
        return true;
    }

    async setDutyCycle(dutyCycle) {
        await this._signalr.invoke("SetDutyCycle", dutyCycle);
    }

    async getDutyCycle() {
        return await this._signalr.invoke("GetDutyCycle");
    }

    async saveAutoPoints(xyPoints) {
        const namedPoints = xyPoints.map(p => {
            return {
                temperature: p.x,
                pwmPercentage: p.y
            };
        });

        return await this._signalr.invoke('SaveAutoConfiguration', namedPoints);
    }
}

export function setupClient(host) {
    if (instance != null) {
        console.warn("Client is already set up");
        return;
    }

    instance = new PwmHubClient(host);
}

export function pwmClient() {
    return instance;
}