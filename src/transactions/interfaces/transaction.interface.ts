/* eslint-disable prettier/prettier */

import { CounterPartyInfo } from "./counter-party-info.interface";
import { EscrowBankDetails } from "./escrow-bank-details.interface";

export interface TransactionRO {
    id: string;
    commodityName: string;
    description: string;
    status: string;
    expiryDate: Date;
    paymentDate: Date;
    counterPartyInfo: CounterPartyInfo;
    escrowBankDetails: EscrowBankDetails;
    conditions: string[];
    amount: number
}
  