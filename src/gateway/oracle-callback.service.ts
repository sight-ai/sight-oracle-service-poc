import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, createWalletClient, http, parseAbiItem } from 'viem';
import {oracleChain} from "./oracle.chain";
import {mnemonicToAccount} from "viem/accounts";
import {OracleCallbackRequest, OracleCallbackRequestSchema} from "../schemas/oracle-callback.schema";
import {computeProxyChain} from "../task/compute-proxy.chain";

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
        try {
            // Validate the callback request using Zod
            OracleCallbackRequestSchema.parse(callbackRequest);

            // Check if chain IDs match
            if (callbackRequest.chainId !== this.oracleChainId) {
                throw new Error(`Chain ID mismatch: expected ${this.oracleChainId}, got ${callbackRequest.chainId}`);
            }

            const abi = [
                parseAbiItem('function callback(bytes32 requestId, (uint256 data, uint8 valueType)[] result) public'),
            ];

            const txHash = await this.walletClient.writeContract({
                address: this.contractAddress,
                chain: oracleChain,
                abi: abi,
                functionName: 'callback',
                args: [callbackRequest.requestId, callbackRequest.responseResults],
                account,
            });

            this.logger.log(`Callback transaction sent: ${txHash}`);
            const receipt = await this.client.waitForTransactionReceipt({ hash: txHash });
            this.logger.log(`Callback transaction mined: ${txHash}`);
            return receipt;
        } catch (error) {
            this.logger.error(`Error in callback task: ${error.message}`);
            throw error;
        }
    }
}
