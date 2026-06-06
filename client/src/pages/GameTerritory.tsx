import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Territory {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  owner: "neutral" | "player" | "opponent";
  controlPoints: number;
}

interface GameState {
  playerScore: number;
  opponentScore: number;
  gameActive: boolean;
  winner: string | null;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
const TERRITORY_SIZE = 100;

export default function GameTerritory() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>({
    playerScore: 0,
    opponentScore: 0,
    gameActive: true,
    winner: null,
  });

  const [territories, setTerritories] = useState<Territory[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  const playerProfile = trpc.game.players.getProfile.useQuery();
  const startGame = trpc.game.gameModes.startGame.useMutation();
  const endGame = trpc.game.gameModes.endGame.useMutation();

  // Initialize territories
  useEffect(() => {
    const newTerritories: Territory[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        newTerritories.push({
          id: `territory-${row}-${col}`,
          x: col * (TERRITORY_SIZE + 20) + 50,
          y: row * (TERRITORY_SIZE + 20) + 50,
          width: TERRITORY_SIZE,
          height: TERRITORY_SIZE,
          owner: "neutral",
          controlPoints: 0,
        });
      }
    }
    setTerritories(newTerritories);
  }, []);

  // Initialize game
  useEffect(() => {
    if (playerProfile.data && !startGame.data) {
      startGame.mutate({ gameMode: "territory_capture" });
    }
  }, [playerProfile.data]);

  // Game loop
  useEffect(() => {
    if (!gameState.gameActive) return;

    const gameLoop = () => {
      setGameTime((t) => t + 1);

      // Update territories
      setTerritories((prev) => {
        return prev.map((territory) => {
          let newOwner = territory.owner;
          let newControlPoints = territory.controlPoints;

          // Simulate control changes
          if (territory.owner === "neutral") {
            if (Math.random() < 0.01) {
              newOwner = Math.random() < 0.5 ? "player" : "opponent";
              newControlPoints = 50;
            }
          } else if (territory.owner === "player") {
            newControlPoints = Math.min(100, newControlPoints + 1);
          } else if (territory.owner === "opponent") {
            newControlPoints = Math.min(100, newControlPoints + 1);
          }

          return { ...territory, owner: newOwner, controlPoints: newControlPoints };
        });
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.gameActive]);

  // Calculate scores
  useEffect(() => {
    const playerCount = territories.filter((t) => t.owner === "player").length;
    const opponentCount = territories.filter((t) => t.owner === "opponent").length;

    setGameState((prev) => ({
      ...prev,
      playerScore: playerCount,
      opponentScore: opponentCount,
    }));

    // Check win condition
    if (gameTime > 600 && gameTime % 60 === 0) {
      if (playerCount > opponentCount) {
        setGameState((prev) => ({ ...prev, gameActive: false, winner: "player" }));
      } else if (opponentCount > playerCount) {
        setGameState((prev) => ({ ...prev, gameActive: false, winner: "opponent" }));
      }
    }
  }, [territories, gameTime]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#e0e7ff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid background
    ctx.strokeStyle = "#c7d2fe";
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw territories
    territories.forEach((territory) => {
      // Territory background
      if (territory.owner === "player") {
        ctx.fillStyle = "#fbbf24";
      } else if (territory.owner === "opponent") {
        ctx.fillStyle = "#60a5fa";
      } else {
        ctx.fillStyle = "#f3f4f6";
      }

      ctx.fillRect(territory.x, territory.y, territory.width, territory.height);

      // Territory border
      ctx.strokeStyle =
        territory.owner === "player"
          ? "#d97706"
          : territory.owner === "opponent"
            ? "#1e40af"
            : "#9ca3af";
      ctx.lineWidth = 2;
      ctx.strokeRect(territory.x, territory.y, territory.width, territory.height);

      // Control points bar
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(
        territory.x,
        territory.y + territory.height - 8,
        territory.width,
        8
      );

      const controlColor =
        territory.owner === "player"
          ? "#f59e0b"
          : territory.owner === "opponent"
            ? "#3b82f6"
            : "#9ca3af";
      ctx.fillStyle = controlColor;
      ctx.fillRect(
        territory.x,
        territory.y + territory.height - 8,
        (territory.controlPoints / 100) * territory.width,
        8
      );

      // Territory label
      ctx.fillStyle = "#1f2937";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `${territory.controlPoints}%`,
        territory.x + territory.width / 2,
        territory.y + territory.height / 2
      );
    });
  }, [territories]);

  const captureTerritory = (territoryId: string) => {
    if (!gameState.gameActive) return;

    setTerritories((prev) =>
      prev.map((t) => {
        if (t.id === territoryId && t.owner !== "player") {
          return { ...t, owner: "player", controlPoints: 50 };
        }
        return t;
      })
    );
  };

  const handleEndGame = () => {
    setGameState((prev) => ({ ...prev, gameActive: false }));

    if (startGame.data) {
      endGame.mutate({
        gameSessionId: startGame.data.gameSessionId,
        playerScore: gameState.playerScore,
        opponentScore: gameState.opponentScore,
        winner:
          gameState.playerScore > gameState.opponentScore ? "player" : "opponent",
      });
    }
  };

  if (playerProfile.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Loader2 className="animate-spin w-8 h-8 text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-green-900">Territory Capture</h1>
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
        <Card className="mb-6 bg-white border-green-300">
          <CardContent className="p-4">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full border-2 border-green-300 rounded"
            />
          </CardContent>
        </Card>

        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Your Territories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{gameState.playerScore}</p>
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
              <CardTitle className="text-sm text-blue-800">Opponent Territories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{gameState.opponentScore}</p>
            </CardContent>
          </Card>
        </div>

        {/* Game Over */}
        {!gameState.gameActive && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 mb-6">
            <CardHeader>
              <CardTitle className="text-center text-purple-800">Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg font-semibold">
                {gameState.playerScore > gameState.opponentScore
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
