import { defineChain } from 'viem';

export const oracleChain = defineChain({
    id: parseInt(process.env.CHAIN_ID, 10),
    name: process.env.CHAIN_NAME,
    nativeCurrency: {
        decimals: parseInt(process.env.NATIVE_CURRENCY_DECIMALS, 10),
        name: process.env.NATIVE_CURRENCY_NAME,
        symbol: process.env.NATIVE_CURRENCY_SYMBOL,
    },
    rpcUrls: {
        default: {
            http: [process.env.CHAIN_RPC_URL],
        },
    },
});