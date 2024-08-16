import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createPublicClient,
    http,
    parseAbiItem,
    PublicClient,
    WalletClient,
    createWalletClient,
    Chain,
    HDAccount, decodeEventLog, getContract, keccak256, encodeEventTopics
} from 'viem';
import {computeProxyChain} from "./compute-proxy.chain";
import {mnemonicToAccount} from "viem/accounts";
import * as process from "process";

// @ts-ignore
const client: PublicClient = createPublicClient({
    chain: computeProxyChain,
    transport: http(process.env.COMPUTE_PROXY_CHAIN_RPC_URL),
});

const account = mnemonicToAccount(process.env.COMPUTE_PROXY_CHAIN_MNEMONIC);

let walletClient = createWalletClient({
    account: account.address,
    chain: computeProxyChain,
    transport: http(process.env.COMPUTE_PROXY_CHAIN_RPC_URL)});

let publicClient = createPublicClient({
    chain: computeProxyChain,
    transport: http(process.env.COMPUTE_PROXY_CHAIN_RPC_URL)});

@Injectable()
export class ComputeProxyService {
    private readonly logger = new Logger(ComputeProxyService.name);
    private contractAddress: `0x${string}`;
    private executeRequestAbi = parseAbiItem('function executeRequest((bytes32 id, address requester, (uint8 opcode, uint256[] operands, uint64 value)[] ops, uint256 opsCursor, address callbackAddr, bytes4 callbackFunc, bytes extraData) r) public returns ((uint256 data, uint8 valueType)[])');
    private requestResolvedEventAbi = parseAbiItem("event RequestResolved(bytes32 id, (uint256 data, uint8 valueType)[] results)");

    constructor(private readonly configService: ConfigService) {
        this.contractAddress = this.configService.get<string>('COMPUTE_PROXY_CONTRACT_ADDRESS') as `0x${string}`;
    }

    async executeRequest(input: any): Promise<any> {
        const maxRetries = 5;
        const retryDelay = 5000; // 5 seconds
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < maxRetries) {
            try {
                attempt++;
                this.logger.log("Doing computation with following args:");
                this.logger.debug(input);
                this.logger.debug(this.contractAddress);
                this.logger.debug(computeProxyChain);

                const transactionHash = await walletClient.writeContract({
                    address: this.contractAddress,
                    chain: computeProxyChain,
                    abi: [this.executeRequestAbi],
                    functionName: 'executeRequest',
                    args: [input],
                    gas: 1000000n,
                    account
                });

                this.logger.log(`Transaction sent: ${transactionHash}`);
                const receipt = await client.waitForTransactionReceipt({ hash: transactionHash });
                this.logger.log(`Transaction mined: ${transactionHash}`);
                this.logger.log(receipt);

                // Extract event logs from the transaction receipt
                const eventLogs = receipt.logs;
                if (eventLogs.length === 0) {
                    throw new Error('No RequestResolved event found in transaction logs');
                }

                const requestResolvedEvent = eventLogs[0];
                const topics = encodeEventTopics({
                    abi: [this.requestResolvedEventAbi],
                    eventName: 'RequestResolved'
                });
                this.logger.log('eventTopic: ' + topics);

                const event = decodeEventLog({
                    abi: [this.requestResolvedEventAbi],
                    data: requestResolvedEvent.data,
                    // @ts-ignore
                    topics: topics
                });

                return event;
            } catch (error) {
                this.logger.error(`Error executing request, attempt ${attempt} of ${maxRetries}: ${error.message}`);
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

        throw lastError || new Error("Unexpected error in executeRequest");
    }
}