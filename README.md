# Virtcon2

The second version of the Virtcon project. This is a complete rewrite of the original. 

#### Installation

1. Install the latest version of [Node.js](https://nodejs.org/en/download/)
2. Install the latest version of [Yarn](https://yarnpkg.com/en/docs/install)
3. Install [PostgreSQL](https://www.postgresql.org/download/) --> start on port 5432 
4. Install Docker
5. Clone the repository
6. Start Redis docker container with `yarn run redis`
7. Run `yarn install` in the root directory
8. Install nx cli with `yarn global add nx`
9. Run `yarn start` in the root directory to start all apps
Note that this may not work for linux users if it doesn't try `yarn linux` if the issue continues submit an issue on github.


## Understand this workspace

Run `nx graph` to see a diagram of the dependencies of the projects.

## NX documentation

Visit the [Nx Documentation](https://nx.dev) to learn more.
