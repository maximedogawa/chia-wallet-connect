type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface Logger {
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  trace: (message: string, ...args: unknown[]) => void;
  child: (childContext: string) => Logger;
}

const LOG_LEVEL: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel;
const ENABLE_LOGS = process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true' || process.env.NODE_ENV !== 'production';

const createLogger = (context: string): Logger => {
  const emptyLogger: Logger = {
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    child: () => emptyLogger,
  };

  if (!ENABLE_LOGS) {
    return emptyLogger;
  }

  const shouldLog = (level: LogLevel): boolean => {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
    };
    return levels[level] <= levels[LOG_LEVEL];
  };

  const formatMessage = (message: string, ...args: unknown[]): string => {
    const timestamp = new Date().toISOString();
    const contextPrefix = `[${context}]`;
    return `${timestamp} ${contextPrefix} ${message}`;
  };

  return {
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error')) {
        // eslint-disable-next-line no-console
        console.error(formatMessage(message), ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn')) {
        // eslint-disable-next-line no-console
        console.warn(formatMessage(message), ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info')) {
        // eslint-disable-next-line no-console
        console.info(formatMessage(message), ...args);
      }
    },
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug')) {
        // eslint-disable-next-line no-console
        console.debug(formatMessage(message), ...args);
      }
    },
    trace: (message: string, ...args: unknown[]) => {
      if (shouldLog('trace')) {
        // eslint-disable-next-line no-console
        console.trace(formatMessage(message), ...args);
      }
    },
    child: (childContext: string) => createLogger(`${context}:${childContext}`),
  };
};

export { createLogger };
export type { LogLevel };

