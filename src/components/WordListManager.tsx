import { useState } from "react";
import { WordsMapInstance } from "../lib/memorizer";

interface Props {
  memorizer: WordsMapInstance;
  onStartQuiz: (wordUUIDs: string[]) => void;
}

export default function WordListManager({ memorizer, onStartQuiz }: Props) {
  const [wordInput, setWordInput] = useState("");
  const [meaningInput, setMeaningInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [selectedUUIDs, setSelectedUUIDs] = useState<Set<string>>(new Set());

  const words = Object.values(memorizer.words);

  const handleAddWord = () => {
    if (wordInput.trim() && meaningInput.trim()) {
      memorizer.addWord(wordInput.trim(), meaningInput.trim());
      setWordInput("");
      setMeaningInput("");
    }
  };

  const handleBulkAdd = () => {
    const lines = bulkInput.split("\n");
    for (const line of lines) {
      const [word, meaning] = line.split(":").map((s) => s.trim());
      if (word && meaning) {
        memorizer.addWord(word, meaning);
      }
    }
    setBulkInput("");
  };

  const toggleWord = (uuid: string) => {
    const newSelected = new Set(selectedUUIDs);
    if (newSelected.has(uuid)) {
      newSelected.delete(uuid);
    } else {
      newSelected.add(uuid);
    }
    setSelectedUUIDs(newSelected);
  };

  const selectAll = () => {
    setSelectedUUIDs(new Set(words.map((w) => w.uuid)));
  };

  const deselectAll = () => {
    setSelectedUUIDs(new Set());
  };

  const selectRange = (startIndex: number, count: number) => {
    const rangeWords = words.slice(startIndex, startIndex + count);
    const newSelected = new Set(selectedUUIDs);
    rangeWords.forEach((w) => newSelected.add(w.uuid));
    setSelectedUUIDs(newSelected);
  };

  const deselectRange = (startIndex: number, count: number) => {
    const rangeWords = words.slice(startIndex, startIndex + count);
    const newSelected = new Set(selectedUUIDs);
    rangeWords.forEach((w) => newSelected.delete(w.uuid));
    setSelectedUUIDs(newSelected);
  };

  const handleStart = () => {
    if (selectedUUIDs.size >= 4) {
      onStartQuiz(Array.from(selectedUUIDs));
    } else {
      alert("최소 4개 이상의 단어를 선택해주세요!");
    }
  };

  return (
    <div className="word-list-manager">
      <div className="add-word-section">
        <h2>단어 추가</h2>
        <div className="add-single">
          <input
            type="text"
            placeholder="단어"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddWord()}
          />
          <input
            type="text"
            placeholder="뜻"
            value={meaningInput}
            onChange={(e) => setMeaningInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddWord()}
          />
          <button onClick={handleAddWord}>추가</button>
        </div>

        <div className="add-bulk">
          <h3>일괄 추가 (단어:뜻 형식, 한 줄에 하나씩)</h3>
          <textarea
            placeholder="예시:&#10;apple:사과&#10;banana:바나나&#10;orange:오렌지"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={5}
          />
          <button onClick={handleBulkAdd}>일괄 추가</button>
        </div>
      </div>

      <div className="word-selection-section">
        <h2>학습할 단어 선택 ({selectedUUIDs.size}개 선택됨)</h2>
        <div className="selection-controls">
          <button onClick={selectAll}>전체 선택</button>
          <button onClick={deselectAll}>전체 해제</button>
        </div>

        {words.length > 10 && (
          <div className="bulk-selection">
            <p>10개 단위 선택:</p>
            <div className="bulk-buttons">
              {Array.from(
                { length: Math.ceil(words.length / 10) },
                (_, i) => i
              ).map((i) => {
                const start = i * 10;
                const end = Math.min((i + 1) * 10, words.length);
                const rangeWords = words.slice(start, end);
                const allSelected = rangeWords.every((w) =>
                  selectedUUIDs.has(w.uuid)
                );

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (allSelected) {
                        deselectRange(start, end - start);
                      } else {
                        selectRange(start, end - start);
                      }
                    }}
                    style={{
                      backgroundColor: allSelected ? "#52c41a" : "white",
                      color: allSelected ? "white" : "#4a90e2",
                    }}
                  >
                    {start + 1}-{end}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="word-list">
          {words.map((word) => (
            <div
              key={word.uuid}
              className={`word-item ${
                selectedUUIDs.has(word.uuid) ? "selected" : ""
              }`}
              onClick={() => toggleWord(word.uuid)}
            >
              <input
                type="checkbox"
                checked={selectedUUIDs.has(word.uuid)}
                onChange={() => {}}
              />
              <span className="word">{word.word}</span>
              <span className="meaning">{word.meaning}</span>
            </div>
          ))}
        </div>

        {words.length > 0 && (
          <button
            className="start-button"
            onClick={handleStart}
            disabled={selectedUUIDs.size < 4}
          >
            학습 시작 ({selectedUUIDs.size}개 단어)
          </button>
        )}
      </div>
    </div>
  );
}
