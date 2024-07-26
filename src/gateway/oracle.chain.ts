import { defineChain } from 'viem';

export const oracleChain = defineChain({
    id: parseInt(process.env.ORACLE_CHAIN_ID, 10),
    name: process.env.ORACLE_CHAIN_NAME,
    nativeCurrency: {
        decimals: parseInt(process.env.ORACLE_CHAIN_NATIVE_CURRENCY_DECIMALS, 10),
        name: process.env.ORACLE_CHAIN_NATIVE_CURRENCY_NAME,
        symbol: process.env.ORACLE_CHAIN_NATIVE_CURRENCY_SYMBOL,
    },
    rpcUrls: {
        default: {
            http: [process.env.ORACLE_CHAIN_RPC_URL],
        },
    },
});