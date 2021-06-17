export interface WovenCeateCustomerPayload {
    customer_reference: string;
    name: string;
    email: string;
    mobile_number: string;
    expires_on: Date;
    destination_nuban: string;
    min_amount: number;
    max_amount: number;
}