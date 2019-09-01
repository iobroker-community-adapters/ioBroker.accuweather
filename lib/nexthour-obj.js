"use strict";

async function createNextHourForecatObjects(hour, adapter) {
	const obj = require("./nextHourObject.json");
	await adapter.setObjectAsync("Hourly.h"+hour, {
		type: "channel",
		common: {
			name: `Hour ${hour} Forecast`
		},
		native: {},
	});

	for ( const key in obj) {
		await adapter.setObjectAsync(key.replace("nextHour","Hourly.h"+hour), obj[key]);
	}

}

async function createCurrentConditionObjects(adapter) {
	const obj = require("./currentCondObject.json");
	await adapter.setObjectAsync("Current", {
		type: "channel",
		common: {
			name: `Current Conditions`
		},
		native: {},
	});

	for ( const key in obj) {
		await adapter.setObjectAsync(key.replace("nextHour","Current"), obj[key]);
	}

}

function createHourlyForecastObjects(adapter) {
	for (let hr=0; hr<24; hr++) {
		createNextHourForecatObjects(hr, adapter);
	}
}

exports.createNextHourForecatObjects = createNextHourForecatObjects;
exports.createHourlyForecastObjects = createHourlyForecastObjects;
exports.createCurrentConditionObjects = createCurrentConditionObjects;