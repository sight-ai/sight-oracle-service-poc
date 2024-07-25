// task.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { RequestEntity } from '../entities/request.entity';
import { RequestSchema, Request } from '../schemas/request.schema';
import { TaskSchema, Task } from '../schemas/task.schema';
import {OperationEntity} from "../entities/operation.entity";
import {ComputeProxyService} from "./compute-proxy.service";

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);

    constructor(
        @InjectRepository(TaskEntity) private taskRepository: Repository<TaskEntity>,
        @InjectRepository(RequestEntity) private requestRepository: Repository<RequestEntity>,
        @InjectRepository(OperationEntity) private operationRepository: Repository<OperationEntity>,
        private readonly computeProxyService: ComputeProxyService,
    ) {}

    async createTask(log: any, chainId: number): Promise<TaskEntity> {
        // Validate and transform the log data using Zod
        const requestResult = RequestSchema.safeParse(log.args);
        if (!requestResult.success) {
            this.logger.error('Invalid request log data:', requestResult.error.errors);
            throw new Error('Invalid request log data');
        }

        const validatedRequest: Request = requestResult.data;
        const operations = validatedRequest.ops.map((op, index) => {
            const operation = new OperationEntity();
            operation.opcode = op.opcode;
            operation.operands = op.operands.map(operand => Number(operand)); // Transform BigInt to number
            operation.value = Number(op.value); // Transform BigInt to number
            operation.index = index; // Set the index of the operation
            return operation;
        });

        const request = new RequestEntity();
        request.requestId = validatedRequest.id;
        request.requester = validatedRequest.requester;
        request.ops = operations;
        request.opsCursor = Number(validatedRequest.opsCursor); // Transform BigInt to number
        request.callbackAddr = validatedRequest.callbackAddr;
        request.callbackFunc = validatedRequest.callbackFunc;
        request.extraData = validatedRequest.extraData;

        await this.requestRepository.save(request);

        const taskResult = TaskSchema.safeParse({
            requestId: validatedRequest.id,
            requester: validatedRequest.requester,
            transactionHash: log.transactionHash,
            blockHash: log.blockHash,
            chainId: chainId,
            callbackAddr: validatedRequest.callbackAddr,
            callbackFunc: validatedRequest.callbackFunc,
            extraData: validatedRequest.extraData,
        });

        if (!taskResult.success) {
            this.logger.error('Invalid task data:', taskResult.error.errors);
            throw new Error('Invalid task data');
        }

        const validatedTask: Task = taskResult.data;

        const task = new TaskEntity();
        task.requestId = validatedTask.requestId;
        task.requester = validatedTask.requester;
        task.transactionHash = validatedTask.transactionHash;
        task.blockHash = validatedTask.blockHash;
        task.chainId = validatedTask.chainId;
        task.callbackAddr = validatedTask.callbackAddr;
        task.callbackFunc = validatedTask.callbackFunc;
        task.extraData = validatedTask.extraData;

        this.logger.log('Creating task with ID:', task.requestId);
        const savedTask = await this.taskRepository.save(task);

        // TODO: Decouple this logic by scan task
        await this.executeTask(savedTask.id);

        return savedTask;
    }

    async executeTask(taskId: string): Promise<void> {
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
            const tx = await this.computeProxyService.executeRequest(request);
            this.logger.log(`Task ${taskId} executed successfully: ${tx.hash}`);
            task.status = 'executed';
            await this.taskRepository.save(task);
        } catch (error) {
            // TODO: retry
            this.logger.error(`Error executing task ${taskId}: ${error.message}`);
            task.status = 'failed';
            await this.taskRepository.save(task);
        }
    }

    async updateTaskStatus(taskId: string, status: string): Promise<TaskEntity> {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (task) {
            task.status = status;
            return this.taskRepository.save(task);
        }
        throw new Error('Task not found');
    }
}
