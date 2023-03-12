## Virtcon 2

The second version of the Virtcon project. This is a complete rewrite of the original. 

#### Installation

1. Install the latest version of [Node.js](https://nodejs.org/en/download/)
2. Install the latest version of [Yarn](https://yarnpkg.com/en/docs/install)
3. Install Docker
4. Clone the repository
5. Start Redis docker container with `docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest`
6. Run `./install.sh` in the root directory
7. Run `./server-dev` to start the development server
8. Run `./client-dev` to start the development client


#### Project setup

`./server` hosts virtcon's backend structure. 

`./client` hosts virtcon's frontend structure.




