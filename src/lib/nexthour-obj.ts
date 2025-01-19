import { adapter } from '@iobroker/adapter-core';
import type Accuweather from '../main';

export async function createSummaryObjects(adapter: Accuweather): Promise<void> {
    const obj = (await import('../../lib/summaryObject.json')) as unknown as {
        default: {
            [key: string]: ioBroker.StateObject;
        };
    };
    await adapter.extendObject('Summary', {
        type: 'channel',
        common: {
            name: 'Weather Summary',
        },
        native: {},
    });
    const _obj = Object.assign({}, obj.default);

    for (const key in _obj) {
        const k = key as keyof typeof _obj;
        await adapter.extendObject(key, _obj[k]);
    }
}

export async function createNextHourForecatObjects(hour: string, adapter: Accuweather): Promise<void> {
    const obj = await import('../../lib/nextHourObject.json');
    await adapter.extendObject(`Hourly.h${hour}`, {
        type: 'channel',
        common: {
            name: `Hour ${hour} Forecast`,
        },
        native: {},
    });
    const _obj = Object.assign({}, obj.default) as unknown as {
        [key: string]: ioBroker.StateObject;
    };

    for (const k in _obj) {
        const key = k as keyof typeof _obj;
        const measure: any = {};
        const nkey = String(key).replace('nextHour', `Hourly.h${hour}`);
        const role = _obj[key].common.role;
        _obj[key].common.unit = metric2Imperial(adapter, _obj[key].common.unit);
        measure[nkey] = Object.assign({}, _obj[key]);
        measure[nkey].common = Object.assign({}, _obj[key].common);
        if (measure[nkey].common.role) {
            measure[nkey].common.role = `${role}.forecast.${hour}`;
        }
        adapter.log.debug(`key: ${nkey}, role:${JSON.stringify(measure[nkey].common.role)}, base: ${role}`);
        adapter.extendObject(nkey, measure[nkey]);
    }
}

export async function createCurrentConditionObjects(adapter: Accuweather): Promise<void> {
    const obj = (await import('../../lib/currentCondObject.json')) as unknown as {
        default: {
            [key: string]: ioBroker.StateObject;
        };
    };
    await adapter.extendObject('Current', {
        type: 'channel',
        common: {
            name: 'Current Conditions',
        },
        native: {},
    });

    for (const key in obj.default) {
        const k = key as keyof typeof obj.default;
        await adapter.extendObject(key.replace('nextHour', 'Current'), obj.default[k]);
    }
}

export async function createDailyForecastObjects(adapter: Accuweather): Promise<void> {
    const obj = await import('../../lib/DailyObject.json');
    for (let i = 1; i <= 5; i++) {
        await adapter.extendObject(`Daily.Day${i}`, {
            type: 'channel',
            common: {
                name: `Day ${i} Forecast`,
            },
            native: {},
        });
        const _obj = Object.assign({}, obj.default) as unknown as {
            [key: string]: ioBroker.StateObject;
        };

        for (const k in _obj) {
            const key = k as keyof typeof _obj;
            const measure: any = {};
            let nkey = '';
            const role = _obj[key].common.role;
            _obj[key].common.unit = metric2Imperial(adapter, _obj[key].common.unit);
            if (!String(key).indexOf('dayPart.')) {
                nkey = String(key).replace('dayn.', `Day${i}.`);
                measure[nkey] = Object.assign({}, _obj[key]);
                measure[nkey].common = Object.assign({}, _obj[key].common);
                if (measure[nkey].common.role) {
                    measure[nkey].common.role = `${role}.forecast.${i - 1}`;
                }
                adapter.extendObject(nkey, measure[nkey]);
            } else {
                ['Day', 'Night'].forEach(dp => {
                    nkey = String(key).replace('dayn.', `Day${i}.`).replace('dayPart.', `${dp}.`);
                    measure[nkey] = Object.assign({}, _obj[key]);
                    measure[nkey].common = Object.assign({}, _obj[key].common);
                    if (measure[nkey].common.role) {
                        measure[nkey].common.role = `${role}.forecast.${i - 1}`;
                    }
                    adapter.extendObject(nkey, measure[nkey]);
                });
            }
        }
    }
}

export async function createHourlyForecastObjects(adapter: Accuweather): Promise<void> {
    for (let hr = 0; hr < 24; hr++) {
        await createNextHourForecatObjects(String(hr), adapter);
    }
}

function metric2Imperial(adapter: Accuweather, unit: string | undefined): string | undefined {
    if (unit === undefined || adapter.config.metric === 'Metric') {
        return unit;
    }
    switch (unit) {
        case '°C':
            return 'F';
        case 'km/h':
            return 'mi/h';
        case 'km':
            return 'mi';
        case 'm':
            return 'ft';
        case 'mb':
            return 'inHg';
        case 'mm':
            return 'in';
        default:
            return unit;
    }
}
