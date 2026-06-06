import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  topic: string;
}

interface GameState {
  playerScore: number;
  opponentScore: number;
  gameActive: boolean;
  winner: string | null;
  currentQuestionIndex: number;
}

export default function GameQuiz() {
  const [, navigate] = useLocation();
  const [gameState, setGameState] = useState<GameState>({
    playerScore: 0,
    opponentScore: 0,
    gameActive: true,
    winner: null,
    currentQuestionIndex: 0,
  });

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  const playerProfile = trpc.game.players.getProfile.useQuery();
  const startGame = trpc.game.gameModes.startGame.useMutation();
  const endGame = trpc.game.gameModes.endGame.useMutation();
  const getQuestions = trpc.game.quiz.getQuestions.useQuery({ count: 10 });
  const submitAnswer = trpc.game.quiz.submitAnswer.useMutation();

  // Initialize game
  useEffect(() => {
    if (playerProfile.data && !startGame.data) {
      startGame.mutate({ gameMode: "quiz_war" });
    }
  }, [playerProfile.data]);

  // Load questions
  useEffect(() => {
    if (getQuestions.data) {
      setQuestions(getQuestions.data);
    }
  }, [getQuestions.data]);

  const handleAnswerSubmit = async (optionIndex: number) => {
    if (answered || !questions[gameState.currentQuestionIndex]) return;

    setSelectedAnswer(optionIndex);
    setAnswered(true);

    const currentQuestion = questions[gameState.currentQuestionIndex];
    submitAnswer.mutate(
      {
        questionId: currentQuestion.id,
        selectedAnswer: optionIndex,
      },
      {
        onSuccess: (result) => {
          if (result.correct) {
            toast.success("Correct! +10 points");
            setGameState((prev) => ({
              ...prev,
              playerScore: prev.playerScore + 10,
            }));
          } else {
            toast.error("Wrong answer!");
            // Opponent gets a point
            setGameState((prev) => ({
              ...prev,
              opponentScore: prev.opponentScore + 5,
            }));
          }

          // Move to next question after delay
          setTimeout(() => {
            if (gameState.currentQuestionIndex < questions.length - 1) {
              setGameState((prev) => ({
                ...prev,
                currentQuestionIndex: prev.currentQuestionIndex + 1,
              }));
              setSelectedAnswer(null);
              setAnswered(false);
            } else {
              // Game over
              setGameState((prev) => ({
                ...prev,
                gameActive: false,
                winner:
                  prev.playerScore > prev.opponentScore ? "player" : "opponent",
              }));
            }
          }, 1500);
        },
      }
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

  if (playerProfile.isLoading || getQuestions.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  const currentQuestion = questions[gameState.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Quiz War</h1>
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

        {/* Score Board */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Your Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">{gameState.playerScore}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">Opponent Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{gameState.opponentScore}</p>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        {gameState.gameActive && currentQuestion ? (
          <Card className="mb-6 bg-white border-blue-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-900">{currentQuestion.question}</CardTitle>
                  <CardDescription>
                    Question {gameState.currentQuestionIndex + 1} of {questions.length}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Difficulty</p>
                  <p className="text-sm font-semibold capitalize">
                    {currentQuestion.difficulty}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? "default" : "outline"}
                  className={`w-full justify-start text-left h-auto py-3 px-4 ${
                    selectedAnswer === index
                      ? answered
                        ? index === parseInt(currentQuestion.options[0]) // Simplified check
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                      : ""
                  }`}
                  onClick={() => handleAnswerSubmit(index)}
                  disabled={answered}
                >
                  <span className="font-semibold mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span>{option}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Game Over */}
        {!gameState.gameActive && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 mb-6">
            <CardHeader>
              <CardTitle className="text-center text-purple-800">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-lg font-semibold">
                  {gameState.playerScore > gameState.opponentScore
                    ? "🎉 You Won!"
                    : gameState.playerScore === gameState.opponentScore
                      ? "🤝 It's a Tie!"
                      : "💔 You Lost"}
                </p>
                <p className="text-sm text-gray-600">
                  Your Score: {gameState.playerScore} | Opponent Score:{" "}
                  {gameState.opponentScore}
                </p>
              </div>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        {gameState.gameActive && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Progress</p>
              <p className="text-sm text-gray-600">
                {gameState.currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((gameState.currentQuestionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>
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
