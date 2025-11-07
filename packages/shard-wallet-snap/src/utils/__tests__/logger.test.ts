/**
 * Unit Tests: Logger Utility
 *
 * Tests for structured logging functionality
 */

import { Logger } from '../logger';

describe('Logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleDebugSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should create logger with context', () => {
      const logger = new Logger('TestContext');
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('debug', () => {
    it('should log debug message with correct format', () => {
      const logger = new Logger('TestContext');
      logger.debug('Test debug message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const call = consoleDebugSpy.mock.calls[0];

      // Check format: [timestamp] [DEBUG] [TestContext]
      expect(call[0]).toContain('[DEBUG]');
      expect(call[0]).toContain('[TestContext]');
      expect(call[1]).toBe('Test debug message');
    });

    it('should log debug message with additional arguments', () => {
      const logger = new Logger('TestContext');
      logger.debug('Test message', { key: 'value' }, 123);

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const call = consoleDebugSpy.mock.calls[0];

      expect(call[1]).toBe('Test message');
      expect(call[2]).toEqual({ key: 'value' });
      expect(call[3]).toBe(123);
    });

    it('should include ISO timestamp', () => {
      const logger = new Logger('TestContext');
      const beforeTime = new Date().toISOString().substring(0, 10); // Just the date part

      logger.debug('Test message');

      const call = consoleDebugSpy.mock.calls[0];
      expect(call[0]).toContain(beforeTime);
    });
  });

  describe('info', () => {
    it('should log info message with correct format', () => {
      const logger = new Logger('TestContext');
      logger.info('Test info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const call = consoleLogSpy.mock.calls[0];

      expect(call[0]).toContain('[INFO]');
      expect(call[0]).toContain('[TestContext]');
      expect(call[1]).toBe('Test info message');
    });

    it('should log info message with additional arguments', () => {
      const logger = new Logger('TestContext');
      logger.info('User action', { action: 'login', userId: 123 });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const call = consoleLogSpy.mock.calls[0];

      expect(call[1]).toBe('User action');
      expect(call[2]).toEqual({ action: 'login', userId: 123 });
    });
  });

  describe('warn', () => {
    it('should log warning message with correct format', () => {
      const logger = new Logger('TestContext');
      logger.warn('Test warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const call = consoleWarnSpy.mock.calls[0];

      expect(call[0]).toContain('[WARN]');
      expect(call[0]).toContain('[TestContext]');
      expect(call[1]).toBe('Test warning message');
    });

    it('should log warning with error object', () => {
      const logger = new Logger('TestContext');
      const error = new Error('Test error');
      logger.warn('Warning occurred', error);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const call = consoleWarnSpy.mock.calls[0];

      expect(call[1]).toBe('Warning occurred');
      expect(call[2]).toBe(error);
    });
  });

  describe('error', () => {
    it('should log error message with correct format', () => {
      const logger = new Logger('TestContext');
      logger.error('Test error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const call = consoleErrorSpy.mock.calls[0];

      expect(call[0]).toContain('[ERROR]');
      expect(call[0]).toContain('[TestContext]');
      expect(call[1]).toBe('Test error message');
    });

    it('should log error with error object', () => {
      const logger = new Logger('TestContext');
      const error = new Error('Critical failure');
      logger.error('Fatal error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const call = consoleErrorSpy.mock.calls[0];

      expect(call[1]).toBe('Fatal error occurred');
      expect(call[2]).toBe(error);
    });

    it('should log error with stack trace', () => {
      const logger = new Logger('TestContext');
      const error = new Error('Test error');
      logger.error('Error with stack', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const call = consoleErrorSpy.mock.calls[0];

      expect(call[2]).toHaveProperty('stack');
    });
  });

  describe('Multiple Loggers', () => {
    it('should maintain separate contexts for different loggers', () => {
      const logger1 = new Logger('Context1');
      const logger2 = new Logger('Context2');

      logger1.info('Message from logger 1');
      logger2.info('Message from logger 2');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy.mock.calls[0][0]).toContain('[Context1]');
      expect(consoleLogSpy.mock.calls[1][0]).toContain('[Context2]');
    });

    it('should support different log levels from different contexts', () => {
      const logger1 = new Logger('ServiceA');
      const logger2 = new Logger('ServiceB');

      logger1.debug('Debug from A');
      logger2.error('Error from B');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[ServiceA]');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ServiceB]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const logger = new Logger('TestContext');
      logger.info('');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][1]).toBe('');
    });

    it('should handle undefined arguments', () => {
      const logger = new Logger('TestContext');
      logger.info('Message', undefined);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][2]).toBeUndefined();
    });

    it('should handle null arguments', () => {
      const logger = new Logger('TestContext');
      logger.info('Message', null);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][2]).toBeNull();
    });

    it('should handle complex objects', () => {
      const logger = new Logger('TestContext');
      const complexObject = {
        nested: {
          deeply: {
            value: 'test',
            array: [1, 2, 3],
          },
        },
      };

      logger.info('Complex object', complexObject);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][2]).toEqual(complexObject);
    });

    it('should handle special characters in context', () => {
      const logger = new Logger('Test-Context_123');
      logger.info('Message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][0]).toContain('[Test-Context_123]');
    });

    it('should handle very long messages', () => {
      const logger = new Logger('TestContext');
      const longMessage = 'A'.repeat(1000);
      logger.info(longMessage);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy.mock.calls[0][1]).toBe(longMessage);
    });
  });
});
