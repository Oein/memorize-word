import { useState } from "react";
import "./App.css";
import { WordsMapInstance, CWord } from "./lib/memorizer";
import WordSetManager from "./components/WordSetManager";
import Quiz from "./components/Quiz";
import Statistics from "./components/Statistics";
import type { WordSet } from "./lib/storage";

function App() {
  const [memorizer, setMemorizer] = useState<WordsMapInstance | null>(null);
  const [selectedWords, setSelectedWords] = useState<CWord[]>([]);
  const [currentWordSet, setCurrentWordSet] = useState<WordSet | null>(null);
  const [mode, setMode] = useState<"sets" | "quiz">("sets");
  const [showStats, setShowStats] = useState(false);

  const handleSelectWordSet = (wordSet: WordSet) => {
    const newMemorizer = new WordsMapInstance();
    const words: CWord[] = [];

    wordSet.words.forEach((pair) => {
      const word = newMemorizer.addWord(pair.word, pair.meaning);
      words.push(word);
    });

    setMemorizer(newMemorizer);
    setSelectedWords(words);
    setCurrentWordSet(wordSet);
    setMode("quiz");
  };

  const handleBackToSets = () => {
    setMode("sets");
    setMemorizer(null);
    setSelectedWords([]);
    setCurrentWordSet(null);
    setShowStats(false);
  };

  const handleToggleStats = () => {
    setShowStats(!showStats);
  };

  return (
    <div className="app">
      <header>
        <h1>📚 단어 암기 프로그램</h1>
        {currentWordSet && mode !== "sets" && (
          <p className="current-set-name">현재 세트: {currentWordSet.name}</p>
        )}
      </header>

      {mode === "sets" && (
        <WordSetManager onSelectWordSet={handleSelectWordSet} />
      )}

      {mode === "quiz" && memorizer && (
        <Quiz
          memorizer={memorizer}
          selectedWords={selectedWords}
          onBack={handleBackToSets}
          onShowStats={handleToggleStats}
        />
      )}

      {memorizer && (
        <Statistics
          words={selectedWords}
          memorizer={memorizer}
          isOpen={showStats}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

export default App;
