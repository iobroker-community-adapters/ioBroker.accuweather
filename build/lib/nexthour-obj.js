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
var nexthour_obj_exports = {};
__export(nexthour_obj_exports, {
  createCurrentConditionObjects: () => createCurrentConditionObjects,
  createDailyForecastObjects: () => createDailyForecastObjects,
  createHourlyForecastObjects: () => createHourlyForecastObjects,
  createNextHourForecatObjects: () => createNextHourForecatObjects,
  createSummaryObjects: () => createSummaryObjects
});
module.exports = __toCommonJS(nexthour_obj_exports);
async function createSummaryObjects(adapter2) {
  const obj = await Promise.resolve().then(() => __toESM(require("../../lib/summaryObject.json")));
  await adapter2.extendObject("Summary", {
    type: "channel",
    common: {
      name: "Weather Summary"
    },
    native: {}
  });
  const _obj = Object.assign({}, obj.default);
  for (const key in _obj) {
    const k = key;
    await adapter2.extendObject(key, _obj[k]);
  }
}
async function createNextHourForecatObjects(hour, adapter2) {
  const obj = await Promise.resolve().then(() => __toESM(require("../../lib/nextHourObject.json")));
  await adapter2.extendObject(`Hourly.h${hour}`, {
    type: "channel",
    common: {
      name: `Hour ${hour} Forecast`
    },
    native: {}
  });
  const _obj = Object.assign({}, obj.default);
  for (const k in _obj) {
    const key = k;
    const measure = {};
    const nkey = String(key).replace("nextHour", `Hourly.h${hour}`);
    const role = _obj[key].common.role;
    _obj[key].common.unit = metric2Imperial(adapter2, _obj[key].common.unit);
    measure[nkey] = Object.assign({}, _obj[key]);
    measure[nkey].common = Object.assign({}, _obj[key].common);
    if (measure[nkey].common.role) {
      measure[nkey].common.role = `${role}.forecast.${hour}`;
    }
    adapter2.log.debug(`key: ${nkey}, role:${JSON.stringify(measure[nkey].common.role)}, base: ${role}`);
    adapter2.extendObject(nkey, measure[nkey]);
  }
}
async function createCurrentConditionObjects(adapter2) {
  const obj = await Promise.resolve().then(() => __toESM(require("../../lib/currentCondObject.json")));
  await adapter2.extendObject("Current", {
    type: "channel",
    common: {
      name: "Current Conditions"
    },
    native: {}
  });
  for (const key in obj.default) {
    const k = key;
    await adapter2.extendObject(key.replace("nextHour", "Current"), obj.default[k]);
  }
}
async function createDailyForecastObjects(adapter2) {
  const obj = await Promise.resolve().then(() => __toESM(require("../../lib/DailyObject.json")));
  for (let i = 1; i <= 5; i++) {
    await adapter2.extendObject(`Daily.Day${i}`, {
      type: "channel",
      common: {
        name: `Day ${i} Forecast`
      },
      native: {}
    });
    const _obj = Object.assign({}, obj.default);
    for (const k in _obj) {
      const key = k;
      const measure = {};
      let nkey = "";
      const role = _obj[key].common.role;
      _obj[key].common.unit = metric2Imperial(adapter2, _obj[key].common.unit);
      if (!String(key).indexOf("dayPart.")) {
        nkey = String(key).replace("dayn.", `Day${i}.`);
        measure[nkey] = Object.assign({}, _obj[key]);
        measure[nkey].common = Object.assign({}, _obj[key].common);
        if (measure[nkey].common.role) {
          measure[nkey].common.role = `${role}.forecast.${i - 1}`;
        }
        adapter2.extendObject(nkey, measure[nkey]);
      } else {
        ["Day", "Night"].forEach((dp) => {
          nkey = String(key).replace("dayn.", `Day${i}.`).replace("dayPart.", `${dp}.`);
          measure[nkey] = Object.assign({}, _obj[key]);
          measure[nkey].common = Object.assign({}, _obj[key].common);
          if (measure[nkey].common.role) {
            measure[nkey].common.role = `${role}.forecast.${i - 1}`;
          }
          adapter2.extendObject(nkey, measure[nkey]);
        });
      }
    }
  }
}
async function createHourlyForecastObjects(adapter2) {
  for (let hr = 0; hr < 24; hr++) {
    await createNextHourForecatObjects(String(hr), adapter2);
  }
}
function metric2Imperial(adapter2, unit) {
  if (unit === void 0 || adapter2.config.metric === "Metric") {
    return unit;
  }
  switch (unit) {
    case "\xB0C":
      return "F";
    case "km/h":
      return "mi/h";
    case "km":
      return "mi";
    case "m":
      return "ft";
    case "mb":
      return "inHg";
    case "mm":
      return "in";
    default:
      return unit;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createCurrentConditionObjects,
  createDailyForecastObjects,
  createHourlyForecastObjects,
  createNextHourForecatObjects,
  createSummaryObjects
});
//# sourceMappingURL=nexthour-obj.js.map