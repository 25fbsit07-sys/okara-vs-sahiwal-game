import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trophy, Medal } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const [selectedDistrict, setSelectedDistrict] = useState<"okara" | "sahiwal">("okara");

  const okaraLeaderboard = trpc.game.leaderboard.getByDistrict.useQuery({
    district: "okara",
    limit: 20,
  });

  const sahiwalLeaderboard = trpc.game.leaderboard.getByDistrict.useQuery({
    district: "sahiwal",
    limit: 20,
  });

  const playerRank = trpc.game.leaderboard.getPlayerRank.useQuery();

  const currentLeaderboard =
    selectedDistrict === "okara" ? okaraLeaderboard : sahiwalLeaderboard;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              Leaderboard
            </h1>
            <p className="text-purple-100">See who's dominating the battlefield</p>
          </div>
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-purple-600"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Your Rank */}
        {playerRank.data && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300">
            <CardHeader>
              <CardTitle className="text-yellow-800">Your Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Rank</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {playerRank.data.rank || "Unranked"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wins</p>
                  <p className="text-2xl font-bold text-green-600">{playerRank.data.wins}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Losses</p>
                  <p className="text-2xl font-bold text-red-600">{playerRank.data.losses}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {playerRank.data.winRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="text-lg font-bold text-purple-600">
                    {playerRank.data.funnyTitle}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* District Leaderboards */}
        <Tabs defaultValue="okara" onValueChange={(v) => setSelectedDistrict(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="okara" className="text-base">
              🌾 Okara
            </TabsTrigger>
            <TabsTrigger value="sahiwal" className="text-base">
              🐃 Sahiwal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="okara">
            <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Okara Warriors</CardTitle>
                <CardDescription>Top players from the Golden Wheat District</CardDescription>
              </CardHeader>
              <CardContent>
                {okaraLeaderboard.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin w-8 h-8 text-amber-600" />
                  </div>
                ) : okaraLeaderboard.data && okaraLeaderboard.data.length > 0 ? (
                  <div className="space-y-2">
                    {okaraLeaderboard.data.map((entry, index) => (
                      <div
                        key={entry.playerId}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-2xl font-bold w-12 text-center">
                            {getRankIcon(index + 1)}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">Player #{entry.playerId}</p>
                            <p className="text-sm text-amber-600">{entry.funnyTitle}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-right">
                          <div>
                            <p className="text-xs text-gray-600">Wins</p>
                            <p className="font-bold text-green-600">{entry.wins}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Losses</p>
                            <p className="font-bold text-red-600">{entry.losses}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Win Rate</p>
                            <p className="font-bold text-blue-600">
                              {entry.winRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">No players yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sahiwal">
            <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Sahiwal Champions</CardTitle>
                <CardDescription>Top players from the Dairy Powerhouse</CardDescription>
              </CardHeader>
              <CardContent>
                {sahiwalLeaderboard.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                  </div>
                ) : sahiwalLeaderboard.data && sahiwalLeaderboard.data.length > 0 ? (
                  <div className="space-y-2">
                    {sahiwalLeaderboard.data.map((entry, index) => (
                      <div
                        key={entry.playerId}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-2xl font-bold w-12 text-center">
                            {getRankIcon(index + 1)}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">Player #{entry.playerId}</p>
                            <p className="text-sm text-blue-600">{entry.funnyTitle}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-right">
                          <div>
                            <p className="text-xs text-gray-600">Wins</p>
                            <p className="font-bold text-green-600">{entry.wins}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Losses</p>
                            <p className="font-bold text-red-600">{entry.losses}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Win Rate</p>
                            <p className="font-bold text-blue-600">
                              {entry.winRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">No players yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
