export const ROUTES = {
  home: '/',

  authLogin: '/auth/login',
  authSignup: '/auth/sign-up',
  authForgotPassword: '/auth/forgot-password',
  authUpdatePassword: '/auth/update-password',
  authError: '/auth/error',
  authConfirm: '/auth/confirm',
  authSignupSuccess: '/auth/sign-up-success',
} as const;

export const DEFAULT_REDIRECTS = {
  authenticated: ROUTES.home,
  unauthenticated: ROUTES.authLogin,
  public: ROUTES.home,
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
export type RedirectKey = keyof typeof DEFAULT_REDIRECTS;
