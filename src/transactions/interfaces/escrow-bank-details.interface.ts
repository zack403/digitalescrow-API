export interface EscrowBankDetails {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    expiresOn: Date;
    hasMoney?: boolean;
    payoutComplete?: boolean;
    payoutReference? : string;
}