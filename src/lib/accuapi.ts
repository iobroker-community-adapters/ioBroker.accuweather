'use strict';
import axios from 'axios';
axios.defaults.timeout = 10000;
//const moment = require("moment");
import queryString from 'qs';

/**
 * Class representing the AccuWeather API.
 */
export class Accuapi {
    apiKey: string;
    lokey: string | number;
    query: any;
    time: string = '';
    url: string = '';
    /**
     * Create an instance of Accuapi.
     *
     * @param apiKey - The API key for accessing AccuWeather.
     */
    constructor(apiKey: any) {
        this.apiKey = apiKey;
        this.lokey = 335315;
        this.query = {};
        //this.adapter = adapter;
    }

    /**
     * Set the location key.
     *
     * @param lkey - The location key.
     * @returns The instance of Accuapi.
     */
    localkey(lkey: string): Accuapi {
        // Unique ID that can be used to search for a specific location.

        !lkey ? null : (this.lokey = lkey);
        return this;
    }

    /**
     * Set the time interval.
     *
     * @param val - The time interval value.
     * @returns Accuapi The instance of Accuapi.
     */
    timeInt(val = ''): Accuapi {
        // Unique ID that can be used to search for a specific location.

        !val ? (this.time = 'hourly/1hour') : (this.time = val);
        return this;
    }

    /**
     * Sets the language for the API request.
     *
     * @param lan - The language code in which to return the resource.
     *                       Refer to http://apidev.accuweather.com/developers/languages for valid language codes.
     *                       If not provided, the default value is 'en-us'.
     * @returns The current instance of the API object to allow for method chaining.
     */
    language(lan: string): Accuapi {
        // http://apidev.accuweather.com/developers/languages
        // String indicating the language in which to return the resource.
        // Default value set to en-us.

        !lan ? null : (this.query.language = lan);
        return this;
    }

    /**
     * Set the details flag.
     *
     * @param bool - Specifies whether or not to include the full object.
     * @returns The instance of Accuapi.
     */
    details(bool: boolean): Accuapi {
        // Boolean value (true or false) specifies whether or not to include the full object.
        // Default value set to false.
        // (For location searches, details = true will return AccuWeather related details).

        !bool ? null : (this.query.details = bool);
        return this;
    }

    /**
     * Set the getphotos flag
     *
     * @param bool Specifies whether or not to include photos.
     * @returns The instance of Accuapi.
     */
    getphotos(bool: boolean): Accuapi {
        // Boolean value (true or false) specifies whether or not to include the photos.
        // Default value set to false.

        !bool ? null : (this.query.getphotos = bool);
        return this;
    }
    /**
     * Set the metric flag.
     *
     * @param bool - Specifies whether to return the data in metric units.
     * @returns The instance of Accuapi.
     */
    metric(bool: boolean): Accuapi {
        // Boolean value (true or false) that specifies to return the data in either metric (=true) or imperial units.

        !bool ? null : (this.query.metric = bool);
        return this;
    }

    /**
     * Generates the request URL for the AccuWeather API
     *
     * @param current - A boolean indicating whether to generate the URL for current conditions or forecasts.
     *                            If true, the URL for current conditions is generated.
     */
    generateReqUrl(current = false): void {
        if (current) {
            this.url = `http://dataservice.accuweather.com/currentconditions/v1/${this.lokey}?apikey=${this.apiKey}`;
        } else {
            this.url = `http://dataservice.accuweather.com/forecasts/v1/${this.time}/${this.lokey}?apikey=${this.apiKey}`;
        }
        this.query ? (this.url += `&${queryString.stringify(this.query)}`) : this.url;
    }

    /**
     * Retrieves the weather data from the AccuWeather API.
     *
     * @returns A promise that resolves to the weather data.
     * @throws {Error} Throws an error if the forecast cannot be retrieved.
     */
    async get(): Promise<any> {
        this.generateReqUrl();
        let response;
        try {
            response = await axios.get(this.url ? this.url : '');
            if (typeof response.data !== 'object') {
                throw new Error(`Status: ${response.status} text: ${response.statusText}`, {
                    cause: {
                        status: 503,
                        text: 'Service Unavailable',
                    },
                });
            }
            return response.data;
        } catch (error: any) {
            if (error && error.cause && error.cause.status === 503) {
                throw new Error(`Status: ${error.cause.status} text: ${error.cause.text}`, {
                    cause: {
                        status: error.cause.status,
                        text: error.cause.text,
                    },
                });
            } else if (error && ((error.status >= 400 && error.status <= 500) || error.status === 503)) {
                throw new Error(`Status: ${error.response.status} text: ${error.response.statusText}`, {
                    cause: {
                        status: error.status,
                        text: error.statusText,
                    },
                });
            } else {
                throw new Error(
                    `Forecast cannot be retrieved. ERROR: Status:${error.status || 'none'} ${(error.response && JSON.stringify(error.response.data)) || error.toString()}`,
                );
            }
        }
    }

    /**
     * Retrieves the current weather data from the AccuWeather API.
     *
     * @returns A promise that resolves to the current weather data.
     * @throws {Error} Throws an error if the forecast cannot be retrieved.
     */
    async getCurrent(): Promise<any> {
        //
        //const body = require("./test-data/currentCond.json");
        //
        this.generateReqUrl(true);
        let response;
        try {
            response = await axios.get(this.url ? this.url : '');
            if (typeof response.data !== 'object') {
                throw new Error(`Status: ${response.status} text: ${response.statusText}`, {
                    cause: {
                        status: 503,
                        text: 'Service Unavailable',
                    },
                });
            }
            return response.data;
        } catch (error: any) {
            if (error && error.cause && error.cause.status === 503) {
                throw new Error(`Status: ${error.cause.status} text: ${error.cause.text}`, {
                    cause: {
                        status: error.cause.status,
                        text: error.cause.text,
                    },
                });
            } else if (error && ((error.status >= 400 && error.status <= 500) || error.status === 503)) {
                throw new Error(`Status: ${error.response.status} text: ${error.response.statusText}`, {
                    cause: {
                        status: error.status,
                        text: error.statusText,
                    },
                });
            } else {
                throw new Error(
                    `Forecast cannot be retrieved. ERROR: Status:${error.status || 'none'} ${(error.response && JSON.stringify(error.response.data)) || error.toString()}`,
                );
            }
        }
    }
}
