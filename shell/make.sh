rm  -rf ./dist 
npx babel --config-file=./babel.config.json ./src  --copy-files --extensions ".ts" --out-dir "dist" 
