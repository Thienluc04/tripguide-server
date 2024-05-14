import { Language, UserGender } from '~/constants/enum'

export interface ForgotPasswordReqBody {
  email: string
}

export interface ResetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface UpdateMeReqBody {
  name: string
  email: string
  date_of_birth: string
  street_address: string
  phone_number: string
  gender: UserGender
  language: Language
  avatar_image: string
}

export interface ChangePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}
