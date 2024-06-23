'use strict';
const axios = require('axios');
//const moment = require("moment");
const queryString = require('qs');

class Accuapi {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.lokey = 335315;
        this.query = {};
        //this.adapter = adapter;
    }

    localkey(lkey) {
        // Unique ID that can be used to search for a specific location.

        !lkey ? null : this.lokey = lkey;
        return this;
    }

    timeInt(val) {
        // Unique ID that can be used to search for a specific location.

        !val ? this.time = 'hourly/1hour' : this.time = val;
        return this;
    }

    language(lan) {
        // http://apidev.accuweather.com/developers/languages
        // String indicating the language in which to return the resource.
        // Default value set to en-us.

        !lan ? null : this.query.language = lan;
        return this;
    }

    details(bool) {
        // Boolean value (true or false) specifies whether or not to include the full object.
        //Default value set to false.
        //(For location searches, details = true will return AccuWeather related details).

        !bool ? null : this.query.details = bool;
        return this;
    }

    metric(bool) {
        // Boolean value (true or false) that specifies to return the data in either metric (=true) or imperial units.

        !bool ? null : this.query.metric = bool;
        return this;
    }

    generateReqUrl(current) {
        if (current) {
            this.url = `http://dataservice.accuweather.com/currentconditions/v1/${this.lokey}?apikey=${this.apiKey}`;
        }
        else {
            this.url = `http://dataservice.accuweather.com/forecasts/v1/${this.time}/${this.lokey}?apikey=${this.apiKey}`;
        }
        this.query ? this.url += `&${queryString.stringify(this.query)}` : this.url;
    }

    get() {
        this.generateReqUrl();
        return axios(this.url)
            .then(response => response.data)
            .catch(error => {
                throw new Error(`Forecast cannot be retrieved. ERROR: ${error.response && JSON.stringify(error.response.data) || error.toString()}`);
            });
    }

    getCurrent() {
        //
        //const body = require("./test-data/currentCond.json");
        //
        this.generateReqUrl(true);
        return axios(this.url)
            .then(response => response.data)
            .catch(error => {
                throw new Error(`Forecast cannot be retrieved. ERROR: ${error.response && JSON.stringify(error.response.data) || error.toString()}`);
            });
    }
}

module.exports = Accuapi;
