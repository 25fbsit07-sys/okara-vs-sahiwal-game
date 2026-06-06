import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wheat, Milk } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [playerDistrict, setPlayerDistrict] = useState<"okara" | "sahiwal" | null>(null);
  const [showDistrictSelect, setShowDistrictSelect] = useState(false);

  // Get or create player profile
  const getOrCreatePlayer = trpc.game.players.getOrCreate.useMutation();
  const getProfile = trpc.game.players.getProfile.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  useEffect(() => {
    if (isAuthenticated && !loading && !getProfile.data) {
      getOrCreatePlayer.mutate({});
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (getProfile.data) {
      setPlayerDistrict(getProfile.data.district as "okara" | "sahiwal");
    }
  }, [getProfile.data]);

  const handleDistrictSelect = async (district: "okara" | "sahiwal") => {
    setPlayerDistrict(district);
    setShowDistrictSelect(false);
  };

  const handleStartGame = (gameMode: "1v1_direct_war" | "territory_capture" | "quiz_war") => {
    navigate(`/game/${gameMode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Okara vs Sahiwal</CardTitle>
            <CardDescription>The Funny War Game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Join the epic battle between Okara and Sahiwal! Select your district and prepare for war.
            </p>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In to Play
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Okara vs Sahiwal</h1>
          <p className="text-amber-100">The Funny War - Choose your district and battle for glory!</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Player Stats */}
        {getProfile.data && (
          <Card className="mb-8 bg-white border-amber-200">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">District</p>
                  <p className="text-lg font-bold capitalize">{getProfile.data.district}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lives</p>
                  <p className="text-lg font-bold">{getProfile.data.lives}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wins</p>
                  <p className="text-lg font-bold">{getProfile.data.totalWins}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Losses</p>
                  <p className="text-lg font-bold">{getProfile.data.totalLosses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* District Selection */}
        {showDistrictSelect && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Okara Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50"
              onClick={() => handleDistrictSelect("okara")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Wheat className="w-6 h-6" />
                  Okara
                </CardTitle>
                <CardDescription>The Golden Wheat District</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">Units:</p>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>🥖 Roti Catapult</li>
                    <li>🚜 Tractor Rush</li>
                    <li>☁️ Wheat Cloud</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Sahiwal Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50"
              onClick={() => handleDistrictSelect("sahiwal")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Milk className="w-6 h-6" />
                  Sahiwal
                </CardTitle>
                <CardDescription>The Dairy Powerhouse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">Units:</p>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>🥛 Lassi Bomb</li>
                    <li>🐃 Buffalo Stampede</li>
                    <li>🔫 Doodh Cannon</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Modes */}
        {playerDistrict && !showDistrictSelect && (
          <div className="space-y-8">
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowDistrictSelect(true)}
                className="mb-6"
              >
                Change District
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* 1v1 Direct War */}
              <Card className="hover:shadow-lg transition-shadow border-amber-300 bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="text-red-800">1v1 Direct War</CardTitle>
                  <CardDescription>Battle head-to-head with another player</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Spawn units and clash in a tug-of-war battle. The first to break through enemy lines wins!
                  </p>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => handleStartGame("1v1_direct_war")}
                  >
                    Start Battle
                  </Button>
                </CardContent>
              </Card>

              {/* Territory Capture */}
              <Card className="hover:shadow-lg transition-shadow border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Territory Capture</CardTitle>
                  <CardDescription>Control the canal map and claim victory</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Capture and hold strategic territories across the Punjab canal system. Control more than your opponent!
                  </p>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStartGame("territory_capture")}
                  >
                    Capture Territory
                  </Button>
                </CardContent>
              </Card>

              {/* Quiz War */}
              <Card className="hover:shadow-lg transition-shadow border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Quiz War</CardTitle>
                  <CardDescription>Test your Punjab knowledge</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Answer Punjab trivia questions to power up your units. More correct answers = stronger army!
                  </p>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleStartGame("quiz_war")}
                  >
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              <Button
                variant="outline"
                className="border-purple-300"
                onClick={() => navigate("/leaderboard")}
              >
                View Leaderboard
              </Button>
              <Button
                variant="outline"
                className="border-purple-300"
                onClick={() => navigate("/heroes")}
              >
                Browse Heroes
              </Button>
            </div>
          </div>
        )}

        {/* Initial District Selection Prompt */}
        {!playerDistrict && !showDistrictSelect && (
          <div className="text-center">
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setShowDistrictSelect(true)}
            >
              Choose Your District
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
