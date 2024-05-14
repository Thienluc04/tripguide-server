import { NextFunction, Request, Response } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { Language, UserGender, UserStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { AUTH_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/Auth.requests'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { validate } from '~/services/validation'
import { verifyToken } from '~/utils/jwt'
import { confirmPasswordSchema, passwordSchema, nameSchema } from './auth.middleware'
import { hashPassword } from '~/utils/crypto'

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: AUTH_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })

        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorWithStatus({
            message: USER_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: AUTH_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        throw error
      }
      return true
    }
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGES.IMAGE_URL_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USER_MESSAGES.IMAGE_URL_LENGTH
  }
}

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            if (user === null) {
              throw new Error(USER_MESSAGES.EMAIL_DOES_NOT_EXIST)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

export const verifyEmailValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new Error(USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED)
            }

            const user = await databaseService.users.findOne({ email_verify_token: value })
            if (user === null) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload

  if (verify !== UserStatus.Verified) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_MUST_BE_VERIFIED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      email: {
        optional: true,
        isEmail: {
          errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayload
            const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
            if (value !== user?.email) {
              const isEmailExist = await userService.checkEmailExist(value)
              if (isEmailExist) {
                throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXIST)
              }
            }
            return true
          }
        }
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      street_address: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.STREET_ADDRESS_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.STREET_ADDRESS_LENGTH
        }
      },
      live_in: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.LIVE_IN_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.LIVE_IN_LENGTH
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGES.WEBSITE_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USER_MESSAGES.WEBSITE_LENGTH
        }
      },
      phone_number: {
        optional: true,
        isMobilePhone: {
          errorMessage: USER_MESSAGES.PHONE_NUMBER_INVALID
        },
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayload
            const currentUser = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
            if (currentUser?.phone_number !== value) {
              if (value.length < 10 || value.length > 11) {
                throw Error(USER_MESSAGES.PHONE_NUMBER_INVALID)
              }

              const user = await databaseService.users.findOne({ phone_number: value })
              if (user) {
                throw Error(USER_MESSAGES.PHONE_NUMBER_ALREADY_EXIST)
              }
            }
            return true
          }
        }
      },
      gender: {
        optional: true,
        isIn: {
          options: [Object.values(UserGender)]
        },
        errorMessage: USER_MESSAGES.GENDER_INVALID
      },
      language: {
        optional: true,
        isIn: {
          options: [Object.values(Language)]
        },
        errorMessage: USER_MESSAGES.LANGUAGE_INVALID
      },
      avatar_image: imageSchema
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayload

            const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
            if (user?.password !== hashPassword(value)) {
              throw new Error(USER_MESSAGES.PASSWORD_INCORRECT)
            }

            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)
