import Phaser from "phaser"
import { reduce, map, toPairs, mapObjIndexed, forEach } from "rambda/immutable"
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

class YahtzeeGame extends Phaser.Scene {
    dice: Phaser.GameObjects.Sprite[] = []
    rollButton!: Phaser.GameObjects.Text
    rollsLeft: number = 3
    scoreText!: Phaser.GameObjects.Text
    categories: Record<CategoryName, Category> = createCategories()
    isCombinationSelected: boolean = false
    isDiceRolled: boolean = false
    diceGroup!: Phaser.GameObjects.Group

    constructor() {
        super("YahtzeeGame")
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
        this.diceGroup = this.add.group()

        for (let i = 0; i < 5; i++) {
            const dice = this.add
                .sprite(150 + i * 100, 100, "dice1")
                .setInteractive()
            dice.setData("value", 1) // Initial value
            dice.setData("held", false) // Initialize held state
            this.diceGroup.add(dice)

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
            // this.dice.push(dice)
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
            this.diceGroup.getChildren().forEach((dice) => {
                if (!dice.getData("held")) {
                    // Roll and animate dice...
                    let value = Phaser.Math.Between(1, 6)
                    dice.setTexture(`dice${value}`)
                    dice.setData("value", value)
                }
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
        if (!this.isDiceRolled || this.isCombinationSelected) return // prevent selecting another combination this turn

        const category = this.categories[categoryName]

        if (category.used) return // Ignore if already used

        const values: number[] = this.diceGroup
            .getChildren()
            .map((dice) => dice.getData("value"))
        const score = this.calculateScore(categoryName, values)

        category.score = score
        category.used = true
        this.isCombinationSelected = true

        if (category.textObject) {
            category.textObject.setStyle({ color: "#808080" })
            category.textObject.setText(`${category.label} (Used)`)
        }

        this.scoreText.setText(`Score for ${category.label}: ${score}`)
        this.endTurn() // Prepare for the next turn
    }

    updateRollsLeftText() {
        this.rollButton.setText(`Roll Dice (${this.rollsLeft} left)`)
    }

    endTurn() {
        // Check for game end condition here
        this.checkGameOver()

        // Prepare for the next turn
        this.prepareNextTurn()
    }

    prepareNextTurn() {
        // Reset turn state
        this.isCombinationSelected = false
        this.isDiceRolled = false
        this.rollsLeft = 3 // Reset the number of rolls for the next turn

        // // Reset dice state
        // this.diceGroup.getChildren().forEach((dice) => {
        //     dice.setData("held", false)
        //     dice.setTint(0xffffff)
        //     // dice.setTint(0xffffff) // Reset tint color
        // })

        this.initializeDice()

        // Check for game end condition here (e.g., all categories used)
        // If game over, handle accordingly
        this.checkGameOver()

        // Update UI as necessary, e.g., rolls left text
        this.updateRollsLeftText()
    }

    checkGameOver() {
        const allUsed = Object.values(this.categories).every(
            (category) => category.used,
        )
        if (allUsed) {
            // Handle game over (e.g., show final score, restart option)
            console.log("Game Over")
            // Show final scores, restart button, etc.
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
