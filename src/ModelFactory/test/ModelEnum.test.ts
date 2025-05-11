import { ModelEnum } from '../src/ModelEnum';
import * as fs from 'fs';
import * as path from 'path';

describe('ModelPath Enum', () => {

    it('should have all enum paths existing in the filesystem', () => {
        const modelDirectory = path.join(__dirname, '../../..');
    
        const listOfModelPaths = Object.values(ModelEnum);
        listOfModelPaths.forEach(modelPath => {
            const fullModelPath = path.join(modelDirectory, modelPath);
            assertPathExists(fullModelPath);
        });
    });
});

function assertPathExists(fullPath: string) {
    expect(fs.existsSync(fullPath)).toBeTruthy();
}
