import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createNonceManager, createPublicClient, createWalletClient, http, parseAbiItem } from "viem";
import {oracleChain} from "./oracle.chain";
import {mnemonicToAccount} from "viem/accounts";
import {OracleCallbackRequest, OracleCallbackRequestSchema} from "../schemas/oracle-callback.schema";
import {computeProxyChain} from "../task/compute-proxy.chain";
import { jsonRpc } from "viem/nonce";


const nonceManager = createNonceManager({
    source: jsonRpc()
})


// @ts-ignore
// const account = mnemonicToAccount(process.env.ORACLE_CHAIN_MNEMONIC, { nonceManager });
const account = mnemonicToAccount(process.env.ORACLE_CHAIN_MNEMONIC);

@Injectable()
export class OracleCallbackService {
    private readonly logger = new Logger(OracleCallbackService.name);
    private client;
    private walletClient;
    private oracleChainId: number;
    private contractAddress;

    constructor(private readonly configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('ORACLE_CHAIN_RPC_URL');
        this.client = createPublicClient({
            chain: oracleChain,
            transport: http(rpcUrl),
        });

        this.walletClient = createWalletClient({
            chain: oracleChain,
            transport: http(rpcUrl),
            account: account.address,
        });

        this.oracleChainId = parseInt(this.configService.get<string>('ORACLE_CHAIN_ID'), 10);
        this.contractAddress = this.configService.get<string>('ORACLE_CONTRACT_ADDRESS') as `0x${string}`;
    }

    async doCallback(callbackRequest: OracleCallbackRequest): Promise<string> {
        const maxRetries = 3;
        const retryDelay = 5000; // 5 seconds
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < maxRetries) {
            try {
                attempt++;
                // Validate the callback request using Zod
                OracleCallbackRequestSchema.parse(callbackRequest);

                // Check if chain IDs match
                if (callbackRequest.chainId !== this.oracleChainId) {
                    throw new Error(`Chain ID mismatch: expected ${this.oracleChainId}, got ${callbackRequest.chainId}`);
                }

                const abi = [
                    parseAbiItem('function callback(bytes32 requestId, (uint256 data, uint8 valueType)[] result) public'),
                ];

                const transactionCount = await this.client.getTransactionCount({
                    address: account.address,
                    blockTag: 'pending'
                })

                const txHash = await this.walletClient.writeContract({
                    address: this.contractAddress,
                    chain: oracleChain,
                    abi: abi,
                    functionName: 'callback',
                    args: [callbackRequest.requestId, callbackRequest.responseResults],
                    account,
                    nonce: transactionCount,
                });

                this.logger.log(`Callback transaction sent: ${txHash}`);
                await this.client.waitForTransactionReceipt({ hash: txHash });
                this.logger.log(`Callback transaction mined: ${txHash}`);
                return txHash;
            } catch (error) {
                this.logger.error(`Error in callback task, attempt ${attempt} of ${maxRetries}: ${error.message}`);
                lastError = error;

                if (attempt < maxRetries) {
                    this.logger.log(`Waiting for ${retryDelay / 1000} seconds before retrying...`);
                    // In-line sleep function
                    await new Promise(resolve => setTimeout(resolve, retryDelay)); // Wait for 5 seconds before retrying
                } else {
                    this.logger.error(`Max retry attempts reached. Failing with error: ${lastError.message}`);
                    throw lastError;
                }
            }
        }

        throw lastError || new Error("Unexpected error in doCallback");
    }


}
