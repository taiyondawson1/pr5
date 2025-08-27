import MyFxBookLogin from "@/components/MyFxBookLogin";

const MyFxBookLoginPage = () => {
  return (
    <div className="flex-1">
      <section className="mb-6 rounded-xl border border-border/50 bg-[hsl(var(--card))]/50 p-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Connect Your Account</h2>
        <p className="text-muted-foreground mt-2">Authorize MyFxBook to enable dashboards and analytics.</p>
      </section>
      <MyFxBookLogin />
    </div>
  );
};

export default MyFxBookLoginPage;