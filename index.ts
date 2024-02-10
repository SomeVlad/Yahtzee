import Phaser from "phaser"
import { reduce, toPairs } from "rambda/immutable"

type CategoryName =
    | "Ones"
    | "Twos"
    | "Threes"
    | "Fours"
    | "Fives"
    | "Sixes"
    | "FullHouse"
    | "Chance"
    | "ThreeOfAKind"
    | "FourOfAKind"
    | "SmallStraight"
    | "LargeStraight"
    | "YAHTZEE"

const CategoryLabelsByName: Record<CategoryName, string> = {
    Ones: "Ones",
    Twos: "Twos",
    Threes: "Threes",
    Fours: "Fours",
    Fives: "Fives",
    Sixes: "Sixes",
    FullHouse: "Full House",
    Chance: "Chance",
    ThreeOfAKind: "Three of a Kind",
    FourOfAKind: "Four of a Kind",
    SmallStraight: "Small Straight",
    LargeStraight: "Large Straight",
    YAHTZEE: "YAHTZEE",
}

interface Category {
    textObject: Phaser.GameObjects.Text | null
    label: string
    score: number
    used: boolean
}

function createCategories() {
    const dict = {} as Record<CategoryName, Category>
    toPairs(CategoryLabelsByName).forEach(([name, label]) => {
        dict[name] = {
            label,
            score: 0,
            used: false,
            textObject: null,
        }
    }, {})

    return dict
}

class YahtzeeGame extends Phaser.Scene {
    dice: Phaser.GameObjects.Sprite[] = []
    rollButton!: Phaser.GameObjects.Text
    rollsLeft: number = 3
    scoreText!: Phaser.GameObjects.Text // Ensure it's initialized in create method
    categories: Record<CategoryName, Category> = createCategories()

    constructor() {
        super("YahtzeeGame")
    }

    private calculateScoreForNumericCategories(
        values: number[],
        categoryValue: number,
    ): number {
        return values
            .filter((value) => value === categoryValue)
            .reduce((acc, value) => acc + value, 0)
    }

    preload() {
        this.load.image("dice1", "assets/dice1.png")
        this.load.image("dice2", "assets/dice2.png")
        this.load.image("dice3", "assets/dice3.png")
        this.load.image("dice4", "assets/dice4.png")
        this.load.image("dice5", "assets/dice5.png")
        this.load.image("dice6", "assets/dice6.png")
    }

    initializeDice() {
        for (let i = 0; i < 5; i++) {
            const dice = this.add
                .sprite(150 + i * 100, 100, "dice1")
                .setInteractive()
            dice.setData("value", 1) // Initial value
            dice.setData("held", false) // Initialize held state
            let heldIndicator = this.add
                .text(150 + i * 100, 150, "", {
                    fontSize: "16px",
                    color: "#FFFFFF",
                })
                .setOrigin(0.5)
            dice.on("pointerdown", () => {
                if (this.rollsLeft > 0 && this.rollsLeft < 3) {
                    // Only allow holding if there are rolls left and after the first roll
                    let isHeld = dice.getData("held")
                    dice.setData("held", !isHeld)
                    dice.setTint(!isHeld ? 0x86bfda : 0xffffff) // Change tint to indicate selection
                    heldIndicator.setText(!isHeld ? "Held" : "")
                }
            })
            this.dice.push(dice)
        }
    }

    initializeCategories() {
        toPairs(this.categories).forEach(([name, category], index) => {
            const yPos = 550 + 30 * index

            // Store the text object reference
            category.textObject = this.add
                .text(400, yPos, category.label, {
                    fontSize: "24px",
                    color: "#FFF",
                })
                .setInteractive()
                .on("pointerdown", () => this.selectCategory(name))
        })
    }

    create() {
        this.scoreText = this.add.text(16, 16, "Score: ", {
            fontSize: "32px",
            color: "#FFF",
        })

        this.initializeDice()
        this.initializeCategories()

        // Roll button setup...
        this.rollButton = this.add
            .text(400, 500, "Roll Dice", { fontSize: "32px" })
            .setInteractive()
            .on("pointerdown", () => this.rollDice())
    }

    rollDice() {
        if (this.rollsLeft > 0) {
            this.dice.forEach((dice) => {
                if (!dice.getData("held")) {
                    // Roll and animate dice...
                    let value = Phaser.Math.Between(1, 6)
                    dice.setTexture(`dice${value}`)
                    dice.setData("value", value)
                }
            })
            this.rollsLeft--
            this.updateRollsLeftText()
        }
    }

    calculateScore(categoryName: CategoryName, values: number[]): number {
        switch (categoryName) {
            case "Ones":
                return calculateScoreForNumericCategories(values, 1)
            case "Twos":
                return calculateScoreForNumericCategories(values, 2)
            case "Threes":
                return calculateScoreForNumericCategories(values, 3)
            case "Fours":
                return calculateScoreForNumericCategories(values, 4)
            case "Fives":
                return calculateScoreForNumericCategories(values, 5)
            case "Sixes":
                return calculateScoreForNumericCategories(values, 6)
            case "FullHouse":
                return calculateFullHouseScore(values)
            case "Chance":
                return calculateChanceScore(values)
            case "ThreeOfAKind":
                return calculateThreeOfAKindScore(values)
            case "FourOfAKind":
                return calculateFourOfAKindScore(values)
            case "SmallStraight":
                return calculateSmallStraightScore(values)
            case "LargeStraight":
                return calculateLargeStraightScore(values)
            case "YAHTZEE":
                return calculateYahtzeeScore(values)
            default:
                return 0
        }
    }

    selectCategory(categoryName: CategoryName) {
        const category = this.categories[categoryName]

        if (category.used) return // Ignore if already used

        const values: number[] = this.dice.map((dice) => dice.getData("value"))
        const score = this.calculateScore(categoryName, values)

        category.score = score
        category.used = true

        if (category.textObject) {
            category.textObject.setStyle({ color: "#808080" })
            category.textObject.setText(`${category.label} (Used)`)
        }

        this.scoreText.setText(`Score for ${category.label}: ${score}`)
    }

    updateRollsLeftText() {
        this.rollButton.setText(`Roll Dice (${this.rollsLeft} left)`)
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: YahtzeeGame,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: "phaser-game",
        width: "100%",
        height: "100%",
    },
}

new Phaser.Game(config)

function countValues(values: number[]): Record<number, number> {
    return values.reduce((acc: Record<number, number>, value) => {
        acc[value] = (acc[value] || 0) + 1
        return acc
    }, {})
}

function calculateScoreForNumericCategories(
    values: number[],
    categoryValue: number,
): number {
    return values
        .filter((value) => value === categoryValue)
        .reduce((acc, value) => acc + value, 0)
}

function calculateFullHouseScore(values: number[]): number {
    const counts = countValues(values)
    const isFullHouse = Object.values(counts).sort().join("") === "23"
    return isFullHouse ? 25 : 0
}

function calculateChanceScore(values: number[]): number {
    return values.reduce((acc, value) => acc + value, 0)
}

function calculateThreeOfAKindScore(values: number[]): number {
    const counts = countValues(values)
    return Object.values(counts).some((count) => count >= 3)
        ? calculateChanceScore(values)
        : 0
}

function calculateFourOfAKindScore(values: number[]): number {
    const counts = countValues(values)
    return Object.values(counts).some((count) => count >= 4)
        ? calculateChanceScore(values)
        : 0
}

function calculateSmallStraightScore(values: number[]): number {
    const sortedUniqueValues = [...new Set(values)].sort().join("")
    const smallStrSeq = ["1234", "2345", "3456"]
    return smallStrSeq.some((seq) => sortedUniqueValues.includes(seq)) ? 30 : 0
}

function calculateLargeStraightScore(values: number[]): number {
    const sortedUniqueVal = [...new Set(values)].sort().join("")
    return ["12345", "23456"].includes(sortedUniqueVal) ? 40 : 0
}

function calculateYahtzeeScore(values: number[]): number {
    const counts = countValues(values)
    return Object.values(counts).some((count) => count === 5) ? 50 : 0
}
