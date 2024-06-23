'use strict';

/*
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
const AccuAPI = require('./lib/accuapi');
const nextHour = require('./lib/nexthour-obj');
let updateInterval = null;
let timeout1 = null;
let timeout2 = null;

class Accuweather extends utils.Adapter {
    /**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
    constructor(options = {}) {
        super({
            ...options,
            name: 'accuweather',
            strictObjectChecks: false
        });
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    getCardinalDirection(angle) {
        if (typeof angle === 'string') {
            angle = parseInt(angle);
        }
        if (angle <= 0 || angle > 360 || typeof angle === 'undefined') {
            return '☈';
        }
        const arrows = { north: '↑N', north_east: '↗NE', east: '→E', south_east: '↘SE', south: '↓S', south_west: '↙SW', west: '←W', north_west: '↖NW' };
        const directions = Object.keys(arrows);
        const degree = 360 / directions.length;
        angle = angle + degree / 4;
        for (let i = 0; i < directions.length; i++) {
            if (angle >= (i * degree) && angle < (i + 1) * degree) return arrows[directions[i]];
        }
        return arrows['north'];
    }


    async setDailyStates(obj) {
        const days = obj.DailyForecasts;
        try {
            for (let day = 1; day <= 5; day++) {
                const json = days[day - 1];
                for (const key in json) {
                    let dt = null;
                    switch (key) {
                        case 'Date':
                            dt = new Date(json[key]);
                            await this.setStateAsync(`Daily.Day${day}.${key}`, { val: json[key], ack: true });
                            await this.setStateAsync(`Summary.DateTime_d${day}`, { val: json[key], ack: true });
                            await this.setStateAsync(`Summary.DayOfWeek_d${day}`, { val: dt.toLocaleString(this.config.language, {weekday: 'short'}), ack: true });
                            break;
                        case 'Sun':
                            await this.setStateAsync(`Daily.Day${day}.Sunrise`, { val: json[key]['Rise'], ack: true });
                            await this.setStateAsync(`Daily.Day${day}.Sunset`, { val: json[key]['Set'], ack: true });
                            if (day === 1) {
                                await this.setStateAsync('Summary.Sunrise', { val: json[key]['Rise'], ack: true });
                                await this.setStateAsync('Summary.Sunset', { val: json[key]['Set'], ack: true });
                            }
                            break;
                        case 'HoursOfSun':
                            await this.setStateAsync(`Daily.Day${day}.HoursOfSun`, { val: json[key], ack: true });
                            if (day === 1) {
                                await this.setStateAsync('Summary.HoursOfSun', { val: json[key], ack: true });
                            }
                            break;
                        case 'Temperature':
                            await this.setStateAsync(`Daily.Day${day}.Temperature.Minimum`, { val: json[key]['Minimum'].Value, ack: true });
                            await this.setStateAsync(`Daily.Day${day}.Temperature.Maximum`, { val: json[key]['Maximum'].Value, ack: true });
                            await this.setStateAsync(`Summary.TempMin_d${day}`, { val: json[key]['Minimum'].Value, ack: true });
                            await this.setStateAsync(`Summary.TempMax_d${day}`, { val: json[key]['Maximum'].Value, ack: true });
                            break;
                        case 'RealFeelTemperature':
                            await this.setStateAsync(`Daily.Day${day}.RealFeelTemperature.Minimum`, { val: json[key]['Minimum'].Value, ack: true });
                            await this.setStateAsync(`Daily.Day${day}.RealFeelTemperature.Maximum`, { val: json[key]['Maximum'].Value, ack: true });
                            break;
                        case 'Day':
                        case 'Night':
                            {
                                const json1 = json[key];
                                for (const key1 in json1) {
                                    if (typeof json1[key1] !== 'object') {
                                        await this.setStateAsync(`Daily.Day${day}.${key}.${key1}`, { val: json1[key1], ack: true });
                                        if (key1 === 'Icon') {
                                            await this.setStateAsync(`Daily.Day${day}.${key}.IconURL`, { val: `https://developer.accuweather.com/sites/default/files/${String(json1[key1]).padStart(2, '0')}-s.png`, ack: true });
                                            await this.setStateAsync(`Daily.Day${day}.${key}.IconURLS`, { val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json1[key1]).padStart(2, '0')}.svg`, ack: true });
                                            if (key === 'Day') {
                                                await this.setStateAsync(`Summary.WeatherIconURL_d${day}`, { val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json1[key1]).padStart(2, '0')}.svg`, ack: true });
                                                await this.setStateAsync(`Summary.WeatherIcon_d${day}`, { val: json1[key1], ack: true });
                                            }
                                        } else if (key === 'Day') {
                                            if (key1 === 'IconPhrase') {
                                                await this.setStateAsync(`Summary.WeatherText_d${day}`, { val: json1[key1], ack: true });
                                            } else {
                                                await this.setStateAsync(`Summary.${key1}_d${day}`, { val: json1[key1], ack: true });
                                            }
                                        }
                                    } else if (typeof json1[key1] == 'object') {
                                        if (json1[key1]['Value'] !== undefined) {
                                            if (['TotalLiquid', 'Rain', 'Snow', 'Ice'].includes(key1)) {
                                                await this.setStateAsync(`Daily.Day${day}.${key}.${key1}Volume`, { val: json1[key1].Value, ack: true });
                                                if (key === 'Day' && key1 === 'TotalLiquid') {
                                                    await this.setStateAsync(`Summary.TotalLiquidVolume_d${day}`, { val: json1[key1].Value, ack: true });
                                                }
                                            } else {
                                                await this.setStateAsync(`Daily.Day${day}.${key}.${key1}`, { val: json1[key1].Value, ack: true });
                                            }
                                        } else if (key1 === 'Wind') {
                                            await this.setStateAsync(`Daily.Day${day}.${key}.WindSpeed`, { val: json1[key1].Speed.Value, ack: true });
                                            await this.setStateAsync(`Daily.Day${day}.${key}.WindDirection`, { val: json1[key1].Direction.Degrees, ack: true });
                                            if (key === 'Day') {
                                                await this.setStateAsync(`Summary.WindSpeed_d${day}`, { val: json1[key1].Speed.Value, ack: true });
                                                await this.setStateAsync(`Summary.WindDirection_d${day}`, { val: json1[key1].Direction.Degrees, ack: true });
                                                await this.setStateAsync(`Summary.WindDirectionStr_d${day}`, { val: this.getCardinalDirection(json1[key1].Direction.Degrees), ack: true });
                                            }
                                        } else if (key1 === 'WindGust') {
                                            await this.setStateAsync(`Daily.Day${day}.${key}.WindGust`, { val: json1[key1].Speed.Value, ack: true });
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
        } catch (/** @type any */ err) {
            this.log.error(err);
        }
    }

    async setNextHourStates(obj, item, hour) {
        const json = obj[item];
        try {
            for (const key in json) {
                if (typeof json[key] !== 'object') {
                    await this.setStateAsync(`Hourly.h${hour}.${key}`, { val: json[key], ack: true });
                    if (key === 'WeatherIcon') {
                        await this.setStateAsync(`Hourly.h${hour}.WeatherIconURL`, { val: `https://developer.accuweather.com/sites/default/files/${String(json[key]).padStart(2, '0')}-s.png`, ack: true });
                        await this.setStateAsync(`Hourly.h${hour}.WeatherIconURLS`, { val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json[key]).padStart(2, '0')}.svg`, ack: true });
                    }
                } else if (typeof json[key] == 'object') {
                    if (json[key]['Value'] !== undefined) {
                        if (['TotalLiquid', 'Rain', 'Snow', 'Ice'].includes(key)) {
                            await this.setStateAsync(`Hourly.h${hour}.${key}Volume`, { val: json[key].Value, ack: true });
                        } else {
                            await this.setStateAsync(`Hourly.h${hour}.${key}`, { val: json[key].Value, ack: true });
                        }
                    } else if (key === 'Wind') {
                        await this.setStateAsync(`Hourly.h${hour}.WindSpeed`, { val: json[key].Speed.Value, ack: true });
                        await this.setStateAsync(`Hourly.h${hour}.WindDirection`, { val: json[key].Direction.Degrees, ack: true });
                        await this.setStateAsync(`Hourly.h${hour}.WindDirectionText`, { val: json[key].Direction.Localized , ack: true });
                    } else if (key === 'WindGust') {
                        await this.setStateAsync(`Hourly.h${hour}.WindGust`, { val: json[key].Speed.Value, ack: true });
                    }
                }
            }
        } catch (/** @type any */err) {
            this.log.error(err);
        }
    }

    async setCurrentStates(obj) {
        const json = obj[0];
        try {
            for (const key in json) {
                //this.log.debug("Current: " + key + ": " + typeof json[key]);
                if (typeof json[key] !== 'object' || json[key] == null) {
                    await this.setStateAsync(`Current.${key}`, { val: json[key], ack: true });

                    if (key === 'WeatherIcon') {
                        await this.setStateAsync('Current.WeatherIconURL', { val: `https://developer.accuweather.com/sites/default/files/${String(json[key]).padStart(2, '0')}-s.png`, ack: true });
                        await this.setStateAsync('Current.WeatherIconURLS', { val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json[key]).padStart(2, '0')}.svg`, ack: true });
                        await this.setStateAsync('Summary.WeatherIconURL', { val: `http://vortex.accuweather.com/adc2010/images/slate/icons/${String(json[key]).padStart(2, '0')}.svg`, ack: true });
                        await this.setStateAsync('Summary.WeatherIcon', { val: json[key], ack: true });
                    } else if (key === 'LocalObservationDateTime') {
                        const dt = new Date(json[key]);
                        const dow = dt.toLocaleString(this.config.language, {weekday: 'short'});
                        await this.setStateAsync('Summary.CurrentDateTime', { val: json[key], ack: true });
                        await this.setStateAsync('Summary.DayOfWeek', { val: dow, ack: true });
                        this.log.debug(`Date ${dt}, dow: ${dt.toLocaleString(this.config.language, {weekday: 'short'})}`);
                    } else {
                        await this.setStateAsync(`Summary.${key}`, { val: json[key], ack: true });
                    }
                } else if (json[key] !== null) {
                    if (json[key].Metric !== undefined) {
                        //this.log.debug(key + ": " + json[key].Metric.Value);
                        await this.setStateAsync(`Current.${key}`, { val: json[key].Metric.Value, ack: true });
                        await this.setStateAsync(`Summary.${key}`, { val: json[key].Metric.Value, ack: true });
                    } else if (key === 'Wind') {
                        await this.setStateAsync('Current.WindSpeed', { val: json[key].Speed.Metric.Value, ack: true });
                        await this.setStateAsync('Summary.WindSpeed', { val: json[key].Speed.Metric.Value, ack: true });
                        await this.setStateAsync('Current.WindDirection', { val: json[key].Direction.Degrees, ack: true });
                        await this.setStateAsync('Current.WindDirectionText', { val: json[key].Direction.Localized, ack: true });
                        await this.setStateAsync('Summary.WindDirection', { val: json[key].Direction.Degrees, ack: true });
                        await this.setStateAsync('Summary.WindDirectionStr', { val: this.getCardinalDirection(json[key].Direction.Degrees), ack: true });
                    } else if (key === 'WindGust') {
                        await this.setStateAsync('Current.WindGust', { val: json[key].Speed.Metric.Value, ack: true });
                    } else if (key === 'PressureTendency') {
                        await this.setStateAsync('Current.PressureTendency', { val: json[key].LocalizedText, ack: true });
                    }
                }
            }
        } catch (/** @type any */err) {
            this.log.error(err);
        }
    }

    async setHourlyStates(obj) {
        for (const hr in obj) {
            if (typeof obj[hr] === 'object' && obj[hr]['DateTime']) {
                const d = new Date(obj[hr]['DateTime']);
                await this.setNextHourStates(obj, hr, d.getHours());
            }
        }
    }

    request5Days() {
        if (typeof this.forecast !== 'undefined') {
            const loc = this.config.loKey;
            const lang = this.config.language;
            this.forecast
                .localkey(loc)
                .timeInt('daily/5day')
                .language(lang)
                .metric(true)
                .details(true)
                .get()
                .then(res => this.setDailyStates(res))
                .catch(err => this.log.error(err));
        }
    }

    request12Hours() {
        if (typeof this.forecast !== 'undefined') {
            const loc = this.config.loKey;
            const lang = this.config.language;
            this.forecast
                .localkey(loc)
                .timeInt('hourly/12hour')
                .language(lang)
                .metric(true)
                .details(true)
                .get()
                .then(res => this.setHourlyStates(res))
                .catch(err => this.log.error(err));
        }
    }

    requestCurrent() {
        if (typeof this.forecast !== 'undefined') {
            const loc = this.config.loKey;
            const lang = this.config.language;

            this.forecast
                .localkey(loc)
                .timeInt()
                .language(lang)
                .metric(true)
                .details(true)
                .getCurrent()
                .then(res => this.setCurrentStates(res))
                .catch(err => this.log.error(err));
        }
    }

    async onReady() {
        let obj;
        try {
            obj = await this.getForeignObjectAsync(this.namespace);
        } catch (e) {
            // ignore
        }
        if (!obj) {
            //@ts-ignore
            await this.setForeignObjectAsync(this.namespace, { type: 'device', common: { name: 'Accuweather device' }, native: {} });
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

        this.log.debug(`API: ${this.config.apiKey}; Loc: ${this.config.loKey} Lang: ${this.config.language}`);

        if (this.config.apiKey) {
            this.forecast = new AccuAPI(this.config.apiKey);
        } else {
            this.log.error('API Key is missing. Please enter Accuweather API key');
        }

        updateInterval = setInterval(() => {
            const now = new Date();
            if ((now.getHours() === 7 || now.getHours() === 20) && now.getMinutes() < 5) {
                timeout1 = setTimeout(() => {
                    timeout1 = null;
                    this.request5Days();
                }, Math.random() * 10000 + 1);
            }
            if (now.getMinutes() < 5) {
                timeout2 = setTimeout(() => {
                    timeout2 = null;
                    this.requestCurrent();
                }, Math.random() * 10000 + 1);
            }
            if ((now.getHours() === 6 || now.getHours() === 12 || now.getHours() === 18 || now.getHours() === 0) && now.getMinutes() < 5) {
                timeout1 = setTimeout(() => {
                    timeout1 = null;
                    this.request12Hours();
                }, Math.random() * 10000 + 1);
            }
        }, 300000); // 5 minutes

        this.request12Hours();
        this.requestCurrent();
        this.request5Days();

        /*
		For every state in the system, there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/

        await this.setObjectNotExistsAsync('updateCurrent', {
            type: 'state',
            common: {
                name: 'Update Current Weather',
                type: 'boolean',
                role: 'button',
                read: true,
                write: true
            },
            native: {},
        });
        await this.setObjectNotExistsAsync('updateHourly', {
            type: 'state',
            common: {
                name: 'Update 12 Hours Forecast',
                type: 'boolean',
                role: 'button',
                read: true,
                write: true,
            },
            native: {},
        });
        await this.setObjectNotExistsAsync('updateDaily', {
            type: 'state',
            common: {
                name: 'Update 5 Days Forecast',
                type: 'boolean',
                role: 'button',
                read: true,
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
	 * @param {() => void} callback
	 */
    onUnload(callback) {
        try {
            this.log.info('cleaned everything up...');
            updateInterval && clearInterval(updateInterval);
            updateInterval = null;

            timeout1 && clearTimeout(timeout1);
            timeout1 = null;

            timeout2 && clearTimeout(timeout2);
            timeout2 = null;

            callback();
            // @ts-ignore
            callback = null;
        } catch (e) {
            callback && callback();
        }
    }

    /**
	 * Is called if a subscribed object changes
	 * @param {string} id
	 * @param {ioBroker.Object | null | undefined} obj
	 */
    onObjectChange(id, obj) {
        if (obj) {
            this.log.debug(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.debug(`object ${id} deleted`);
        }
    }

    /**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            if (id === `${this.namespace}.updateCurrent`) {
                this.requestCurrent();
            } else if (id === `${this.namespace}.updateHourly`) {
                this.request12Hours();
            } else if (id === `${this.namespace}.updateDaily`) {
                this.request5Days();
            }
            this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.debug(`state ${id} deleted`);
        }
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
    module.exports = (options) => new Accuweather(options);
} else {
    // otherwise start the instance directly
    new Accuweather();
}


