# Writing a component guide

This guide outlines the best practices associated with writing a component.


## Composing components


## Creating lower level components

A lower level component is a component that is responsible for constructing a resource on a SaaS service or cloud service. When writing these types of components it is important to remember that the core of the Serverless framework works with your component to orchestrate the deployment of it along side all of the other components in the application. The framework is responsible not only for managing the state of your component but also responsible for ordering its deployment based on which components depend upon it and which components it depends directly upon.
