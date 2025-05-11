import { HavokPlugin, PhysicsImpostor, Scene, Vector3, AbstractMesh, Mesh, MeshBuilder, Ray } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';



// Declare global HavokPhysics for CDN loading
declare global {
    const HavokPhysics: any;
}

export class PhysicsManager {
    private scene: Scene;
    private physicsPlugin: HavokPlugin | null = null;
    private isInitialized: boolean = false;
    
    constructor(scene: Scene) {
        this.scene = scene; 
    }
    
    public async getInitializedHavok() {
        return await HavokPhysics();
        
      }
     
    // Add initialize method that was referenced in Playground.ts
    public async initialize(): Promise<void> {
        try {
            const havokInstance = await HavokPhysics();
            this.physicsPlugin = new HavokPlugin(true, havokInstance);
            this.scene.enablePhysics(new Vector3(0, -9.81, 0), this.physicsPlugin);
            this.isInitialized = true;
            console.log("Physics initialized successfully");
        } catch (error) {
            console.error("Failed to initialize Havok physics:", error);
            throw new Error("Physics initialization failed");
        }
    }
    

    
    /**
     * Add a physics impostor to a mesh
     * @param mesh The mesh to add physics to
     * @param type The type of physics impostor
     * @param options The physics options
     */
    public addImpostor(mesh: AbstractMesh, type: number, options: { mass: number, restitution?: number, friction?: number }): void {
        // Vérifier que le plugin est initialisé
        if (!this.isInitialized || !this.physicsPlugin || !this.scene.getPhysicsEngine()) {
            console.error("Physics engine not initialized yet");
            return;
        }
        
        try {
            // Safer approach - don't dispose old impostors, just create a new one if needed
            if (!mesh.physicsImpostor) {
                // Only create a new impostor if one doesn't already exist
                mesh.physicsImpostor = new PhysicsImpostor(
                    mesh,
                    type,
                    options,
                    this.scene
                );
                console.log(`Physics impostor added to ${mesh.name}`);
            } else {
                // If impostor already exists, just update its properties
                mesh.physicsImpostor.setMass(options.mass);
                
                
                console.log(`Physics impostor updated for ${mesh.name}`);
            }
        } catch (error) {
            console.error(`Failed to add physics impostor to ${mesh.name}:`, error);
        }
    }
    
    /**
     * Apply an impulse to a physics-enabled mesh
     * @param mesh The mesh to apply the impulse to
     * @param direction The direction vector of the impulse
     * @param contactPoint The point of contact (default: mesh position)
     */
    public applyImpulse(mesh: AbstractMesh,direction: Vector3,contactPoint?: Vector3): void 
    {
        if (mesh.physicsImpostor) {
            mesh.physicsImpostor.applyImpulse(direction,contactPoint || mesh.position);
        }
    }
    
    /**
     * Check if a mesh is in contact with the ground
     * @param mesh The mesh to check
     * @param groundName The name of the ground mesh
     * @param distance The distance to check from the mesh
     */
    public isGrounded(mesh: AbstractMesh, distance: number = 3): boolean {
        const origin = mesh.position.clone();
        
        
        const rayStart = new Vector3(origin.x, origin.y + 0.2, origin.z);
        const direction = new Vector3(0, -1, 0);
        const ray = new Ray(rayStart, direction, distance);
        const hit = this.scene.pickWithRay(ray);
        
       
        return !!hit?.hit;
    }
    
    /**
     * Create a physics-enabled ground
     * @param name The name of the ground mesh
     * @param options The ground creation options
     * @param physicsOptions The physics options
     */
    public createGround(name: string = "ground", options: { width: number, height: number } = { width: 200, height: 20 },physicsOptions: { mass: number, restitution: number, friction: number } = { mass: 0, restitution: 0.3, friction: 0.3 }): Mesh
     {
        const ground = MeshBuilder.CreateGround(name, options, this.scene);
        this.addImpostor(ground, PhysicsImpostor.BoxImpostor, physicsOptions);
        return ground;
    }
    
    /**
     * Get the physics plugin
     */
    public getPhysicsPlugin(): HavokPlugin | null {
        return this.physicsPlugin;
    }
}