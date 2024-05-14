import { Request, Response } from 'express'
import { USER_MESSAGES } from '~/constants/messages'
import mediaService from '~/services/media.services'

export const uploadImageController = async (req: Request, res: Response) => {
  const result = await mediaService.uploadImage(req)

  return res.json({
    message: USER_MESSAGES.UPLOAD_IMAGE_SUCCESS,
    result
  })
}
