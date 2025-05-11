import { Scene, Mesh } from "@babylonjs/core";
 
 export function addKeyboardControlsOnSceneToMesh(scene: Scene, mesh: Mesh) {
     const keyboardMap: { [key: string]: boolean } = {};
 
     window.addEventListener("keydown", (e) => {
         keyboardMap[e.key] = true;
     });
 
     window.addEventListener("keyup", (e) => {
         keyboardMap[e.key] = false;
     });
 
     scene.registerBeforeRender(() => {
         // Move forward/backward
         if (keyboardMap["w"] || keyboardMap["ArrowUp"]) {
             mesh.position.z += 0.2;
         }
         if (keyboardMap["s"] || keyboardMap["ArrowDown"]) {
             mesh.position.z -= 0.2;
         }
         
         // Move left/right
         if (keyboardMap["a"] || keyboardMap["ArrowLeft"]) {
             mesh.position.x -= 0.2;
         }
         if (keyboardMap["d"] || keyboardMap["ArrowRight"]) {
             mesh.position.x += 0.2;
         }
     });
 }