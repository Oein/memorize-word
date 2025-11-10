# 단어 암기 도우미

## IWord
{
    uuid : string

    단어 : string
    뜻 : string

    학습 필요도 : (최근 $$N개의 기록중 실패) / $$N : (get(): number)
    가장 최근에 나온 Round : string[] // round들의 uuid
    이 단어와 함께 나온 단어들: KV<uuid, IChoice> // 함께 나온 단어들의 uuid와 선택/노출 기록
    이 단어가 나온 총 횟수 : number
}

## IChoice
{
    chosen : number // 선택된 횟수
    shown : number // 보여진 횟수

    선택 비율 : $chosen / $shown : (get(): number)
}

// 단어를 뽑는 알고리즘
// 1. 학습 필요도가 높은 단어 우선 (잘 틀리는 단어)
// 2. 가장 최근에 나온 Round가 낮은 단어 우선 (최근에 나와서 외운 단어는 제외)
// 3. 학습 필요도가 낮더라도 Round가 많이 지난 단어들에게 가중치 부여 (오래된 단어도 복습 필요)

ROUND가중치 = 5
최근단어무시가중치 = 3

필요도가중치 = 100
랜덤가중치 = 15

function score2choose(word: IWord): number {
    const need = word.학습_필요도
    const round = word.가장_최근에_나온_Round

    return (need * 필요도가중치) + ((현재ROUND - round - 최근단어무시가중치) * ROUND가중치) + (Math.random() * 랜덤가중치)
}

// 학습 종료 가능 조건 체크
// 1. 모든 단어의 학습 필요도가 일정 이하 (예: 0.2) 인가?
// 2. 각 단어가 최소한 N번 이상 출제되었는가? (예: 5번)

필요도임계값 = 0.2
최소출제횟수 = 5

function canEndLearning(words: IWord[]): boolean {
    for (const word of words) {
        if (word.학습_필요도 > 필요도임계값) {
            return false
        }
        if (word.이_단어가_나온_총_횟수 < 최소출제횟수) {
            return false
        }
    }
    return true
}

// 같이 나올 단어 선택 알고리즘
// 1. 함께 나왔을때 선택 비율이 높은 단어 우선
// 2. 함께 나온 횟수가 적은 단어 우선 (새로운 조합 시도)

틀림가중치 = 100
같이나오지않음가중치 = 500
랜덤성가중치 = 50

function pickCompanionWords(word: IWord, allWords: IWord[], count: number): IWord[] {
    // 각 단어마다 가중치를 계산
    const candidates = allWords.map(w => {
        const choice = word.이_단어와_함께_나온_단어들[w.uuid]
        let score = 0
        if (choice) {
            score += choice.선택_비율 * 틀림가중치 // 자주 선택된 단어 우선
        } else {
            score += 같이나오지않음가중치 // 한번도 함께 나온 적 없는 단어 우선
        }
        score += Math.random() * 랜덤성가중치 // 약간의 랜덤성 추가
        return { word: w, score }
    })

    return candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(c => c.word)
}