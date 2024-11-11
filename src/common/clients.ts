import { createPublicClient, http } from 'viem';
import { oracleChain } from './oracle.chain'; // Import your custom chain definition
import { computeProxyChain } from './compute-proxy.chain';

// Setup viem client with custom chain
const oracleClient = createPublicClient({
  chain: oracleChain,
  transport: http(process.env.ORACLE_CHAIN_RPC_URL),
});

const computeProxyClient = createPublicClient({
  chain: computeProxyChain,
  transport: http(process.env.COMPUTE_PROXY_CHAIN_RPC_URL),
});

export { oracleClient, computeProxyClient };
