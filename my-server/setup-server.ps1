# Step 1: Initialize npm project
npm init -y

# Step 2: Install dependencies
npm install express

# Step 3: Install dev dependencies
npm install -D typescript ts-node-dev @types/node @types/express

# Step 4: Initialize tsconfig.json
npx tsc --init

# Step 5: Update tsconfig.json for TypeScript config
(Get-Content tsconfig.json) -replace '"target": ".*?"', '"target": "ES2020"' |
    ForEach-Object { $_ -replace '"module": ".*?"', '"module": "commonjs"' } |
    ForEach-Object { $_ -replace '\/\/ "rootDir": "\.\/"', '"rootDir": "./src"' } |
    ForEach-Object { $_ -replace '\/\/ "outDir": "\.\/"', '"outDir": "./dist"' } |
    ForEach-Object { $_ -replace '\/\/ "esModuleInterop": false', '"esModuleInterop": true' } |
    Set-Content tsconfig.json

# Step 6: Create folder structure
New-Item -ItemType Directory -Force -Path "src/controllers", "src/models", "src/routes", "src/views", "src/config"

# Step 7: Create base files
New-Item -Path src/server.ts -ItemType File
New-Item -Path src/app.ts -ItemType File
New-Item -Path src/controllers/homeController.ts -ItemType File
New-Item -Path src/routes/homeRoutes.ts -ItemType File

# Step 8: Write content to files

@"
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
"@ | Set-Content src/server.ts

@"
import express from 'express';
import homeRoutes from './routes/homeRoutes';

const app = express();

app.use(express.json());
app.use('/', homeRoutes);

export default app;
"@ | Set-Content src/app.ts

@"
import { Request, Response } from 'express';

export const getHome = (req: Request, res: Response) => {
  res.send('Welcome to Node + Express + TypeScript MVC!');
};
"@ | Set-Content src/controllers/homeController.ts

@"
import express from 'express';
import { getHome } from '../controllers/homeController';

const router = express.Router();

router.get('/', getHome);

export default router;
"@ | Set-Content src/routes/homeRoutes.ts

# Step 9: Update package.json with dev script
(Get-Content package.json) -replace '"scripts": \{', '"scripts": {`n    "dev": "ts-node-dev --respawn src/server.ts",' | Set-Content package.json

Write-Host "`n✅ Setup complete. Run the server with:"
Write-Host "   npm run dev"
