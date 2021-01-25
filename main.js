"use strict";

/*
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const Accuapi = require("./lib/accuapi");
const nextHour = require("./lib/nexthour-obj");
var updateInterval = null;
var timeout1 = null;
var timeout2 = null;


// Load your modules here, e.g.:
// const fs = require("fs");
//let forecast = undefined;

class Accuweather extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "accuweather",
			strictObjectChecks: false
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}



	getCardinalDirection(angle) {
		if (typeof angle === "string") angle = parseInt(angle);
		if (angle <= 0 || angle > 360 || typeof angle === "undefined") return "☈";
		const arrows = { north: "↑N", north_east: "↗NE", east: "→E", south_east: "↘SE", south: "↓S", south_west: "↙SW", west: "←W", north_west: "↖NW" };
		const directions = Object.keys(arrows);
		const degree = 360 / directions.length;
		angle = angle + degree / 4;
		for (let i = 0; i < directions.length; i++) {
			if (angle >= (i * degree) && angle < (i + 1) * degree) return arrows[directions[i]];
		}
		return arrows["north"];
	}


	setDailyStates(obj) {
		const days = obj.DailyForecasts;
		try {
			for (let day = 1; day <= 5; day++) {
				const json = days[day - 1];
				for (const key in json) {
					let dt = null;
					switch (key) {
						case "Date":
							dt = new Date(json[key]);
							this.setState("Daily.Day" + day + "." + key, { val: json[key], ack: true });
							this.setState("Summary.DateTime_d" + day, { val: json[key], ack: true });
							this.setState("Summary.DayOfWeek_d"+day, { val: dt.toLocaleString(this.config.language, {weekday: "short"}), ack: true });
							break;
						case "Sun":
							this.setState("Daily.Day" + day + ".Sunrise", { val: json[key]["Rise"], ack: true });
							this.setState("Daily.Day" + day + ".Sunset", { val: json[key]["Set"], ack: true });
							if (day == 1) {
								this.setState("Summary.Sunrise", { val: json[key]["Rise"], ack: true });
								this.setState("Summary.Sunset", { val: json[key]["Set"], ack: true });	
							}
							break;
						case "Temperature":
							this.setState("Daily.Day" + day + ".Temperature.Minimum", { val: json[key]["Minimum"].Value, ack: true });
							this.setState("Daily.Day" + day + ".Temperature.Maximum", { val: json[key]["Maximum"].Value, ack: true });
							this.setState("Summary.TempMin_d" + day, { val: json[key]["Minimum"].Value, ack: true });
							this.setState("Summary.TempMax_d" + day, { val: json[key]["Maximum"].Value, ack: true });
							break;
						case "RealFeelTemperature":
							this.setState("Daily.Day" + day + ".RealFeelTemperature.Minimum", { val: json[key]["Minimum"].Value, ack: true });
							this.setState("Daily.Day" + day + ".RealFeelTemperature.Maximum", { val: json[key]["Maximum"].Value, ack: true });
							break;
						case "Day":
						case "Night":
							{
								const json1 = json[key];
								for (const key1 in json1) {
									if (typeof json1[key1] !== "object") {
										this.setState("Daily.Day" + day + "." + key + "." + key1, { val: json1[key1], ack: true });
										if (key1 === "Icon") {
											this.setState("Daily.Day" + day + "." + key + ".IconURL", { val: "https://developer.accuweather.com/sites/default/files/" + String(json1[key1]).padStart(2, "0") + "-s.png", ack: true });
											this.setState("Daily.Day" + day + "." + key + ".IconURLS", { val: "http://vortex.accuweather.com/adc2010/images/slate/icons/" + String(json1[key1]).padStart(2, "0") + ".svg", ack: true });
											if (key == "Day") {
												this.setState("Summary.WeatherIconURL_d" + day, { val: "http://vortex.accuweather.com/adc2010/images/slate/icons/" + String(json1[key1]).padStart(2, "0") + ".svg", ack: true });
												this.setState("Summary.WeatherIcon_d"+day, { val: json1[key1], ack: true });
											}
										} else
										if (key == "Day") {
											if (key1=="IconPhrase") {
												this.setState("Summary.WeatherText_d"+day, { val: json1[key1], ack: true });
											} else this.setState("Summary."+key1+"_d"+day, { val: json1[key1], ack: true });	
										}
										
									} else
									if (typeof json1[key1] == "object") {

										if (json1[key1]["Value"] !== undefined) {
											if (["TotalLiquid", "Rain", "Snow", "Ice"].includes(key1)) {
												this.setState("Daily.Day" + day + "." + key + "." + key1 + "Volume", { val: json1[key1].Value, ack: true });
												if (key=="Day" && key1=="TotalLiquid") this.setState("Summary.TotalLiquidVolume_d" + day, { val: json1[key1].Value, ack: true });
											} else { this.setState("Daily.Day" + day + "." + key + "." + key1, { val: json1[key1].Value, ack: true }); }
										} else
										if (key1 == "Wind") {
											this.setState("Daily.Day" + day + "." + key + ".WindSpeed", { val: json1[key1].Speed.Value, ack: true });
											this.setState("Daily.Day" + day + "." + key + ".WindDirection", { val: json1[key1].Direction.Degrees, ack: true });
											if (key=="Day") {
												this.setState("Summary.WindSpeed_d"+day, { val: json1[key1].Speed.Value, ack: true });
												this.setState("Summary.WindDirection_d"+day, { val: json1[key1].Direction.Degrees, ack: true });
												this.setState("Summary.WindDirectionStr_d"+day, { val: this.getCardinalDirection(json1[key1].Direction.Degrees), ack: true });
											}
										} else
										if (key1 == "WindGust") {
											this.setState("Daily.Day" + day + "." + key + ".WindGust", { val: json1[key1].Speed.Value, ack: true });
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

		} catch (err) { this.log.error(err); }
	}

	setNextHourStates(obj, item, hour) {
		const json = obj[item];
		try {
			for (const key in json) {
				if (typeof json[key] !== "object") {
					this.setState("Hourly.h" + hour + "." + key, { val: json[key], ack: true });
					if (key === "WeatherIcon") {
						this.setState("Hourly.h" + hour + ".WeatherIconURL", { val: "https://developer.accuweather.com/sites/default/files/" + String(json[key]).padStart(2, "0") + "-s.png", ack: true });
						this.setState("Hourly.h" + hour + ".WeatherIconURLS", { val: "http://vortex.accuweather.com/adc2010/images/slate/icons/" + String(json[key]).padStart(2, "0") + ".svg", ack: true });
					}
				} else
				if (typeof json[key] == "object") {

					if (json[key]["Value"] !== undefined) {
						if (["TotalLiquid", "Rain", "Snow", "Ice"].includes(key)) {
							this.setState("Hourly.h" + hour + "." + key + "Volume", { val: json[key].Value, ack: true });
						} else { this.setState("Hourly.h" + hour + "." + key, { val: json[key].Value, ack: true }); }
					} else
					if (key == "Wind") {
						this.setState("Hourly.h" + hour + ".WindSpeed", { val: json[key].Speed.Value, ack: true });
						this.setState("Hourly.h" + hour + ".WindDirection", { val: json[key].Direction.Degrees, ack: true });
					} else
					if (key == "WindGust") {
						this.setState("Hourly.h" + hour + ".WindGust", { val: json[key].Speed.Value, ack: true });
					}
				}
			}
		} catch (err) { this.log.error(err); }
	}

	setCurrentStates(obj) {
		const json = obj[0];
		try {
			for (const key in json) {
				//this.log.debug("Current: " + key + ": " + typeof json[key]);
				if (typeof json[key] !== "object" || json[key]==null) {
					this.setState("Current." + key, { val: json[key], ack: true });

					if (key === "WeatherIcon") {
						this.setState("Current" + ".WeatherIconURL", { val: "https://developer.accuweather.com/sites/default/files/" + String(json[key]).padStart(2, "0") + "-s.png", ack: true });
						this.setState("Current" + ".WeatherIconURLS", { val: "http://vortex.accuweather.com/adc2010/images/slate/icons/" + String(json[key]).padStart(2, "0") + ".svg", ack: true });
						this.setState("Summary.WeatherIconURL", { val: "http://vortex.accuweather.com/adc2010/images/slate/icons/" + String(json[key]).padStart(2, "0") + ".svg", ack: true });
						this.setState("Summary.WeatherIcon", { val: json[key], ack: true });
					} else
					if (key === "LocalObservationDateTime") {
						const dt = new Date(json[key]);
						const dow = dt.toLocaleString(this.config.language, {weekday: "short"});
						this.setState("Summary.CurrentDateTime", { val: json[key], ack: true });
						this.setState("Summary.DayOfWeek", { val: dow, ack: true });
						this.log.debug("Date " + dt + ", dow: "+ dt.toLocaleString(this.config.language, {weekday: "short"}));
					}
					else {
						this.setState("Summary." + key, { val: json[key], ack: true });
					}
				}
				else if (json[key] !== null) {
					if (json[key].Metric !== undefined) {
						//this.log.debug(key + ": " + json[key].Metric.Value);
						this.setState("Current." + key, { val: json[key].Metric.Value, ack: true });
						this.setState("Summary." + key, { val: json[key].Metric.Value, ack: true });
					} else
					if (key == "Wind") {
						this.setState("Current.WindSpeed", { val: json[key].Speed.Metric.Value, ack: true });
						this.setState("Summary.WindSpeed", { val: json[key].Speed.Metric.Value, ack: true });
						this.setState("Current.WindDirection", { val: json[key].Direction.Degrees, ack: true });
						this.setState("Summary.WindDirection", { val: json[key].Direction.Degrees, ack: true });
						this.setState("Summary.WindDirectionStr", { val: this.getCardinalDirection(json[key].Direction.Degrees), ack: true });
					} else
					if (key == "WindGust") {
						this.setState("Current.WindGust", { val: json[key].Speed.Metric.Value, ack: true });
					} else
					if (key == "PressureTendency") {
						this.setState("Current.PressureTendency", { val: json[key].LocalizedText, ack: true });
					}
				}
			}
		} catch (err) { this.log.error(err); }
	}

	setHourlyStates(obj) {
		for (const hr in obj) {
			if (typeof obj[hr] == "object" && obj[hr]["DateTime"]) {
				const d = new Date(obj[hr]["DateTime"]);
				this.setNextHourStates(obj, hr, d.getHours());
			}
		}
	}

	requst5Days() {
		if (typeof this.forecast !== "undefined") {
			const loc = this.config.loKey;
			const lang = this.config.language;
			this.forecast
				.localkey(loc)
				.timeInt("daily/5day")
				.language(lang)
				.metric(true)
				.details(true)
				.get()
				.then(res => {
					//this.log.debug(JSON.stringify(res));
					this.setDailyStates(res);
				})
				.catch(err => {
					this.log.error(err);
				});
		}
	}

	requst12Hours() {
		if (typeof this.forecast !== "undefined") {
			const loc = this.config.loKey;
			const lang = this.config.language;
			this.forecast
				.localkey(loc)
				.timeInt("hourly/12hour")
				.language(lang)
				.metric(true)
				.details(true)
				.get()
				.then(res => {
					//this.log.debug(JSON.stringify(res));
					this.setHourlyStates(res);
				})
				.catch(err => {
					this.log.error(err);
				});
		}
	}

	requstCurrent() {
		if (typeof this.forecast !== "undefined") {
			const loc = this.config.loKey;
			const lang = this.config.language;
			this.forecast
				.localkey(loc)
				.timeInt()
				.language(lang)
				.metric(true)
				.details(true)
				.getCurrent()
				.then(res => {
					//this.log.debug(JSON.stringify(res));
					this.setCurrentStates(res);
				})
				.catch(err => {
					this.log.error(err);
				});
		}
	}

	async onReady() {
		nextHour.createHourlyForecastObjects(this);
		nextHour.createCurrentConditionObjects(this);
		nextHour.createDailyForecastObjects(this);
		nextHour.createSummaryObjects(this);

		this.log.debug("API: " + this.config.apiKey + "; Loc: " + this.config.loKey + " Lang: " + this.config.language);

		if (this.config.apiKey !== "") {
			this.forecast = new Accuapi(this.config.apiKey);
		} else { this.log.error("API Key is missing. Please enter Accuweather API key"); }

		updateInterval = setInterval(() => {
			const _this = this;
			const cdt = new Date();
			if ((cdt.getHours() === 7 || cdt.getHours() === 20) && cdt.getMinutes() < 5) { timeout1 = setTimeout(() => { _this.requst5Days(); }, Math.random() * 10000 + 1); }
			if (cdt.getMinutes() <= 5 && cdt.getMinutes() > 0) { timeout2 = setTimeout(() => { _this.requstCurrent(); }, Math.random() * 10000 + 1); }
			if ((cdt.getHours() === 6 || cdt.getHours() === 12 || cdt.getHours() === 18 || cdt.getHours() === 0) && cdt.getMinutes() <=5) { timeout1 = setTimeout(() => { _this.requst12Hours(); }, Math.random() * 10000 + 1); }

		}, 300000);

		this.requst12Hours();
		this.requstCurrent();
		this.requst5Days();

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/


		await this.setObjectNotExistsAsync("updateCurrent", {
			type: "state",
			common: {
				name: "Update Current Weather",
				type: "boolean",
				role: "button",
				read: true,
				write: true
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("updateHourly", {
			type: "state",
			common: {
				name: "Update 12 Hours Forecast",
				type: "boolean",
				role: "button",
				read: true,
				write: true,
			},
			native: {},
		});
		await this.setObjectNotExistsAsync("updateDaily", {
			type: "state",
			common: {
				name: "Update 5 Days Forecast",
				type: "boolean",
				role: "button",
				read: true,
				write: true,
			},
			native: {},
		});


		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("update*");

	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
			clearInterval(updateInterval);
                        clearTimeout(timeout1);
                        clearTimeout(timeout2);
			callback();
		} catch (e) {
			callback();
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
			if (id.indexOf("updateCurrent")) { this.requstCurrent(); } else
			if (id.indexOf("updateHourly")) { this.requst12Hours(); } else
			if (id.indexOf("updateDaily")) { this.requst5Days(); }
			this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.debug(`state ${id} deleted`);
		}
	}

	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Accuweather(options);
} else {
	// otherwise start the instance directly
	new Accuweather();
}


