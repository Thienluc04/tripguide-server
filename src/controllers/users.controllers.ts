import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { AUTH_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import {
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await userService.register(req.body)
  return res.json({
    message: USER_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await userService.login({ user_id: user_id.toString(), verify: user.status })
  return res.json({
    message: USER_MESSAGES.LOGIN_SUCCESS,
    result: { ...result, avatar: user.avatar_image, name: user.name }
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await userService.logout(refresh_token)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, status } = req.user as User
  const result = await userService.forgotPassword({ user_id: _id?.toString() as string, verify: status })
  res.json(result)
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

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { user_id, exp } = req.decoded_refresh_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  const { refresh_token } = req.body

  if (user === null) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
  const result = await userService.refreshToken({
    user_id,
    expires: exp as number,
    verify: user.status,
    old_refresh_token: refresh_token
  })

  return res.json({
    message: AUTH_MESSAGES.GET_NEW_TOKENS_SUCCESS,
    result
  })
}
