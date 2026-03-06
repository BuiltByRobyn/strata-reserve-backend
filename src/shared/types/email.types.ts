export interface WelcomeEmailParams {
  to: string;
  firstName: string;
  loginLink?: string;
}

export interface NewStrataEmailParams {
  strataPlan: string;
  complexName?: string;
  town?: string;
  province?: string;
}
