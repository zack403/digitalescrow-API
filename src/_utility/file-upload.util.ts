import { HttpException, HttpStatus } from '@nestjs/common';

// Allow only images
export const imageFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(
      new HttpException(
        'Only image files are allowed!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
  }
  callback(null, true);
};