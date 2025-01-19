'use strict';

/*
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from '@iobroker/adapter-core';
import { Accuapi } from './lib/accuapi';
import * as nextHour from './lib/nexthour-obj';
let updateInterval: ioBroker.Interval | undefined = undefined;
let timeout1: ioBroker.Timeout | undefined = undefined;
let timeout2: ioBroker.Timeout | undefined = undefined;
let timeout3: ioBroker.Timeout | undefined = undefined;

class Accuweather extends utils.Adapter {
    forecast: Accuapi | undefined;
    /**
     * @param [options] - Optional settings for the adapter
     */
    constructor(options = {}) {
        super({
            ...options,
            name: 'accuweather',
            strictObjectChecks: false,
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    getCardinalDirection(angle: number): string {
        if (typeof angle === 'string') {
            angle = parseInt(angle);
        }
        if (angle <= 0 || angle > 360 || typeof angle === 'undefined') {
            return '☈';
        }
        const arrows: Record<string, string> = {
            north: '↑N',
            north_east: '↗NE',
            east: '→E',
            south_east: '↘SE',
            south: '↓S',
            south_west: '↙SW',
            west: '←W',
            north_west: '↖NW',
        };
        const directions = Object.keys(arrows);
        const degree = 360 / directions.length;
        angle = angle + degree / 4;
        for (let i = 0; i < directions.length; i++) {
            if (angle >= i * degree && angle < (i + 1) * degree) {
                return arrows[directions[i]];
            }
        }
        return arrows.north;
    }

    async setDailyStates(obj: any): Promise<void> {
        this.log.debug(`Daily: ${JSON.stringify(obj)}`);
        const days = obj.DailyForecasts;
        try {
            for (let day = 1; day <= 5; day++) {
                const json = days[day - 1];
                for (const key in json) {
                    let dt = null;
                    switch (key) {
                        case 'Date':
                            dt = new Date(json[key]);
                            await this.setState(`Daily.Day${day}.${key}`, {
                                val: json[key],
                                ack: true,
                            });
                            await this.setState(`Summary.DateTime_d${day}`, {
                                val: json[key],
                                ack: true,
                            });
                            await this.setState(`Summary.DayOfWeek_d${day}`, {
                                val: dt.toLocaleString(this.config.language, {
                                    weekday: 'short',
                                }),
                                ack: true,
                            });
                            break;
                        case 'Sun':
                            await this.setState(`Daily.Day${day}.Sunrise`, {
                                val: json[key].Rise,
                                ack: true,
                            });
                            await this.setState(`Daily.Day${day}.Sunset`, {
                                val: json[key].Set,
                                ack: true,
                            });
                            if (day === 1) {
                                await this.setState('Summary.Sunrise', {
                                    val: json[key].Rise,
                                    ack: true,
                                });
                                await this.setState('Summary.Sunset', {
                                    val: json[key].Set,
                                    ack: true,
                                });
                            }
                            break;
                        case 'HoursOfSun':
                            await this.setState(`Daily.Day${day}.HoursOfSun`, {
                                val: json[key],
                                ack: true,
                            });
                            if (day === 1) {
                                await this.setState('Summary.HoursOfSun', {
                                    val: json[key],
                                    ack: true,
                                });
                            }
                            break;
                        case 'Temperature':
                            await this.setState(`Daily.Day${day}.Temperature.Minimum`, {
                                val: json[key].Minimum.Value,
                                ack: true,
                            });
                            await this.setState(`Daily.Day${day}.Temperature.Maximum`, {
                                val: json[key].Maximum.Value,
                                ack: true,
                            });
                            await this.setState(`Summary.TempMin_d${day}`, {
                                val: json[key].Minimum.Value,
                                ack: true,
                            });
                            await this.setState(`Summary.TempMax_d${day}`, {
                                val: json[key].Maximum.Value,
                                ack: true,
                            });
                            break;
                        case 'RealFeelTemperature':
                            await this.setState(`Daily.Day${day}.RealFeelTemperature.Minimum`, {
                                val: json[key].Minimum.Value,
                                ack: true,
                            });
                            await this.setState(`Daily.Day${day}.RealFeelTemperature.Maximum`, {
                                val: json[key].Maximum.Value,
                                ack: true,
                            });
                            break;
                        case 'Day':
                        case 'Night':
                            {
                                const json1 = json[key];
                                for (const key1 in json1) {
                                    if (typeof json1[key1] !== 'object') {
                                        await this.setState(`Daily.Day${day}.${key}.${key1}`, {
                                            val: json1[key1],
                                            ack: true,
                                        });
                                        if (key1 === 'Icon') {
                                            await this.setState(`Daily.Day${day}.${key}.IconURL`, {
                                                val: `https://developer.accuweather.com/sites/default/files/${String(json1[key1]).padStart(2, '0')}-s.png`,
                                                ack: true,
                                            });
                                            await this.setState(`Daily.Day${day}.${key}.IconURLS`, {
                                                val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json1[key1]).padStart(2, '0')}.svg`,
                                                ack: true,
                                            });
                                            if (key === 'Day') {
                                                await this.setState(`Summary.WeatherIconURL_d${day}`, {
                                                    val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json1[key1]).padStart(2, '0')}.svg`,
                                                    ack: true,
                                                });
                                                await this.setState(`Summary.WeatherIcon_d${day}`, {
                                                    val: json1[key1],
                                                    ack: true,
                                                });
                                            }
                                        } else if (key === 'Day') {
                                            if (key1 === 'IconPhrase') {
                                                await this.setState(`Summary.WeatherText_d${day}`, {
                                                    val: json1[key1],
                                                    ack: true,
                                                });
                                            } else {
                                                await this.setState(`Summary.${key1}_d${day}`, {
                                                    val: json1[key1],
                                                    ack: true,
                                                });
                                            }
                                        }
                                    } else if (typeof json1[key1] == 'object') {
                                        if (json1[key1].Value !== undefined) {
                                            if (['TotalLiquid', 'Rain', 'Snow', 'Ice'].includes(key1)) {
                                                await this.setState(`Daily.Day${day}.${key}.${key1}Volume`, {
                                                    val: json1[key1].Value,
                                                    ack: true,
                                                });
                                                if (key === 'Day' && key1 === 'TotalLiquid') {
                                                    await this.setState(`Summary.TotalLiquidVolume_d${day}`, {
                                                        val: json1[key1].Value,
                                                        ack: true,
                                                    });
                                                }
                                            } else {
                                                await this.setState(`Daily.Day${day}.${key}.${key1}`, {
                                                    val: json1[key1].Value,
                                                    ack: true,
                                                });
                                            }
                                        } else if (key1 === 'Wind') {
                                            await this.setState(`Daily.Day${day}.${key}.WindSpeed`, {
                                                val: json1[key1].Speed.Value,
                                                ack: true,
                                            });
                                            await this.setState(`Daily.Day${day}.${key}.WindDirection`, {
                                                val: json1[key1].Direction.Degrees,
                                                ack: true,
                                            });
                                            if (key === 'Day') {
                                                await this.setState(`Summary.WindSpeed_d${day}`, {
                                                    val: json1[key1].Speed.Value,
                                                    ack: true,
                                                });
                                                await this.setState(`Summary.WindDirection_d${day}`, {
                                                    val: json1[key1].Direction.Degrees,
                                                    ack: true,
                                                });
                                                await this.setState(`Summary.WindDirectionStr_d${day}`, {
                                                    val: this.getCardinalDirection(json1[key1].Direction.Degrees),
                                                    ack: true,
                                                });
                                            }
                                        } else if (key1 === 'WindGust') {
                                            await this.setState(`Daily.Day${day}.${key}.WindGust`, {
                                                val: json1[key1].Speed.Value,
                                                ack: true,
                                            });
                                        }
                                    }
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        } catch (err) {
            this.log.error(String(err));
        }
    }

    async setNextHourStates(obj: any, item: string, hour: string): Promise<void> {
        this.log.debug(`Hours: ${JSON.stringify(obj)}`);
        const json = obj[item];
        try {
            for (const key in json) {
                if (typeof json[key] !== 'object') {
                    await this.setState(`Hourly.h${hour}.${key}`, {
                        val: json[key],
                        ack: true,
                    });
                    if (key === 'WeatherIcon') {
                        await this.setState(`Hourly.h${hour}.WeatherIconURL`, {
                            val: `https://developer.accuweather.com/sites/default/files/${String(json[key]).padStart(2, '0')}-s.png`,
                            ack: true,
                        });
                        await this.setState(`Hourly.h${hour}.WeatherIconURLS`, {
                            val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json[key]).padStart(2, '0')}.svg`,
                            ack: true,
                        });
                    }
                } else if (typeof json[key] == 'object') {
                    if (json[key].Value !== undefined) {
                        if (['TotalLiquid', 'Rain', 'Snow', 'Ice'].includes(key)) {
                            await this.setState(`Hourly.h${hour}.${key}Volume`, {
                                val: json[key].Value,
                                ack: true,
                            });
                        } else {
                            await this.setState(`Hourly.h${hour}.${key}`, {
                                val: json[key].Value,
                                ack: true,
                            });
                        }
                    } else if (key === 'Wind') {
                        await this.setState(`Hourly.h${hour}.WindSpeed`, {
                            val: json[key].Speed.Value,
                            ack: true,
                        });
                        await this.setState(`Hourly.h${hour}.WindDirection`, {
                            val: json[key].Direction.Degrees,
                            ack: true,
                        });
                        await this.setState(`Hourly.h${hour}.WindDirectionText`, {
                            val: json[key].Direction.Localized,
                            ack: true,
                        });
                    } else if (key === 'WindGust') {
                        await this.setState(`Hourly.h${hour}.WindGust`, {
                            val: json[key].Speed.Value,
                            ack: true,
                        });
                    }
                }
            }
        } catch (err) {
            this.log.error(String(err));
        }
    }

    async setCurrentStates(obj: any): Promise<void> {
        this.log.debug(`Current: ${JSON.stringify(obj)}`);
        const json = obj[0];
        try {
            for (const key in json) {
                //this.log.debug("Current: " + key + ": " + typeof json[key]);
                if (typeof json[key] !== 'object' || json[key] == null) {
                    await this.setState(`Current.${key}`, { val: json[key], ack: true });

                    if (key === 'WeatherIcon') {
                        await this.setState('Current.WeatherIconURL', {
                            val: `https://developer.accuweather.com/sites/default/files/${String(json[key]).padStart(2, '0')}-s.png`,
                            ack: true,
                        });
                        await this.setState('Current.WeatherIconURLS', {
                            val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json[key]).padStart(2, '0')}.svg`,
                            ack: true,
                        });
                        await this.setState('Summary.WeatherIconURL', {
                            val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json[key]).padStart(2, '0')}.svg`,
                            ack: true,
                        });
                        await this.setState('Summary.WeatherIcon', {
                            val: json[key],
                            ack: true,
                        });
                    } else if (key === 'LocalObservationDateTime') {
                        const dt = new Date(json[key]);
                        const dow = dt.toLocaleString(this.config.language, {
                            weekday: 'short',
                        });
                        await this.setState('Summary.CurrentDateTime', {
                            val: json[key],
                            ack: true,
                        });
                        await this.setState('Summary.DayOfWeek', { val: dow, ack: true });
                        this.log.debug(
                            `Date ${dt.getTime()}, dow: ${dt.toLocaleString(this.config.language, { weekday: 'short' })}`,
                        );
                    } else {
                        await this.setState(`Summary.${key}`, {
                            val: json[key],
                            ack: true,
                        });
                    }
                } else if (json[key] !== null) {
                    if (json[key][this.config.metric] !== undefined) {
                        //this.log.debug(key + ": " + json[key][this.config.metric].Value);
                        await this.setState(`Current.${key}`, {
                            val: json[key][this.config.metric].Value,
                            ack: true,
                        });
                        await this.setState(`Summary.${key}`, {
                            val: json[key][this.config.metric].Value,
                            ack: true,
                        });
                    } else if (key === 'Wind') {
                        await this.setState('Current.WindSpeed', {
                            val: json[key].Speed[this.config.metric].Value,
                            ack: true,
                        });
                        await this.setState('Summary.WindSpeed', {
                            val: json[key].Speed[this.config.metric].Value,
                            ack: true,
                        });
                        await this.setState('Current.WindDirection', {
                            val: json[key].Direction.Degrees,
                            ack: true,
                        });
                        await this.setState('Current.WindDirectionText', {
                            val: json[key].Direction.Localized,
                            ack: true,
                        });
                        await this.setState('Summary.WindDirection', {
                            val: json[key].Direction.Degrees,
                            ack: true,
                        });
                        await this.setState('Summary.WindDirectionStr', {
                            val: this.getCardinalDirection(json[key].Direction.Degrees),
                            ack: true,
                        });
                    } else if (key === 'WindGust') {
                        await this.setState('Current.WindGust', {
                            val: json[key].Speed[this.config.metric].Value,
                            ack: true,
                        });
                    } else if (key === 'PressureTendency') {
                        await this.setState('Current.PressureTendency', {
                            val: json[key].LocalizedText,
                            ack: true,
                        });
                    } else if (key === 'Photos' && Array.isArray(json[key].Photos)) {
                        const l = json[key].Photos.length;
                        const index = Math.round(Math.random() * l);
                        await this.setState('Current.LandscapeLink', json[key].Photos[index].LandscapeLink, true);
                        await this.setState('Current.PortraitLink', json[key].Photos[index].PortraitLink, true);
                    }
                }
            }
        } catch (err) {
            this.log.error(String(err));
        }
    }

    async setHourlyStates(obj: any): Promise<void> {
        for (const hr in obj) {
            if (typeof obj[hr] === 'object' && obj[hr].DateTime) {
                const d = new Date(obj[hr].DateTime);
                await this.setNextHourStates(obj, hr, String(d.getHours()));
            }
        }
    }

    async request5Days(): Promise<void> {
        if (typeof this.forecast !== 'undefined') {
            const loc = this.config.loKey;
            const lang = this.config.language;

            this.forecast = this.forecast.localkey(loc).timeInt('daily/5day').language(lang).details(true).metric(true);

            const res = await this.forecast.get();
            await this.setDailyStates(res);
        }
    }

    async request12Hours(): Promise<void> {
        if (typeof this.forecast !== 'undefined') {
            const loc = this.config.loKey;
            const lang = this.config.language;

            this.forecast = this.forecast
                .localkey(loc)
                .timeInt('hourly/12hour')
                .language(lang)
                .details(true)
                .metric(true);

            const res = await this.forecast.get();
            await this.setHourlyStates(res);
        }
    }

    async requestCurrent(): Promise<void> {
        if (typeof this.forecast !== 'undefined') {
            const loc = this.config.loKey;
            const lang = this.config.language;

            this.forecast = this.forecast
                .localkey(loc)
                .timeInt()
                .language(lang)
                .details(true)
                .metric(true)
                .getphotos(true);

            const res = await this.forecast.getCurrent();
            await this.setCurrentStates(res);
        }
    }

    async onReady(): Promise<void> {
        const nameSpaceObj = await this.getForeignObjectAsync(this.namespace);
        if (!nameSpaceObj) {
            await this.setForeignObject(this.namespace, {
                _id: this.namespace,
                type: 'meta',
                common: { name: 'Accuweather device', type: 'meta.folder' },
                native: {},
            });
        }
        const obj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);

        if (obj && obj.native && obj.native.apiKey) {
            obj.native.apiKeyEncrypted = this.encrypt(obj.native.apiKey);
            this.config.apiKeyEncrypted = obj.native.apiKey;
            delete obj.native.apiKey;
            await this.setForeignObject(`system.adapter.${this.namespace}`, obj);
        }

        if (this.config.metric !== 'Metric' && this.config.metric !== 'Imperial') {
            this.config.metric = 'Metric';
        }
        if (!this.config.language) {
            const systemConfig = await this.getForeignObjectAsync('system.config');
            if (systemConfig && systemConfig.common && systemConfig.common.language) {
                this.config.language = systemConfig.common.language;
            }
        }

        await nextHour.createHourlyForecastObjects(this);
        await nextHour.createCurrentConditionObjects(this);
        await nextHour.createDailyForecastObjects(this);
        await nextHour.createSummaryObjects(this);

        //this.log.debug(`API: ${this.config.apiKey}; Loc: ${this.config.loKey} Lang: ${this.config.language}`);
        this.log.debug(`API: ********; Loc: ${this.config.loKey} Lang: ${this.config.language}`);

        if (this.config.apiKeyEncrypted) {
            this.forecast = new Accuapi(this.config.apiKeyEncrypted);
        } else {
            this.log.error('API Key is missing. Please enter Accuweather API key');
        }

        updateInterval = this.setInterval(() => {
            const now = new Date();
            if ((now.getHours() === 7 || now.getHours() === 20) && now.getMinutes() < 5) {
                const _get5DaysTimeout = (): void => {
                    timeout1 && this.clearTimeout(timeout1);
                    timeout1 = this.setTimeout(
                        async () => {
                            try {
                                timeout1 = null;
                                await this.request5Days();
                            } catch (error: any) {
                                this.log.error(error);
                                this.log.info(`Retry in 10 Minutes`);
                                timeout1 = this.setTimeout(_get5DaysTimeout, 600000);
                            }
                        },
                        Math.random() * 10000 + 1,
                    );
                };
                _get5DaysTimeout();
            }
            if (now.getMinutes() < 5) {
                const _getMinutesTimeout = (): void => {
                    timeout2 && this.clearTimeout(timeout2);
                    timeout2 = this.setTimeout(
                        async () => {
                            try {
                                timeout2 = null;
                                await this.requestCurrent();
                            } catch (error: any) {
                                this.log.error(error);
                                this.log.info(`Retry in 10 Minutes`);
                                timeout2 = this.setTimeout(_getMinutesTimeout, 600000);
                            }
                        },
                        Math.random() * 10000 + 1,
                    );
                };
                _getMinutesTimeout();
            }
            if (
                (now.getHours() === 6 || now.getHours() === 12 || now.getHours() === 18 || now.getHours() === 0) &&
                now.getMinutes() < 5
            ) {
                const _get12HoursTimeout = (): void => {
                    timeout3 && this.clearTimeout(timeout3);
                    timeout3 = this.setTimeout(
                        async () => {
                            try {
                                timeout3 = null;
                                await this.request12Hours();
                            } catch (error: any) {
                                this.log.error(error);
                                this.log.info(`Retry in 10 Minutes`);
                                timeout3 = this.setTimeout(_get12HoursTimeout, 600000);
                            }
                        },
                        Math.random() * 10000 + 1,
                    );
                };
                _get12HoursTimeout();
            }
        }, 300000); // 5 minutes
        if (!this.config.apiCallProtection) {
            try {
                await this.request12Hours();
                await this.requestCurrent();
                await this.request5Days();
            } catch (error: any) {
                this.log.error(error);
            }
        } else {
            this.log.info('The data has not been updated. The normal update cycle is running.');
        }

        /*
            For every state in the system, there has to be also an object of type state
            Here a simple template for a boolean variable named "testVariable"
            Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
            */

        await this.extendObject('updateCurrent', {
            type: 'state',
            common: {
                name: 'Update Current Weather',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
            native: {},
        });
        await this.extendObject('updateHourly', {
            type: 'state',
            common: {
                name: 'Update 12 Hours Forecast',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
            native: {},
        });
        await this.extendObject('updateDaily', {
            type: 'state',
            common: {
                name: 'Update 5 Days Forecast',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
            },
            native: {},
        });

        // in this template, all states changes inside the adapter's namespace are subscribed
        await this.subscribeStatesAsync('updateCurrent');
        await this.subscribeStatesAsync('updateHourly');
        await this.subscribeStatesAsync('updateDaily');
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param callback - The callback function to be called when the unload process is complete
     */
    private onUnload(callback: () => void): void {
        try {
            this.log.info('cleaned everything up...');
            updateInterval && this.clearInterval(updateInterval);
            updateInterval = null;

            timeout1 && this.clearTimeout(timeout1);
            timeout1 = null;

            timeout2 && this.clearTimeout(timeout2);
            timeout2 = null;

            timeout3 && this.clearTimeout(timeout3);
            timeout3 = null;

            callback();
        } catch {
            callback && callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     *
     * @param id - The id of the state that changed
     * @param state - The state object that changed
     */
    async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
        if (state) {
            if (!state.ack) {
                try {
                    // The state was changed
                    if (id === `${this.namespace}.updateCurrent`) {
                        await this.requestCurrent();
                    } else if (id === `${this.namespace}.updateHourly`) {
                        await this.request12Hours();
                    } else if (id === `${this.namespace}.updateDaily`) {
                        await this.request5Days();
                    }
                    this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
                } catch (error: any) {
                    this.log.error(error);
                }
            }
        } else {
            // The state was deleted
            this.log.debug(`state ${id} deleted`);
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Accuweather(options);
} else {
    // otherwise start the instance directly
    (() => new Accuweather())();
}

export = Accuweather;
