import Phaser from "phaser"

class YahtzeeGame extends Phaser.Scene {
    dice: Phaser.GameObjects.Sprite[] = []

    rollButton!: Phaser.GameObjects.Text

    rollsLeft: number = 3

    scoreText: Phaser.GameObjects.Text
    categories: { [key: string]: { score: number; used: boolean } }

    constructor() {
        super("YahtzeeGame")
    }

    preload() {
        // Load dice images
        this.load.image("dice1", "assets/dice1.png")
        this.load.image("dice2", "assets/dice2.png")
        this.load.image("dice3", "assets/dice3.png")
        this.load.image("dice4", "assets/dice4.png")
        this.load.image("dice5", "assets/dice5.png")
        this.load.image("dice6", "assets/dice6.png")
    }

    create() {
        // Create 5 dice at different positions
        for (let i = 0; i < 5; i++) {
            const dice = this.add
                .sprite(150 + i * 100, 100, "dice1")
                .setInteractive()
            dice.setData("value", 1) // Initial value
            let heldIndicator = this.add
                .text(150 + i * 100, 150, "", {
                    fontSize: "16px",
                    color: "#FFFFFF",
                })
                .setOrigin(0.5)
            dice.setData("heldIndicator", heldIndicator)

            dice.on("pointerdown", () => {
                // if (this.rollsLeft < 3) {
                //     // Allow toggling hold state after the first roll
                //     dice.setData("held", !dice.getData("held"))
                //     dice.setTint(dice.getData("held") ? 0x00ff00 : 0xffffff)
                // }
                let isHeld = dice.getData("held")
                dice.setData("held", !isHeld)
                dice.setTint(!isHeld ? 0x86bfda : 0xffffff) // Change tint to indicate selection
                heldIndicator.setText(!isHeld ? "Held" : "")
            })
            this.dice.push(dice)

            this.scoreText = this.add.text(16, 16, "Score: 0", {
                fontSize: "32px",
                color: "#FFF",
            })
            this.categories = {
                Ones: { score: 0, used: false },
                // Add other categories similarly...
            }

            // Example: Interactive text for scoring category "Ones"
            let onesText = this.add
                .text(400, 550, "Ones", { fontSize: "24px", color: "#FFF" })
                .setInteractive()
            onesText.on("pointerdown", () => this.selectCategory("Ones"))
        }

        // Roll button
        this.rollButton = this.add
            .text(400, 500, "Roll Dice", { fontSize: "32px" })
            .setInteractive()
            .on("pointerdown", () => this.rollDice())
    }

    selectCategory(categoryName: string) {
        if (this.categories[categoryName].used) return // Ignore if already used

        // Example scoring calculation for "Ones"
        let score = this.dice.filter(
            (dice) => dice.getData("value") === 1,
        ).length // Replace with actual scoring logic
        this.categories[categoryName].score = score
        this.categories[categoryName].used = true

        // Update score display
        this.scoreText.setText(`Score: ${score}`)
    }

    rollDice() {
        // Add a simple animation effect for rolling dice
        this.dice.forEach((dice) => {
            // Only animate non-held dice
            if (!dice.getData("held")) {
                this.tweens.add({
                    targets: dice,
                    y: "-=50",
                    yoyo: true,
                    duration: 100,
                    onComplete: () => {
                        let value = Phaser.Math.Between(1, 6)
                        dice.setTexture(`dice${value}`)
                        dice.setData("value", value)
                    },
                })
            }
        })

        if (this.rollsLeft > 0) {
            this.dice.forEach((dice) => {
                if (!dice.getData("held")) {
                    const value = Phaser.Math.Between(1, 6)
                    dice.setTexture(`dice${value}`)
                    dice.setData("value", value)
                }
            })
            this.rollsLeft--
            this.updateRollsLeftText()

            let onesScore = this.dice.filter(
                (dice) => dice.getData("value") === 1,
            ).length
            console.log(`Score for ones: ${onesScore}`) // This would be where you update the UI instead
        }
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
        mode: Phaser.Scale.RESIZE, // This will resize the game to fill the whole screen
        parent: "phaser-game",
        width: "100%",
        height: "100%",
    },
}

new Phaser.Game(config)
