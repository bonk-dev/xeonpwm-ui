import {HubConnectionBuilder} from "@microsoft/signalr";
import {getToken, storeToken} from "./KeyStorage";

let instance = null;

class PwmHubClient
{
    constructor(host) {
        const savedToken = getToken();
        if (savedToken != null) {
            this._token = savedToken.token;
            this._expirationDate = savedToken.expirationDate;
        }
        else {
            this._token = '';
            this._expirationDate = null;
        }

        this._connect = false;
        this._host = host;
        this._signalr = new HubConnectionBuilder()
            .withUrl(`${host}/hubs/pwm`, {
                accessTokenFactory: () => {
                    return this._hubToken;
                }
            })
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

        this._onAutoModeStatusChangedCallbacks = [];
        this._onAutoModeStatusChanged = (maxDutyCycle) => {
            this._onAutoModeStatusChangedCallbacks.forEach(cb => {
                cb(maxDutyCycle);
            })
        };

        this._signalr.on('OnDutyCycleChanged', this._onDutyCycleChanged);
        this._signalr.on('OnMaxDutyCycleChanged', this._onMaxDutyCycleChanged);
        this._signalr.on('OnTemperatureChanged', this._onTemperatureChanged);
        this._signalr.on('OnAutoPointsChanged', this._onAutoPointsChanged);
        this._signalr.on('OnAutoModeStatusChanged', this._onAutoModeStatusChanged);
        this._signalr.onclose(e => {
            console.log(e);
            this._connect = false;
        });
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

    onAutoModeStatusChanged(callback) {
        this._onAutoModeStatusChangedCallbacks.push(callback);
    }

    clearCallbacks() {
        this._onDutyCycleChangedCallbacks.splice(0, this._onDutyCycleChangedCallbacks.length);
        this._onMaxDutyCycleChangedCallbacks.splice(0, this._onMaxDutyCycleChangedCallbacks.length);
        this._onTemperatureChangedCallbacks.splice(0, this._onTemperatureChangedCallbacks.length);
        this._onAutoModeStatusChangedCallbacks.splice(0, this._onAutoModeStatusChangedCallbacks.length);
        this._onAutoPointsChangedCallbacks.splice(0, this._onAutoPointsChangedCallbacks.length);
        this._onDutyCycleChangedCallbacks.splice(0, this._onDutyCycleChangedCallbacks.length);
    }

    async connect() {
        if (this._connect || this._signalr.state === 'Connected' || this._signalr.state === 'Connecting') return false;
        this._connect = true;

        try {
            console.debug('Fetching hub auth token');
            this._hubToken = await this.getHubToken();
        } finally {
            this._connect = false;
        }

        await this._signalr.start();
        console.debug("Connected to PWM hub");
        this._connect = false;

        return true;
    }

    async disconnect() {
        if (this._connect || this._signalr.state !== 'Connected') return;
        this._connect = true;

        try {
            await this._signalr.stop();
        } finally {
            this._connect = false;
        }
    }

    async setDutyCycle(dutyCycle) {
        await this._signalr.invoke("SetDutyCycle", dutyCycle);
    }

    async getDutyCycle() {
        return await this._signalr.invoke("GetDutyCycle");
    }

    async saveAutoPoints(xyPoints) {
        const namedPoints = xyPoints
            .filter(p => {
                return p.x > 0 && p.x < 100;
            }).map(p => {
                return {
                    temperature: p.x,
                    pwmPercentage: p.y
                };
            });

        return await this._signalr.invoke('SaveAutoConfiguration', namedPoints);
    }

    async setAutoModeStatus(enabled) {
        await this._signalr.invoke('ChangeAutoModeStatus', enabled);
    }

    // REST API
    isAuthenticated() {
        return this._token !== '' && this._expirationDate != null && this._expirationDate > new Date();
    }

    async login(username, password) {
        const response = await fetch(`${this._host}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        if (response.ok) {
            const obj = JSON.parse(await response.text());
            this._token = obj['token'];
            this._expirationDate =  Date.parse(obj['expirationDate']);

            storeToken(this._token, obj['expirationDate']);

            return obj;
        }

        throw new Error("Login failed");
    }

    async logout() {
        if (!this.isAuthenticated()) {
            throw new Error("Not authenticated");
        }

        await fetch(`${this._host}/api/auth/logout`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${this._token}`
            }
        });

        this._token = '';
        this._hubToken = '';
        this._expirationDate = null;
    }

    async getHubToken() {
        if (!this.isAuthenticated()) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${this._host}/api/auth/hubToken`, {
            method: "POST",
            headers: {
                "Authorization": 'Bearer ' + this._token
            }
        });

        if (response.ok) {
            const obj = JSON.parse(await response.text());
            return obj['token'];
        }
        else {
            throw new Error(response.statusText);
        }
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