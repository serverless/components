# Firebase project example

This example deploys a firebase project.

## Setup
- create a firebase project on https://firebase.google.com
- get your firebase project id
- generate a firebase ci token
- Create a .env file at the root of this example
```
FIREBASE_PROJECT_ID="your firebase project id"
FIREBASE_TOKEN="your firebase token"
```
- cd into functions folder and install npm packages
```sh
cd functions
npm install
```

## Deploying
- run `components deploy` in terminal

## Removing
- run `components remove` in terminal
