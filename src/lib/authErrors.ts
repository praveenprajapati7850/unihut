/**
 * Parses Firebase Auth error codes into human-friendly, informative error messages
 * as requested for hackathon usability and error resilience.
 */
export function getFriendlyAuthErrorMessage(
  error: any,
  provider: 'email' | 'google' = 'email',
  action: 'login' | 'register' = 'register'
): { message: string; isConfigError: boolean; consoleUrl?: string } {
  const code = error?.code || '';
  const rawMsg = error?.message || '';

  // Firebase project ID from config
  const projectId = 'emergent-province-vpthm';
  const consoleProvidersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;

  if (code === 'auth/operation-not-allowed' || rawMsg.includes('operation-not-allowed')) {
    if (provider === 'email') {
      return {
        message:
          'Email & Password provider is currently disabled in your Firebase project. Please enable Email/Password under Firebase Console → Authentication → Sign-in method.',
        isConfigError: true,
        consoleUrl: consoleProvidersUrl,
      };
    } else {
      return {
        message:
          'Google sign-in is not enabled yet. Please use university email and password or enable Google Sign-In in Firebase Console → Authentication → Sign-in method.',
        isConfigError: true,
        consoleUrl: consoleProvidersUrl,
      };
    }
  }

  if (code === 'auth/invalid-email') {
    return {
      message: 'Please enter a valid university email address.',
      isConfigError: false,
    };
  }

  if (code === 'auth/weak-password') {
    return {
      message: 'Password must contain at least 6 characters.',
      isConfigError: false,
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      message: 'An account with this email already exists. Please sign in.',
      isConfigError: false,
    };
  }

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found'
  ) {
    return {
      message: 'Incorrect email or password. Please verify your credentials.',
      isConfigError: false,
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      message:
        'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.',
      isConfigError: false,
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      message: 'Sign-in window was closed before completion. Please try again.',
      isConfigError: false,
    };
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return {
      message:
        'An account already exists with this email address using a different sign-in method.',
      isConfigError: false,
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      isConfigError: false,
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      message: 'Too many attempts. Access to this account has been temporarily disabled. Please reset password or try again later.',
      isConfigError: false,
    };
  }

  // Fallback cleanly stripped of internal prefixes
  const clean = rawMsg.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)\.?/, '').trim();
  return {
    message: clean || 'Authentication failed. Please check your details and try again.',
    isConfigError: false,
  };
}
