import { logging } from './logging';

// Simple RFC5322-like email regex
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Z|a-z]{2,}\b/g;

interface RobotsTxtResult {
allowed: boolean;
delay?: number; // Crawl-delay in seconds
}

export const checkRobotsTxt = async (baseUrl: string): Promise<RobotsTxtResult> => {
try {
const robotsUrl = new URL('/robots.txt', baseUrl).href;
const response = await fetch(robotsUrl, {
method: 'GET',
headers: {
'User-Agent': '*'
},
signal: AbortSignal.timeout(5000) // 5 second timeout
});

if (!response.ok) {
// If robots.txt doesn't exist or is inaccessible, assume allowed
return { allowed: true };
}

const robotsTxt = await response.text();
const lines = robotsTxt.split('\n');

let userAgentMatch = false;
let allowed = true; // Default to allowed if no rules found
let delay: number | undefined;

for (const line of lines) {
const trimmedLine = line.trim();

// Check user agent
if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
const userAgent = trimmedLine.substring(10).trim();
if (userAgent === '*' || userAgent === '*') {
userAgentMatch = true;
} else {
userAgentMatch = false;
}
}

// Only process rules that match our user agent
if (userAgentMatch) {
// Check disallow
if (trimmedLine.toLowerCase().startsWith('disallow:')) {
const path = trimmedLine.substring(9).trim();
if (path === '/') {
allowed = false;
} else if (path === '' || path === '/') {
// Empty disallow means allowed
allowed = true;
}
}

// Check allow
if (trimmedLine.toLowerCase().startsWith('allow:')) {
const path = trimmedLine.substring(6).trim();
if (path === '/' || path === '') {
allowed = true;
}
}

// Check crawl delay
if (trimmedLine.toLowerCase().startsWith('crawl-delay:')) {
const delayValue = parseFloat(trimmedLine.substring(12).trim());
if (!isNaN(delayValue)) {
delay = delayValue;
}
}
}
}

return { allowed, delay };
} catch (error) {
logging.warn(Failed to fetch robots.txt for ${baseUrl}:, error);
// If we can't fetch robots.txt, assume allowed
return { allowed: true };
}
};

export const extractEmailsFromWebsite = async (websiteUrl: string): Promise<string[]> => {
if (!websiteUrl) return [];

try {
// First check robots.txt
const robotsResult = await checkRobotsTxt(websiteUrl);
if (!robotsResult.allowed) {
logging.info(Robots.txt disallows scraping ${websiteUrl});
return [];
}

// Add delay if specified in robots.txt
if (robotsResult.delay) {
await sleep(robotsResult.delay * 1000);
}

// Fetch the website content
const response = await fetch(websiteUrl, {
method: 'GET',
headers: {
'User-Agent': 'Mozilla/5.0 (compatible; DataEnricher/1.0)'
},
signal: AbortSignal.timeout(5000), // 5 second timeout
// Limit response size to 100KB
size: 100 * 1024
});

if (!response.ok) {
logging.warn(`Failed to fetch website ${websiteUrl}: ${response.status}`);
return [];
}

const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('text/html')) {
logging.info(`Skipping non-HTML content for ${websiteUrl}: ${contentType}`);
return [];
}

const html = await response.text();

// Extract emails
const emails = html.match(EMAIL_REGEX) || [];

// Filter for business domain emails
const websiteDomain = new URL(websiteUrl).hostname.toLowerCase();
const businessEmails = emails.filter(email => {
const emailDomain = email.split('@')[1].toLowerCase();
return emailDomain === websiteDomain;
});

// Deduplicate and limit to 3
const uniqueEmails = [...new Set(businessEmails)].slice(0, 3);

// Prefer info@, contact@, hello@ etc. if available
const preferredEmails = prioritizeEmails(uniqueEmails);

return preferredEmails;
} catch (error) {
logging.warn(Error extracting emails from ${websiteUrl}:, error);
return [];
}
};

// Prioritize common business email addresses
function prioritizeEmails(emails: string[]): string[] {
if (emails.length <= 1) return emails;

const preferredOrder = ['info@', 'contact@', 'hello@', 'support@', 'sales@', 'admin@'];

return emails.sort((a, b) => {
const aIndex = preferredOrder.findIndex(pref => a.startsWith(pref));
const bIndex = preferredOrder.findIndex(pref => b.startsWith(pref));

// If both are in preferred list, sort by preference
if (aIndex !== -1 && bIndex !== -1) {
return aIndex - bIndex;
}

// If only one is in preferred list, prioritize it
if (aIndex !== -1) return -1;
if (bIndex !== -1) return 1;

// Otherwise keep original order
return 0;
});
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
