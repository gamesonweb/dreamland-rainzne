import { Engine, Scene } from "@babylonjs/core";
import { BasicScene } from "./Scene/BasicScene";

class App {
    private canvas: HTMLCanvasElement
    private engine: Engine;
    private scene!: Scene;

    constructor() {
        this.canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        this.engine = new Engine(this.canvas, true);
        
        // Initialisation asynchrone de la scène
        this.initializeAsync();
    }

    private async initializeAsync() {
        // Créer la scène une seule fois
        const basicScene = new BasicScene(this.engine);
        this.scene = await basicScene.createScene();
        
        // Ne pas initialiser une autre caméra ici car BasicScene a déjà une caméra
        this.runMainRenderLoop();
        
        // Ajout de l'événement de redimensionnement
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    private runMainRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

new App();