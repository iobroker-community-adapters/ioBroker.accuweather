"use strict";


async function createSummaryObjects(adapter) {
	const obj = require("./summaryObject.json");
	await adapter.setObjectNotExistsAsync("Summary", {
		type: "channel",
		common: {
			name: "Weather Summary"
		},
		native: {},
	});
	const _obj = Object.assign({}, obj);

	for (const key in _obj) {
		adapter.setObjectNotExists(key, _obj[key]);
	}

}


async function createNextHourForecatObjects(hour, adapter) {
	const obj = require("./nextHourObject.json");
	await adapter.setObjectNotExistsAsync("Hourly.h" + hour, {
		type: "channel",
		common: {
			name: `Hour ${hour} Forecast`
		},
		native: {},
	});
	const _obj = Object.assign({}, obj);

	for (const key in _obj) {
		const measure = {};
		const nkey = key.replace("nextHour", "Hourly.h" + hour);
		const role = _obj[key].common.role;
		measure[nkey] = Object.assign({}, _obj[key]);
		measure[nkey].common = Object.assign({}, _obj[key].common);
		if (measure[nkey].common.role) { measure[nkey].common.role = role + ".forecast." + hour; }
		adapter.log.debug("key: " + nkey + ", role:" + JSON.stringify(measure[nkey].common.role) + ", base: " + role);
		adapter.setObjectNotExists(nkey, measure[nkey]);
	}

}


async function createCurrentConditionObjects(adapter) {
	const obj = require("./currentCondObject.json");
	await adapter.setObjectNotExistsAsync("Current", {
		type: "channel",
		common: {
			name: `Current Conditions`
		},
		native: {},
	});

	for (const key in obj) {
		adapter.setObjectNotExists(key.replace("nextHour", "Current"), obj[key]);
	}

}

async function createDailyForecastObjects(adapter) {

	const obj = require("./DailyObject.json");
	for (let i = 1; i <= 5; i++) {
		await adapter.setObjectNotExistsAsync("Daily.Day" + i, {
			type: "channel",
			common: {
				name: `Day ${i} Forecast`
			},
			native: {},
		});
		const _obj = Object.assign({}, obj);

		for (const key in _obj) {
			const measure = {};
			let nkey = "";
			const role = _obj[key].common.role;
			if (!key.indexOf("dayPart.")) {
				nkey = key.replace("dayn.", "Day" + i + ".");
				measure[nkey] = Object.assign({}, _obj[key]);
				measure[nkey].common = Object.assign({}, _obj[key].common);
				if (measure[nkey].common.role) { measure[nkey].common.role = role + ".forecast." + (i - 1); }
				adapter.setObjectNotExists(nkey, measure[nkey]);
			}
			else {
				["Day", "Night"].forEach(function (dp) {
					nkey = key.replace("dayn.", "Day" + i + ".").replace("dayPart.", dp + ".");
					measure[nkey] = Object.assign({}, _obj[key]);
					measure[nkey].common = Object.assign({}, _obj[key].common);
					if (measure[nkey].common.role) { measure[nkey].common.role = role + ".forecast." + (i - 1); }
					adapter.setObjectNotExists(nkey, measure[nkey]);
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
exports.createSummaryObjects = createSummaryObjects;
