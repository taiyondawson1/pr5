import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Account {
  id: number;
  name: string;
  description: string;
  gain: number;
  balance: number;
  equity: number;
  drawdown: number;
  profit: number;
  currency: string;
  demo: boolean;
  lastUpdateDate: string;
  server: {
    name: string;
  };
}

interface AccountsTableProps {
  accounts: Account[];
}

const AccountsTable = ({ accounts }: AccountsTableProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Trading Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Server</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Equity</TableHead>
              <TableHead>Gain</TableHead>
              <TableHead>Drawdown</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Last Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>{account.server.name}</TableCell>
                <TableCell>
                  {account.balance.toLocaleString()} {account.currency}
                </TableCell>
                <TableCell>
                  {account.equity.toLocaleString()} {account.currency}
                </TableCell>
                <TableCell className={account.gain >= 0 ? "text-green-500" : "text-red-500"}>
                  {account.gain.toFixed(2)}%
                </TableCell>
                <TableCell className="text-red-500">
                  {account.drawdown.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    account.demo ? "bg-yellow-200 text-yellow-800" : "bg-green-200 text-green-800"
                  }`}>
                    {account.demo ? "Demo" : "Live"}
                  </span>
                </TableCell>
                <TableCell>{account.lastUpdateDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AccountsTable;