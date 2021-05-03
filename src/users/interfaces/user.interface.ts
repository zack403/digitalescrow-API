/* eslint-disable prettier/prettier */

export interface UserRO {
    id: string;
    name: string;
    email: string;
    accountNumber: string;
    phoneNumber: string;
    address: string;
    dateOfBirth: Date;
    profileImage: string;
    gender: string;
    emailVerified: boolean;
    isAdmin: boolean;
}
  