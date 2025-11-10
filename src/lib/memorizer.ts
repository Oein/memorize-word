// Memorizer Core Logic

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface IRound {
  uuid: string;
  answerUUID: string;
  choicesUUIDs: string[];
  userAnswerUUID?: string;
  isCorrect?: boolean;
}

export interface WordsMapConfig {
  pick_round_weight: number;
  pick_reccent_word_ignore_weight: number;
  pick_need_weight: number;
  pick_random_weight: number;
  end_need_threshold: number;
  end_min_rounds: number;
  choice_wrong_weight: number;
  choice_not_shown_weight: number;
  choice_random_weight: number;
}

export const DEFAULT_CONFIG: WordsMapConfig = {
  pick_round_weight: 0.05,
  pick_reccent_word_ignore_weight: 0.03,
  pick_need_weight: 0.7,
  pick_random_weight: 0.07,
  end_need_threshold: 0.2,
  end_min_rounds: 2,
  choice_wrong_weight: 0.1,
  choice_not_shown_weight: 0.4,
  choice_random_weight: 0.05,
};

export class CChoice {
  public shown: number = 0;
  public picked: number = 0;

  get ratio(): number {
    return this.shown === 0 ? 0 : this.picked / this.shown;
  }

  get 선택_비율(): number {
    return this.ratio;
  }
}

export class CWord {
  public uuid: string;
  public word: string;
  public meaning: string;
  public choices: { [key: string]: CChoice } = {};
  public shownRounds: string[] = [];
  public instance: WordsMapInstance;

  constructor(instance: WordsMapInstance, word: string, meaning: string) {
    this.instance = instance;
    this.uuid = generateUUID();
    this.word = word;
    this.meaning = meaning;
  }

  get 학습_필요도(): number {
    const N = this.instance.config.end_min_rounds;

    // 한 번도 나오지 않은 경우
    if (this.shownRounds.length === 0) return 1;

    // 최소 출제 횟수를 채우지 못한 경우, 높은 필요도 부여
    if (this.shownRounds.length < N) {
      // 틀린 횟수 비율 + 부족한 출제 횟수 페널티
      const failures = this.오답_횟수;
      const baseNeed =
        this.shownRounds.length === 0 ? 1 : failures / this.shownRounds.length;
      const incompletePenalty = ((N - this.shownRounds.length) / N) * 0.5;
      return Math.min(1, baseNeed + incompletePenalty);
    }

    // 최근 N개 라운드에서의 실패율
    const recentRounds = this.shownRounds.slice(-N);
    let failures = 0;

    for (const roundUUID of recentRounds) {
      const round = this.instance.rounds[roundUUID];
      if (!round) continue;
      if (round.isCorrect === false) {
        failures++;
      }
    }

    const baseNeed = failures / recentRounds.length;

    // 연속 정답 보너스: 연속으로 맞추수록 학습 필요도 점진적으로 감소
    // 제곱 함수를 사용하여 처음에는 느리게, 점점 빠르게 감소
    const correctStreak = this.연속_정답_횟수;
    const streakFactor = Math.pow(correctStreak / 4, 2); // (streak/4)^2: 4번에서 1.0 도달
    const maxReduction = 0.9; // 최대 90%까지 감소
    const streakBonus = Math.min(1, streakFactor) * maxReduction;

    // 연속 오답 페널티: 연속으로 틀릴수록 학습 필요도 선형 증가
    const wrongStreak = this.연속_오답_횟수;
    const wrongPenalty = wrongStreak * 0.1; // 1회당 0.1씩 증가

    return Math.min(1, Math.max(0, baseNeed - streakBonus + wrongPenalty));
  }

  get 가장_최근에_나온_Round(): number {
    if (this.shownRounds.length === 0) return -1;
    const lastRoundUUID = this.shownRounds[this.shownRounds.length - 1];
    const allRoundUUIDs = Object.keys(this.instance.rounds);
    return allRoundUUIDs.indexOf(lastRoundUUID);
  }

  get 이_단어와_함께_나온_단어들(): { [key: string]: CChoice } {
    return this.choices;
  }

  get 이_단어가_나온_총_횟수(): number {
    return this.shownRounds.length;
  }

  get 정답_횟수(): number {
    let correct = 0;
    for (const roundUUID of this.shownRounds) {
      const round = this.instance.rounds[roundUUID];
      if (round && round.isCorrect === true) {
        correct++;
      }
    }
    return correct;
  }

  get 오답_횟수(): number {
    return this.이_단어가_나온_총_횟수 - this.정답_횟수;
  }

  get 정답률(): number {
    if (this.이_단어가_나온_총_횟수 === 0) return 0;
    return this.정답_횟수 / this.이_단어가_나온_총_횟수;
  }

  get 연속_정답_횟수(): number {
    let streak = 0;
    // 최근 라운드부터 역순으로 확인
    for (let i = this.shownRounds.length - 1; i >= 0; i--) {
      const roundUUID = this.shownRounds[i];
      const round = this.instance.rounds[roundUUID];
      if (!round) continue;

      if (round.isCorrect === true) {
        streak++;
      } else {
        break; // 틀린 문제가 나오면 중단
      }
    }
    return streak;
  }

  get 연속_오답_횟수(): number {
    let streak = 0;
    // 최근 라운드부터 역순으로 확인
    for (let i = this.shownRounds.length - 1; i >= 0; i--) {
      const roundUUID = this.shownRounds[i];
      const round = this.instance.rounds[roundUUID];
      if (!round) continue;

      if (round.isCorrect === false) {
        streak++;
      } else {
        break; // 맞춘 문제가 나오면 중단
      }
    }
    return streak;
  }
}

export class WordsMapInstance {
  public rounds: { [key: string]: IRound } = {};
  public words: { [key: string]: CWord } = {};
  public config: WordsMapConfig = DEFAULT_CONFIG;

  constructor(overrideConfig: Partial<WordsMapConfig> = {}) {
    this.config = { ...this.config, ...overrideConfig };
  }

  public addWord(word: string, meaning: string): CWord {
    const cword = new CWord(this, word, meaning);
    this.words[cword.uuid] = cword;
    return cword;
  }

  public canEndLearning(): boolean {
    const words = Object.values(this.words);
    for (const word of words) {
      if (word.학습_필요도 > this.config.end_need_threshold) {
        return false;
      }
      if (word.이_단어가_나온_총_횟수 < this.config.end_min_rounds) {
        return false;
      }
    }
    return true;
  }

  private score2choose(word: CWord): number {
    const need = word.학습_필요도;
    const round = word.가장_최근에_나온_Round;
    const currentRound = Object.keys(this.rounds).length;

    return (
      need * this.config.pick_need_weight +
      (currentRound - round - this.config.pick_reccent_word_ignore_weight) *
        this.config.pick_round_weight +
      Math.random() * this.config.pick_random_weight
    );
  }

  public getAnswerScore(word: CWord): number {
    return this.score2choose(word);
  }

  public getChoiceScore(answerWord: CWord, choiceWord: CWord): number {
    const choice = answerWord.이_단어와_함께_나온_단어들[choiceWord.uuid];
    let score = 0;

    if (choice) {
      score += choice.선택_비율 * this.config.choice_wrong_weight;
    } else {
      score += this.config.choice_not_shown_weight;
    }

    score += Math.random() * this.config.choice_random_weight;
    return score;
  }

  private pickCompanionWords(
    word: CWord,
    allWords: CWord[],
    count: number
  ): CWord[] {
    const candidates = allWords
      .filter((w) => w.uuid !== word.uuid)
      .map((w) => {
        const choice = word.이_단어와_함께_나온_단어들[w.uuid];
        let score = 0;

        if (choice) {
          score += choice.선택_비율 * this.config.choice_wrong_weight;
        } else {
          score += this.config.choice_not_shown_weight;
        }

        score += Math.random() * this.config.choice_random_weight;
        return { word: w, score };
      });

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map((c) => c.word);
  }

  public createNewRound(choicesCount: number = 4): IRound {
    const allWords = Object.values(this.words);

    if (allWords.length === 0) {
      throw new Error("단어가 없습니다. 먼저 단어를 추가해주세요.");
    }

    if (allWords.length < choicesCount) {
      throw new Error(
        `선택지 개수(${choicesCount})보다 단어가 적습니다. 최소 ${choicesCount}개의 단어가 필요합니다.`
      );
    }

    // 가장 최근 라운드의 정답 단어 찾기
    let lastAnswerUUID: string | null = null;
    const allRoundUUIDs = Object.keys(this.rounds);
    if (allRoundUUIDs.length > 0) {
      const lastRoundUUID = allRoundUUIDs[allRoundUUIDs.length - 1];
      lastAnswerUUID = this.rounds[lastRoundUUID].answerUUID;
    }

    // 최근 정답 단어를 제외한 단어들 중에서 선택 (단어가 충분한 경우)
    const candidateWords =
      allWords.length > choicesCount && lastAnswerUUID
        ? allWords.filter((w) => w.uuid !== lastAnswerUUID)
        : allWords;

    const answerWord = candidateWords.reduce((prev, current) =>
      this.score2choose(current) > this.score2choose(prev) ? current : prev
    );

    const companionWords = this.pickCompanionWords(
      answerWord,
      allWords,
      choicesCount - 1
    );

    const allChoices = [answerWord, ...companionWords];
    const shuffledChoices = allChoices.sort(() => Math.random() - 0.5);

    const round: IRound = {
      uuid: generateUUID(),
      answerUUID: answerWord.uuid,
      choicesUUIDs: shuffledChoices.map((w) => w.uuid),
    };

    this.rounds[round.uuid] = round;
    answerWord.shownRounds.push(round.uuid);

    for (const otherWord of companionWords) {
      if (!answerWord.choices[otherWord.uuid]) {
        answerWord.choices[otherWord.uuid] = new CChoice();
      }
      answerWord.choices[otherWord.uuid].shown++;
    }

    return round;
  }

  public recordAnswer(roundUUID: string, userAnswerUUID: string): boolean {
    const round = this.rounds[roundUUID];
    if (!round) {
      throw new Error("존재하지 않는 라운드입니다.");
    }

    const isCorrect = round.answerUUID === userAnswerUUID;
    round.userAnswerUUID = userAnswerUUID;
    round.isCorrect = isCorrect;

    if (!isCorrect) {
      const answerWord = this.words[round.answerUUID];
      if (!answerWord.choices[userAnswerUUID]) {
        answerWord.choices[userAnswerUUID] = new CChoice();
      }
      answerWord.choices[userAnswerUUID].picked++;
    }

    return isCorrect;
  }
}
