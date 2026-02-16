import { createLogger, format, transports } from 'winston';

// PII field names to redact
const PII_FIELDS = [
  'email', 'visitorEmail', 'attendeeEmail', 'notificationEmail',
  'name', 'visitorName', 'attendeeName', 'displayName',
  'phone', 'visitorPhone', 'phoneNumber',
  'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
  'secret', 'apiKey', 'privateKey',
  'address', 'ipAddress', 'streetAddress',
  'ssn', 'creditCard', 'cardNumber',
  'userid', 'clerkid', 'customerId', 'accountId'
];

// Mask email addresses
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.***';

  const maskedLocal = local.length > 2
    ? `${local[0]}***${local[local.length - 1]}`
    : `${local[0]}***`;

  const domainParts = domain.split('.');
  const maskedDomain = domainParts.map(part =>
    part.length > 2 ? `${part[0]}***` : '***'
  ).join('.');

  return `${maskedLocal}@${maskedDomain}`;
}

// Mask user IDs and similar identifiers
function maskId(id: string): string {
  if (id.length <= 8) return '***';
  return `${id.slice(0, 4)}***${id.slice(-4)}`;
}

// Mask phone numbers
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***-***-${digits.slice(-4)}`;
}

// Deep scan and redact PII from objects
function redactPII(data: any): any {
  if (typeof data === 'string') {
    // Check if string looks like email
    if (data.includes('@') && data.includes('.')) {
      return maskEmail(data);
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactPII(item));
  }

  if (data instanceof Error) {
    return {
      message: data.message,
      name: data.name,
      ...(isDev ? { stack: data.stack } : {}),
    };
  }

  if (data && typeof data === 'object') {
    const redacted: any = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Redact known PII fields
      if (PII_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        if (typeof value === 'string') {
          if (lowerKey.includes('email')) {
            redacted[key] = maskEmail(value);
          } else if (lowerKey.includes('phone')) {
            redacted[key] = maskPhone(value);
          } else if (lowerKey.includes('id') || lowerKey.includes('token')) {
            redacted[key] = maskId(value);
          } else {
            redacted[key] = '[REDACTED]';
          }
        } else {
          redacted[key] = '[REDACTED]';
        }
      } else {
        redacted[key] = redactPII(value);
      }
    }

    return redacted;
  }

  return data;
}

// Create logger instance
const isDev = process.env.NODE_ENV === 'development';

export const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const redactedMeta = Object.keys(meta).length > 0
        ? ` ${JSON.stringify(redactPII(meta))}`
        : '';
      return `${timestamp} [${level.toUpperCase()}] ${message}${redactedMeta}`;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const redactedMeta = Object.keys(meta).length > 0
            ? ` ${JSON.stringify(redactPII(meta), null, 2)}`
            : '';
          return `${timestamp} ${level}: ${message}${redactedMeta}`;
        })
      ),
    }),
  ],
});

// Convenience methods
export const log = {
  debug: (message: string, meta?: any) => logger.debug(message, redactPII(meta || {})),
  info: (message: string, meta?: any) => logger.info(message, redactPII(meta || {})),
  warn: (message: string, meta?: any) => logger.warn(message, redactPII(meta || {})),
  error: (message: string, error?: Error | any) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: isDev ? error.stack : undefined });
    } else {
      logger.error(message, redactPII(error || {}));
    }
  },
};
