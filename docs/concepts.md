# Concepts

## Project

A serverless project is the code base that lives on a user's computer. A project represents the root level where the entry point to the users application can be found (often represented by a single serverless.yml file). A single git project is a good mental model for a serverless project.


## Application

A component application represents an individual group of deployed components that are related to one another. Each application has its own record of deployments. An application can be composed of multiple Services, each of which can have multiple Components.

## Service

## Component

## Provider

## Compute


## Deployment

A deployment represents a single historical record for the deployment of an application. Each deployment has a state file that stores what the instance was when the deployment started and what it is was at the end of the deployment.


## Instance

An instance represents the state of a single application instance in memory for a specific deployment. It contains an entire tree of all component instances as they were at that point in the history.
