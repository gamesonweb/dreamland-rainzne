import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { Scene, loadSceneAsync, SceneLoader } from "@babylonjs/core";
import { ModelEnum } from "./ModelEnum";

/**
 * ModelLoader is a class that handles loading 3D models into a Babylon.js scene.
 */
export class SceneModelLoader {
    scene: Scene;

    constructor(Scene: Scene) {
        this.scene = Scene;
        registerBuiltInLoaders();
    }

    
    public async appendSceneFromPath(modelEnum: ModelEnum): Promise<void> {
        try {
            // Utiliser le chemin base pour accéder aux assets
            const basePath = import.meta.env.BASE_URL || '/';
            
            // Exemple avec un switch pour gérer différents modèles
            let modelPath = '';
            switch(modelEnum) {
                case ModelEnum.MAP:
                    modelPath = `${basePath}models/MapForTest.glb`;
                    break;
                // Autres cas...
                default:
                    modelPath = `${basePath}models/MapForTest.glb`;
            }
            
            console.log("Loading model from:", modelPath);
            
            // Chargement avec le chemin correct
            await SceneLoader.AppendAsync("", modelPath, this.scene);
            console.log("Model loaded successfully");
        } catch (error) {
            console.error("Failed to load model:", error);
            throw new Error(`Failed to load model: ${error}`);
        }
    }

    async loadSceneFromPath(modelEnum: ModelEnum): Promise<void> {
        try {
            await loadSceneAsync(modelEnum, this.scene.getEngine());
        } catch (error) {
            throw new Error(`Failed to load model from ${modelEnum}: ${error}`);
        }
    }
}