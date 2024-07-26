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
import {computeProxyAbi} from "./compute-proxy.abi";
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
        try {

            const transactionHash = await walletClient.writeContract({
                address: this.contractAddress,
                chain: computeProxyChain,
                abi: [this.executeRequestAbi],
                functionName: 'executeRequest',
                args: [input],
                account
            });

            this.logger.log(`Transaction sent: ${transactionHash}`);
            const receipt = await client.waitForTransactionReceipt({ hash: transactionHash });
            this.logger.log(`Transaction mined: ${transactionHash}`);

            // Extract event logs from the transaction receipt
            const eventLogs = receipt.logs;
            if (eventLogs.length === 0) {
                throw new Error('No RequestResolved event found in transaction logs');
            }

            const requestResolvedEvent = eventLogs[0];
            const topics = encodeEventTopics({
                abi: [this.requestResolvedEventAbi],
                eventName: 'RequestResolved'
            })
            this.logger.log('eventTopic: ' + topics);

            const event = decodeEventLog({
                abi: [this.requestResolvedEventAbi],
                data: requestResolvedEvent.data,
                // @ts-ignore
                topics: topics
            })

            return event;
        } catch (error) {
            this.logger.error(`Error executing request: ${error.message}`);
            throw error;
        }
    }
}