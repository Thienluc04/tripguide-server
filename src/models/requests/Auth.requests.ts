import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserStatus } from '~/constants/enum'

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserStatus
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

export interface RefreshTokenReqBody {
  refresh_token: string
}
