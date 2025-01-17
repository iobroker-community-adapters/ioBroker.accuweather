'use strict';
const axios = require('axios');
//const moment = require("moment");
const queryString = require('qs');

/**
 * Class representing the AccuWeather API.
 */
class Accuapi {
    /**
     * Create an instance of Accuapi.
     *
     * @param apiKey - The API key for accessing AccuWeather.
     */
    constructor(apiKey) {
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
    localkey(lkey) {
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
    timeInt(val = '') {
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
    language(lan) {
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
    details(bool) {
        // Boolean value (true or false) specifies whether or not to include the full object.
        // Default value set to false.
        // (For location searches, details = true will return AccuWeather related details).

        !bool ? null : (this.query.details = bool);
        return this;
    }

    /**
     * Set the metric flag.
     *
     * @param bool - Specifies whether to return the data in metric units.
     * @returns The instance of Accuapi.
     */
    metric(bool) {
        // Boolean value (true or false) that specifies to return the data in either metric (=true) or imperial units.

        !bool ? null : (this.query.metric = bool);
        return this;
    }

    /**
     * Generates the request URL for the AccuWeather API.
     *
     * @param current - A boolean indicating whether to generate the URL for current conditions or forecasts.
     *                            If true, the URL for current conditions is generated.
     */
    generateReqUrl(current = false) {
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
    get() {
        this.generateReqUrl();
        return axios
            .get(this.url ? this.url : '')
            .then(response => response.data)
            .catch(error => {
                throw new Error(
                    `Forecast cannot be retrieved. ERROR: ${(error.response && JSON.stringify(error.response.data)) || error.toString()}`,
                );
            });
    }

    /**
     * Retrieves the current weather data from the AccuWeather API.
     *
     * @returns A promise that resolves to the current weather data.
     * @throws {Error} Throws an error if the forecast cannot be retrieved.
     */
    getCurrent() {
        //
        //const body = require("./test-data/currentCond.json");
        //
        this.generateReqUrl(true);
        return axios
            .get(this.url ? this.url : '')
            .then(response => response.data)
            .catch(error => {
                throw new Error(
                    `Forecast cannot be retrieved. ERROR: ${(error.response && JSON.stringify(error.response.data)) || error.toString()}`,
                );
            });
    }
}

module.exports = Accuapi;
