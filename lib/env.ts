export const getEnvVar = (name: string): string => {
const value = process.env[name];
if (!value) {
throw new Error(Missing required environment variable: ${name});
}
return value;
};

export const getEnvVarWithDefault = (name: string, defaultValue: string): string => {
return process.env[name] || defaultValue;
};

export const getEnvVarAsNumber = (name: string): number => {
const value = process.env[name];
if (!value) {
throw new Error(Missing required environment variable: ${name});
}
const numValue = Number(value);
if (isNaN(numValue)) {
throw new Error(Environment variable ${name} is not a valid number: ${value});
}
return numValue;
};

export const getEnvVarAsNumberWithDefault = (name: string, defaultValue: number): number => {
const value = process.env[name];
if (!value) {
return defaultValue;
}
const numValue = Number(value);
if (isNaN(numValue)) {
return defaultValue;
}
return numValue;
};
