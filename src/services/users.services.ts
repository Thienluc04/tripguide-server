import { ObjectId } from 'mongodb'
import { TokenType, UserStatus } from '~/constants/enum'
import { USER_MESSAGES } from '~/constants/messages'
import { RegisterReqBody } from '~/models/requests/User.requests'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import databaseService from './database.services'

class UserService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }

  private signRefreshTokenWithExpires({
    user_id,
    verify,
    remainingSeconds
  }: {
    user_id: string
    verify: UserStatus
    remainingSeconds: number
  }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: `${remainingSeconds}s` // Set remaining seconds from old refresh token
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }

  private async signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private async signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        _id: user_id,
        email: payload.email,
        name: payload.name,
        email_verify_token,
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserStatus.Unverified
    })

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id,
        token: refresh_token
      })
    )
    console.log('email_verify_token:', email_verify_token)

    return {
      access_token,
      refresh_token
    }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({ user_id, verify })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })

    return {
      message: USER_MESSAGES.LOGOUT_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            forgot_password_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    console.log('forgot_password_token:', forgot_password_token)

    return {
      message: USER_MESSAGES.CHECK_EMAIL_TO_FORGOT_PASSWORD
    }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])

    return {
      message: USER_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }

  async refreshToken({
    user_id,
    expires,
    verify,
    old_refresh_token
  }: {
    user_id: string
    expires: number
    verify: UserStatus
    old_refresh_token: string
  }) {
    // Calculate remaining seconds from old expires
    const remainingSeconds = expires - Math.floor(Date.now() / 1000)

    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshTokenWithExpires({ user_id, verify, remainingSeconds })
    ])

    await databaseService.refreshTokens.deleteOne({ token: old_refresh_token })

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token })
    )

    return {
      access_token,
      refresh_token
    }
  }
}

const userService = new UserService()
export default userService
