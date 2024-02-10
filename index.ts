import Phaser from "phaser"

class YahtzeeGame extends Phaser.Scene {
    dice: Phaser.GameObjects.Sprite[] = []
    rollButton!: Phaser.GameObjects.Text
    rollsLeft: number = 3
    scoreText!: Phaser.GameObjects.Text // Ensure it's initialized in create method
    categories: {
        [key: string]: { label: string; score: number; used: boolean }
    } = {
        Ones: { label: "Ones", score: 0, used: false },
        Twos: { label: "Twos", score: 0, used: false },
        Threes: { label: "Threes", score: 0, used: false },
        Fours: { label: "Fours", score: 0, used: false },
        Fives: { label: "Fives", score: 0, used: false },
        Sixes: { label: "Sixes", score: 0, used: false },
        FullHouse: { label: "Full House", score: 0, used: false },
        Chance: { label: "Chance", score: 0, used: false },
    }

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

        // Category selection setup...
        Object.entries(this.categories).forEach(
            ([category, { label, used, score }], index) => {
                this.add
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

    selectCategory(categoryName: string) {
        const category = this.categories[categoryName]

        if (category.used) return // Ignore if already used

        let score = 0
        const values = this.dice.map((dice) => dice.getData("value"))

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
            case "Sixes":
                // Generalize scoring for numeric categories
                const categoryValue = categoryValues[categoryName]
                score = values
                    .filter((value) => value === categoryValue)
                    .reduce((acc, value) => acc + value, 0)
                break
            case "FullHouse":
                const counts = values.reduce((acc, value) => {
                    acc[value] = (acc[value] || 0) + 1
                    return acc
                }, {})
                const isFullHouse =
                    Object.values(counts).sort().join("") === "23"
                score = isFullHouse ? 25 : 0
                break
            case "Chance":
                score = values.reduce((acc, value) => acc + value, 0)
                break
            // Implement other categories...
        }

        category.score = score
        category.used = true
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
