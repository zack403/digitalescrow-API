import { HttpException, HttpStatus } from '@nestjs/common';
import {v2} from 'cloudinary';

export const uploadFile = async (fileUrl: any) => {
    try {
        const result = await v2.uploader.upload(fileUrl, { eager: [{ width: 400, height: 300, crop: "fill",  gravity: "face" }]});
        if(result) {
            return result.secure_url;
        }
    } catch (error) {
        throw new HttpException(`${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
} 