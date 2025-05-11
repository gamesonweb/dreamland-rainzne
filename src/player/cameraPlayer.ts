import * as BABYLON from '@babylonjs/core';
import { PlayerControl } from './PlayerControl';

export class CameraPlayer {
    private camera: BABYLON.FreeCamera;
    private scene: BABYLON.Scene;
    private canvas: HTMLCanvasElement;
    private playerControl: PlayerControl;
    private keysPressed: { [key: string]: boolean } = {};
    
    
    // Variables for mouse camera control
    private isPointerLocked: boolean = false;
    private mouseSensitivity: number = 0.002; // Mouse sensitivity
    private minPitch: number = -Math.PI / 9; // -30° 
    private maxPitch: number = Math.PI / 9;  // 30°
    
    private cameraHeight: number = 5; 
    private cameraDistance: number = 10; 
    
    // Add these instance variables to track rotation state
    private yaw: number = 0;
    private pitch: number = 0;
    
    /**
     * Creates a new camera controller that follows the player
     * @param scene The Babylon scene
     * @param canvas The HTML canvas element
     * @param playerControl The player control instance
     */
    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, playerControl: PlayerControl) {
        this.scene = scene;
        this.canvas = canvas;
        this.playerControl = playerControl;
        scene.collisionsEnabled = true;
        
       
        
        // Create camera that follows the player
        this.camera = new BABYLON.FreeCamera("playerCamera", new BABYLON.Vector3(0, 2, -4.5), this.scene);
        this.camera.attachControl(this.canvas, true);
        this.camera.checkCollisions = true;
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
        
        // Disable default camera controls
        this.camera.inputs.clear();
        
        // Initialize yaw & pitch
        this.yaw = 0;
        this.pitch = 0;
        this.camera.rotation = new BABYLON.Vector3(this.pitch, this.yaw, 0);
        
        // Set up input handling
        this.setupInputHandling();
        
        // Update camera position on each frame
        this.scene.registerBeforeRender(() => {
            this.updateCamera();
        });

        // Activer automatiquement le pointer lock après le chargement de la scène
        this.scene.executeWhenReady(() => {
            // Petit délai pour s'assurer que tout est bien chargé
            setTimeout(() => {
                this.requestPointerLock();
            }, 500);
        });
    }
    
    /**
     * Set up keyboard and mouse input handling
     */
    private setupInputHandling(): void {
        // Handle keyboard inputs (for other functions if needed)
        window.addEventListener('keydown', (event) => {
            this.keysPressed[event.key.toLowerCase()] = true;
        });       
        window.addEventListener('keyup', (event) => {
            this.keysPressed[event.key.toLowerCase()] = false;
        });
        
        // Set up pointer lock for mouse camera control
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.requestPointerLock();
            }
        });
        
        // Event to detect pointer lock state
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
            
        });
        
        // Handle mouse movement for camera rotation
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                const deltaX = event.movementX || 0;
                const deltaY = event.movementY || 0;
                
                // Update yaw and pitch
                this.yaw += deltaX * this.mouseSensitivity;
                this.pitch += deltaY * this.mouseSensitivity;
                if(this.pitch > this.maxPitch) this.pitch = this.maxPitch;
                if(this.pitch < this.minPitch) this.pitch = this.minPitch;
                
                // Apply to camera rotation
                this.camera.rotation.x = this.pitch;
                this.camera.rotation.y = this.yaw;
            }
        });
    }
    
    /**
     * Helper method to request pointer lock
     */
    private requestPointerLock(): void {
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || 
                                       (this.canvas as any).mozRequestPointerLock ||
                                       (this.canvas as any).webkitRequestPointerLock;
        this.canvas.requestPointerLock();
    }
    
    /**
     * Update camera position to follow player
     */
    private updateCamera(): void {
        const playerMesh = this.playerControl.getPlayerMesh();
        if (playerMesh) {
            // Compute spherical coordinates based on yaw/pitch
            const offsetX = this.cameraDistance * Math.sin(this.yaw) * Math.cos(this.pitch);
            const offsetY = this.cameraDistance * Math.sin(this.pitch);
            const offsetZ = this.cameraDistance * Math.cos(this.yaw) * Math.cos(this.pitch);
            
            // Position camera based on player position and computed offset
            this.camera.position.x = playerMesh.position.x - offsetX;
            this.camera.position.y = playerMesh.position.y + this.cameraHeight - offsetY;
            this.camera.position.z = playerMesh.position.z - offsetZ;
            
            // Always look at the player
            this.camera.setTarget(playerMesh.position);
        }
    }
    
   
    
    /**
     * Get the camera instance
     * @returns The free camera instance
     */
    public getCamera(): BABYLON.FreeCamera {
        return this.camera;
    }
}