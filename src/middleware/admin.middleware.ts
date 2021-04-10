import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export function AdminMiddleware(req: any, res: Response, next: NextFunction) {
    const {isAdmin} = req.user;
    if (!isAdmin) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN)
    } 
    next();
};