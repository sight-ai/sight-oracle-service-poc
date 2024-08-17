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


const TaskStatus = {
    CREATED: 'created',
    COMPUTE_EXECUTED: 'compute-executed', // successfully execute the computation
    COMPUTE_RESPONSE_CAPTURED: 'compute-response-captured', // successfully execute the computation
    CALLBACK_STARTED: 'callback-started',
    CALLBACK_COMPLETE: 'callback-complete'
}

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

        this.logger.log(request);

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
        task.status = TaskStatus.CREATED;

        this.logger.log('Creating task for requestID:', task.requestId);
        this.logger.log(JSON.stringify(task));
        const savedTask = await this.taskRepository.save(task);

        // TODO: Decouple this logic by scan task
        await this.executeTask(savedTask.id);

        return savedTask;
    }

    async executeTask(taskId: string): Promise<void> {
        this.logger.log('Executing task ' + taskId);
        this.logger.log('Doing computation ' + taskId);
        await this.doComputation(taskId);
        this.logger.log('Doing callback ' + taskId);
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
            ops: task.request.ops.sort(function(a,b){return a.index - b.index}).map(op => ({
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
            this.logger.log(response);
            task.status = TaskStatus.COMPUTE_EXECUTED;
            await this.taskRepository.save(task);
            task.responseResults = JSON.stringify(response, stringifyBigInt);
            task.status = TaskStatus.COMPUTE_RESPONSE_CAPTURED;
            await this.taskRepository.save(task);
            this.logger.log('Task computation response captured');
        } catch (error) {
            // TODO: retry
            this.logger.error(`Error executing task ${taskId}: ${error.message}`);
            task.failed = true;
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

        const computationResults = JSON.parse(task.responseResults).args.results;

        this.logger.log('Callbacking following result:');
        this.logger.log(JSON.stringify(computationResults));

        const transformedComputationResults = computationResults.map(element => {
            return {
                data: BigInt(element.data),
                valueType: element.valueType
            }
        });

        const callbackRequestParse = OracleCallbackRequestSchema.safeParse({
            chainId: task.chainId,
            requestId: task.requestId,
            callbackAddr: task.callbackAddr,
            callbackFunc: task.callbackFunc,
            responseResults: transformedComputationResults,
        });

        if(!callbackRequestParse.success) {
            this.logger.error('Invalid callbackRequest data:', callbackRequestParse.error.errors);
            throw new Error(callbackRequestParse.error.toString());
        }

        // TODO: decouple and use HTTP REST API
        try{
            const callbackTxHash = await this.oracleCallbackService.doCallback(callbackRequestParse.data);
            task.callbackRecipient = callbackTxHash;
            task.status = TaskStatus.CALLBACK_STARTED;
            await this.taskRepository.save(task);
        } catch (e) {
            this.logger.error(`task ${taskId} failed to do callback`);
            task.failed = true;
            await this.taskRepository.save(task);
        }
    }

}
