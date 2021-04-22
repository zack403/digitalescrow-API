/* eslint-disable prettier/prettier */

import { CounterPartyInfo } from "./counter-party-info.interface";

export interface TransactionRO {
    id: string;
    commodityName: string;
    description: string;
    status: string;
    expiryDate: Date;
    paymentDate: Date;
    counterPartyInfo: CounterPartyInfo;
    conditions: string[];
    amount: number
}
  