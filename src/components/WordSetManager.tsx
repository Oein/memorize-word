import { useState, useEffect } from "react";
import {
  getWordSets,
  deleteWordSet,
  createWordSet,
  addWordSet,
  updateWordSet,
} from "../lib/storage";
import type { WordSet, WordPair } from "../lib/storage";

interface Props {
  onSelectWordSet: (wordSet: WordSet) => void;
}

export default function WordSetManager({ onSelectWordSet }: Props) {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [editingSet, setEditingSet] = useState<WordSet | null>(null);

  useEffect(() => {
    loadWordSets();
  }, []);

  const loadWordSets = () => {
    setWordSets(getWordSets());
  };

  const handleCreateSet = () => {
    if (!newSetName.trim()) {
      alert("세트 이름을 입력해주세요!");
      return;
    }

    const words: WordPair[] = [];
    const lines = bulkInput.split("\n");
    for (const line of lines) {
      const [word, meaning] = line.split(":").map((s) => s.trim());
      if (word && meaning) {
        words.push({ word, meaning });
      }
    }

    if (words.length < 4) {
      alert("최소 4개 이상의 단어를 입력해주세요!");
      return;
    }

    const newSet = createWordSet(newSetName.trim(), words);
    addWordSet(newSet);
    setWordSets(getWordSets());
    setShowCreateModal(false);
    setNewSetName("");
    setBulkInput("");
  };

  const handleUpdateSet = () => {
    if (!editingSet || !newSetName.trim()) {
      alert("세트 이름을 입력해주세요!");
      return;
    }

    const words: WordPair[] = [];
    const lines = bulkInput.split("\n");
    for (const line of lines) {
      const [word, meaning] = line.split(":").map((s) => s.trim());
      if (word && meaning) {
        words.push({ word, meaning });
      }
    }

    if (words.length < 4) {
      alert("최소 4개 이상의 단어를 입력해주세요!");
      return;
    }

    updateWordSet(editingSet.id, {
      name: newSetName.trim(),
      words,
    });

    setWordSets(getWordSets());
    setEditingSet(null);
    setNewSetName("");
    setBulkInput("");
  };

  const handleDeleteSet = (id: string) => {
    if (confirm("정말 이 단어 세트를 삭제하시겠습니까?")) {
      deleteWordSet(id);
      setWordSets(getWordSets());
    }
  };

  const openEditModal = (wordSet: WordSet) => {
    setEditingSet(wordSet);
    setNewSetName(wordSet.name);
    setBulkInput(wordSet.words.map((w) => `${w.word}:${w.meaning}`).join("\n"));
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingSet(null);
    setNewSetName("");
    setBulkInput("");
  };

  return (
    <div className="word-set-manager">
      <h2>단어 세트 관리</h2>
      <button
        className="create-set-button"
        onClick={() => setShowCreateModal(true)}
      >
        + 새 세트 만들기
      </button>

      <div className="sets-grid">
        {wordSets.length === 0 ? (
          <div className="empty-state">
            <p>아직 단어 세트가 없습니다.</p>
            <p>새 세트를 만들어 학습을 시작하세요!</p>
          </div>
        ) : (
          wordSets.map((set) => (
            <div key={set.id} className="set-card">
              <h3>{set.name}</h3>
              <div className="set-info">{set.words.length}개 단어</div>
              <div className="set-actions">
                <button
                  className="select-button"
                  onClick={() => onSelectWordSet(set)}
                >
                  학습 시작
                </button>
                <button
                  className="edit-button"
                  onClick={() => openEditModal(set)}
                >
                  수정
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteSet(set.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {(showCreateModal || editingSet) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSet ? "단어 세트 수정" : "새 단어 세트 만들기"}</h2>
            <label>
              <span>세트 이름</span>
              <input
                type="text"
                placeholder="세트 이름"
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
              />
            </label>
            <label>
              <span>단어 목록 (word:meaning 형식)</span>
              <textarea
                placeholder="apple:사과&#10;banana:바나나&#10;orange:오렌지"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={15}
              />
            </label>
            <div className="modal-actions">
              <button onClick={editingSet ? handleUpdateSet : handleCreateSet}>
                {editingSet ? "수정" : "만들기"}
              </button>
              <button onClick={closeModal}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
