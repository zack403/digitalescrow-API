/* eslint-disable prettier/prettier */

import { UserBankDetails } from "../dto/user-bank-details.dto";

export interface UserRO {
    id: string;
    name: string;
    email: string;
    userBankDetails: UserBankDetails;
    phoneNumber: string;
    address: string;
    dateOfBirth: Date;
    profileImage: string;
    gender: string;
    emailVerified: boolean;
    isAdmin: boolean;
}
  