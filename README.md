
![Vitest](https://github.com/HillwoodPark/gcp-logger/actions/workflows/vitest.yml/badge.svg)

# Hillwood Park GCP Logger

Nodejs Logger for Google Cloud Platform

Part of https://epicroadtripplanner.com. Let's GO!

## Description

**Note:** This module is provided under the MIT license, and both forks and contributions are certainly welcome, but notably, it was created with the very specific Hillwood Park environments in mind. As published, we expect it's unlikely to provide much benefit in other environments without significant development effort, and we hope and expect there are already better similar tools for some other environments. At the time this module is initially published, we use Nodejs, typically v22.14.0 or newer, predominantly in Google Cloud's App Engine and Cloud Run environments and locally on macOS.

This module provides a few convenience functions to help translate our notion of an error or log message into a Node Console log, warn, or error message that's more or less compatible with the Google [Logging agent](https://cloud.google.com/logging/docs/agent/logging) and/or [Ops Agent](https://cloud.google.com/logging/docs/agent/ops-agent). These agents are used by default in various Google Cloud environments such as App Engine and Cloud Run, and turn formatted stdout and stderr messages into Google Cloud Log entries. If you need more control of logging, and can create code tightly coupled to the Google Cloud Environment, there are other libraries available that provide a much more integrated interface to the Ops Agent and Google Logging API. 

In addition, there are quite a few full-featured, [widely-adopted logging libraries for Node](https://betterstack.com/community/guides/logging/best-nodejs-logging-libraries/). We'll almost certainly eventually adopt one, too, in fact, but this one is lightweight, evolved organically on our team, and meets our needs at the moment.

When running locally, it may be helpful to use the [`jq`](https://github.com/jqlang/jq) command line process to render the output in a more human-readable format. For example the following command line uses the TypeScript watcher to recompine and run 'app.js' with the json output formatted with jq and non-json output echoed verbatim.
```
tsc-watch --onSuccess "node ./dist/app.js"  2>&1 | jq -r -R '. as $line | try fromjson catch $line'
```

This logger intentionally reserves CRITICAL, ALERT, and EMERGENCY level messages for the runtime and lower layers - i.e. if you set the LogLevel to one of these values, no messages will be logged by this library, and there are no convenience functions exported by this module that imply those levels. This functionality is appropriate to the Hillwood Park environments described above, but may not be reasonable elsewhere. In theory it could be extended to do so, and we encourage both forks and contributions.

The `redactHeaders` convenience function is a lightweight attempt to redact some HTTP headers that are commonly used to transmit credentials -- but there is no way to know in general what headers (or other fields) may actually contain PII or other sensitive information. In other words, while `redactHeaders` redacts the 'authorization' and 'cookie' headers, it has to be explicitly used when logging, and there are also many other places where you must protect against sensitive information or secrets leaking into log. There are automated sensitive data discovery tooling that can be used to find and mitigate other sources, which may help you find places where you should use `redactHeaders` or otherwise redact log messages.

The `abbreviateStrings` convenience function endeavors to trim strings such that they are more human-readable and have a better chance of fitting into the formatted stdout and stderr messages expected by the Google agents. We do not attempt to track the [implementation details of the Ops Agent](https://github.com/GoogleCloudPlatform/ops-agent) or the various Google Cloud environments that use it, and therefore if a given object contains several such lengthy strings, it will still exceed the limits and the resulting log message will be incompatible with the Agent. Also, by definition, information is removed by `abbreviateStrings` and `redactHeaders`, so if you always need the maximum amount of log content -- these won't be very helpful.

Good luck, have fun, forks and contributions welcome!

## Installation

We've only used this with npm, and haven't tried it with yarn or pnpm or any other package managers for Node.

```
npm i @hillwoodpark/gcp-logger
```

## Usage

The module exports logging functions `logDebug`, `logInfo`, `logNotice`, `logWarning`, and `logError` that use a shared instance singleton logger, or you can create a distinct logger. We use both approaches in Epic Road Trip Planner. Where we're creating a shared module, we'll typically allow a logger instance to be passed in as a dependency, so that the module's log output can be configured distinct from the shared instance.

### setSeverity

!!!!! TODO(tjohns): Document in detail how the severity determines which messages are emitted. Provide references to relevant Google Cloud LogLevel information.

### log{Debug|Info|Notice|Warning|Error}

!!!!! TODO(tjohns): Describe how the messages each consist of a `message` and an optional `object` that is merged with the jsonPayload, and reference the Google docs on why and how that works, along with the exising properties with defined meanings.


#### Shared instance, using convenience functions:
```
import { logInfo } from '@hillwoodpark/gcp-logger';

logInfo("This is a log message.")
```

#### Using a distinct logger instance:
TODO(tjohns): Run these examples.
```
import { createDefaultLogger, Logger, setSeverity, logDebug } from "@hillwoodpark/gcp-logger";

const logger = createDefaultLogger();

setSeverity(LogSeverity.DEBUG);
logger.setSeverity(LogSeverity.INFO);

logger.logInfo("This is an INFO log message, that WILL be emitted by this logger instance.")
logger.logDebug("This is a DEBUG log message, that WILL NOT be emitted by this logger instance.")

logDebug("This is a DEBUG log message, that WILL be emitted by the shared logger instance.")
setSeverity(LogSeverity.INFO);
logDebug("This is a DEBUG log message, that WILL NOT be emitted by the shared logger instance.")
```

### redactHeaders

### abbreviateStrings

### errorFromUnknown

### errorMessageFromUnknown

!!!!! TODO(tjohns): See if it makes sense to integrate Node's built-in [util.debuglog](https://nodejs.org/api/util.html#utildebuglogsection-callback) functionality.

