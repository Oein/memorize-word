import { useState, useEffect } from "react";
import { WordsMapInstance, CWord } from "../lib/memorizer";
import type { IRound } from "../lib/memorizer";

interface Props {
  memorizer: WordsMapInstance;
  selectedWords: CWord[];
  onBack: () => void;
  onShowStats: () => void;
}

export default function Quiz({ memorizer, onBack, onShowStats }: Props) {
  const [currentRound, setCurrentRound] = useState<IRound | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  // roundNumber를 memorizer.rounds 개수로 계산
  const roundNumber = Object.keys(memorizer.rounds).length;

  useEffect(() => {
    loadNextRound();
  }, []);

  useEffect(() => {
    setCanComplete(memorizer.canEndLearning());
  }, [currentRound]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showResult) {
        if (e.key === "Enter" || e.key === " ") {
          handleNext();
        }
        return;
      }

      if (!currentRound) return;

      const choices = currentRound.choicesUUIDs.map(
        (uuid) => memorizer.words[uuid]
      );

      if (e.key === "1") {
        handleAnswer(choices[0].uuid);
      } else if (e.key === "2") {
        handleAnswer(choices[1].uuid);
      } else if (e.key === "3") {
        handleAnswer(choices[2].uuid);
      } else if (e.key === "4") {
        handleAnswer(choices[3].uuid);
      } else if (e.key === "0" || e.key.toLowerCase() === "s") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showResult, currentRound]);

  const loadNextRound = () => {
    try {
      const round = memorizer.createNewRound(4);
      setCurrentRound(round);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAnswer = (wordUUID: string) => {
    if (showResult || !currentRound) return;

    setSelectedAnswer(wordUUID);
    memorizer.recordAnswer(currentRound.uuid, wordUUID);
    setShowResult(true);
  };

  const handleSkip = () => {
    if (showResult || !currentRound) return;

    // "모르겠음"을 선택한 경우 임의의 오답을 기록
    const wrongChoice = currentRound.choicesUUIDs.find(
      (uuid) => uuid !== currentRound.answerUUID
    );
    if (wrongChoice) {
      setSelectedAnswer("skip");
      memorizer.recordAnswer(currentRound.uuid, wrongChoice);
      setShowResult(true);
    }
  };

  const handleNext = () => {
    loadNextRound();
  };

  if (!currentRound) {
    return <div>로딩중...</div>;
  }

  const answerWord = memorizer.words[currentRound.answerUUID];
  const choices = currentRound.choicesUUIDs.map(
    (uuid) => memorizer.words[uuid]
  );
  const isCorrect =
    selectedAnswer && currentRound.answerUUID === selectedAnswer;

  return (
    <div className="quiz">
      <div className="quiz-header">
        <button onClick={onBack}>← 돌아가기</button>
        <h2>Round {roundNumber}</h2>
        <button onClick={onShowStats}>📊 통계</button>
      </div>

      {canComplete && (
        <div className="completion-notice">
          🎉 학습 완료 조건을 달성했습니다! 계속 학습하거나 통계를 확인하세요.
        </div>
      )}

      <div className="question">
        <h1>"{answerWord.word}"의 뜻은?</h1>
        <p style={{ color: "#8c8c8c", fontSize: "1rem", marginTop: "10px" }}>
          키보드: 1, 2, 3, 4로 선택 | 0 또는 S: 모르겠음 | Enter: 다음
        </p>
      </div>

      <div className="choices">
        {choices.map((choice, index) => {
          let className = "choice";
          if (showResult) {
            if (choice.uuid === currentRound.answerUUID) {
              className += " correct";
            } else if (choice.uuid === selectedAnswer) {
              className += " wrong";
            }
          } else if (choice.uuid === selectedAnswer) {
            className += " selected";
          }

          return (
            <button
              key={choice.uuid}
              className={className}
              onClick={() => handleAnswer(choice.uuid)}
              disabled={showResult}
            >
              <span style={{ color: "#8c8c8c", marginRight: "10px" }}>
                {index + 1}.
              </span>
              {choice.meaning}
            </button>
          );
        })}
        <button
          className={`choice skip ${
            selectedAnswer === "skip" && showResult ? "wrong" : ""
          }`}
          onClick={handleSkip}
          disabled={showResult}
        >
          <span style={{ color: "#8c8c8c", marginRight: "10px" }}>0.</span>
          모르겠음
        </button>
      </div>

      {showResult && (
        <div className={`result ${isCorrect ? "correct" : "wrong"}`}>
          {isCorrect ? (
            <p>✅ 정답입니다!</p>
          ) : (
            <p>❌ 틀렸습니다. 정답은 "{answerWord.meaning}"입니다.</p>
          )}
          <button onClick={handleNext} className="next-button">
            다음 문제
          </button>
        </div>
      )}
    </div>
  );
}
