import { describe, expect, it, vi } from "vitest";
import { 
  abbreviateStrings,
  DefaultLoggerImpl,
  errorFromUnknown,
  errorMessageFromUnknown,
  LogSeverity,
  redactHeaders
} from "../src/logger"
import assert from "node:assert";
import { Console } from "node:console";

describe('logger', () => {

  describe('redactHeaders - remove a few of the more common sources of credentials in the logs', () => {

    it('should redact the authorization header', () => {
      const headers = { "authorization": "Bearer token"} ;
      expect(redactHeaders(headers)).toEqual({ "authorization": "<REDACTED>"})
    })

    it('should redact the proxy-authorization header', () => {
      const headers = { "proxy-authorization": "Bearer token"} ;
      expect(redactHeaders(headers)).toEqual({ "proxy-authorization": "<REDACTED>"})
    })

    it('should redact the cookie header', () => {
      const headers = { "cookie": "credentials=something"} ;
      expect(redactHeaders(headers)).toEqual({ "cookie": "<REDACTED>"})
    })

    it('should redact the set-cookie header', () => {
      const headers = { "set-cookie": "credentials=something"} ;
      expect(redactHeaders(headers)).toEqual({ "set-cookie": "<REDACTED>"})
    })

    it('should be case insensitive', () => {
      const headers = { "Authorization": "Bearer token"} ;
      expect(redactHeaders(headers)).toEqual({ "Authorization": "<REDACTED>"})
    })

    it('should return non-redacted headers unmodified', () => {
      const headers = { "Content-Type": "text/xml" } ;
      expect(redactHeaders(headers)).toEqual({ "Content-Type": "text/xml" })

    })
  })

  describe('abbreviateStrings - make objects with a long strings somewhat more likely to fit into the Google Cloud Log records', () => {

    it('should abbreviate a long string in a shallow object', () => {
      expect(abbreviateStrings({
        foo: "01234567890123456789012345678901234567890123456789012345678901234567890123456789"
      })).toEqual({
        foo: "0123456789012345678901234567890123456789012345678901234567890123456789012345..."
      })
    })

    it('should abbreviate a long string deep in an object', () => {
      expect(abbreviateStrings({
        foo: {
          bar: {
            something: "01234567890123456789012345678901234567890123456789012345678901234567890123456789"
          }
        }
      })).toEqual({
        foo: {
          bar: {
            something: "0123456789012345678901234567890123456789012345678901234567890123456789012345..."
          }
        }
      })
    })

    it("should abbreviate multiple long strings in an object", () => {
      expect(abbreviateStrings({
        foo: "01234567890123456789012345678901234567890123456789012345678901234567890123456789",
        bar: "01234567890123456789012345678901234567890123456789012345678901234567890123456789"
      })).toEqual({
        foo: "0123456789012345678901234567890123456789012345678901234567890123456789012345...",
        bar: "0123456789012345678901234567890123456789012345678901234567890123456789012345..."
      })

    })

    it('should not abbreviate short strings in a shallow object', () => {
      expect(abbreviateStrings({foo: "bar"})).toStrictEqual({foo: "bar"})
    })

    it('should not abbreviate short strings deep in an object', () => {
      expect(abbreviateStrings({foo: { foo: { foo: "bar"}}})).toStrictEqual({foo: { foo: { foo: "bar"}}})
    })
  })

  describe('errorFromUnknown', () => {

    it('should turn a string into an Error object with that string as the message', () => {
      const error = errorFromUnknown("A string someone threw");
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual("A string someone threw")
    })

    it('should turn any object with a message string into an Error object with that message', () => {
      const error = errorFromUnknown({ message: "A kinda Error-like object someone threw" });
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual("A kinda Error-like object someone threw")
    })

    it('should turn an unknown object into an Error object', () => {
      const error = errorFromUnknown({ });
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual("Error of unknown shape")
    })

    it('should turn a number into an Error object with the number as the message', () => {
      const error = errorFromUnknown(3);
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual("3")
    })

    it('should return an Error object unmodified', () => {
      const error = errorFromUnknown(new Error("An Error someone threw"));
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toEqual("An Error someone threw")
    })

    it('should return a Node Error unmodified', () => {
      const error = errorFromUnknown(new assert.AssertionError({
        actual: 1,
        expected: 2,
        operator: 'strictEqual',
      }));
      expect(error).toBeInstanceOf(assert.AssertionError)
      expect(error.message).toBeDefined()
    })

    it('should return a web DOMException unmodified', () => {
      const error = errorFromUnknown(new DOMException("This is a DOMException"));
      expect(error).toBeInstanceOf(DOMException)
      expect(error.message).toEqual("This is a DOMException")
    })

    it('should return a custom Error unmodified', () => {
      class MyError extends Error {};

      const error = errorFromUnknown(new MyError("This is MY Error. There are many like it, but this one is mine."));
      expect(error).toBeInstanceOf(MyError)
      expect(error.message).toEqual("This is MY Error. There are many like it, but this one is mine.")
    })

  })

  describe('errorMessageFromUnknown', () => {

    it('should return a string with Error.prototype.toString() semantics', () => {
      expect(errorMessageFromUnknown("A string")).toEqual("Error: A string")
    })

    it('should turn any object with a message string into a string with Error.prototype.toString() semantics', () => {
      expect(errorMessageFromUnknown({ message: "A kinda Error-like object" })).toEqual("Error: A kinda Error-like object")
    })

    it('should turn an unknown object into a string with Error.prototype.toString() semantics', () => {
      expect(errorMessageFromUnknown({  })).toEqual("Error: Error of unknown shape")
    })

    it('should turn a number into a string with Error.prototype.toString() semantics', () => {
      expect(errorMessageFromUnknown(3)).toEqual("Error: 3")
    })

    it('should return an Error object toString() result', () => {
      expect(errorMessageFromUnknown(new Error("An Error"))).toEqual("Error: An Error")
    })

  })

  describe('DefaultLoggerImpl', () => {
    const mockConsole = {
      Console,
      assert: vi.fn(),
      clear: vi.fn(),
      count: vi.fn(),
      countReset: vi.fn(),
      debug: vi.fn(),
      dir: vi.fn(),
      dirxml: vi.fn(),
      error: vi.fn(),
      group: vi.fn(),
      groupCollapsed: vi.fn(),
      groupEnd: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      table: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      timeLog: vi.fn(),
      timeStamp: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn(),
      profile: vi.fn(),
      profileEnd: vi.fn(),
    };
    
    describe('logDebug', () => {

      const logger = new DefaultLoggerImpl({severity: LogSeverity.DEFAULT, console: mockConsole});

      it('should log a message when the logger is set to severity DEBUG', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.DEBUG);

        logger.logDebug("message");

        expect(mockConsole.log).toHaveBeenCalledWith("{\"severity\":\"DEBUG\",\"message\":\"message\"}")
      })

      it('should not log a message when the logger is set to severity INFO', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.INFO);

        logger.logDebug("message");

        expect(mockConsole.log).not.toHaveBeenCalled()
      })

    })

    describe('logInfo', () => {

      const logger = new DefaultLoggerImpl({severity: LogSeverity.DEFAULT, console: mockConsole});

      it('should log a message when the logger is set to severity DEBUG', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.DEBUG);

        logger.logInfo("message");

        expect(mockConsole.log).toHaveBeenCalledWith("{\"severity\":\"INFO\",\"message\":\"message\"}")
      })

      it('should log a message when the logger is set to severity INFO', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.INFO);

        logger.logInfo("message");

        expect(mockConsole.log).toHaveBeenCalledWith("{\"severity\":\"INFO\",\"message\":\"message\"}")
      })

      it('should not log a message when the logger is set to severity NOTICE', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.NOTICE);

        logger.logInfo("message");

        expect(mockConsole.log).not.toHaveBeenCalled()
      })
  
    })

    describe('logNotice', () => {
      const logger = new DefaultLoggerImpl({severity: LogSeverity.DEFAULT, console: mockConsole});

      it('should log a message when the logger is set to severity DEBUG', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.DEBUG);

        logger.logNotice("message");

        expect(mockConsole.log).toHaveBeenCalledWith("{\"severity\":\"NOTICE\",\"message\":\"message\"}")
      })

      it('should log a message when the logger is set to severity INFO', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.INFO);

        logger.logNotice("message");

        expect(mockConsole.log).toHaveBeenCalledWith("{\"severity\":\"NOTICE\",\"message\":\"message\"}")
      })

      it('should log a message when the logger is set to severity NOTICE', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.NOTICE);

        logger.logNotice("message");

        expect(mockConsole.log).toHaveBeenCalledWith("{\"severity\":\"NOTICE\",\"message\":\"message\"}")
      })

      it('should not log a message when the logger is set to severity WARNING', () => {
        mockConsole.log.mockRestore();
        logger.setSeverity(LogSeverity.WARNING);

        logger.logNotice("message");

        expect(mockConsole.log).not.toHaveBeenCalled()
      })

      it('should not log a warning when the logger is set to severity WARNING', () => {
        mockConsole.warn.mockRestore();
        logger.setSeverity(LogSeverity.WARNING);

        logger.logNotice("message");

        expect(mockConsole.warn).not.toHaveBeenCalled()
      })

    })

    describe('logWarning', () => {
      const logger = new DefaultLoggerImpl({severity: LogSeverity.DEFAULT, console: mockConsole});

      it('should log a warning when the logger is set to severity DEBUG', () => {
        mockConsole.warn.mockRestore();
        logger.setSeverity(LogSeverity.DEBUG);

        logger.logWarning("message");

        expect(mockConsole.warn).toHaveBeenCalledWith("{\"severity\":\"WARNING\",\"message\":\"message\"}")
      })

      it('should log a warning when the logger is set to severity INFO', () => {
        mockConsole.warn.mockRestore();
        logger.setSeverity(LogSeverity.INFO);

        logger.logWarning("message");

        expect(mockConsole.warn).toHaveBeenCalledWith("{\"severity\":\"WARNING\",\"message\":\"message\"}")
      })

      it('should log a warning when the logger is set to severity NOTICE', () => {
        mockConsole.warn.mockRestore();
        logger.setSeverity(LogSeverity.NOTICE);

        logger.logWarning("message");

        expect(mockConsole.warn).toHaveBeenCalledWith("{\"severity\":\"WARNING\",\"message\":\"message\"}")
      })

      it('should log a warning when the logger is set to severity WARNING', () => {
        mockConsole.warn.mockRestore();
        logger.setSeverity(LogSeverity.WARNING);

        logger.logWarning("message");

        expect(mockConsole.warn).toHaveBeenCalledWith("{\"severity\":\"WARNING\",\"message\":\"message\"}")
      })

      it('should not log a warning when the logger is set to severity ERROR', () => {
        mockConsole.warn.mockRestore();
        logger.setSeverity(LogSeverity.ERROR);

        logger.logWarning("message");

        expect(mockConsole.warn).not.toHaveBeenCalled()
      })

      it('should not log an error when the logger is set to severity ERROR', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.ERROR);

        logger.logWarning("message");

        expect(mockConsole.error).not.toHaveBeenCalled()
      })

    })

    describe('logError', () => {
      const logger = new DefaultLoggerImpl({severity: LogSeverity.DEFAULT, console: mockConsole});

      it('should log an error when the logger is set to severity DEBUG', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.DEBUG);

        logger.logError("message");

        expect(mockConsole.error).toHaveBeenCalledWith("{\"severity\":\"ERROR\",\"message\":\"message\"}")
      })

      it('should log an error when the logger is set to severity INFO', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.INFO);

        logger.logError("message");

        expect(mockConsole.error).toHaveBeenCalledWith("{\"severity\":\"ERROR\",\"message\":\"message\"}")
      })

      it('should log an error when the logger is set to severity NOTICE', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.NOTICE);

        logger.logError("message");

        expect(mockConsole.error).toHaveBeenCalledWith("{\"severity\":\"ERROR\",\"message\":\"message\"}")
      })

      it('should log an error when the logger is set to severity WARNING', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.WARNING);

        logger.logError("message");

        expect(mockConsole.error).toHaveBeenCalledWith("{\"severity\":\"ERROR\",\"message\":\"message\"}")
      })

      it('should log an error when the logger is set to severity ERROR', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.ERROR);

        logger.logError("message");

        expect(mockConsole.error).toHaveBeenCalledWith("{\"severity\":\"ERROR\",\"message\":\"message\"}")
      })

      it('should not log an error when the logger is set to severity CRITICAL - we reserve these for the runtime and lower layers', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.CRITICAL);

        logger.logError("message");

        expect(mockConsole.error).not.toHaveBeenCalled()
      })

      it('should not log an error when the logger is set to severity ALERT - we reserve these for the runtime and lower layers', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.ALERT);

        logger.logError("message");

        expect(mockConsole.error).not.toHaveBeenCalled()
      })

      it('should not log an error when the logger is set to severity EMERGENCY - we reserve these for the runtime and lower layers', () => {
        mockConsole.error.mockRestore();
        logger.setSeverity(LogSeverity.EMERGENCY);

        logger.logError("message");

        expect(mockConsole.error).not.toHaveBeenCalled()
      })

    })
  })
})

