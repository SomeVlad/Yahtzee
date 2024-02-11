import Phaser from "phaser"

export class ScoreIndicator extends Phaser.GameObjects.Text {
    constructor(scene: Phaser.Scene, x: number, y: number, text: string) {
        super(scene, x, y, text, {
            color: "#fff",
            fontSize: "24px",
            align: "left",
        })
        this.setOrigin(0, 0)
    }

    updateScore(score: number) {
        this.setText(`${this.text}: ${score}`)
        this.setStyle({ color: "#808080" })
    }
}
