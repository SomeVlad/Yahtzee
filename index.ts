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

type Category = {
    textObject: Phaser.GameObjects.Text
    label: string
    score: number
    used: boolean
}

type CategoryDict = Record<CategoryName, Category>

function createCategories(): CategoryDict {
    const dict = {} as CategoryDict
    toPairs(CategoryLabelsByName).forEach(([name, label]) => {
        dict[name] = {
            label,
            score: 0,
            used: false,
            textObject: {} as Phaser.GameObjects.Text,
        }
    }, {})

    return dict
}

class YahtzeeGame extends Phaser.Scene {
    dice: Phaser.GameObjects.Sprite[] = []
    rollButton!: Phaser.GameObjects.Text
    rollsLeft: number = 3
    scoreText!: Phaser.GameObjects.Text // Ensure it's initialized in create method
    categories: CategoryDict

    constructor() {
        super("YahtzeeGame")

        this.categories = createCategories()
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

    create() {
        this.scoreText = this.add.text(16, 16, "Score: ", {
            fontSize: "32px",
            color: "#FFF",
        })

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

        // Roll button setup...
        this.rollButton = this.add
            .text(400, 500, "Roll Dice", { fontSize: "32px" })
            .setInteractive()
            .on("pointerdown", () => this.rollDice())

        toPairs(this.categories).forEach(
            ([category, { label, used }], index) => {
                // Store the text object reference
                this.categories[category].textObject = this.add
                    .text(400, 550 + 30 * index, label, {
                        fontSize: "24px",
                        color: "#FFF",
                    })
                    .setInteractive()
                    .on("pointerdown", () => this.selectCategory(category))
            },
        )
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

    selectCategory(categoryName: CategoryName) {
        const category = this.categories[categoryName]

        if (category.used) return // Ignore if already used

        let score = 0
        const values: number[] = this.dice.map((dice) => dice.getData("value"))

        const valueCounts = reduce(
            (acc, value) => {
                acc[value] = (acc[value] || 0) + 1
                return acc
            },
            {} as { [key: number]: number },
            values,
        )

        // Map category names to their numeric values
        const categoryValues = {
            Ones: 1,
            Twos: 2,
            Threes: 3,
            Fours: 4,
            Fives: 5,
            Sixes: 6,
        }

        switch (categoryName) {
            case "Ones":
            case "Twos":
            case "Threes":
            case "Fours":
            case "Fives":
            case "Sixes": {
                // Generalize scoring for numeric categories
                const categoryValue = categoryValues[categoryName]
                score = this.calculateScoreForNumericCategories(
                    values,
                    categoryValue,
                )
                break
            }
            case "FullHouse": {
                const counts = reduce(
                    (acc, value) => {
                        acc[value] = (acc[value] || 0) + 1
                        return acc
                    },
                    {} as { [key: number]: number },
                    values,
                )
                const isFullHouse =
                    Object.values(counts).sort().join("") === "23"
                score = isFullHouse ? 25 : 0
                break
            }
            case "Chance": {
                score = values.reduce((acc, value) => acc + value, 0)
                break
            }
            case "ThreeOfAKind": {
                score = Object.values(valueCounts).some((count) => count >= 3)
                    ? values.reduce((acc, value) => acc + value, 0)
                    : 0
                break
            }
            case "FourOfAKind": {
                score = Object.values(valueCounts).some((count) => count >= 4)
                    ? values.reduce((acc, value) => acc + value, 0)
                    : 0
                break
            }
            case "SmallStraight": {
                const smallStrSeq = ["1234", "2345", "3456"]
                const sortedUniqueValues = [...new Set(values)].sort().join("")
                score = smallStrSeq.some((seq) =>
                    sortedUniqueValues.includes(seq),
                )
                    ? 30
                    : 0
                break
            }
            case "LargeStraight": {
                const largeStrSeq = ["12345", "23456"]
                const sortedUniqueVal = [...new Set(values)].sort().join("")
                score = largeStrSeq.includes(sortedUniqueVal) ? 40 : 0
                break
            }
            case "YAHTZEE": {
                score = Object.values(valueCounts).some((count) => count === 5)
                    ? 50
                    : 0
                break
            }
        }

        category.score = score
        category.used = true

        category.textObject.setStyle({ color: "#808080" }) // Change color to indicate it's used
        category.textObject.setText(`${category.label} (Used)`) // Append "(Used)" to the label

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
