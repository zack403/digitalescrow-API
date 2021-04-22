/* eslint-disable prettier/prettier */

export interface PaymentRO {
    amountRecieved: number;
    amountSent: number;
    id: string;
    userId: string;
    paymentDate: Date;
    completed: boolean;
    virtualAccountNumber: string;
}
  