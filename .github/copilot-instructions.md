# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

## Adapter-Specific Context
- **Adapter Name**: accuweather
- **Primary Function**: Weather forecast using AccuWeather API
- **Repository**: iobroker-community-adapters/ioBroker.accuweather
- **Key Features**: Current weather conditions, 12-hour forecast, 5-day forecast, location-based weather data
- **API Integration**: AccuWeather API with encrypted API key handling
- **Data Types**: Weather metrics (temperature, humidity, wind, precipitation, cloud cover, etc.)
- **Configuration**: Supports metric/imperial units, location key, language selection
- **Update Intervals**: Configurable polling intervals with rate limiting
- **Technology**: TypeScript (rewritten from JavaScript in v2.1.0)

## Development Guidelines

### Weather Data Handling
- Always validate API responses before processing weather data
- Handle API rate limiting gracefully (AccuWeather has strict limits)
- Implement proper error handling for network timeouts and API failures
- Cache weather data appropriately to minimize API calls
- Support both metric and imperial unit systems
- Validate location data and provide meaningful error messages

### ioBroker Adapter Best Practices
- Follow ioBroker adapter development patterns
- Use appropriate logging levels (error, warn, info, debug)
- Implement proper error handling and recovery
- Ensure clean resource cleanup in unload() method
- Test both success and failure scenarios
- Follow semantic versioning for releases

### AccuWeather API Specifics
- API key must be encrypted using ioBroker's encryption mechanism
- Location keys are required - provide location search functionality
- Respect API call limits (varies by subscription level)
- Handle API error codes appropriately (401 Unauthorized, 403 Forbidden, etc.)
- Cache forecast data to avoid unnecessary API calls
- Implement retry logic with exponential backoff for transient failures

### Configuration Management
- Use JSON-based configuration with proper validation
- Encrypt sensitive data (API keys) using adapter-core encryption
- Provide clear configuration descriptions and validation messages
- Support language selection for weather descriptions
- Allow unit system selection (metric/imperial)

### State Management
- Create appropriate state objects for weather data
- Use proper data types and roles for each weather parameter
- Implement button states for manual refresh actions
- Maintain connection status state
- Group related states logically (current, hourly, daily forecasts)

### Error Handling
- Log API errors with appropriate detail levels
- Provide user-friendly error messages in adapter logs
- Handle network connectivity issues gracefully
- Implement fallback mechanisms for critical functionality
- Monitor and report adapter health status

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            }).timeout(120000);
        });
    }
});
```

## Logging

Use ioBroker's built-in logging system with appropriate levels:

```javascript
this.log.error('Critical error message');
this.log.warn('Warning message');
this.log.info('Informational message');
this.log.debug('Debug message');
```

## State Management

### Creating States
Always use `extendObject` to ensure proper state structure:

```javascript
await this.extendObject('stateName', {
    type: 'state',
    common: {
        name: 'State Name',
        type: 'number',
        role: 'value.temperature',
        unit: '°C',
        read: true,
        write: false,
    },
    native: {},
});
```

### Setting State Values
Always use `setState` with proper ack flag:

```javascript
// For values from external sources (acknowledged)
await this.setState('stateName', { val: value, ack: true });

// For command states (not acknowledged)
await this.setState('commandState', { val: false, ack: false });
```

### Object Structure
Organize states hierarchically:

```javascript
// Weather data structure example
adapter.0.current.temperature
adapter.0.current.humidity
adapter.0.forecast.day1.temperature.max
adapter.0.forecast.day1.temperature.min
```

## Configuration Management (JSON-Config)

For modern ioBroker adapters, use JSON-based configuration:

### Configuration Schema
Define your schema in `admin/jsonConfig.json`:

```json
{
    "type": "panel",
    "items": {
        "apiKey": {
            "type": "password",
            "label": "API Key",
            "sm": 12
        },
        "location": {
            "type": "text",
            "label": "Location Key",
            "sm": 12
        },
        "units": {
            "type": "select",
            "label": "Units",
            "options": [
                { "label": "Metric", "value": "metric" },
                { "label": "Imperial", "value": "imperial" }
            ]
        }
    }
}
```

### TypeScript Configuration Types
Define configuration types in `src/lib/adapter-config.d.ts`:

```typescript
declare global {
    namespace ioBroker {
        interface AdapterConfig {
            apiKey: string;
            location: string;
            units: "metric" | "imperial";
        }
    }
}

export {};
```

## Error Handling

### API Error Handling
```javascript
try {
    const response = await this.apiCall();
    // Process successful response
} catch (error) {
    if (error.response) {
        // API responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || 'API Error';
        
        if (status === 401) {
            this.log.error('Invalid API credentials');
        } else if (status === 429) {
            this.log.warn('API rate limit exceeded, retrying later');
        } else {
            this.log.error(`API error ${status}: ${message}`);
        }
    } else if (error.request) {
        // Network error
        this.log.error('Network error: ' + error.message);
    } else {
        // Other error
        this.log.error('Unexpected error: ' + error.message);
    }
}
```

### Graceful Degradation
```javascript
async onReady() {
    try {
        await this.initializeAdapter();
        await this.startDataCollection();
    } catch (error) {
        this.log.error('Failed to initialize: ' + error.message);
        // Set connection state to false
        await this.setState('info.connection', { val: false, ack: true });
        // Schedule retry
        this.setTimeout(this.onReady.bind(this), 60000);
    }
}
```

## Connection Management

Maintain connection state:

```javascript
async setConnected(connected) {
    if (this.connected !== connected) {
        this.connected = connected;
        await this.setState('info.connection', { val: connected, ack: true });
        this.log.info(`Connection ${connected ? 'established' : 'lost'}`);
    }
}
```

## Resource Cleanup

Implement proper cleanup in the unload method:

```javascript
onUnload(callback) {
  try {
    // Clear all timers
    if (this.updateTimer) {
        this.clearInterval(this.updateTimer);
        this.updateTimer = undefined;
    }
    
    // Close connections
    if (this.connectionTimer) {
        this.clearTimeout(this.connectionTimer);
        this.connectionTimer = undefined;
    }
    // Close connections, clean up resources
    callback();
  } catch (e) {
    callback();
  }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```