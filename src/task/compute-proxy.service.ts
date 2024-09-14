import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, HDNodeWallet, JsonRpcProvider, TransactionReceipt, TransactionResponse, Wallet } from "ethers";
import { computeProxyAbi } from './compute-proxy.abi';

@Injectable()
export class ComputeProxyService {
    private readonly logger = new Logger(ComputeProxyService.name);
    private contractAddress: string;
    private provider: JsonRpcProvider;
    private wallet: HDNodeWallet;
    private contract: ethers.Contract;

    constructor(private readonly configService: ConfigService) {
        this.contractAddress = this.configService.get<string>('COMPUTE_PROXY_CONTRACT_ADDRESS') as string;
        this.logger.log("COMPUTE_PROXY_CONTRACT_ADDRESS: " + this.contractAddress);

        // Initialize the provider, wallet, and contract
        const rpcUrl = this.configService.get<string>('COMPUTE_PROXY_CHAIN_RPC_URL');
        const mnemonic = this.configService.get<string>('COMPUTE_PROXY_CHAIN_MNEMONIC');

        this.provider = new JsonRpcProvider(rpcUrl);
        this.wallet = Wallet.fromPhrase(mnemonic).connect(this.provider);
        this.contract = new ethers.Contract(this.contractAddress, computeProxyAbi, this.wallet);
    }

    async executeRequest(input: any): Promise<any> {
        const maxRetries = 5;
        const retryDelay = 5000; // 5 seconds
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < maxRetries) {
            try {
                attempt++;
                this.logger.log("Doing computation with the following args:");
                this.logger.debug(input);
                this.logger.debug("Compute Proxy Contract Address:" + this.contractAddress);

                let transactionResponse: TransactionResponse;

                try {
                    transactionResponse = await this.contract.executeRequest(input, {
                        gasLimit: 10000000n,
                    });
                } catch (e) {
                    this.logger.error(e);
                    throw e;
                }

                this.logger.log(`Compute Transaction sent: ${transactionResponse.hash}`);

                let receipt: TransactionReceipt;
                try {
                    receipt = await transactionResponse.wait();
                    this.logger.log(`Compute Transaction mined: ${transactionResponse.hash}`);
                    this.logger.log(receipt);

                    if (receipt.status === 0) { // 0 indicates transaction failure
                        this.logger.error(`Compute transaction ${transactionResponse.hash} reverted`);
                        throw new Error(`Transaction reverted`);
                    }
                } catch (e) {
                    this.logger.error("waitForTransactionReceipt failed");
                    this.logger.error(e);
                    throw e;
                }

                // Extract event logs from the transaction receipt
                const eventLogs = receipt.logs;
                if (eventLogs.length === 0) {
                    this.logger.error("eventLogs length is 0");
                    throw new Error('No RequestResolved event found in transaction logs');
                }

                const event = this.contract.interface.parseLog(eventLogs[0]);

                if (event.name !== 'RequestResolved') {
                    this.logger.error('Unexpected event type');
                    throw new Error('Unexpected event type');
                }

                return event.args;
            } catch (error) {
                this.logger.error(`Error executing request, attempt ${attempt} of ${maxRetries}: ${error.message}`);
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

        throw lastError || new Error("Unexpected error in executeRequest");
    }
}
