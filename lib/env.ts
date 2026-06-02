// Server-only Hermes endpoints. These are read from the environment so the same
// build works whether your Pi is reached by raw IP or a DuckDNS hostname.
export const HERMES_API_URL =
  process.env.HERMES_API_URL || 'http://104.229.7.78:8642';

export const HERMES_CONFIG_URL =
  process.env.HERMES_CONFIG_URL || 'http://104.229.7.78:8643';

export const HERMES_CONFIG_KEY = process.env.HERMES_CONFIG_KEY || 'changeme';
