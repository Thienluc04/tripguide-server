import { ObjectId } from 'mongodb'
import { TokenType, UserStatus } from '~/constants/enum'
import { USER_MESSAGES } from '~/constants/messages'
import { RegisterReqBody } from '~/models/requests/Auth.requests'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import databaseService from './database.services'
import axios from 'axios'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { sendVerifyRegisterEmail } from '~/utils/email'

class AuthService {
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

    // Send email by AWS
    await sendVerifyRegisterEmail(payload.email, email_verify_token)

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string, verify: UserStatus, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify })

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    await sendVerifyRegisterEmail(email, email_verify_token)

    return {
      message: USER_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
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

  async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data as {
      access_token: string
      id_token: string
    }
  }

  async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data as {
      id: string
      email: string
      verified_email: string
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oauthGoogle(code: string) {
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const user = await databaseService.users.findOne({ email: userInfo.email })
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.status
      })
      await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: user._id, token: refresh_token }))

      return {
        access_token,
        refresh_token,
        name: user.name,
        avatar: user.avatar_image
      }
    } else {
      // Random string password
      const password = Math.random().toString(36).substring(2, 15)

      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        password
      })

      await databaseService.users.updateOne(
        { email: userInfo.email },
        {
          $set: {
            avatar_image: userInfo.picture
          },
          $currentDate: {
            updated_at: true
          }
        }
      )

      return {
        ...data,
        name: userInfo.name,
        avatar: userInfo.picture
      }
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })

    return {
      message: USER_MESSAGES.LOGOUT_SUCCESS
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

const authService = new AuthService()
export default authService
