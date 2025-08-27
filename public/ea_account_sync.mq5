#property copyright "PlatinumAi"
#property version   "1.0"
#property strict

input int    SYNC_INTERVAL_SEC = 60;
input string PRODUCT_CODE = "EA-SYNC";

string JsonEscape(string s){ string out=s; StringReplace(out, "\\", "\\\\"); StringReplace(out, "\"", "\\\""); StringReplace(out, "\n", "\\n"); StringReplace(out, "\r", "\\r"); return out; }

double FloatingPL(){ return(AccountInfoDouble(ACCOUNT_EQUITY)-AccountInfoDouble(ACCOUNT_BALANCE)); }

string GetUrl(){ return "https://"+"qzbwxtegqsusmfwjauwh"+".supabase.co/rest/v1/account_metrics"; }
string GetApiKey(){ string h="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; string p="eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Ynd4dGVncXN1c21md2phdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NTgwMzMsImV4cCI6MjA1MzIzNDAzM30"; string s="N3vIgRtWmaEVkaNEWDo_ywfzOu-gSupjCQywKQA8kz8"; return h+"."+p+"."+s; }

string BuildJson(){
  long login=(long)AccountInfoInteger(ACCOUNT_LOGIN); string cur=AccountInfoString(ACCOUNT_CURRENCY);
  double bal=AccountInfoDouble(ACCOUNT_BALANCE); double eq=AccountInfoDouble(ACCOUNT_EQUITY);
  double free=AccountInfoDouble(ACCOUNT_FREEMARGIN); int open=PositionsTotal(); double flt=FloatingPL();
  string body="{"+
    "\"account_number\":\""+(string)login+"\","+
    "\"balance\":"+DoubleToString(bal,2)+","+
    "\"equity\":"+DoubleToString(eq,2)+","+
    "\"floating\":"+DoubleToString(flt,2)+","+
    "\"free_margin\":"+DoubleToString(free,2)+","+
    "\"open_positions\":\""+(string)open+"\""+
  "}"; return body; }

bool PostJson(const string url,const string api,const string json,string &resp){
  ResetLastError(); char data[]; StringToCharArray(json,data,0,WHOLE_ARRAY,CP_UTF8); char result[]; string hdrs;
  string headers="Content-Type: application/json\r\n"+"apikey: "+api+"\r\n"+"Authorization: Bearer "+api+"\r\n"+"Prefer: return=minimal\r\n";
  int code=WebRequest("POST",url,headers,10000,data,ArraySize(data)-1,result,hdrs);
  if(code==-1){ Print("WebRequest error ",GetLastError()); return false; }
  resp=CharArrayToString(result,0,-1,CP_UTF8); return (code>=200 && code<300);
}

void Sync(){ string r; if(!PostJson(GetUrl(),GetApiKey(),BuildJson(),r)) Print("Sync failed: ",r); }

void MaybeSync(){ static datetime lastBar=0; static int lastPos=-1; static datetime lastSync=0; datetime now=TimeCurrent(); bool trig=false; if(lastBar!=iTime(_Symbol,PERIOD_CURRENT,0)){ lastBar=iTime(_Symbol,PERIOD_CURRENT,0); trig=true;} int curPos=PositionsTotal(); if(curPos!=lastPos){ lastPos=curPos; trig=true;} if(now-lastSync>=SYNC_INTERVAL_SEC) trig=true; if(trig){ Sync(); lastSync=now; } }

int OnInit(){ if(SYNC_INTERVAL_SEC>0) EventSetTimer(SYNC_INTERVAL_SEC); Sync(); return(INIT_SUCCEEDED);} 
void OnDeinit(const int reason){ EventKillTimer(); } 
void OnTick(){ MaybeSync(); } 
void OnTimer(){ MaybeSync(); }
