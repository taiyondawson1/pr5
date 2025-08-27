import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const OpenOrdersTable = () => {
  const orders = [
    {
      id: 1,
      pair: "EUR/USD",
      type: "Buy",
      openPrice: 1.0921,
      lots: 0.1,
      sl: 1.0900,
      tp: 1.0950,
      profit: 25.50
    },
    {
      id: 2,
      pair: "GBP/USD",
      type: "Sell",
      openPrice: 1.3000,
      lots: 0.2,
      sl: 1.3050,
      tp: 1.2950,
      profit: -15.00
    },
    {
      id: 3,
      pair: "USD/JPY",
      type: "Buy",
      openPrice: 110.50,
      lots: 0.1,
      sl: 110.00,
      tp: 111.00,
      profit: 10.00
    },
    {
      id: 4,
      pair: "AUD/USD",
      type: "Sell",
      openPrice: 0.7500,
      lots: 0.5,
      sl: 0.7550,
      tp: 0.7450,
      profit: -20.00
    },
  ];

  const getOrderTypeColor = (type: string) => {
    return type === "Buy" ? "text-green-500" : "text-red-500";
  };

  return (
    <Card className="w-full bg-[#141522]/40 border-[#2A2D3E]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-[#E2E8F0]">Open Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Open Price</TableHead>
              <TableHead>Lots</TableHead>
              <TableHead>SL</TableHead>
              <TableHead>TP</TableHead>
              <TableHead>Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.pair}</TableCell>
                <TableCell>
                  <span className={getOrderTypeColor(order.type)}>{order.type}</span>
                </TableCell>
                <TableCell>{order.openPrice}</TableCell>
                <TableCell>{order.lots}</TableCell>
                <TableCell>{order.sl}</TableCell>
                <TableCell>{order.tp}</TableCell>
                <TableCell>{order.profit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OpenOrdersTable;
