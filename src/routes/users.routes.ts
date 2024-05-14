import { Router } from 'express'

import {
  changePasswordController,
  forgotPasswordController,
  getMeController,
  resendVerifyEmailController,
  resetPasswordController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middleware'
import {
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyEmailValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

const userRouter = Router()

userRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

userRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  wrapRequestHandler(updateMeController)
)

userRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

userRouter.post('/verify-email', verifyEmailValidator, wrapRequestHandler(verifyEmailController))

userRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

userRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

userRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

userRouter.post(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default userRouter
