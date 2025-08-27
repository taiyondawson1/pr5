#property copyright "PlatinumAi"
#property link      "https://platinum.ai"
#property version   "1.0"
#property strict

// ---- Inputs ----
input int    SYNC_INTERVAL_SEC = 60;   // How often to sync
input string PRODUCT_CODE = "EA-SYNC"; // Tag for your platform/product
input bool   USE_WEBREQUEST   = true;  // Prefer WebRequest (simpler) when allowed
// Obfuscated config (assembled at runtime)
string GetUrl()
{
   // "https://" + host + "/rest/v1/account_metrics"
   return "https://" + "qzbwxtegqsusmfwjauwh" + ".supabase.co" + "/rest/v1/account_metrics";
}

string GetApiKey()
{
   // JWT split across three segments
   string h = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
   string p = "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Ynd4dGVncXN1c21md2phdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTgwMzMsImV4cCI6MjA1MzIzNDAzM30";
   string s = "N3vIgRtWmaEVkaNEWDo_ywfzOu-gSupjCQywKQA8kz8";
   return h+"."+p+"."+s;
}


// ---- Helpers ----
string JsonEscape(string s)
{
   string out = s;
   StringReplace(out, "\\", "\\\\");
   StringReplace(out, "\"", "\\\"");
   StringReplace(out, "\n", "\\n");
   StringReplace(out, "\r", "\\r");
   return out;
}

double FloatingPL()
{
   // Approx floating using equity - balance
   return(AccountEquity() - AccountBalance());
}

// Backward-safe define for balance operations in history (deposits/withdrawals)
#ifndef OP_BALANCE
  #define OP_BALANCE 6
#endif

// ---- Metrics calculation (closed + open) ----
void CalculateTradeMetrics(
   double &totalResult,
   double &profitFactor,
   double &maxDrawdownPct,
   double &avgWin,
   double &avgLoss,
   double &winRate,
   int    &totalOrders,
   double &totalWithdrawals,
   datetime &lastTradeTime
)
{
   static double peakEquity = 0.0;
   if(AccountEquity() > peakEquity) peakEquity = AccountEquity();
   double currentDD = 0.0;
   if(peakEquity > 0.0) currentDD = (peakEquity - AccountEquity()) / peakEquity * 100.0;
   if(currentDD > maxDrawdownPct) maxDrawdownPct = currentDD;

   double winSum = 0.0, lossSum = 0.0; int winCount = 0, lossCount = 0; int closedCount = 0;
   totalWithdrawals = 0.0; lastTradeTime = 0;

   int hist = OrdersHistoryTotal();
   for(int i=0; i<hist; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;

      int type = OrderType();
      double profit = OrderProfit() + OrderSwap() + OrderCommission();
      if(type == OP_BUY || type == OP_SELL)
      {
         closedCount++;
         if(profit > 0) { winSum += profit; winCount++; }
         else if(profit < 0) { lossSum += profit; lossCount++; }
         if(OrderCloseTime() > lastTradeTime) lastTradeTime = OrderCloseTime();
      }
      else if(type == OP_BALANCE || type > OP_SELLSTOP)
      {
         if(profit < 0) totalWithdrawals += MathAbs(profit);
      }
   }

   double openProfit = AccountProfit();
   totalResult = (winSum + lossSum) + openProfit;
   profitFactor = (lossSum != 0.0) ? (winSum / MathAbs(lossSum)) : 0.0;
   avgWin = (winCount > 0) ? (winSum / winCount) : 0.0;
   avgLoss = (lossCount > 0) ? (MathAbs(lossSum) / lossCount) : 0.0;
   winRate = ((winCount + lossCount) > 0) ? (double(winCount) / (winCount + lossCount) * 100.0) : 0.0;
   totalOrders = closedCount + OrdersTotal();
}

// ---- WebRequest only (whitelist the domain in MT4 Options → Expert Advisors) ----

string BuildJson()
{
   int    acc   = AccountNumber();
   double bal   = AccountBalance();
   double eq    = AccountEquity();
   double free  = AccountFreeMargin();
   double flt   = FloatingPL();
   int    open  = OrdersTotal();

   string body  = "{"+
      "\"account_number\":\""+IntegerToString(acc)+"\","+
      "\"balance\":"+DoubleToString(bal,2)+","+
      "\"equity\":"+DoubleToString(eq,2)+","+
      "\"floating\":"+DoubleToString(flt,2)+","+
      "\"free_margin\":"+DoubleToString(free,2)+","+
      "\"open_positions\":"+IntegerToString(open)+""+
   "}";
   return body;
}

bool PostRPC(const string rpcName, const string body, string &resp)
{
   ResetLastError();
   char data[]; StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(ArraySize(data)>0) ArrayResize(data, ArraySize(data)-1);
   char result[]; string resHeaders;
   string headers =
      "Content-Type: application/json\r\n"+
      "Accept: application/json\r\n"+
      "apikey: "+GetApiKey()+"\r\n"+
      "Authorization: Bearer "+GetApiKey()+"\r\n"+
      "Prefer: return=representation\r\n";
   string base = GetUrl();
   StringReplace(base, "/rest/v1/account_metrics", "/rest/v1/rpc/");
   string rpc = base + rpcName;
   int code = WebRequest("POST", rpc, headers, 15000, data, result, resHeaders);
   if(code == -1)
   {
      int err = GetLastError();
      resp = "WebRequest error "+IntegerToString(err)+" len="+IntegerToString(ArraySize(data));
      return false;
   }
   resp = CharArrayToString(result, 0, -1, CP_UTF8);
   return (code>=200 && code<300);
}

bool SendSnapshot()
{
   string body = "{"+
     "\"p_account_number\":\""+IntegerToString(AccountNumber())+"\","+
     "\"p_balance\":"+DoubleToString(AccountBalance(),2)+","+
     "\"p_equity\":"+DoubleToString(AccountEquity(),2)+","+
     "\"p_floating\":"+DoubleToString(FloatingPL(),2)+","+
     "\"p_free_margin\":"+DoubleToString(AccountFreeMargin(),2)+","+
     "\"p_open_positions\":"+IntegerToString(OrdersTotal())+""+
   "}";
   string resp=""; return PostRPC("insert_snapshot", body, resp);
}

bool SendLatestClosedTrade()
{
   static long lastSentTicket = -1;
   int hist = OrdersHistoryTotal(); 
   int newTrades = 0;
   bool allOk = true;
   
   // Check for any new trades since last sync
   for(int i=0;i<hist;i++) {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      int type=OrderType(); 
      if(type!=OP_BUY && type!=OP_SELL) continue;
      
      long ticket = OrderTicket();
      if(ticket <= lastSentTicket) continue; // Already sent
      
      string t = (OrderType()==OP_BUY?"buy":"sell");
      string entry = TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS);
      string exit  = TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS);
      double commission = OrderCommission(); double swap=OrderSwap();
      double result = OrderProfit()+commission+swap;
      
      string body = "{"+
        "\"p_account_number\":\""+IntegerToString(AccountNumber())+"\","+
        "\"p_ticket\":"+IntegerToString(ticket)+","+
        "\"p_symbol\":\""+JsonEscape(OrderSymbol())+"\","+
        "\"p_type\":\""+t+"\","+
        "\"p_size\":"+DoubleToString(OrderLots(),2)+","+
        "\"p_entry_time\":\""+entry+"\","+
        "\"p_exit_time\":\""+exit+"\","+
        "\"p_entry_price\":"+DoubleToString(OrderOpenPrice(),Digits)+","+
        "\"p_exit_price\":"+DoubleToString(OrderClosePrice(),Digits)+","+
        "\"p_commission\":"+DoubleToString(commission,2)+","+
        "\"p_swap\":"+DoubleToString(swap,2)+","+
        "\"p_result\":"+DoubleToString(result,2)+""+
      "}";
      
      string resp=""; bool ok = PostRPC("insert_trade", body, resp);
      if(ok) {
         newTrades++;
         lastSentTicket = MathMax(lastSentTicket, ticket);
      } else {
         Print("Failed to sync new trade ", ticket, ": ", resp);
         allOk = false;
      }
   }
   
   if(newTrades > 0) Print("Synced ", newTrades, " new trades");
   return allOk;
}

bool BackfillTradesOnce()
{
   string key = "EA_SYNC_BACKFILL_"+IntegerToString(AccountNumber());
   if(GlobalVariableCheck(key)) return true;
   
   Print("Starting backfill for account ", AccountNumber(), " - found ", OrdersHistoryTotal(), " trades to process");
   int hist = OrdersHistoryTotal();
   bool allOk = true;
   int processed = 0;
   int failed = 0;
   
   for(int i=0;i<hist;i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      int type=OrderType(); if(type!=OP_BUY && type!=OP_SELL) continue;
      
      string t = (type==OP_BUY?"buy":"sell");
      string entry = TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS);
      string exit  = TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS);
      double commission = OrderCommission(); double swap=OrderSwap();
      double result = OrderProfit()+commission+swap;
      
      string body = "{"+
        "\"p_account_number\":\""+IntegerToString(AccountNumber())+"\","+
        "\"p_ticket\":"+IntegerToString(OrderTicket())+","+
        "\"p_symbol\":\""+JsonEscape(OrderSymbol())+"\","+
        "\"p_type\":\""+t+"\","+
        "\"p_size\":"+DoubleToString(OrderLots(),2)+","+
        "\"p_entry_time\":\""+entry+"\","+
        "\"p_exit_time\":\""+exit+"\","+
        "\"p_entry_price\":"+DoubleToString(OrderOpenPrice(),Digits)+","+
        "\"p_exit_price\":"+DoubleToString(OrderClosePrice(),Digits)+","+
        "\"p_commission\":"+DoubleToString(commission,2)+","+
        "\"p_swap\":"+DoubleToString(swap,2)+","+
        "\"p_result\":"+DoubleToString(result,2)+""+
      "}";
      
      string resp=""; bool ok = PostRPC("insert_trade", body, resp);
      if(ok) {
         processed++;
         if(processed % 10 == 0) Print("Backfill progress: ", processed, "/", hist, " trades processed");
      } else { 
         failed++;
         Print("Failed to sync trade ", OrderTicket(), ": ", resp);
         if(failed > 5) { allOk=false; break; } // Stop after 5 failures
      }
      
      // Small delay to avoid overwhelming the server
      Sleep(50);
   }
   
   Print("Backfill completed: ", processed, " trades processed, ", failed, " failed");
   if(allOk) GlobalVariableSet(key, TimeCurrent());
   return allOk;
}

// Prefer this simpler path when MT4 Options → Expert Advisors → Allow WebRequest has
// the Supabase domain whitelisted.
bool PostJsonWebRequest(const string url, const string apiKey, const string json, string &resp)
{
   ResetLastError();
   char data[]; StringToCharArray(json, data, 0, WHOLE_ARRAY, CP_UTF8);
   char result[]; string resHeaders;
   string headers =
      "Content-Type: application/json\r\n"+
      "Accept: application/json\r\n"+
      "apikey: "+apiKey+"\r\n"+
      "Authorization: Bearer "+apiKey+"\r\n"+
      "Prefer: return=minimal\r\n";

   int code = WebRequest("POST", url, headers, 15000, data, result, resHeaders);
   if(code == -1)
   {
      int err = GetLastError();
      resp = "WebRequest error "+IntegerToString(err);
      return false;
   }
   resp = CharArrayToString(result, 0, -1, CP_UTF8);
   return (code>=200 && code<300);
}

void Sync()
{
   string payload = BuildJson();
   string resp="";
   // Compute and log derived metrics (kept client-side for now)
   double totalResult=0, profitFactor=0, maxDD=0, avgWin=0, avgLoss=0, winRate=0, withdrawals=0; int allOrders=0; datetime lastTrade=0;
   CalculateTradeMetrics(totalResult, profitFactor, maxDD, avgWin, avgLoss, winRate, allOrders, withdrawals, lastTrade);
   Print(
      "Stats ", Symbol(), ": ",
      "Bal=", DoubleToString(AccountBalance(),2),
      " Eq=", DoubleToString(AccountEquity(),2),
      " Res=", DoubleToString(totalResult,2),
      " PF=", DoubleToString(profitFactor,2),
      " DD=", DoubleToString(maxDD,2), "% ",
      " WR=", DoubleToString(winRate,2), "% ",
      " AvgW=", DoubleToString(avgWin,2),
      " AvgL=", DoubleToString(avgLoss,2),
      " Orders=", allOrders,
      " Wdraw=", DoubleToString(withdrawals,2),
      " Last=", TimeToString(lastTrade, TIME_DATE|TIME_SECONDS)
   );
   bool ok = true;
   ok = ok && SendSnapshot();
   ok = ok && SendLatestClosedTrade();
   if(!ok)
      Print("Sync failed: ", resp);
}

void MaybeSync()
{
   static datetime lastBar = 0;
   static int lastOrders = -1;
   static datetime lastSync = 0;
   datetime now = TimeCurrent();

   bool trigger = false;
   if(Time[0] != lastBar) { lastBar = Time[0]; trigger = true; }
   int curOrders = OrdersTotal();
   if(curOrders != lastOrders) { lastOrders = curOrders; trigger = true; }
   if(now - lastSync >= SYNC_INTERVAL_SEC) trigger = true;

   if(trigger) { Sync(); lastSync = now; }
}

int OnInit()
{
   if(SYNC_INTERVAL_SEC > 0)
      EventSetTimer(SYNC_INTERVAL_SEC);
   BackfillTradesOnce();
   Sync();
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTick()
{
   MaybeSync();
}

void OnTimer()
{
   MaybeSync();
}

// Function to reset backfill flag - call this from MT4 terminal to force full backfill
void ResetBackfill()
{
   string key = "EA_SYNC_BACKFILL_"+IntegerToString(AccountNumber());
   GlobalVariableDel(key);
   Print("Backfill flag reset for account ", AccountNumber(), " - will backfill on next restart");
}

// Function to force complete re-sync of all trades - call this from MT4 terminal
void ForceFullResync()
{
   string key = "EA_SYNC_BACKFILL_"+IntegerToString(AccountNumber());
   GlobalVariableDel(key);
   Print("Forcing complete re-sync for account ", AccountNumber());
   BackfillTradesOnce();
   Print("Full re-sync completed");
}


