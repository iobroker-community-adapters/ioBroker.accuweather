"use strict";

/*
 * Created with @iobroker/create-adapter v1.16.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const Accuapi = require("./lib/accuapi");
const nextHour = require("./lib/nexthour-obj");

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
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}



	/**
	 * Is called when databases are connected and adapter received configuration.
	 */

	async setDailyStates(obj) {
		const days = obj.DailyForecasts;
		try {
			for (let day = 1; day <= 5; day++) {
				let json = days[day - 1];
				for (let key in json) {
					switch (key) {
						case "Date":
							await this.setStateAsync("Daily.Day" + day + "." + key, { val: json[key], ack: true });
							break;
						case "Sun":
							await this.setStateAsync("Daily.Day" + day + ".Sunrise", { val: json[key]["Rise"], ack: true });
							await this.setStateAsync("Daily.Day" + day + ".Sunset", { val: json[key]["Set"], ack: true });
							break;
						case "Temperature":
							await this.setStateAsync("Daily.Day" + day + ".Temperature.Minimum", { val: json[key]["Minimum"].Value, ack: true });
							await this.setStateAsync("Daily.Day" + day + ".Temperature.Maximum", { val: json[key]["Maximum"].Value, ack: true });
							break;
						case "RealFeelTemperature":
							await this.setStateAsync("Daily.Day" + day + ".RealFeelTemperature.Minimum", { val: json[key]["Minimum"].Value, ack: true });
							await this.setStateAsync("Daily.Day" + day + ".RealFeelTemperature.Maximum", { val: json[key]["Maximum"].Value, ack: true });
							break;
						case "Day":
						case "Night":
							{
								let json1 = json[key];
								for (let key1 in json1) {
									if (typeof json1[key1] !== "object") {
										await this.setStateAsync("Daily.Day" + day + "." + key + "." + key1, { val: json1[key1], ack: true });
									} else
									if (typeof json1[key1] == "object") {

										if (json1[key1]["Value"] !== undefined) {
											if (["TotalLiquid", "Rain", "Snow", "Ice"].includes(key1)) {
												await this.setStateAsync("Daily.Day" + day + "." + key + "." + key1 + "Volume", { val: json1[key1].Value, ack: true });
											} else { await this.setStateAsync("Daily.Day" + day + "." + key + "." + key1, { val: json1[key1].Value, ack: true }); }
										} else
										if (key1 == "Wind") {
											await this.setStateAsync("Daily.Day" + day + "." + key + ".WindSpeed", { val: json1[key1].Speed.Value, ack: true });
											await this.setStateAsync("Daily.Day" + day + "." + key + ".WindDirection", { val: json1[key1].Direction.Degrees, ack: true });
										} else
										if (key1 == "WindGust") {
											await this.setStateAsync("Daily.Day" + day + "." + key + ".WindGust", { val: json1[key1].Speed.Value, ack: true });
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

	async setNextHourStates(obj, item, hour) {
		const json = obj[item];
		try {
			for (let key in json) {
				if (typeof json[key] !== "object") {
					await this.setStateAsync("Hourly.h" + hour + "." + key, { val: json[key], ack: true });
				} else
				if (typeof json[key] == "object") {

					if (json[key]["Value"] !== undefined) {
						if (["TotalLiquid", "Rain", "Snow", "Ice"].includes(key)) {
							await this.setStateAsync("Hourly.h" + hour + "." + key + "Volume", { val: json[key].Value, ack: true });
						} else { await this.setStateAsync("Hourly.h" + hour + "." + key, { val: json[key].Value, ack: true }); }
					} else
					if (key == "Wind") {
						await this.setStateAsync("Hourly.h" + hour + ".WindSpeed", { val: json[key].Speed.Value, ack: true });
						await this.setStateAsync("Hourly.h" + hour + ".WindDirection", { val: json[key].Direction.Degrees, ack: true });
					} else
					if (key == "WindGust") {
						await this.setStateAsync("Hourly.h" + hour + ".WindGust", { val: json[key].Speed.Value, ack: true });
					}
				}
			}
		} catch (err) { this.log.error(err); }
	}

	async setCurrentStates(obj) {
		const json = obj[0];
		try {
			for (let key in json) {
				//this.log.debug("Current: " + key + ": " + typeof json[key]);
				if (typeof json[key] !== "object" && json[key] !== null) {
					await this.setStateAsync("Current." + key, { val: json[key], ack: true });
				}
				else if (json[key] !== null) {
					if (json[key].Metric !== undefined) {
						//this.log.debug(key + ": " + json[key].Metric.Value);
						await this.setStateAsync("Current." + key, { val: json[key].Metric.Value, ack: true });
					} else
					if (key == "Wind") {
						await this.setStateAsync("Current.WindSpeed", { val: json[key].Speed.Metric.Value, ack: true });
						await this.setStateAsync("Current.WindDirection", { val: json[key].Direction.Degrees, ack: true });
					} else
					if (key == "WindGust") {
						await this.setStateAsync("Current.WindGust", { val: json[key].Speed.Metric.Value, ack: true });
					} else
					if (key == "PressureTendency") {
						await this.setStateAsync("Current.PressureTendency", { val: json[key].LocalizedText, ack: true });
					}
				}
			}
		} catch (err) { this.log.error(err); }
	}

	setHourlyStates(obj) {
		for (let hr in obj) {
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
					this.log.debug(JSON.stringify(res));
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

		this.log.debug("API: " + this.config.apiKey + "; Loc: " + this.config.loKey + " Lang: " + this.config.language);

		if (this.config.apiKey !== "") {
			this.forecast = new Accuapi(this.config.apiKey);
		} else { this.log.error("API Key is missing. Please enter Accuweather API key"); }

		setInterval(()=>{
			const _this=this;
			const cdt=new Date();
			if ((cdt.getHours()===7 || cdt.getHours()===20) && cdt.getMinutes() <=5 ) {setTimeout(()=>{_this.requst5Days();},Math.random()*10000+1);}
			if (cdt.getMinutes() <=5 && cdt.getMinutes() > 0) {setTimeout(()=>{_this.requstCurrent();},Math.random()*10000+1);}
			if ((cdt.getHours()===6 || cdt.getHours()===12 || cdt.getHours()===18 || cdt.getHours()===0) && cdt.getMinutes() <=5) {setTimeout(()=>{_this.requst12Hours();},Math.random()*10000+1);}
			
		}, 300000);

		this.requst12Hours();
		this.requstCurrent();
		this.requst5Days();
/*
		setInterval(() => {
			this.requst12Hours();
		}, 21600000);

		setInterval(() => {
			this.requstCurrent();
		}, 3600000);
*/
		//this.log.info(fres);
		//accu=require('./lib/accuapi')()('GqmgWXup3W4DSrGoHpGdB32MR9bSAlPI');
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.info("config option1: " + this.config.option1);
		//this.log.info("config option2: " + this.config.option2);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/

		
		await this.setObjectAsync("updateCurrent", {
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
		await this.setObjectAsync("updateHourly", {
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
		await this.setObjectAsync("updateDaily", {
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

		/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		//await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		//await this.setStateAsync("testVariable", { val: true, ack: true });

		// examples for the checkPassword/checkGroup functions
		//let result = await this.checkPasswordAsync("admin", "iobroker");
		//this.log.info("check user admin pw ioboker: " + result);

		//result = await this.checkGroupAsync("admin", "admin");
		//this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info("cleaned everything up...");
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
			if (id.indexOf("updateCurrent")) {this.requstCurrent();} else
			if (id.indexOf("updateHourly")) {this.requst12Hours();} else
			if (id.indexOf("updateDaily")) {this.requst5Days();} 
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


