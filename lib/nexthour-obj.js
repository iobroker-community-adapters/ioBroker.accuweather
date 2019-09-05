"use strict";

async function createNextHourForecatObjects(hour, adapter) {
	const obj = require("./nextHourObject.json");
	await adapter.setObjectAsync("Hourly.h" + hour, {
		type: "channel",
		common: {
			name: `Hour ${hour} Forecast`
		},
		native: {},
	});

	for (const key in obj) {
		await adapter.setObjectAsync(key.replace("nextHour", "Hourly.h" + hour), obj[key]);
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

	for (const key in obj) {
		await adapter.setObjectAsync(key.replace("nextHour", "Current"), obj[key]);
	}

}

async function createDailyForecastObjects(adapter) {

	const obj = require("./DailyObject.json");
	for (let i = 1; i <= 5; i++) {
		await adapter.setObjectAsync("Daily.Day" + i, {
			type: "channel",
			common: {
				name: `Day ${i} Forecast`
			},
			native: {},
		});
		for (const key in obj) {
			if (!key.indexOf("dayPart.")) { await adapter.setObjectAsync(key.replace("dayn.", "Day" + i + "."), obj[key]); }
			else {
				["Day", "Night"].forEach(async function (dp) {
					await adapter.setObjectAsync(key.replace("dayn.", "Day" + i + ".").replace("dayPart.", dp + "."), obj[key]);
				});
			}

		}
	}




}

function createHourlyForecastObjects(adapter) {
	for (let hr = 0; hr < 24; hr++) {
		createNextHourForecatObjects(hr, adapter);
	}
}

exports.createNextHourForecatObjects = createNextHourForecatObjects;
exports.createHourlyForecastObjects = createHourlyForecastObjects;
exports.createCurrentConditionObjects = createCurrentConditionObjects;
exports.createDailyForecastObjects = createDailyForecastObjects;