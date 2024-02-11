import Phaser from "phaser"
import type { GameScene } from ".."

export class Dice extends Phaser.GameObjects.Sprite {
    private value: number
    private held: boolean
    private heldIndicator: Phaser.GameObjects.Text
    scene: GameScene

    constructor(scene: GameScene, x: number, y: number) {
        super(scene, x, y, "dice", "1")
        this.scene = scene
        this.value = 1
        this.held = false
        // Create the held indicator text
        this.heldIndicator = scene.add
            .text(x, y + 50, "", {
                fontSize: "16px",
                color: "#FFFFFF",
            })
            .setOrigin(0.5)
        this.setInteractive()
        this.on("pointerdown", this.toggleHeld, this)
    }

    roll() {
        if (!this.held) {
            this.value = Phaser.Math.Between(1, 6)
            this.setTexture("dice", this.value)
        }
    }

    toggleHeld() {
        if (this.scene.isDiceRolled) {
            this.held = !this.held
            this.setTint(this.held ? 0x86bfda : 0xffffff)
            this.heldIndicator.setText(this.held ? "Held" : "")
        }
    }

    getValue(): number {
        return this.value
    }

    isHeld(): boolean {
        return this.held
    }

    reset() {
        this.held = false
        this.clearTint()
        this.heldIndicator.setText("") // Clear the held indicator text
    }
}
