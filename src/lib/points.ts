export class InvalidAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAmountError";
  }
}

const MAX_AMOUNT_CENTS = 50_000; // 500 €

export function calculatePointsCredit(amountEurCents: number): number {
  if (!Number.isInteger(amountEurCents)) {
    throw new InvalidAmountError("Amount must be an integer number of cents");
  }
  if (amountEurCents <= 0) {
    throw new InvalidAmountError("Amount must be strictly positive");
  }
  if (amountEurCents > MAX_AMOUNT_CENTS) {
    throw new InvalidAmountError("Amount cannot exceed 50000 cents (500€)");
  }
  return Math.floor(amountEurCents / 100);
}
