import { getEnvVarWithDefault } from './env';
import { blue, yellow, red, green } from 'colorette';

const LOG_LEVEL = getEnvVarWithDefault('LOG_LEVEL', 'info');

const shouldLog = (level: string): boolean => {
const levels = ['error', 'warn', 'info', 'debug'];
return levels.indexOf(level) <= levels.indexOf(LOG_LEVEL);
};

export const logging = {
info: (message: string, ...args: any[]): void => {
if (shouldLog('info')) {
console.log(${blue('[INFO]')} ${new Date().toISOString()} - ${message}, ...args);
}
},

warn: (message: string, ...args: any[]): void => {
if (shouldLog('warn')) {
console.log(${yellow('[WARN]')} ${new Date().toISOString()} - ${message}, ...args);
}
},

error: (message: string, ...args: any[]): void => {
if (shouldLog('error')) {
console.log(${red('[ERROR]')} ${new Date().toISOString()} - ${message}, ...args);
}
},

debug: (message: string, ...args: any[]): void => {
if (shouldLog('debug')) {
console.log(${green('[DEBUG]')} ${new Date().toISOString()} - ${message}, ...args);
}
}
};
