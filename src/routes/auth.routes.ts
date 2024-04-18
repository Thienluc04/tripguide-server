import { Router } from 'express'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resetPasswordController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator
} from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

const authRouter = Router()

authRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

authRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

authRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

authRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

authRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

authRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

export default authRouter