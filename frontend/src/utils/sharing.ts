/**
 * Generates a trackable share URL with UTM parameters for analytics
 *
 * @param postId - The ID of the post being shared
 * @param ianfluencerUsername - The username of the IAnfluencer who created the post
 * @param platform - The platform where the post is being shared
 * @returns A URL with UTM tracking parameters
 */
export function generateTrackableShareUrl(
  postId: string,
  ianfluencerUsername: string,
  platform: 'twitter' | 'facebook' | 'whatsapp' | 'webshare' | 'clipboard'
): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    utm_source: platform,
    utm_medium: 'social',
    utm_campaign: 'user_share',
    utm_content: `post_${postId}`,
    utm_term: `ianfluencer_${ianfluencerUsername}`,
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Extracts UTM parameters from the current URL
 *
 * @returns Object containing UTM parameters or null if none are present
 */
export function extractUTMParameters(): {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
} | null {
  const searchParams = new URLSearchParams(window.location.search);

  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');
  const utmContent = searchParams.get('utm_content');
  const utmTerm = searchParams.get('utm_term');

  // Only return if at least utm_source exists
  if (!utmSource) {
    return null;
  }

  return {
    source: utmSource,
    medium: utmMedium || '',
    campaign: utmCampaign || '',
    content: utmContent || '',
    term: utmTerm || '',
  };
}

/**
 * Stores UTM parameters in sessionStorage for later tracking
 *
 * @param utmParams - UTM parameters to store
 */
export function storeUTMParameters(utmParams: {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}): void {
  sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
}

/**
 * Retrieves stored UTM parameters from sessionStorage
 *
 * @returns Stored UTM parameters or null if none exist
 */
export function getStoredUTMParameters(): {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
} | null {
  const stored = sessionStorage.getItem('utm_params');
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
