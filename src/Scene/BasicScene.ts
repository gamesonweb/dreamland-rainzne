import { Scene, Engine, Vector3, HemisphericLight, MeshBuilder, TransformNode, PhysicsAggregate, PhysicsShapeType, ShaderMaterial, DynamicTexture, StandardMaterial, Color3, Texture, CreateAudioEngineAsync, CreateSoundAsync } from "@babylonjs/core";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin"; 
//import * as BABYLON from "babylonjs";


import { ModelEnum } from "../ModelFactory/src/ModelEnum";
import { SceneModelLoader } from "../ModelFactory/src/SceneModelLoader";
import { CameraPlayer } from "../player/cameraPlayer";
import { PlayerControl } from "../player/PlayerControl";

// Declare global HavokPhysics for proper TypeScript recognition
declare const HavokPhysics: () => Promise<any>;

export class BasicScene extends Scene {
    private _isInitialized = false;
    
    constructor(engine: Engine) {
        super(engine);
        
    }
    

    
 
    public async createScene() {
        const audioEngine = await CreateAudioEngineAsync();

        audioEngine.volume =0.09;

        // Modifiez le chemin de la musique en ajoutant le préfixe de base si nécessaire
        const music = CreateSoundAsync("music",
            import.meta.env.BASE_URL + "assets/music/music.mp3"
        );
       

        
        (await music).play({ loop: true,volume: 0.5 });

    

        // Éviter la double initialisation
        if (this._isInitialized) {
            return this;
        }
        this._isInitialized = true;
    
        
        // 1. Create light
        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this);
        light.intensity = 0.7;
        
        // 2. Initialize Havok physics
        console.log("Initializing Havok physics...");
        try {
            const havokInstance = await HavokPhysics();
            const havokPlugin = new HavokPlugin(true, havokInstance);
            
            // 3. Enable physics in the scene with gravity
            this.enablePhysics(new Vector3(0, -8, 0), havokPlugin);
            console.log("Physics enabled successfully");
        } catch (error) {
            console.error("Failed to initialize Havok physics:", error);
            throw new Error("Physics initialization failed");
        }
        
        // 4. Load the map
        console.log("Loading map...");
        const modelLoader = new SceneModelLoader(this);
        
        const _width = 300;
        const _height = 300;
        console.log("Model loader initialized. Scene size:", { _width, _height });
        await modelLoader.appendSceneFromPath(ModelEnum.MAP);
        console.log("Map loaded successfully");
        
        // 5. Find all ground/static meshes
        console.log("Finding static meshes for physics...");
        const staticMeshes = this.meshes.filter(mesh => 
            // Filter for potential ground/static elements based on naming or position
            mesh.name.toLowerCase().includes("ground") || 
            mesh.name.toLowerCase().includes("floor") || 
            mesh.name.toLowerCase().includes("world") ||
            mesh.name.toLowerCase().includes("terrain") ||
            (mesh.parent && mesh.parent instanceof TransformNode && mesh.position.y < 0.5)
        );

        // Create a dynamic texture to track visited areas
        const dynamicTexture = new DynamicTexture("dynamicTexture", { width: _width, height: _height }, this, false);
        const dynamicContext = dynamicTexture.getContext();
        dynamicContext.fillStyle = "black";
        dynamicContext.fillRect(0, 0, _width, _height);
        dynamicTexture.update();

        // Create the shader material
        const shaderMaterial = new ShaderMaterial("colorRevealShader", this, {
            vertexSource: `
                precision highp float;
                attribute vec3 position;
                attribute vec2 uv;
                varying vec2 vUV;
                uniform mat4 worldViewProjection;
                void main() {
                    vUV = uv;
                    gl_Position = worldViewProjection * vec4(position, 1.0);
                }
            `,
            fragmentSource: `
                precision highp float;
                varying vec2 vUV;
                uniform sampler2D textureSampler;
                uniform sampler2D visitedTexture;

                vec3 toGrayscale(vec3 color) {
                    float gray = dot(color, vec3(0.3, 0.59, 0.11)); // Standard grayscale conversion
                    return vec3(gray);
                }

                void main() {
                    vec3 color = texture2D(textureSampler, vUV).rgb;
                    float visited = texture2D(visitedTexture, vUV).r; // Check if the area is visited
                    vec3 grayscaleColor = toGrayscale(color); // Convert to grayscale
                    color = vec3(color.r == 1.0 && color.g == 0.0 && color.b == 0.0 ? 1.0 : color.r, color.g, color.b); // Replace red with white
                    vec3 finalColor = mix(grayscaleColor, color, visited); // Blend based on visited areas
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        }, {
            attributes: ["position", "uv"],
            uniforms: ["worldViewProjection", "textureSampler", "visitedTexture"]
});

        console.log(`Found ${staticMeshes.length} potential static meshes`);
        console.log("Static meshes:", staticMeshes.map(mesh => mesh.name).join(", "));
        staticMeshes.forEach(mesh => {
            console.log(`Mesh name: ${mesh.name}, Position: ${mesh.position.toString()}`);
            const groundMaterial = new StandardMaterial("groundMaterial", this);
            groundMaterial.diffuseColor = new Color3(0, 0, 1); // Set the ground color to blue
            groundMaterial.diffuseTexture = new Texture("https://playground.babylonjs.com/textures/grass.png", this); // Assign a valid texture
            mesh.material = groundMaterial; // Apply the material to the mesh
            if (mesh.material instanceof StandardMaterial && mesh.material.diffuseTexture) {
                shaderMaterial.setTexture("textureSampler", mesh.material.diffuseTexture);
            }
            shaderMaterial.setTexture("visitedTexture", dynamicTexture);
            mesh.material = shaderMaterial;
            });
        
        // 6. Add physics to all static meshes using PhysicsAggregate
        let mapHeight = 0;
        for (const mesh of staticMeshes) {
            try {
                // Create a static physics aggregate for each mesh
                new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0.3, friction: 0.3 }, this);
                
                // Track the highest point of any static mesh
                const boundingInfo = mesh.getBoundingInfo();
                const meshHeight = boundingInfo.maximum.y;
                if (meshHeight > mapHeight) {
                    mapHeight = meshHeight;
                }
                
                console.log(`Added physics to: ${mesh.name}`);
            } catch (error) {
                console.error(`Failed to add physics to ${mesh.name}:`, error);
            }
        }
        
        // Fallback height if no static meshes found
        if (mapHeight === 0) mapHeight = 5;
        console.log(`Using map height: ${mapHeight}`);
        
        // 7. Create the player sphere
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, this);
        sphere.scaling.setAll(0.5); 
        sphere.position.y = mapHeight + 5; 
        
        // 8. Add physics to the sphere using PhysicsAggregate
        
        try {
            
            // The sphere will be dynamic with mass of 1
            new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { 
                mass: 1, 
                restitution: 0.1, 
                friction: 0.5 
            }, this);
            console.log("Added physics to player sphere");
        } catch (error) {
            console.error("Failed to add physics to sphere:", error);
            // Create a fallback if physics failed
            console.warn("Using fallback sphere without physics");
        }
        
        
        // 9. Setup player control and camera
        const playerControl = new PlayerControl(this, sphere);
        const canvas = this.getEngine().getRenderingCanvas();
        if (!canvas) {
            throw new Error("Canvas is null, cannot initialize CameraPlayer");
        }
        const cameraPlayer = new CameraPlayer(this, canvas, playerControl);
        this.activeCamera = cameraPlayer.getCamera();
        
        // 10. Add inspector shortcut
        this.addInspector();
        // 11. Wait for scene to be fully ready
        await new Promise<void>((resolve) => {
            this.executeWhenReady(() => {
                console.log("Scene is fully ready");
                resolve();
            });
        });

        // 11. register before render loop to update the dynamic texture
        this.registerBeforeRender(() => {
            const textureWidth = _width;
            const textureHeight = _height;
            const worldSize = Math.max(_width, _height);
            
            
            
            

            // Map world position to texture coordinates
            const x = (-sphere.position.x / worldSize + 0.5) * textureWidth; // Invert X-axis
            const z = (0.5 - sphere.position.z / worldSize) * textureHeight;

            // Ensure the coordinates are clamped within the texture bounds
            const clampedX = Math.max(0, Math.min(textureWidth - 1, x));
            const clampedZ = Math.max(0, Math.min(textureHeight - 1, z));

            // Draw a sphere-like gradient at the player's position to mark the visited area
            const radius = 10; // Adjust the radius to control the size of the marked area
            const gradient = dynamicContext.createRadialGradient(clampedX, clampedZ, 0, clampedX, clampedZ, radius);
            gradient.addColorStop(0, "white");

            dynamicContext.fillStyle = gradient;
            dynamicContext.beginPath();
            dynamicContext.arc(clampedX, clampedZ, radius, 0, 2 * Math.PI);
            dynamicContext.fill();

            dynamicTexture.update();
        });

      

        return this;
    }
 
    private addInspector() {
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this.debugLayer.isVisible()) {
                    this.debugLayer.hide();
                } else {
                    this.debugLayer.show();
                }
            }
        });
    }
}