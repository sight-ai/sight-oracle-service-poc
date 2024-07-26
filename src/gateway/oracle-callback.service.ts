import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, createWalletClient, http, parseAbiItem } from 'viem';
import {oracleChain} from "./oracle.chain";
import {mnemonicToAccount} from "viem/accounts";
import {OracleCallbackRequest, OracleCallbackRequestSchema} from "../schemas/oracle-callback.schema";

@Injectable()
export class OracleCallbackService {
    private readonly logger = new Logger(OracleCallbackService.name);
    private client;
    private walletClient;
    private oracleChainId: number;

    constructor(private readonly configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('ORACLE_CHAIN_RPC_URL');
        this.client = createPublicClient({
            chain: oracleChain,
            transport: http(rpcUrl),
        });

        const mnemonic = this.configService.get<string>('ORACLE_CHAIN_MNEMONIC');
        const account = mnemonicToAccount(mnemonic);

        this.walletClient = createWalletClient({
            chain: oracleChain,
            transport: http(rpcUrl),
            account: account.address,
        });

        this.oracleChainId = parseInt(this.configService.get<string>('ORACLE_CHAIN_ID'), 10);
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
                parseAbiItem(`function callback(bytes32 requestId, (uint256 data, uint8 valueType)[] results) public`),
            ];

            const tx = await this.walletClient.writeContract({
                address: callbackRequest.callbackAddr,
                abi: abi,
                functionName: callbackRequest.callbackFunc,
                args: [callbackRequest.requestId, callbackRequest.responseResults],
            });

            this.logger.log(`Callback transaction sent: ${tx.hash}`);
            const receipt = await this.client.waitForTransactionReceipt({ hash: tx.hash });
            this.logger.log(`Callback transaction mined: ${tx.hash}`);
            return receipt;
        } catch (error) {
            this.logger.error(`Error in callback task: ${error.message}`);
            throw error;
        }
    }
}
