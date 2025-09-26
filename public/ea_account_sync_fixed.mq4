#property copyright "PlatinumAi"
#property link      "https://platinum.ai"
#property version   "1.1"
#property strict

// ---- Inputs ----
input int    SYNC_INTERVAL_SEC = 60;   // How often to sync
input string PRODUCT_CODE = "EA-SYNC"; // Tag for your platform/product
input bool   DEBUG_MODE = true;        // Enable debug logging

// Obfuscated config (assembled at runtime)
string GetUrl()
{
   return "https://" + "qzbwxtegqsusmfwjauwh" + ".supabase.co" + "/rest/v1/rpc/insert_snapshot";
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
   return(AccountEquity() - AccountBalance());
}

// ---- Simplified sync using RPC ----
bool SendSnapshot()
{
   int acc = AccountNumber();
   double bal = AccountBalance();
   double eq = AccountEquity();
   double flt = FloatingPL();
   double free = AccountFreeMargin();
   int open = OrdersTotal();
   
   string body = "{"+
     "\"p_account_number\":\""+IntegerToString(acc)+"\","+
     "\"p_balance\":"+DoubleToString(bal,2)+","+
     "\"p_equity\":"+DoubleToString(eq,2)+","+
     "\"p_floating\":"+DoubleToString(flt,2)+","+
     "\"p_free_margin\":"+DoubleToString(free,2)+","+
     "\"p_open_positions\":"+IntegerToString(open)+""
   "}";
   
   if(DEBUG_MODE) Print("Sending snapshot for account ", acc, ": ", body);
   
   ResetLastError();
   char data[];
   StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(ArraySize(data)>0) ArrayResize(data, ArraySize(data)-1);
   
   char result[];
   string resHeaders;
   string headers =
      "Content-Type: application/json\r\n"+
      "Accept: application/json\r\n"+
      "apikey: "+GetApiKey()+"\r\n"+
      "Authorization: Bearer "+GetApiKey()+"\r\n"+
      "Prefer: return=minimal\r\n";
   
   string url = GetUrl();
   int code = WebRequest("POST", url, headers, 15000, data, result, resHeaders);
   
   if(code == -1)
   {
      int err = GetLastError();
      Print("❌ WebRequest failed with error ", err, " for account ", acc);
      Print("   Make sure 'qzbwxtegqsusmfwjauwh.supabase.co' is in WebRequest allowed URLs");
      return false;
   }
   
   string resp = CharArrayToString(result, 0, -1, CP_UTF8);
   if(code >= 200 && code < 300)
   {
      Print("✅ Successfully synced account ", acc, " (HTTP ", code, ")");
      if(DEBUG_MODE && StringLen(resp) > 0) Print("Response: ", resp);
      return true;
   }
   else
   {
      Print("❌ Sync failed for account ", acc, " - HTTP ", code);
      Print("Response: ", resp);
      return false;
   }
}

void Sync()
{
   static datetime lastSync = 0;
   datetime now = TimeCurrent();
   
   // Always sync on first run
   if(lastSync == 0)
   {
      Print("🔄 Initial sync for account ", AccountNumber());
      SendSnapshot();
      lastSync = now;
      return;
   }
   
   // Sync every SYNC_INTERVAL_SEC seconds
   if(now - lastSync >= SYNC_INTERVAL_SEC)
   {
      if(DEBUG_MODE) Print("⏰ Timer sync for account ", AccountNumber());
      SendSnapshot();
      lastSync = now;
   }
}

void MaybeSync()
{
   static datetime lastBar = 0;
   static int lastOrders = -1;
   datetime now = TimeCurrent();

   bool trigger = false;
   
   // Trigger on new bar
   if(Time[0] != lastBar) 
   { 
      lastBar = Time[0]; 
      trigger = true;
      if(DEBUG_MODE) Print("📊 New bar detected for account ", AccountNumber());
   }
   
   // Trigger on position change
   int curOrders = OrdersTotal();
   if(curOrders != lastOrders) 
   { 
      lastOrders = curOrders; 
      trigger = true;
      if(DEBUG_MODE) Print("📈 Position change detected for account ", AccountNumber(), " (", curOrders, " positions)");
   }

   if(trigger) 
   {
      Sync();
   }
}

int OnInit()
{
   Print("🚀 EA Sync initialized for account ", AccountNumber());
   Print("📡 Target URL: ", GetUrl());
   Print("⏱️  Sync interval: ", SYNC_INTERVAL_SEC, " seconds");
   Print("🐛 Debug mode: ", (DEBUG_MODE ? "ON" : "OFF"));
   
   if(SYNC_INTERVAL_SEC > 0)
   {
      EventSetTimer(SYNC_INTERVAL_SEC);
      Print("⏰ Timer set for ", SYNC_INTERVAL_SEC, " seconds");
   }
   
   // Initial sync
   Sync();
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   Print("🛑 EA Sync deinitialized for account ", AccountNumber());
   EventKillTimer();
}

void OnTick()
{
   MaybeSync();
}

void OnTimer()
{
   Sync();
}

// Manual sync function - call from MT4 terminal
void ManualSync()
{
   Print("🔄 Manual sync triggered for account ", AccountNumber());
   SendSnapshot();
}
