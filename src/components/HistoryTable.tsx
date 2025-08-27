
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TradeHistory {
  openTime: string;
  closeTime: string;
  symbol: string;
  action: string;
  sizing: {
    type: string;
    value: string;
  };
  openPrice: number;
  closePrice: number;
  tp: number;
  sl: number;
  comment: string;
  pips: number;
  profit: number;
  interest: number;
  commission: number;
}

interface HistoryTableProps {
  history: TradeHistory[];
}

const HistoryTable = ({ history = [] }: HistoryTableProps) => {
  console.log("HistoryTable received history:", history);

  return (
    <div className="w-full mt-4">
      <h3 className="text-xl font-bold mb-4 text-softWhite">Trade History</h3>
      <div className="relative overflow-auto" style={{ maxHeight: "480px" }}>
        <Table>
          <TableHeader className="sticky top-0 bg-[#141522] z-10">
            <TableRow>
              <TableHead>Open Time</TableHead>
              <TableHead>Close Time</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lots</TableHead>
              <TableHead>Open Price</TableHead>
              <TableHead>Close Price</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history && history.length > 0 ? (
              history.map((trade, index) => (
                <TableRow key={index}>
                  <TableCell className="dark:text-white text-black">{trade.openTime}</TableCell>
                  <TableCell className="dark:text-white text-black">{trade.closeTime}</TableCell>
                  <TableCell className="dark:text-white text-black">{trade.symbol}</TableCell>
                  <TableCell className="dark:text-white text-black">{trade.action}</TableCell>
                  <TableCell className="dark:text-white text-black">{trade.sizing.value}</TableCell>
                  <TableCell className="dark:text-white text-black">{trade.openPrice}</TableCell>
                  <TableCell className="dark:text-white text-black">{trade.closePrice}</TableCell>
                  <TableCell className={`${trade.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {trade.profit.toFixed(2)}
                  </TableCell>
                  <TableCell className="dark:text-white text-black">{trade.comment}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4 dark:text-white text-black">
                  No trade history found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HistoryTable;
