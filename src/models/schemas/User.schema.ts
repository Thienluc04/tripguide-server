import { ObjectId } from 'mongodb'
import { Language, UserGender, UserStatus } from '~/constants/enum'

interface UserType {
  _id?: ObjectId
  name: string
  email: string
  password: string
  phone_number?: string
  avatar_image?: string
  status?: UserStatus
  street_address?: string
  live_in?: string
  date_of_birth?: Date
  gender?: UserGender
  language?: Language
  website?: string
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  phone_number: string
  avatar_image: string
  status: UserStatus
  street_address: string
  live_in: string
  date_of_birth: Date
  gender: UserGender
  language: Language
  website: string
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  constructor(user: UserType) {
    ;(this._id = user._id),
      (this.name = user.name),
      (this.email = user.email),
      (this.password = user.password),
      (this.phone_number = user.phone_number || ''),
      (this.avatar_image = user.avatar_image || ''),
      (this.status = user.status || UserStatus.Unverified),
      (this.street_address = user.street_address || ''),
      (this.live_in = user.live_in || ''),
      (this.date_of_birth = user.date_of_birth || new Date()),
      (this.gender = user.gender || UserGender.Male),
      (this.language = user.language || Language.English),
      (this.website = user.website || ''),
      (this.created_at = user.created_at || new Date()),
      (this.updated_at = user.updated_at || new Date()),
      (this.email_verify_token = user.email_verify_token || ''),
      (this.forgot_password_token = user.forgot_password_token || '')
  }
}
