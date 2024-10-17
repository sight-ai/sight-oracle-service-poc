import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, HDNodeWallet, JsonRpcProvider, TransactionResponse, Wallet } from "ethers";
import { computeProxyAbi } from './compute-proxy.abi';
import { TaskEntity } from 'src/entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskStatus } from 'src/schemas/task.schema';
import { stringifyBigInt } from 'src/utils/utils';
import { OracleCallbackRequestSchema } from 'src/schemas/oracle-callback.schema';
import { OracleInstanceService } from 'src/gateway/oracle-instance.service';
import { OracleCallbackService } from 'src/gateway/oracle-callback.service';
import { GetContractEventsReturnType, GetLogsReturnType, Log } from 'viem';

@Injectable()
export class ComputeProxyService {
    private readonly logger = new Logger(ComputeProxyService.name);
    private contractAddress: string;
    private provider: JsonRpcProvider;
    private wallet: HDNodeWallet;
    private contract: ethers.Contract;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(TaskEntity) private taskRepository: Repository<TaskEntity>,
        private readonly oracleInstanceService: OracleInstanceService,
        private readonly oracleCallbackService: OracleCallbackService
    ) {
        this.contractAddress = this.configService.get<string>('COMPUTE_PROXY_CONTRACT_ADDRESS') as string;
        this.logger.log("COMPUTE_PROXY_CONTRACT_ADDRESS: " + this.contractAddress);

        // Initialize the provider, wallet, and contract
        const rpcUrl = this.configService.get<string>('COMPUTE_PROXY_CHAIN_RPC_URL');
        const mnemonic = this.configService.get<string>('COMPUTE_PROXY_CHAIN_MNEMONIC');

        this.provider = new JsonRpcProvider(rpcUrl);
        this.wallet = Wallet.fromPhrase(mnemonic).connect(this.provider);
        this.contract = new ethers.Contract(this.contractAddress, computeProxyAbi, this.wallet);
    }

    async executeRequest(oracleInstanceId: string, reqId: string, input: any): Promise<any> {
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
                    transactionResponse = await this.contract.executeRequest(oracleInstanceId, reqId, input, {
                        gasLimit: 10000000n,
                    });
                    this.logger.log(`Compute transaction ${transactionResponse.hash} handing`);
                } catch (e) {
                    this.logger.error(e);
                    throw e;
                }

                this.logger.log(`Compute Transaction sent: ${transactionResponse.hash}`);
                return transactionResponse;
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


    async doCallback(taskId: string): Promise<void> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['request', 'request.ops'],
        });
        if (!task) {
            this.logger.error(`Task with ID ${taskId} not found`);
            throw new Error(`Task with ID ${taskId} not found`);
        }

        if(task.failed) {
            this.logger.error(`Task failed in previous step, skip`);
            return;
        }

        if(task.status !== TaskStatus.COMPUTE_RESPONSE_CAPTURED) {
            this.logger.error('No response captured');
            throw new Error(`Task with ID ${taskId} no response captured`);
        }

        task.status = TaskStatus.CALLBACK_STARTED;
        await this.taskRepository.save(task);

        this.logger.log('Callback following result:');
        this.logger.log(task.responseResults);

        const computationResults = JSON.parse(task.responseResults);

        const rawCapsulatedValues = computationResults[2];

        const transformedCapsulatedValues = rawCapsulatedValues.map(element => {
            return {
                data: BigInt(element[0]),
                valueType: BigInt(element[1])
            }
        });

        const callbackRequestParse = OracleCallbackRequestSchema.safeParse({
            chainId: this.oracleInstanceService.getOracleInstanceEntity().chainId,
            requestId: task.requestId,
            callbackAddr: task.callbackAddr,
            callbackFunc: task.callbackFunc,
            responseResults: transformedCapsulatedValues,
        });

        if(!callbackRequestParse.success) {
            this.logger.error('Invalid callbackRequest data:', callbackRequestParse.error.errors);
            throw new Error(callbackRequestParse.error.toString());
        }

        // TODO: decouple and use HTTP REST API
        try{
            const callbackTxHash = await this.oracleCallbackService.doCallback(callbackRequestParse.data);
            task.callbackRecipient = callbackTxHash;
            task.status = TaskStatus.CALLBACK_COMPLETE;
            await this.taskRepository.save(task);
        } catch (e) {
            this.logger.error(`task ${taskId} failed to do callback`);
            task.failed = true;
            await this.taskRepository.save(task);
        }
    }

    async doSaveResponseResults(log: { transactionHash: string, topics: string[], data: string}) {
            const event = this.contract.interface.parseLog({topics: log.topics, data: log.data});

            if (event.name !== 'RequestResolved') {
                this.logger.error('Unexpected event type');
                throw new Error('Unexpected event type');
            }
            const task = await this.taskRepository.findOne({
                where: { executeResponseHash: log.transactionHash },
                relations: ['request', 'request.ops'],
            });;
            task.responseResults = JSON.stringify(event.args, stringifyBigInt);
            task.status = TaskStatus.COMPUTE_RESPONSE_CAPTURED;
            await this.taskRepository.save(task);
            this.logger.log('Task computation response captured');
            this.logger.log('Doing callback ' + task.id);
            await this.doCallback(task.id);
    }
}
