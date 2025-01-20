"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var accuapi_exports = {};
__export(accuapi_exports, {
  Accuapi: () => Accuapi
});
module.exports = __toCommonJS(accuapi_exports);
var import_axios = __toESM(require("axios"));
var import_qs = __toESM(require("qs"));
import_axios.default.defaults.timeout = 1e4;
class Accuapi {
  apiKey;
  lokey;
  query;
  time = "";
  url = "";
  /**
   * Create an instance of Accuapi.
   *
   * @param apiKey - The API key for accessing AccuWeather.
   */
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.lokey = 335315;
    this.query = {};
  }
  /**
   * Set the location key.
   *
   * @param lkey - The location key.
   * @returns The instance of Accuapi.
   */
  localkey(lkey) {
    !lkey ? null : this.lokey = lkey;
    return this;
  }
  /**
   * Set the time interval.
   *
   * @param val - The time interval value.
   * @returns Accuapi The instance of Accuapi.
   */
  timeInt(val = "") {
    !val ? this.time = "hourly/1hour" : this.time = val;
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
    !lan ? null : this.query.language = lan;
    return this;
  }
  /**
   * Set the details flag.
   *
   * @param bool - Specifies whether or not to include the full object.
   * @returns The instance of Accuapi.
   */
  details(bool) {
    !bool ? null : this.query.details = bool;
    return this;
  }
  /**
   * Set the getphotos flag
   *
   * @param bool Specifies whether or not to include photos.
   * @returns The instance of Accuapi.
   */
  getphotos(bool) {
    !bool ? null : this.query.getphotos = bool;
    return this;
  }
  /**
   * Set the metric flag.
   *
   * @param bool - Specifies whether to return the data in metric units.
   * @returns The instance of Accuapi.
   */
  metric(bool) {
    !bool ? null : this.query.metric = bool;
    return this;
  }
  /**
   * Generates the request URL for the AccuWeather API
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
    this.query ? this.url += `&${import_qs.default.stringify(this.query)}` : this.url;
  }
  /**
   * Retrieves the weather data from the AccuWeather API.
   *
   * @returns A promise that resolves to the weather data.
   * @throws {Error} Throws an error if the forecast cannot be retrieved.
   */
  async get() {
    this.generateReqUrl();
    let response;
    try {
      response = await import_axios.default.get(this.url ? this.url : "");
      if (typeof response.data !== "object") {
        throw new Error(`Status: ${response.status} text: ${response.statusText}`, {
          cause: {
            status: 503,
            text: "Service Unavailable"
          }
        });
      }
      return response.data;
    } catch (error) {
      if (error && error.cause && error.cause.status === 503) {
        throw new Error(`Status: ${error.cause.status} text: ${error.cause.text}`, {
          cause: {
            status: error.cause.status,
            text: error.cause.text
          }
        });
      } else if (error && error.response && error.status >= 400 && error.status <= 500) {
        throw new Error(`Status: ${error.response.status} text: ${error.response.statusText}`, {
          cause: {
            status: error.status,
            text: error.statusText
          }
        });
      } else {
        throw new Error(
          `Forecast cannot be retrieved. ERROR: ${error.response && JSON.stringify(error.response.data) || error.toString()}`
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
  async getCurrent() {
    this.generateReqUrl(true);
    let response;
    try {
      response = await import_axios.default.get(this.url ? this.url : "");
      if (typeof response.data !== "object") {
        throw new Error(`Status: ${response.status} text: ${response.statusText}`, {
          cause: {
            status: 503,
            text: "Service Unavailable"
          }
        });
      }
      return response.data;
    } catch (error) {
      if (error && error.cause && error.cause.status === 503) {
        throw new Error(`Status: ${error.cause.status} text: ${error.cause.text}`, {
          cause: {
            status: error.cause.status,
            text: error.cause.text
          }
        });
      } else if (error && error.response && (error.status >= 400 && error.status <= 500 || error.status === 503)) {
        throw new Error(`Status: ${error.response.status} text: ${error.response.statusText}`, {
          cause: {
            status: error.status,
            text: error.statusText
          }
        });
      } else {
        throw new Error(
          `Forecast cannot be retrieved. ERROR: status:${error.status} ${error.response && JSON.stringify(error.response.data) || error.toString()}`
        );
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Accuapi
});
//# sourceMappingURL=accuapi.js.map
