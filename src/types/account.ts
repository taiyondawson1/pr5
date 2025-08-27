export interface AccountMetric {
  id?: string;
  account_number: string;
  balance: number;
  equity: number;
  floating: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  openPositions: number;
  created_at: string;
}