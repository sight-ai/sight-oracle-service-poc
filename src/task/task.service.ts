// task.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { RequestEntity } from '../entities/request.entity';
import { RequestSchema, Request } from '../schemas/request.schema';
import {OperationEntity} from "../entities/operation.entity";
import {ComputeProxyService} from "./compute-proxy.service";
import {OracleCallbackRequestSchema} from "../schemas/oracle-callback.schema";
import {OracleCallbackService} from "../gateway/oracle-callback.service";
import {stringifyBigInt} from "../utils/utils";

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);

    constructor(
        @InjectRepository(TaskEntity) private taskRepository: Repository<TaskEntity>,
        @InjectRepository(RequestEntity) private requestRepository: Repository<RequestEntity>,
        @InjectRepository(OperationEntity) private operationRepository: Repository<OperationEntity>,
        private readonly computeProxyService: ComputeProxyService,
        private readonly oracleCallbackService: OracleCallbackService
    ) {}

    async createTask(log: any, chainId: number): Promise<TaskEntity> {
        this.logger.log(`create new Task`);
        // Validate and transform the log data using Zod
        const requestResult = RequestSchema.safeParse(log.args[0]);
        if (!requestResult.success) {
            this.logger.error('Invalid request log data:', requestResult.error.errors);
            throw new Error('Invalid request log data');
        }

        const validatedRequest: Request = requestResult.data;
        this.logger.log('Validate request pass');
        this.logger.log(validatedRequest);

        // Check if request already exists
        const existRequest = await this.requestRepository.findOneBy({id: validatedRequest.id});
        if(existRequest) {
            this.logger.log('Same request already exists, skip.')
            return null;
        }

        const operations = validatedRequest.ops.map((op, index) => {
            const operation = new OperationEntity();
            operation.opcode = op.opcode;
            operation.operands = op.operands.map(operand => Number(operand)); // Transform BigInt to number
            operation.value = Number(op.value); // Transform BigInt to number
            operation.index = index; // Set the index of the operation
            return operation;
        });

        const request = new RequestEntity();
        request.id = validatedRequest.id;
        request.requester = validatedRequest.requester;
        request.ops = operations;
        request.opsCursor = Number(validatedRequest.opsCursor); // Transform BigInt to number
        request.callbackAddr = validatedRequest.callbackAddr;
        request.callbackFunc = validatedRequest.callbackFunc;
        request.extraData = validatedRequest.extraData;

        await this.requestRepository.save(request);

        const task = new TaskEntity();
        task.requestId = request.id;
        task.requester = request.requester;
        task.transactionHash = log.transactionHash;
        task.blockHash = log.blockHash;
        task.chainId = chainId;
        task.callbackAddr = request.callbackAddr;
        task.callbackFunc = request.callbackFunc;
        task.extraData = request.extraData;
        task.request = request;

        this.logger.log('Creating task for requestID:', task.requestId);
        const savedTask = await this.taskRepository.save(task);

        // TODO: Decouple this logic by scan task
        await this.executeTask(savedTask.id);

        return savedTask;
    }

    async executeTask(taskId: string): Promise<void> {
        this.logger.log('Executing task ' + taskId);
        this.logger.log('Doing computation');
        await this.doComputation(taskId);
        this.logger.log('Doing callback');
        await this.doCallback(taskId);
    }

    async doComputation(taskId: string): Promise<void> {
        const task = await this.taskRepository.findOne({
            where: { id: taskId },
            relations: ['request', 'request.ops'],
        });
        if (!task) {
            this.logger.error(`Task with ID ${taskId} not found`);
            throw new Error(`Task with ID ${taskId} not found`);
        }

        // Transform task data into the format expected by the ComputeProxy contract
        const request = {
            id: task.requestId,
            requester: task.requester,
            ops: task.request.ops.map(op => ({
                opcode: op.opcode,
                operands: op.operands,
                value: op.value,
            })),
            opsCursor: task.request.opsCursor,
            callbackAddr: task.callbackAddr,
            callbackFunc: task.callbackFunc,
            extraData: task.extraData,
        };

        try {
            const response = await this.computeProxyService.executeRequest(request);
            // TODO: Add recipient for computation tx hash
            this.logger.log(`Task ${taskId} computation executed successfully`);
            task.status = 'executed';
            await this.taskRepository.save(task);
            task.responseResults = JSON.stringify(response, stringifyBigInt);
            task.status = 'response-captured';
            await this.taskRepository.save(task);
            this.logger.log('Task result captured');
            this.logger.log(response);
        } catch (error) {
            // TODO: retry
            this.logger.error(`Error executing task ${taskId}: ${error.message}`);
            task.status = 'failed';
            await this.taskRepository.save(task);
        }
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
        if(task.status !== 'response-captured') {
            this.logger.error('No response captured');
            throw new Error(`Task with ID ${taskId} no response captured`);
        }
        const computationResults = JSON.parse(task.responseResults).args.results;

        this.logger.log('Callbacking following result:');
        this.logger.log(computationResults);

        const transformedComputationResults = computationResults.map(element => {
            return {
                data: BigInt(element.data),
                valueType: element.valueType
            }
        });

        const callbackRequest = OracleCallbackRequestSchema.parse({
            chainId: task.chainId,
            requestId: task.requestId,
            callbackAddr: task.callbackAddr,
            callbackFunc: task.callbackFunc,
            responseResults: transformedComputationResults,
        });

        // TODO: decouple and use HTTP REST API
        const callbackRecipient = await this.oracleCallbackService.doCallback(callbackRequest);
        if(callbackRecipient) {
            task.callbackRecipient = callbackRecipient;
            task.status = 'callback-complete';
            await this.taskRepository.save(task);
        } else {
            this.logger.error(`task ${taskId} failed to do callback`);
            task.status = 'callback-failed';
            await this.taskRepository.save(task);
        }
    }

}
