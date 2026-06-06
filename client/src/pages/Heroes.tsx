import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const rarityColors: Record<string, string> = {
  common: "bg-gray-100 text-gray-800",
  rare: "bg-blue-100 text-blue-800",
  epic: "bg-purple-100 text-purple-800",
  legendary: "bg-yellow-100 text-yellow-800",
};

export default function Heroes() {
  const [, navigate] = useLocation();
  const [selectedDistrict, setSelectedDistrict] = useState<"okara" | "sahiwal">("okara");

  const okaraHeroes = trpc.game.heroes.getByDistrict.useQuery({
    district: "okara",
  });

  const sahiwalHeroes = trpc.game.heroes.getByDistrict.useQuery({
    district: "sahiwal",
  });

  const selectHero = trpc.game.heroes.selectHero.useMutation();

  const currentHeroes = selectedDistrict === "okara" ? okaraHeroes : sahiwalHeroes;

  const handleSelectHero = (heroId: string) => {
    selectHero.mutate({ heroId });
  };

  const getDistrictColor = (district: string) => {
    return district === "okara"
      ? "from-amber-50 to-yellow-50 border-amber-300"
      : "from-blue-50 to-cyan-50 border-blue-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Zap className="w-8 h-8" />
              Heroes
            </h1>
            <p className="text-indigo-100">Choose your legendary warrior</p>
          </div>
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-indigo-600"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Tabs defaultValue="okara" onValueChange={(v) => setSelectedDistrict(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="okara" className="text-base">
              🌾 Okara Heroes
            </TabsTrigger>
            <TabsTrigger value="sahiwal" className="text-base">
              🐃 Sahiwal Heroes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="okara">
            {okaraHeroes.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin w-8 h-8 text-amber-600" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {okaraHeroes.data?.map((hero) => (
                  <Card
                    key={hero.id}
                    className={`bg-gradient-to-br ${getDistrictColor("okara")} hover:shadow-lg transition-shadow`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-amber-900">{hero.name}</CardTitle>
                          <CardDescription>{hero.description}</CardDescription>
                        </div>
                        <Badge className={rarityColors[hero.rarity]}>
                          {hero.rarity.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Special Move</p>
                        <p className="text-sm text-gray-600 italic">"{hero.specialMove}"</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-600">Health</p>
                          <p className="font-bold text-red-600">{hero.baseHealth}</p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-600">Attack</p>
                          <p className="font-bold text-orange-600">{hero.baseAttack}</p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-600">Speed</p>
                          <p className="font-bold text-blue-600">{hero.baseSpeed}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        onClick={() => handleSelectHero(hero.id)}
                        disabled={selectHero.isPending}
                      >
                        {selectHero.isPending ? "Selecting..." : "Select Hero"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sahiwal">
            {sahiwalHeroes.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {sahiwalHeroes.data?.map((hero) => (
                  <Card
                    key={hero.id}
                    className={`bg-gradient-to-br ${getDistrictColor("sahiwal")} hover:shadow-lg transition-shadow`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-blue-900">{hero.name}</CardTitle>
                          <CardDescription>{hero.description}</CardDescription>
                        </div>
                        <Badge className={rarityColors[hero.rarity]}>
                          {hero.rarity.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Special Move</p>
                        <p className="text-sm text-gray-600 italic">"{hero.specialMove}"</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-600">Health</p>
                          <p className="font-bold text-red-600">{hero.baseHealth}</p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-600">Attack</p>
                          <p className="font-bold text-orange-600">{hero.baseAttack}</p>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <p className="text-xs text-gray-600">Speed</p>
                          <p className="font-bold text-blue-600">{hero.baseSpeed}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleSelectHero(hero.id)}
                        disabled={selectHero.isPending}
                      >
                        {selectHero.isPending ? "Selecting..." : "Select Hero"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
