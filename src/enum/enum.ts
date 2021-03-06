export enum TransactionType {
    BUY = "buying",
    SELL = "selling"
}

export enum TransactionStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected",
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    COMPLETED = 'completed'
}

export enum PaymentStatus {
    PENDING = "pending",
    FAILED = "failed",
    COMPLETED = 'completed'
}