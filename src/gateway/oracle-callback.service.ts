import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, HDNodeWallet, JsonRpcProvider, Wallet } from "ethers";
import { OracleCallbackRequest, OracleCallbackRequestSchema } from '../schemas/oracle-callback.schema';
import { oracleChain } from './oracle.chain';

@Injectable()
export class OracleCallbackService {
    private readonly logger = new Logger(OracleCallbackService.name);
    private provider: JsonRpcProvider;
    private wallet: HDNodeWallet;
    private contract: ethers.Contract;
    private oracleChainId: number;
    private contractAddress: string;

    constructor(private readonly configService: ConfigService) {
        const rpcUrl = this.configService.get<string>('ORACLE_CHAIN_RPC_URL');
        const mnemonic = this.configService.get<string>('ORACLE_CHAIN_MNEMONIC');

        this.provider = new JsonRpcProvider(rpcUrl);
        this.wallet = ethers.Wallet.fromPhrase(mnemonic).connect(this.provider);

        this.oracleChainId = parseInt(this.configService.get<string>('ORACLE_CHAIN_ID'), 10);
        this.contractAddress = this.configService.get<string>('ORACLE_CONTRACT_ADDRESS') as string;

        const abi = [
            'function callback(bytes32 requestId, (uint256 data, uint8 valueType)[] result) public',
        ];

        this.contract = new ethers.Contract(this.contractAddress, abi, this.wallet);
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
                    attempt = maxRetries;
                    throw new Error(`Chain ID mismatch: expected ${this.oracleChainId}, got ${callbackRequest.chainId}`);
                }

                const tx = await this.contract.callback(
                  callbackRequest.requestId,
                  callbackRequest.responseResults,
                );

                this.logger.log(`Callback transaction sent: ${tx.hash}`);
                const receipt = await tx.wait();
                this.logger.log(`Callback transaction mined: ${tx.hash}`);
                return tx.hash;
            } catch (error) {
                this.logger.error(`Error in callback task, attempt ${attempt} of ${maxRetries}: ${error.message}`);
                lastError = error;

                if (attempt < maxRetries) {
                    this.logger.log(`Waiting for ${retryDelay / 1000} seconds before retrying...`);
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
