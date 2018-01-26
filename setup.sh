cd framework
npm install
npm link
npm i -g
cd ../registry/apigateway@0.0.1
npm link framework
cd ../dynamodb@0.0.1
npm link framework
cd ../lambda@0.0.1
npm install
npm link framework
cd ../github@0.0.1
npm install
npm link framework
cd ../../github-webhook-receiver@0.0.1

