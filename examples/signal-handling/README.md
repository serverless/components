# Signal Handling

The Framework supports graceful exits with the help of signal detection (`SIGINT`, `SIGTERM`, `SIGBREAK`).

Deploying this service will take a couple of seconds since the `mySlowFunction` component simulates a long deployment with the help of `Promise.delay()`.

After running `deploy` the user has the possibility to exit gracefully by sending a `SIGINT` signal via `CTRL + C`.

The Framework detects this request for interruption and ensures that the current operations are successfully processed and therefore state is stored before terminating the process.

A process termination without gracefully exiting can be enforced by sending the signal twice (e.g. using `CTRL + C` twice).
