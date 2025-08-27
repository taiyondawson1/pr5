export interface MyFxBookServer {
  name: string;
}

export interface MyFxBookAccount {
  id: number;
  name: string;
  description: string;
  accountId: number;
  gain: number;
  absGain: number;
  daily: string;
  monthly: string;
  withdrawals: number;
  deposits: number;
  interest: number;
  profit: number;
  balance: number;
  drawdown: number;
  equity: number;
  equityPercent: number;
  demo: boolean;
  lastUpdateDate: string;
  creationDate: string;
  firstTradeDate: string;
  tracking: number;
  views: number;
  commission: number;
  currency: string;
  profitFactor: number;
  pips: number;
  invitationUrl: string;
  server: MyFxBookServer;
}

export interface MyFxBookWatchedAccount {
  name: string;
  gain: number;
  drawdown: number;
  demo: boolean;
  change: number;
}

export interface MyFxBookAccountsResponse {
  error: boolean;
  message: string;
  accounts: MyFxBookAccount[];
}

export interface MyFxBookWatchedAccountsResponse {
  error: boolean;
  message: string;
  accounts: MyFxBookWatchedAccount[];
}