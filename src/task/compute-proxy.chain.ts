// Define the Compute Proxy Chain
import {defineChain} from "viem";

export const computeProxyChain = defineChain({
    id: parseInt(process.env.COMPUTE_PROXY_CHAIN_ID, 10),
    name: process.env.COMPUTE_PROXY_CHAIN_NAME,
    nativeCurrency: {
        decimals: parseInt(process.env.COMPUTE_PROXY_CHAIN_NATIVE_CURRENCY_DECIMALS, 10),
        name: process.env.COMPUTE_PROXY_CHAIN_NATIVE_CURRENCY_NAME,
        symbol: process.env.COMPUTE_PROXY_CHAIN_NATIVE_CURRENCY_SYMBOL,
    },
    rpcUrls: {
        default: {
            http: [process.env.COMPUTE_PROXY_CHAIN_RPC_URL],
        },
    },
});