import {HubConnectionBuilder} from "@microsoft/signalr";

let instance = null;

class PwmHubClient
{
    constructor(host) {
        this._host = host;
        this._signalr = new HubConnectionBuilder()
            .withUrl(`${host}/hubs/pwm`)
            .build();

        this._onSetDutyCycleResultAsync = async (error) => {
            console.debug(`SetDtCycle result: ${error}`);
        };

        this._signalr.on('OnSetDutyCycleResultAsync', this._onSetDutyCycleResultAsync);

        this._signalr.start()
            .then(() => {
                console.debug("Connected to PWM hub")
            });
    }

    async setDutyCycle(dutyCycle) {
        await this._signalr.send("SetDutyCycle", dutyCycle);
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