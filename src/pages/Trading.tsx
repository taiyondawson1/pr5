
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MyFxBookLogin from "@/components/MyFxBookLogin";

const TradingPage = () => {
  return (
    <div className="flex-1">
      <section className="mb-6 rounded-xl border border-border/50 bg-[hsl(var(--card))]/50 p-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Trading</h2>
        <p className="text-muted-foreground mt-2">Connect your MyFxBook to power analytics and insights.</p>
      </section>
      <div className="grid gap-4">
        <MyFxBookLogin />
      </div>
    </div>
  );
};

export default TradingPage;
