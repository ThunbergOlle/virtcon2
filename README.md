# Virtcon2

The second version of the Virtcon project. This is a complete rewrite of the original. 

#### Installation

1. Install the latest version of [Node.js](https://nodejs.org/en/download/)
2. Install the latest version of [Yarn](https://yarnpkg.com/en/docs/install)
3. Install Docker
4. Clone the repository
5. Start Redis docker container with `yarn docker`
6. Run `yarn install` in the root directory
7. Install nx cli with `yarn global add nx`
8. Run `yarn start` in the root directory to start all apps
Note that this may not work for linux users if it doesn't try `yarn linux` if the issue continues submit an issue on github.


## Understand this workspace

Run `nx graph` to see a diagram of the dependencies of the projects.

## NX documentation

Visit the [Nx Documentation](https://nx.dev) to learn more.
