import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class CurrencyService {
  private rates: Record<string, number> = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
  };

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (!this.rates[from] || !this.rates[to]) {
      throw new BadRequestException(`Unsupported currency: ${from} or ${to}`);
    }
    return (amount / this.rates[from]) * this.rates[to];
  }
}
