import Phaser from "phaser"

export class Button extends Phaser.GameObjects.Text {
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        text: string,
        callback: () => void,
    ) {
        super(scene, x, y, text, {
            color: "#fff",
            fontSize: "32px",
            // backgroundColor: "#fff",
        })

        this.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => callback())
            .on("pointerover", () => this.enterButtonHoverState())
            .on("pointerout", () => this.enterButtonRestState())
    }

    private enterButtonHoverState() {
        this.setStyle({ fill: "#ff0" })
    }

    private enterButtonRestState() {
        this.setStyle({ fill: "#0f0" })
    }
}
