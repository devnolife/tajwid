type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, unknown>;
type LogWriter = (message: string) => void;

const SENSITIVE_KEY = /password|passwd|secret|token|authorization|cookie|api[-_]?key/i;

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitize(entry, seen),
    ]),
  );
}

export function createLogger(writer: LogWriter = console.log) {
  const log = (level: LogLevel, event: string, context: LogContext = {}) => {
    const safeContext = sanitize(context) as LogContext;
    writer(
      JSON.stringify({
        ...safeContext,
        timestamp: new Date().toISOString(),
        level,
        event,
      }),
    );
  };

  return {
    info: (event: string, context?: LogContext) => log("info", event, context),
    warn: (event: string, context?: LogContext) => log("warn", event, context),
    error: (event: string, context?: LogContext) => log("error", event, context),
  };
}

export const logger = createLogger(
  process.env.NODE_ENV === "test"
    ? () => undefined
    : (message) => console.log(message),
);
