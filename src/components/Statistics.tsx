import { CWord, WordsMapInstance } from "../lib/memorizer";

interface Props {
  words: CWord[];
  memorizer: WordsMapInstance;
  isOpen: boolean;
  onClose: () => void;
}

export default function Statistics({
  words,
  memorizer,
  isOpen,
  onClose,
}: Props) {
  if (!isOpen) return null;

  // 정답 점수의 최대값 계산 (정규화용)
  const maxAnswerScore = Math.max(
    ...words.map((w) => memorizer.getAnswerScore(w)),
    0.01
  );

  // 오답 유도 점수의 최대값 계산
  const allChoiceScores: number[] = [];
  words.forEach((word) => {
    const otherWords = words.filter((w) => w.uuid !== word.uuid);
    if (otherWords.length > 0) {
      const avgScore =
        otherWords.reduce(
          (sum, other) => sum + memorizer.getChoiceScore(other, word),
          0
        ) / otherWords.length;
      allChoiceScores.push(avgScore * 10);
    }
  });
  const maxChoiceScore = Math.max(...allChoiceScores, 0.01);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="statistics-drawer">
        <div className="drawer-header">
          <h2>📊 학습 통계</h2>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        <div className="drawer-content">
          <div className="stats-summary">
            <div className="stat-card">
              <h3>총 단어 수</h3>
              <p className="stat-value">{words.length}</p>
            </div>
            <div className="stat-card">
              <h3>평균 정답률</h3>
              <p className="stat-value">
                {words.length > 0
                  ? (
                      (words.reduce((sum, w) => sum + w.정답률, 0) /
                        words.length) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="stat-card">
              <h3>평균 학습 필요도</h3>
              <p className="stat-value">
                {words.length > 0
                  ? (
                      words.reduce((sum, w) => sum + w.학습_필요도, 0) /
                      words.length
                    ).toFixed(2)
                  : 0}
              </p>
            </div>
          </div>

          <div className="word-stats-table">
            <h3>단어별 상세 통계</h3>
            <table>
              <thead>
                <tr>
                  <th>단어</th>
                  <th>뜻</th>
                  <th>출제</th>
                  <th>정답</th>
                  <th>오답</th>
                  <th>정답률</th>
                  <th>
                    연속
                    <br />
                    정답
                  </th>
                  <th>
                    연속
                    <br />
                    오답
                  </th>
                  <th style={{ minWidth: "120px" }}>학습 필요도</th>
                  <th style={{ minWidth: "120px" }}>정답 점수</th>
                  <th style={{ minWidth: "120px" }}>오답 유도 점수</th>
                </tr>
              </thead>
              <tbody>
                {words
                  .sort((a, b) => b.학습_필요도 - a.학습_필요도)
                  .map((word) => {
                    const answerScore = memorizer.getAnswerScore(word);
                    // 다른 단어들과의 평균 choice 점수 계산
                    const otherWords = words.filter(
                      (w) => w.uuid !== word.uuid
                    );
                    const avgChoiceScore =
                      otherWords.length > 0
                        ? otherWords.reduce(
                            (sum, other) =>
                              sum + memorizer.getChoiceScore(other, word),
                            0
                          ) / otherWords.length
                        : 0;

                    return (
                      <tr key={word.uuid}>
                        <td className="word-cell">{word.word}</td>
                        <td className="meaning-cell">{word.meaning}</td>
                        <td>{word.이_단어가_나온_총_횟수}</td>
                        <td className="correct-cell">{word.정답_횟수}</td>
                        <td className="wrong-cell">{word.오답_횟수}</td>
                        <td>
                          {word.이_단어가_나온_총_횟수 > 0
                            ? `${(word.정답률 * 100).toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="correct-cell">{word.연속_정답_횟수}</td>
                        <td className="wrong-cell">{word.연속_오답_횟수}</td>
                        <td>
                          <div className="need-bar-container">
                            <div
                              className="need-bar"
                              style={{
                                width: `${word.학습_필요도 * 100}%`,
                                backgroundColor:
                                  word.학습_필요도 > 0.5
                                    ? "#ff4444"
                                    : word.학습_필요도 > 0.2
                                    ? "#ffaa00"
                                    : "#44ff44",
                              }}
                            ></div>
                            <span className="need-value">
                              {word.학습_필요도.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="need-bar-container">
                            <div
                              className="need-bar"
                              style={{
                                width: `${
                                  (answerScore / maxAnswerScore) * 100
                                }%`,
                                backgroundColor: "#4a90e2",
                              }}
                            ></div>
                            <span className="need-value">
                              {answerScore.toFixed(3)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="need-bar-container">
                            <div
                              className="need-bar"
                              style={{
                                width: `${
                                  ((avgChoiceScore * 10) / maxChoiceScore) * 100
                                }%`,
                                backgroundColor: "#764ba2",
                              }}
                            ></div>
                            <span className="need-value">
                              {(avgChoiceScore * 10).toFixed(3)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
