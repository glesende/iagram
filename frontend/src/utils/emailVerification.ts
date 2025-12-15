/**
 * Checks if a user has verified their email address
 * @param user - The user object (can be any type with email_verified_at field)
 * @returns true if email is verified, false otherwise
 */
export const isEmailVerified = (user: any): boolean => {
  if (!user) return false;
  return user.email_verified_at !== null && user.email_verified_at !== undefined;
};

/**
 * Gets a user-friendly message for why an action requires email verification
 * @param action - The action being attempted (like, follow, comment)
 * @returns A user-friendly message
 */
export const getVerificationRequiredMessage = (action: 'like' | 'follow' | 'comment'): string => {
  const actionMessages = {
    like: 'dar likes',
    follow: 'seguir IAnfluencers',
    comment: 'comentar posts'
  };

  return `Para ${actionMessages[action]}, necesitas verificar tu email primero.`;
};
