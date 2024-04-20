import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enum'

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface RegisterReqBody {
  name: string
  email: string
  password: string
}

export interface LoginReqBody {
  email: string
  password: string
}

export interface LogoutReqBody {
  refresh_token: string
}

export interface ForgotPasswordReqBody {
  email: string
}

export interface ResetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface RefreshTokenReqBody {
  refresh_token: string
}
