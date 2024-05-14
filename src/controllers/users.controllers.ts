import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { AUTH_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/Auth.requests'
import {
  ChangePasswordReqBody,
  ForgotPasswordReqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import authService from '~/services/auth.services'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await userService.getMe(user_id)

  return res.json({
    message: USER_MESSAGES.GET_PROFILE_SUCCESS,
    result
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const payload = req.body
  const result = await userService.updateMe(user_id, payload)
  return res.json({
    message: USER_MESSAGES.UPDATE_PROFILE_SUCCESS,
    result
  })
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, status, email } = req.user as User
  const result = await userService.forgotPassword({ user_id: _id?.toString() as string, verify: status, email })
  res.json(result)
}

export const verifyForgotPasswordController = (req: Request, res: Response) => {
  return res.json({
    message: AUTH_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await userService.resetPassword({ user_id, password })
  return res.json(result)
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id, verify } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  if (user === null) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  const result = await authService.resendVerifyEmail(user_id, verify, user.email)

  return res.json(result)
}

export const verifyEmailController = async (req: Request, res: Response) => {
  const { _id: user_id } = req.user as User
  const result = await userService.verifyEmail(user_id as ObjectId)

  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const password = req.body.password
  const result = await userService.changePassword(user_id, password)

  return res.json(result)
}
