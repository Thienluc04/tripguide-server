export const COMMON_MESSAGES = {
  VALIDATION_ERROR: 'Validation error'
} as const

export const AUTH_MESSAGES = {
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_NOT_EXIST: 'Refresh token not exist',
  REFRESH_TOKEN_MUST_BE_A_STRING: 'Refresh token must be a string',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  INVALID_FORGOT_PASSWORD_TOKEN: 'Invalid forgot password token',
  GET_NEW_TOKENS_SUCCESS: 'Get new tokens success'
} as const

export const USER_MESSAGES = {
  NAME_IS_REQUIRED: 'Name is required',
  NAME_LENGTH_MUST_BE_FROM_6_TO_100: 'Name length must be from 6 to 100',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_ALREADY_EXIST: 'Email already exist',
  EMAIL_DOES_NOT_EXIST: 'Email does not exist',
  PHONE_NUMBER_MUST_BE_A_STRING: 'Phone number must be a string',
  PHONE_NUMBER_INVALID: 'Phone number invalid',
  PHONE_NUMBER_ALREADY_EXIST: 'Phone number already exist',
  AVATAR_IMAGE_MUST_BE_A_STRING: 'Avatar image must be a string',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50',
  PASSWORD_MUST_BE_STRONG: 'Password must be 6-50 characters and contain at least 1 lowercase, 1 number',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm password length must be from 6 to 50',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must be 6-50 characters and contain at least 1 lowercase, 1 number',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME: 'Confirm password must be the same',
  REGISTER_SUCCESS: 'Register success',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password incorrect',
  LOGIN_SUCCESS: 'Login success',
  LOGOUT_SUCCESS: 'Logout success',
  CHECK_EMAIL_TO_FORGOT_PASSWORD: 'Check email to forgot password',
  USER_NOT_FOUND: 'User not found',
  RESET_PASSWORD_SUCCESS: 'Reset password success'
} as const
