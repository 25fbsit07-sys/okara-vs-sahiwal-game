import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Unit {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  type: "okara" | "sahiwal";
  unitType: string;
}

interface GameState {
  playerScore: number;
  opponentScore: number;
  playerHealth: number;
  opponentHealth: number;
  gameActive: boolean;
  winner: string | null;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const BASE_HEALTH = 100;

export default function Game1v1() {
  const [, navigate] = useLocation();
  const [match] = useRoute("/game/1v1_direct_war");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>({
    playerScore: 0,
    opponentScore: 0,
    playerHealth: BASE_HEALTH,
    opponentHealth: BASE_HEALTH,
    gameActive: true,
    winner: null,
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [resources, setResources] = useState({ player: 500, opponent: 500 });
  const [gameTime, setGameTime] = useState(0);

  const playerProfile = trpc.game.players.getProfile.useQuery();
  const startGame = trpc.game.gameModes.startGame.useMutation();
  const endGame = trpc.game.gameModes.endGame.useMutation();
  const getUnits = trpc.game.gameModes.getUnits.useQuery({
    district: playerProfile.data?.district,
  });

  // Initialize game
  useEffect(() => {
    if (playerProfile.data && !startGame.data) {
      startGame.mutate({ gameMode: "1v1_direct_war" });
    }
  }, [playerProfile.data]);

  // Game loop
  useEffect(() => {
    if (!gameState.gameActive) return;

    const gameLoop = () => {
      // Update game time
      setGameTime((t) => t + 1);

      // Simulate opponent spawning units
      if (Math.random() < 0.02 && resources.opponent > 100) {
        const opponentDistrict =
          playerProfile.data?.district === "okara" ? "sahiwal" : "okara";
        const newUnit: Unit = {
          id: `opponent-${Date.now()}`,
          x: CANVAS_WIDTH - 50,
          y: Math.random() * (CANVAS_HEIGHT - 40) + 20,
          health: 50,
          maxHealth: 50,
          attack: 15,
          speed: 3,
          type: opponentDistrict as any,
          unitType: "lassi-bomb",
        };
        setUnits((prev) => [...prev, newUnit]);
        setResources((prev) => ({ ...prev, opponent: prev.opponent - 100 }));
      }

      // Update units
      setUnits((prev) => {
        return prev
          .map((unit) => ({
            ...unit,
            x: unit.type === "okara" ? unit.x + unit.speed : unit.x - unit.speed,
          }))
          .filter((unit) => unit.x > -50 && unit.x < CANVAS_WIDTH + 50);
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.gameActive, playerProfile.data]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw bases
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(10, CANVAS_HEIGHT / 2 - 30, 40, 60);
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(CANVAS_WIDTH - 50, CANVAS_HEIGHT / 2 - 30, 40, 60);

    // Draw units
    units.forEach((unit) => {
      ctx.fillStyle = unit.type === "okara" ? "#f59e0b" : "#06b6d4";
      ctx.fillRect(unit.x - 15, unit.y - 10, 30, 20);

      // Health bar
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(unit.x - 15, unit.y - 20, 30, 3);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(unit.x - 15, unit.y - 20, (unit.health / unit.maxHealth) * 30, 3);
    });

    // Draw health bars for bases
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(10, CANVAS_HEIGHT / 2 + 40, 40, 5);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(
      10,
      CANVAS_HEIGHT / 2 + 40,
      (gameState.playerHealth / BASE_HEALTH) * 40,
      5
    );

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(CANVAS_WIDTH - 50, CANVAS_HEIGHT / 2 + 40, 40, 5);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(
      CANVAS_WIDTH - 50,
      CANVAS_HEIGHT / 2 + 40,
      (gameState.opponentHealth / BASE_HEALTH) * 40,
      5
    );
  }, [units, gameState]);

  const spawnUnit = (unitType: string) => {
    const unitData = getUnits.data?.find((u) => u.id === unitType);
    if (!unitData) return;

    if (resources.player < unitData.cost) {
      toast.error("Not enough resources!");
      return;
    }

    const newUnit: Unit = {
      id: `player-${Date.now()}`,
      x: 50,
      y: Math.random() * (CANVAS_HEIGHT - 40) + 20,
      health: unitData.baseHealth,
      maxHealth: unitData.baseHealth,
      attack: unitData.baseAttack,
      speed: unitData.baseSpeed,
      type: playerProfile.data?.district as any,
      unitType: unitType,
    };

    setUnits((prev) => [...prev, newUnit]);
    setResources((prev) => ({ ...prev, player: prev.player - unitData.cost }));
  };

  const handleEndGame = () => {
    setGameState((prev) => ({ ...prev, gameActive: false }));

    if (startGame.data) {
      endGame.mutate({
        gameSessionId: startGame.data.gameSessionId,
        playerScore: gameState.playerScore,
        opponentScore: gameState.opponentScore,
        winner: gameState.playerHealth > gameState.opponentHealth ? "player" : "opponent",
      });
    }
  };

  if (playerProfile.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <Loader2 className="animate-spin w-8 h-8 text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-amber-900">1v1 Direct War</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Exit Game
          </Button>
        </div>

        {/* Game Canvas */}
        <Card className="mb-6 bg-white border-amber-300">
          <CardContent className="p-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full border-2 border-amber-300 rounded"
            />
          </CardContent>
        </Card>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Your Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">
                {gameState.playerHealth}/{BASE_HEALTH}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-800">Game Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">
                {Math.floor(gameTime / 60)}:{String(gameTime % 60).padStart(2, "0")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Opponent Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {gameState.opponentHealth}/{BASE_HEALTH}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Resources and Units */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Player Units */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300">
            <CardHeader>
              <CardTitle className="text-amber-800">
                Your Resources: {resources.player}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getUnits.data
                ?.filter((u) => u.district === playerProfile.data?.district)
                .map((unit) => (
                  <Button
                    key={unit.id}
                    className="w-full justify-between bg-amber-600 hover:bg-amber-700"
                    onClick={() => spawnUnit(unit.id)}
                    disabled={resources.player < unit.cost || !gameState.gameActive}
                  >
                    <span>{unit.name}</span>
                    <span className="text-sm">Cost: {unit.cost}</span>
                  </Button>
                ))}
            </CardContent>
          </Card>

          {/* Opponent Units */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300">
            <CardHeader>
              <CardTitle className="text-blue-800">
                Opponent Resources: {resources.opponent}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getUnits.data
                ?.filter(
                  (u) =>
                    u.district !==
                    playerProfile.data?.district
                )
                .map((unit) => (
                  <div
                    key={unit.id}
                    className="flex justify-between items-center p-2 bg-white rounded border border-blue-200"
                  >
                    <span className="text-sm font-semibold">{unit.name}</span>
                    <span className="text-xs text-gray-600">Cost: {unit.cost}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Game Over */}
        {!gameState.gameActive && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
            <CardHeader>
              <CardTitle className="text-center text-purple-800">Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg font-semibold">
                {gameState.playerHealth > gameState.opponentHealth
                  ? "🎉 You Won!"
                  : "💔 You Lost"}
              </p>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}

        {/* End Game Button */}
        {gameState.gameActive && (
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={handleEndGame}
          >
            End Game
          </Button>
        )}
      </div>
    </div>
  );
}
