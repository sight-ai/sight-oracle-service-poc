import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicClient, http } from 'viem';
import { oracleChain } from './oracle.chain'; // Import your custom chain definition
import { TaskService } from '../task/task.service';
import { oracleAbi } from "./oracle.abi";

@Injectable()
export class OracleListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OracleListenerService.name);
    private client;
    private intervalId;
    private lastBlockHeight: bigint;
    private contractAddress: string;

    constructor(
        private readonly taskService: TaskService,
        private readonly configService: ConfigService,
    ) {
        this.logger.log('Initializing service...');
        this.contractAddress = this.configService.get<string>('ORACLE_CONTRACT_ADDRESS');

        // Setup viem client with custom chain
        this.client = createPublicClient({
            chain: oracleChain,
            transport: http(this.configService.get<string>('ORACLE_CHAIN_RPC_URL')),
        });
    }

    async onModuleInit() {
        this.logger.log('onModuleInit called...');
        // Get the current block height
        try {
            this.lastBlockHeight = await this.client.getBlockNumber();
            this.logger.log(`Starting block height: ${this.lastBlockHeight}`);
            this.startFetchingLogs();
        } catch (error) {
            this.logger.error('Failed to get initial block number:', error);
        }
    }

    onModuleDestroy() {
        this.logger.log('onModuleDestroy called...');
        this.stopFetchingLogs();
    }

    startFetchingLogs() {
        this.logger.log('startFetchingLogs called...');
        this.intervalId = setInterval(async () => {
            try {
                const currentBlockHeight = await this.client.getBlockNumber();
                const logs = await this.client.getLogs({
                    address: this.contractAddress,
                    abi: oracleAbi,
                    eventName: 'RequestSent',
                    // TODO: persistant this block height to recover from crash
                    fromBlock: this.lastBlockHeight + BigInt(1),
                    toBlock: currentBlockHeight,
                });

                if (logs.length === 0) {
                    this.logger.log('No new events found');
                } else {
                    for (const log of logs) {
                        this.logger.log('Event received:', JSON.stringify(log));
                        await this.taskService.createTask(log, oracleChain.id); // Create a new task
                    }
                }

                this.lastBlockHeight = currentBlockHeight;
            } catch (error) {
                this.logger.error('Error fetching logs:', error);
            }
        }, 1000); // Fetch logs every second
    }

    stopFetchingLogs() {
        this.logger.log('stopFetchingLogs called...');
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}
