import { authStore, type AuthUser } from '@/lib/authStore'
import { GOOGLE_ACCOUNT, MOCK_ACCOUNTS, type MockAccount } from '@/lib/mock/auth'
import { mockRequest } from '@/lib/mock/request'

/**
 * Signing in: Google, or an email and a password. No phone number and no
 * one-time code anywhere.
 *
 * Each function is what the backend swap replaces with Firebase Auth
 * (signInWithCredential for Google, signInWithEmailAndPassword and friends for
 * email). Until then they check against lib/mock/auth and start a mock
 * session in the auth store, so every screen that reads `useAuth()` sees a
 * signed-in customer exactly as it will with Firebase.
 *
 * Failures throw an `AuthError` whose message is already fit to show.
 */

export type AuthErrorCode =
  | 'invalid-email'
  | 'weak-password'
  | 'email-in-use'
  | 'no-account'
  | 'wrong-password'
  | 'cancelled'

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/** Shortest password sign-up accepts; Firebase's own floor is six. */
export const MIN_PASSWORD = 8

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Why an email will not do, or undefined when it will. */
export function emailProblem(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email'
  return EMAIL.test(email.trim()) ? undefined : 'That does not look like an email address'
}

/** Why a new password will not do, or undefined when it will. */
export function passwordProblem(password: string): string | undefined {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use letters and at least one number'
  return undefined
}

function sessionFor(account: Pick<MockAccount, 'uid' | 'email' | 'name'>): AuthUser {
  return { uid: account.uid, email: account.email, displayName: account.name || null, phoneNumber: null, photoURL: null }
}

function find(email: string): MockAccount | undefined {
  const key = email.trim().toLowerCase()
  return MOCK_ACCOUNTS.find((account) => account.email.toLowerCase() === key)
}

/** "Continue with Google". */
export async function signInWithGoogle(): Promise<AuthUser> {
  const user = await mockRequest(sessionFor(GOOGLE_ACCOUNT))
  authStore.setMockUser(user)
  return user
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const problem = emailProblem(email)
  if (problem) throw new AuthError('invalid-email', problem)
  const account = await mockRequest(find(email))
  if (!account) throw new AuthError('no-account', 'There is no account with that email. Create one instead?')
  if (account.password !== password) throw new AuthError('wrong-password', 'That password is not right. Try again, or reset it.')
  const user = sessionFor(account)
  authStore.setMockUser(user)
  return user
}

/** Creates the account and signs in to it. The name comes after, on the profile step. */
export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  const emailIssue = emailProblem(email)
  if (emailIssue) throw new AuthError('invalid-email', emailIssue)
  const passwordIssue = passwordProblem(password)
  if (passwordIssue) throw new AuthError('weak-password', passwordIssue)
  if (await mockRequest(find(email))) {
    throw new AuthError('email-in-use', 'An account with that email already exists. Log in instead?')
  }
  const account: MockAccount = { uid: `demo-${Date.now()}`, email: email.trim(), password, name: '' }
  MOCK_ACCOUNTS.push(account)
  const user = sessionFor(account)
  authStore.setMockUser(user)
  return user
}

/**
 * Sends the reset link. Resolves whether or not the email has an account, so
 * the screen cannot be used to find out who is a customer.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const problem = emailProblem(email)
  if (problem) throw new AuthError('invalid-email', problem)
  await mockRequest(undefined)
}

/** True once the signed-in customer has a name, so the profile step can be skipped. */
export function hasName(user: AuthUser | null): boolean {
  return Boolean(user?.displayName?.trim())
}

/** Saves the name given on the profile step, and puts it on the session. */
export async function saveProfileName(user: AuthUser, name: string): Promise<AuthUser> {
  const trimmed = name.trim()
  await mockRequest(undefined)
  const account = MOCK_ACCOUNTS.find((a) => a.uid === user.uid)
  if (account) account.name = trimmed
  const next = { ...user, displayName: trimmed }
  authStore.setMockUser(next)
  return next
}
