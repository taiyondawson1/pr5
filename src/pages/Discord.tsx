import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ExternalLink, Users, Shield, Star } from "lucide-react";

export default function DiscordPage() {
  const discordInviteUrl = "https://discord.gg/tVfxVbFxdU";

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <section 
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <MessageCircle className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Private Group Access</h1>
                <p className="text-white/70 mt-1">Join our exclusive Discord community for premium traders</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Card */}
        <Card 
          className="relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Premium Discord Community
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            {/* Benefits Section */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3">What You'll Get:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-green-500/20 rounded-lg">
                      <Shield className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Exclusive Trading Signals</p>
                      <p className="text-white/60 text-sm">Real-time alerts and market insights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Direct Support</p>
                      <p className="text-white/60 text-sm">Get help from our expert team</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Star className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Advanced Strategies</p>
                      <p className="text-white/60 text-sm">Access to premium trading methods</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-3">How to Join:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">1</div>
                    <div>
                      <p className="text-white font-medium">Click the Join Discord button below</p>
                      <p className="text-white/60 text-sm">This will take you to our Discord server</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">2</div>
                    <div>
                      <p className="text-white font-medium">Notify your enroller</p>
                      <p className="text-white/60 text-sm">Send them your Discord username</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm font-bold">3</div>
                    <div>
                      <p className="text-white font-medium">Get premium access</p>
                      <p className="text-white/60 text-sm">Your enroller will grant you access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                  <Shield className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-yellow-300 font-medium mb-1">Important Notice</p>
                  <p className="text-yellow-200/80 text-sm">
                    This is a private group for verified traders only. Access is granted by your enroller after they verify your Discord username. 
                    Make sure to use the same Discord username that your enroller knows.
                  </p>
                </div>
              </div>
            </div>

            {/* Join Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => window.open(discordInviteUrl, '_blank')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl text-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Join Discord Server
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Discord Link Display */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70 text-sm mb-2">Discord Invite Link:</p>
              <p className="text-purple-300 font-mono text-sm break-all bg-black/20 p-2 rounded border">
                {discordInviteUrl}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card 
          className="relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <CardContent className="relative z-10 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Need Help?</h3>
            <p className="text-white/70 text-sm">
              If you have trouble joining or need assistance, please contact your enroller directly. 
              They will help you get set up with the correct permissions in our Discord community.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


