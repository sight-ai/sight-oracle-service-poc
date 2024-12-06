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

## Build Docker Image

1. (Optional) Specify environment variable ORG_NAME and VERSION 
ORG_NAME=sight-ai
VERSION=0.0.4-SNAPSHOT

2. Build local docker image
```
docker build --platform=linux/amd64 -t sight-oracle-backend \
--build-arg ORG_NAME=${ORG_NAME} --build-arg VERSION=${VERSION} .
```

After the build, user following information to check if ORG_NAME and VERSION are packed into the image:

```
docker run --rm sight-oracle-backend cat release_info
```

3. Tag docker image
```
docker tag sight-oracle-backend ghcr.io/${ORG_NAME}/sight-oracle-backend:${VERSION}
```

4. Push image
```
docker push ghcr.io/${ORG_NAME}/sight-oracle-backend:${VERSION}
```
