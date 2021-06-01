/* eslint-disable prettier/prettier */

import { PaymentStatus } from "src/enum/enum";

export interface PaymentRO {
    amountRecieved: number;
    amountSent: number;
    id: string;
    userId: string;
    paymentDate: Date;
    status: PaymentStatus;
    virtualAccountNumber: string;
}
  