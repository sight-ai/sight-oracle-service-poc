# Sight Oracle Gateway Service (POC)

This is a proof-of-concept for the Sight Oracle Gateway Service, utilizing a private SightChain for data storage, an FHE compute engine, and a consensus mechanism.

Please note that this is currently a single-node setup without a dedicated peer-to-peer (P2P) consensus module, as the private SightChain internally achieves consensus at the blockchain layer.

We plan to gradually transition these three components into separate modules.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```