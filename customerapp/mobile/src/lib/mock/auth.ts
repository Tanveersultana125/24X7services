import { USER } from './account'

/**
 * The accounts the demo can sign in to. One exists already, so "log in" has
 * something to log in to; sign-up adds more for as long as the app is open.
 *
 * Passwords sit here in plain text because nothing here is real. The backend
 * swap replaces this whole file with Firebase Auth, which never shows a
 * password to anyone.
 */
export interface MockAccount {
  uid: string
  email: string
  password: string
  /** Empty until the customer gives one on the profile step. */
  name: string
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  { uid: USER.uid, email: USER.email, password: 'password123', name: USER.name },
]

/** Who "Continue with Google" signs in as. Google hands over a name, so there is no profile step for them. */
export const GOOGLE_ACCOUNT = {
  uid: 'demo-google',
  email: 'demo.customer@gmail.com',
  name: 'Rahul Verma',
}
