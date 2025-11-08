/**
 * Device detection utilities
 */

// Cache for iOS detection to avoid repeated checks
let _isIOSCache: boolean | null = null;
let _isIOSLogged = false;

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detect if the current platform is iOS (iPhone/iPad)
 * Handles the case where iPhone user agents contain "Mac OS X"
 * Uses caching to avoid repeated checks
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Return cached result if available
  if (_isIOSCache !== null) {
    return _isIOSCache;
  }

  const { userAgent } = navigator;

  // Check for actual iOS devices first (iPhone/iPad/iPod)
  const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);

  if (!isIOSDevice) {
    if (!_isIOSLogged) {
      // Non-iOS platform detected
      _isIOSLogged = true;
    }
    _isIOSCache = false;
    return false;
  }

  // Check if it's actually macOS (not iOS)
  // Modern iPhones report as "Mac OS X" in user agent but are still iOS
  const isMacOS = /Mac OS X/.test(userAgent) && !/iPhone|iPad|iPod/.test(userAgent);

  if (isMacOS) {
    if (!_isIOSLogged) {
      // macOS detected - not iOS
      _isIOSLogged = true;
    }
    _isIOSCache = false;
    return false;
  }

  // If it has iPhone/iPad/iPod in user agent, it's iOS regardless of Mac OS X
  const result = isIOSDevice && !('MSStream' in window);

  if (!_isIOSLogged) {
    if (result) {
      // iOS detected
    } else {
      // Non-iOS platform detected
    }
    _isIOSLogged = true;
  }

  _isIOSCache = result;
  return result;
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
};

export const isDesktop = (): boolean => {
  return !isMobile();
};

export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

