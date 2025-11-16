import { logInfo, logWarning } from './logging';

/**
 * Check robots.txt for a given URL
 */
export async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
    
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      // If robots.txt doesn't exist, assume allowed
      return true;
    }

    const robotsTxt = await response.text();
    
    // Simple check for "Disallow: /"
    // This is a basic implementation - a full parser would be more complex
    const lines = robotsTxt.split('\n');
    let userAgentMatch = false;
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('user-agent:')) {
        userAgentMatch = trimmed.includes('*');
      }
      
      if (userAgentMatch && trimmed === 'disallow: /') {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logWarning('Error checking robots.txt, assuming allowed', error);
    return true;
  }
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string, domain?: string): string[] {
  // RFC 5322 simplified email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  
  // Filter unique emails
  const uniqueEmails = [...new Set(emails)];
  
  // If domain provided, prioritize emails from that domain
  if (domain) {
    const domainEmails = uniqueEmails.filter(email => 
      email.toLowerCase().includes(domain.toLowerCase())
    );
    
    if (domainEmails.length > 0) {
      return domainEmails.slice(0, 3);
    }
  }
  
  // Prioritize common business emails
  const priority = ['info@', 'contact@', 'hello@', 'support@', 'sales@'];
  const prioritized = uniqueEmails.sort((a, b) => {
    const aIndex = priority.findIndex(p => a.toLowerCase().startsWith(p));
    const bIndex = priority.findIndex(p => b.toLowerCase().startsWith(p));
    
    if (aIndex !== -1 && bIndex === -1) return -1;
    if (aIndex === -1 && bIndex !== -1) return 1;
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    return 0;
  });
  
  return prioritized.slice(0, 3);
}

/**
 * Fetch website and extract emails
 */
export async function enrichWithEmail(website: string, domain?: string): Promise<string[]> {
  try {
    // Check robots.txt first
    const allowed = await checkRobotsTxt(website);
    if (!allowed) {
      logInfo(`Robots.txt disallows scraping for ${website}`);
      return [];
    }

    // Fetch website content
    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProspectorBot/1.0)'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return [];
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      logInfo(`Skipping non-HTML content for ${website}`);
      return [];
    }

    // Read limited content (100KB max)
    const text = await response.text();
    const limitedText = text.substring(0, 100000);

    // Extract emails
    const emails = extractEmails(limitedText, domain);
    
    if (emails.length > 0) {
      logInfo(`Found ${emails.length} emails for ${website}`);
    }

    return emails;
  } catch (error) {
    logWarning(`Error enriching ${website}`, error);
    return [];
  }
}
