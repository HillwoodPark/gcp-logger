
/**
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
 */ 
export enum LogSeverity {
  DEFAULT = 0,
  DEBUG = 100,
  INFO = 200,
  NOTICE = 300,
  WARNING = 400,
  ERROR = 500,
  CRITICAL = 600,
  ALERT = 700,
  EMERGENCY = 800
};

export type LogSettings = {
  severity: LogSeverity,
  console?: Console
};

export function redactHeaders(headers: { [key: string]: any; }) {

  const headersToRedact = ["authorization", "proxy-authorization", "cookie", "set-cookie"];

  const redactedHeaders: { [key: string]: any; } = { ...headers };

  Object.keys(headers).forEach((key: string) => {
    if(headersToRedact.includes(key.toLowerCase())) redactedHeaders[key] = '<REDACTED>'
  })

  return redactedHeaders;
}

export function abbreviateStrings(obj: any) {
  const objRet: any = {};

  for (let key in obj) {
    switch(typeof obj[key]) {
      case "string":
        objRet[key] = (obj[key].length < 80) ? obj[key] : obj[key].substring(0, 76) + "...";
        break;
      case "object":
        objRet[key] = abbreviateStrings(obj[key]);
        break;
      default:
        objRet[key] = obj[key];
        break;      
    }
  }

  return objRet;

}

export function errorFromUnknown(e: any): Error {
  if (e instanceof Error) return e;
  if (typeof e == "string") return new Error(e);
  if (typeof e == "number") return new Error(e.toString());
  if (typeof e?.message === 'string') return new Error(e.message);

  return new Error("Error of unknown shape")
}

export function errorMessageFromUnknown(e: any): string {
  return errorFromUnknown(e).toString();
}

export interface Logger {
  setSeverity(severity: LogSeverity): void;
  logDebug(message: string, jsonPayload?: any): void;
  logInfo(message: string, jsonPayload?: any): void;
  logNotice(message: string, jsonPayload?: any): void;
  logWarning(message: string, jsonPayload?: any): void;
  logError(message: string, jsonPayload?: any): void;
}

export class DefaultLoggerImpl implements Logger {
  private readonly logSettings: LogSettings;
  private readonly console: Console;

  constructor(logSettings: LogSettings = {
    severity: LogSeverity.DEFAULT,
    console
  }) {
    this.logSettings = logSettings;
    this.console = logSettings.console || console;
  }

  setSeverity(severity: LogSeverity) {
    this.logSettings.severity = severity;
  }

  logDebug(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.DEBUG) this.console.log(JSON.stringify({severity: "DEBUG", message, ...jsonPayload}))
  }
  logInfo(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.INFO) this.console.log(JSON.stringify({severity: "INFO", message, ...jsonPayload}))
  }
  logNotice(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.NOTICE) this.console.log(JSON.stringify({severity: "NOTICE", message, ...jsonPayload}))
  }
  logWarning(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.WARNING) this.console.warn(JSON.stringify({severity: "WARNING", message, ...jsonPayload}))
  }
  logError(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.ERROR) this.console.error(JSON.stringify({severity: "ERROR", message, ...jsonPayload}))
  }
}

export function createDefaultLogger() {
  return new DefaultLoggerImpl();
}

let logger: Logger;
export function getInstance() {
  if(!logger) logger = createDefaultLogger();
  return logger;
}

export function logDebug(message: string, jsonPayload?: any) {
  getInstance().logDebug(message, jsonPayload);
}

export function logInfo(message: string, jsonPayload?: any) {
  getInstance().logInfo(message, jsonPayload);
}

export function logNotice(message: string, jsonPayload?: any) {
  getInstance().logNotice(message, jsonPayload);
}

export function logWarning(message: string, jsonPayload?: any) {
  getInstance().logWarning(message, jsonPayload);
}

export function logError(message: string, jsonPayload?: any) {
  getInstance().logWarning(message, jsonPayload);
}

export function setSeverity(severity: LogSeverity) {
  getInstance().setSeverity(severity);
}
