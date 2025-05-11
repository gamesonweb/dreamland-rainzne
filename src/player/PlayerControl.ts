import * as BABYLON from '@babylonjs/core';
import { Scene, Mesh, Vector3 } from '@babylonjs/core';

export class PlayerControl {
    private playerSphere: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    private moveSpeed: number = 1.2; // Movement speed
    private isGrounded: boolean = true;
    private frictionForce: number = 0.95; // Friction coefficient
    private stopFrictionForce: number = 0.5;
    private keysPressed: Set<string> = new Set();
    private movementKeysReleased: boolean = true;
    private maxVelocity: number = 20; // Maximum horizontal velocity
    private stopThreshold: number = 0.3; // Threshold for complete player stop
  
    private previousPositionY: number = 0;
    private yChangeThreshold: number = 0.005; // Threshold for height change detection
    private lastLogTime: number = 0;
    
    /**
     * Creates a new player control instance
     * @param scene The Babylon scene
     * @param playerSphere The player sphere mesh
     */
    constructor(scene: Scene, playerSphere: Mesh) {
        this.scene = scene;
        this.playerSphere = playerSphere;
        this.previousPositionY = playerSphere.position.y;
        this.setupPlayerControls();
        
        // Variable pour gérer la mise à jour de previousPositionY
        let lastYUpdateTime = 0;
        
        this.scene.registerBeforeRender(() => {
            // Mise à jour de previousPositionY à intervalle régulier
            const now = Date.now();
            if (now - lastYUpdateTime > 100) { // 100ms
                this.previousPositionY = this.playerSphere.position.y;
                lastYUpdateTime = now;
            }
            
            this.checkGroundContact();
            this.updateMovementState();
            this.applyMovement();
            this.applyFriction();
            this.limitMaxVelocity();
        });
    }
    
    /**
     * Set up keyboard controls for the player
     */
    private setupPlayerControls(): void {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            const keyEvent = kbInfo.event;
            const key = keyEvent.key.toLowerCase();
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    this.keysPressed.add(key);
                    break;
                    
                case BABYLON.KeyboardEventTypes.KEYUP:
                    this.keysPressed.delete(key);
                    break;
            }
        });
    }
    
    /**
     * Update movement state based on pressed keys
     */
    private updateMovementState(): void {
        this.movementKeysReleased = !(['z', 's', 'q', 'd'].some(key => this.keysPressed.has(key)));
    }
    
    /**
     * Apply movement based on key inputs
     */
    private applyMovement(): void {
        if (!this.playerSphere.physicsBody) return;
        const impulseDirection = new Vector3(0, 0, 0);
        if (this.keysPressed.has('z')) impulseDirection.z += this.moveSpeed;
        if (this.keysPressed.has('s')) impulseDirection.z -= this.moveSpeed;
        if (this.keysPressed.has('q')) impulseDirection.x -= this.moveSpeed;
        if (this.keysPressed.has('d')) impulseDirection.x += this.moveSpeed;
        
        if (impulseDirection.length() > 0) {
            const cameraRotationY = (this.scene.activeCamera as BABYLON.FreeCamera)?.rotation.y || 0;
            const rotationMatrix = BABYLON.Matrix.RotationY(cameraRotationY);
            const transformedImpulse = Vector3.TransformNormal(impulseDirection, rotationMatrix);
            const slopeMultiplier = this.getSlopeMultiplier();
            transformedImpulse.scaleInPlace(slopeMultiplier);
            
            // Logs pour déboguer
            const now = Date.now();
            if (now - this.lastLogTime > 500) {
                //const currentY = this.playerSphere.position.y;
                // const deltaY = currentY - this.previousPositionY;
              
                this.lastLogTime = now;
            }
            
            this.applyImpulse(transformedImpulse);
        }
    }
    
    /**
     * Apply an impulse to the player
     * @param direction The direction vector of the impulse
     */
    private applyImpulse(direction: Vector3): void {
        if (this.playerSphere.physicsBody) {
            this.playerSphere.physicsBody.applyImpulse(direction, this.playerSphere.getAbsolutePosition());
        }
    }

    /**
     * Limit the maximum horizontal velocity of the player
     */
    private limitMaxVelocity(): void {
        if (this.playerSphere.physicsBody) {
            const velocity = this.playerSphere.physicsBody.getLinearVelocity();
            if (velocity) {
                const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
                
                // Appliquer le slopeMultiplier à la vitesse maximale
                const slopeMultiplier = this.getSlopeMultiplier();
                const adjustedMaxVel = this.maxVelocity * slopeMultiplier;
                
                // Log pour déboguer les variations de vitesse en fonction de la pente
                const now = Date.now();
                if (now - this.lastLogTime > 200) {  // Limiter les logs à toutes les 200ms
                    const currentY = this.playerSphere.position.y;
                    const deltaY = currentY - this.previousPositionY;
                    console.log(`Vitesse: ${horizontalSpeed.toFixed(2)}, MaxVel: ${adjustedMaxVel.toFixed(2)}, Pente: ${deltaY > 0 ? "Montée" : deltaY < 0 ? "Descente" : "Plat"}, SlopeMultiplier: ${slopeMultiplier.toFixed(2)}`);
                    
                    this.lastLogTime = now;
                }
                
                if (horizontalSpeed > adjustedMaxVel) {
                    const scale = adjustedMaxVel / horizontalSpeed;
                    velocity.x *= scale;
                    velocity.z *= scale;
                    this.playerSphere.physicsBody.setLinearVelocity(velocity);
                }
            }
        }
    }
    
    /**
     * Apply friction to slow down the player when on the ground
     */
    private applyFriction(): void {
        if (this.playerSphere.physicsBody && this.isGrounded) {
            const currentVelocity = this.playerSphere.physicsBody.getLinearVelocity();
            if (currentVelocity) {
                // Apply stronger friction when no movement keys are pressed
                const friction = this.movementKeysReleased ? this.stopFrictionForce : this.frictionForce;
                const horizontalVelocity = new Vector3(
                    currentVelocity.x * friction,
                    currentVelocity.y,
                    currentVelocity.z * friction
                );
                
                this.playerSphere.physicsBody.setLinearVelocity(horizontalVelocity);
                
                // Complete stop at threshold
                if (Math.abs(horizontalVelocity.x) < this.stopThreshold && 
                    Math.abs(horizontalVelocity.z) < this.stopThreshold && 
                    this.movementKeysReleased) {
                        horizontalVelocity.x = 0;
                        horizontalVelocity.z = 0;
                        this.playerSphere.physicsBody.setLinearVelocity(horizontalVelocity);
                }
            }
        }
    }
    
    /**
     * Check if the player is in contact with the ground
     */
    private checkGroundContact(): void {
        const origin = this.playerSphere.position.clone();
        const rayStart = new BABYLON.Vector3(origin.x, origin.y + 0.2, origin.z);
        const direction = new BABYLON.Vector3(0, -1, 0);
        const ray = new BABYLON.Ray(rayStart, direction, 1.5);
        const hit = this.scene.pickWithRay(ray);
        this.isGrounded = !!hit?.hit;
        if (this.isGrounded && hit && hit.hit && hit.getNormal(true)) {
            BABYLON.Vector3.Up();
        } 
    }
    
    /**
     * Get the player mesh
     * @returns The player mesh
     */
    public getPlayerMesh(): BABYLON.Mesh {
        return this.playerSphere;
    }

    /**
     * Calculate the slope multiplier based on height variation
     * @returns The slope multiplier
     */
    private getSlopeMultiplier(): number {
        if (!this.isGrounded) return 1.0;
        
        const currentY = this.playerSphere.position.y;
        const deltaY = currentY - this.previousPositionY;
        
        // Log pour diagnostic
        if (Date.now() - this.lastLogTime > 500) {
            console.log(`Delta Y brut: ${deltaY.toFixed(4)}, Seuil: ${this.yChangeThreshold}`);
        }
        
        return this.calculateSlopeMultiplier(deltaY);
    }

    /**
     * Calculates the actual slope multiplier value based on deltaY
     * @param deltaY Difference in height
     */
    private calculateSlopeMultiplier(deltaY: number): number {
        // Si le changement est très petit, c'est considéré comme plat
        if (Math.abs(deltaY) < this.yChangeThreshold) {
            return 1.0;
        }
        
        const accelerationFactor = 0.8; // Plus grand = plus d'effet
        const decelerationFactor = 0.6; // Plus grand = plus d'effet
        
        if (deltaY < 0) {
            // Descente
            return 1.0 + Math.abs(deltaY) * accelerationFactor;
        } else {
            // Montée
            return Math.max(0.5, 1.0 - deltaY * decelerationFactor);
        }
    }
}