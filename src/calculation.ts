function countValues(values: number[]): Record<number, number> {
    return values.reduce((acc: Record<number, number>, value) => {
        acc[value] = (acc[value] || 0) + 1
        return acc
    }, {})
}

export function calculateScoreForNumericCategories(
    values: number[],
    categoryValue: number,
): number {
    return values
        .filter((value) => value === categoryValue)
        .reduce((acc, value) => acc + value, 0)
}

export function calculateFullHouseScore(values: number[]): number {
    const counts = countValues(values)
    const isFullHouse = Object.values(counts).sort().join("") === "23"
    return isFullHouse ? 25 : 0
}

export function calculateChanceScore(values: number[]): number {
    return values.reduce((acc, value) => acc + value, 0)
}

export function calculateThreeOfAKindScore(values: number[]): number {
    // ???
    const counts = countValues(values)
    return Object.values(counts).some((count) => count >= 3)
        ? calculateChanceScore(values)
        : 0
}

export function calculateFourOfAKindScore(values: number[]): number {
    const counts = countValues(values)
    return Object.values(counts).some((count) => count >= 4)
        ? calculateChanceScore(values)
        : 0
}

export function calculateSmallStraightScore(values: number[]): number {
    const sortedUniqueValues = [...new Set(values)].sort().join("")
    const smallStrSeq = ["1234", "2345", "3456"]
    return smallStrSeq.some((seq) => sortedUniqueValues.includes(seq)) ? 30 : 0
}

export function calculateLargeStraightScore(values: number[]): number {
    const sortedUniqueVal = [...new Set(values)].sort().join("")
    return ["12345", "23456"].includes(sortedUniqueVal) ? 40 : 0
}

export function calculateYahtzeeScore(values: number[]): number {
    const counts = countValues(values)
    return Object.values(counts).some((count) => count === 5) ? 50 : 0
}
