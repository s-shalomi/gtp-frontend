// types/trips.ts
export interface Budget {
    id: number;
    amount: string;
    status: 'unpaid' | 'paid';
    trip: {
      id: number;
      name: string;
      description: string;
      start_date: string;
      end_date: string;
      status: string;
    };
    currency: {
      code: string;
    };
  }