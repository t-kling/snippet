/**
 * Clean tracking parameters from URLs
 * Removes common tracking parameters like utm_*, fbclid, gclid, etc.
 */
function cleanUrl(url) {
  try {
    const urlObj = new URL(url);
    const paramsToRemove = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'msclkid',
      'ref',
      'referrer',
      'source',
      '_ga',
      'mc_cid',
      'mc_eid'
    ];

    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Truncate URL for display (keep first 60 chars)
 */
function truncateUrl(url, maxLength = 60) {
  if (url.length <= maxLength) {
    return url;
  }
  return url.substring(0, maxLength) + '...';
}

export { cleanUrl, truncateUrl };
