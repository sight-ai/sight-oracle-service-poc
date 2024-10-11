import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {createPublicClient, http, keccak256, PublicClient} from 'viem';
import { oracleChain } from './oracle.chain'; // Import your custom chain definition
import { TaskService } from '../task/task.service';
import { oracleAbi } from "./oracle.abi";
import { OracleSvcEntity } from 'src/entities/oracle-svc.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Setup viem client with custom chain
const client = createPublicClient({
    chain: oracleChain,
    transport: http(process.env.ORACLE_CHAIN_RPC_URL)
});

@Injectable()
export class OracleListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OracleListenerService.name);
    private intervalId;
    private lastBlockHeight: bigint;
    private contractAddress: `0x${string}`;
    private oracleSvcEntity: OracleSvcEntity;

    constructor(
        @InjectRepository(OracleSvcEntity) private oracleRepository: Repository<OracleSvcEntity>,
        private readonly taskService: TaskService,
        private readonly configService: ConfigService,
    ) {
        this.logger.log('Initializing service...');
        this.contractAddress = this.configService.get<string>('ORACLE_CONTRACT_ADDRESS') as `0x${string}`;
    }

    async onModuleInit() {
        this.logger.log('onModuleInit called...');
        const chainId = +this.configService.get<string>('ORACLE_CHAIN_ID');
        const oracleSvcSymbol = Buffer.from(this.configService.get<string>('ORACLE_SVC_SYMBOL') as string || this.configService.get<string>('ORACLE_CHAIN_NAME') as string + this.configService.get<string>('ORACLE_CHAIN_ID') as string);
        this.logger.log(oracleSvcSymbol);
        const oracleSvcId = keccak256(oracleSvcSymbol);
        this.oracleSvcEntity = await this.oracleRepository.findOneBy({id: oracleSvcId});
        if(!this.oracleSvcEntity) {
            const oracle = new OracleSvcEntity();
            oracle.id = oracleSvcId;
            oracle.address = this.contractAddress;
            oracle.chainId = chainId;
            oracle.name = this.configService.get<string>('ORACLE_CHAIN_NAME');
            this.oracleRepository.save(oracle);
            this.oracleSvcEntity = oracle;
        }
        this.logger.log(JSON.stringify(this.oracleSvcEntity));
        this.taskService.setOracleSvcEntity(this.oracleSvcEntity);

        // Get the current block height

        this.lastBlockHeight = await client.getBlockNumber();
        this.logger.log('fetching lastBlockHeight as ' + this.lastBlockHeight)
        try {
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
                const currentBlockHeight = await client.getBlockNumber();
                if(currentBlockHeight == this.lastBlockHeight) {
                    return;
                }
                this.logger.debug(`scanning block from ${this.lastBlockHeight} to ${currentBlockHeight}`);

                const logs = await client.getContractEvents({
                    address: this.contractAddress,
                    // @ts-ignore
                    abi: oracleAbi,
                    eventName: 'RequestSent',
                    // TODO: persistant this block height to recover from crash
                    fromBlock: this.lastBlockHeight + BigInt(1),
                    toBlock: currentBlockHeight,
                });

                if (logs.length === 0) {
                    this.logger.debug('No new events found');
                } else {
                    for (const log of logs) {
                        this.logger.log('RequestSent Event received:', log.transactionHash);
                        await this.taskService.createTask(log); // Create a new task
                    }
                }

                this.lastBlockHeight = currentBlockHeight;
            } catch (error) {
                this.logger.error('Error fetching logs:', error);
            }
        }, 5000); // Fetch logs every second
    }

    stopFetchingLogs() {
        this.logger.log('stopFetchingLogs called...');
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}
