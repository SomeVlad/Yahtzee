import Phaser from "phaser"
import { forEach, toPairs } from "rambda/immutable"
import {
    calculateChanceScore,
    calculateFourOfAKindScore,
    calculateFullHouseScore,
    calculateLargeStraightScore,
    calculateScoreForNumericCategories,
    calculateSmallStraightScore,
    calculateThreeOfAKindScore,
    calculateYahtzeeScore,
} from "./calculation"
import { Dice } from "./components/Dice.ts"
import { Button } from "./components/Button.ts"
import { ScoreIndicator } from "./components/ScoreIndicator.ts"

const CategoryLabelsByName = {
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
} as const

type CategoryName = keyof typeof CategoryLabelsByName

interface Category {
    textObject: Phaser.GameObjects.Text | null
    label: string
    score: number
    used: boolean
}

function createCategories() {
    const dict = {} as Record<CategoryName, Category>
    forEach((val, prop) => {
        dict[prop as CategoryName] = {
            label: val,
            score: 0,
            used: false,
            textObject: null,
        }
    }, CategoryLabelsByName)

    return dict
}

export class GameScene extends Phaser.Scene {
    rollButton!: Phaser.GameObjects.Text
    rollsLeft: number = 3
    scoreText!: Phaser.GameObjects.Text
    categories: Record<CategoryName, Category> = createCategories()
    isCombinationSelected: boolean = false
    isDiceRolled: boolean = false
    diceGroup!: Phaser.GameObjects.Group
}

class YahtzeeGame extends GameScene {
    constructor() {
        super("YahtzeeGame")
    }

    preload() {
        this.load.atlasXML("dice", "assets/dice.png", "assets/dice.xml")
    }

    initializeDice() {
        this.diceGroup = this.add.group()

        for (let i = 0; i < 5; i++) {
            const dice = new Dice(this, 150 + i * 100, 100)
            this.add.existing(dice)
            this.diceGroup.add(dice)
        }
    }

    initializeCategories() {
        toPairs(this.categories).forEach(([name, category], index) => {
            const yPos = 550 + 30 * index

            category.textObject = new ScoreIndicator(
                this,
                400,
                yPos,
                category.label,
            )
            this.add.existing(category.textObject)

            category.textObject.setInteractive().on("pointerdown", () => {
                this.selectCategory(name as CategoryName)
            })
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
        this.rollButton = new Button(this, 400, 500, "Roll Dice", () =>
            this.rollDice(),
        )
        this.add.existing(this.rollButton)
    }

    rollDice() {
        if (this.rollsLeft > 0) {
            this.diceGroup.getChildren().forEach((diceObj) => {
                const dice = diceObj as Dice
                dice.roll()
            })
            this.rollsLeft--
            this.isDiceRolled = true // Indicate that the dice have been rolled this turn
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
        if (!this.isDiceRolled || this.isCombinationSelected || category.used) {
            return
        }

        const values: number[] = this.diceGroup.getChildren().map((diceObj) => {
            const dice = diceObj as Dice

            return dice.getValue()
        })

        category.score = this.calculateScore(categoryName, values)
        category.used = true
        this.isCombinationSelected = true

        if (category.textObject instanceof ScoreIndicator) {
            category.textObject.updateScore(category.score)
        }

        this.updateTotalScore()
        this.endTurn() // Prepare for the next turn
    }

    updateTotalScore() {
        const totalScore = Object.values(this.categories).reduce(
            (acc, category) => acc + category.score,
            0,
        )
        this.scoreText.setText(`Score: ${totalScore}`)
    }

    updateRollsLeftText() {
        this.rollButton.setText(`Roll Dice (${this.rollsLeft} left)`)
    }

    endTurn() {
        this.checkGameOver()

        this.prepareNextTurn()
    }

    prepareNextTurn() {
        // Reset turn state
        this.isCombinationSelected = false
        this.isDiceRolled = false
        this.rollsLeft = 3 // Reset the number of rolls for the next turn

        // Reset dice state
        this.diceGroup.getChildren().forEach((diceObj) => {
            const dice = diceObj as Dice

            dice.reset()
        })

        this.updateRollsLeftText()
    }

    checkGameOver() {
        const allUsed = Object.values(this.categories).every(
            (category) => category.used,
        )
        if (allUsed) {
            console.log("Game Over")
        }
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
