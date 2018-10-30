set -e
babel src -d dist --source-maps --ignore "**/*.test.js" --ignore "**/__mocks__"
rsync -avz --exclude "*.js" --exclude "__tests__" --exclude "__snapshots__" --exclude "__mocks__" --exclude "node_modules" src/ dist/
