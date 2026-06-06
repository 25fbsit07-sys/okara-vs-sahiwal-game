import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Heroes from "./pages/Heroes";
import Game1v1 from "./pages/Game1v1";
import GameTerritory from "./pages/GameTerritory";
import GameQuiz from "./pages/GameQuiz";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/leaderboard"} component={Leaderboard} />
      <Route path={"/heroes"} component={Heroes} />
      <Route path={"/game/1v1_direct_war"} component={Game1v1} />
      <Route path={"/game/territory_capture"} component={GameTerritory} />
      <Route path={"/game/quiz_war"} component={GameQuiz} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
