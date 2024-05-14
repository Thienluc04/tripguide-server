import { Router } from 'express'
import { uploadImageController } from '~/controllers/media.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middleware'
import { verifiedUserValidator } from '~/middlewares/users.middleware'
import { wrapRequestHandler } from '~/utils/handlers'

const mediaRouter = Router()

mediaRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
)

export default mediaRouter
