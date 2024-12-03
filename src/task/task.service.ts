// task.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestType, TaskEntity } from '../common/entities/task.entity';
import { RequestEntity } from '../common/entities/request.entity';
import { TaskStatus } from '../common/schemas/task.schema';
import {
  RequestSchema,
  Request,
  ReencryptRequest,
  SaveCiphertextRequest,
  ReencryptRequestSchema,
  SaveCiphertextRequestSchema,
} from '../common/schemas/request.schema';
import { ComputeProxyService } from './compute-proxy.service';
import { bigintToJSON } from '../common/utils';
import { ConfigService } from '@nestjs/config';
import { OracleInstanceService } from 'src/gateway/oracle-instance.service';
import { ComputeProxyInstanceService } from './compute-proxy-instance.service';
import { ResponseEntity } from 'src/common/entities/response.entity';
import { OracleCallbackService } from 'src/gateway/oracle-callback.service';
import { OracleCallbackRequestSchema } from 'src/common/schemas/oracle-callback.schema';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    @InjectRepository(RequestEntity)
    private requestRepository: Repository<RequestEntity>,
    @InjectRepository(ResponseEntity)
    private responseRepository: Repository<ResponseEntity>,
    private readonly configService: ConfigService,
    private readonly computeProxyService: ComputeProxyService,
    private readonly oracleInstanceService: OracleInstanceService,
    private readonly oracleCallbackService: OracleCallbackService,
    private readonly computeProxyInstanceService: ComputeProxyInstanceService,
  ) {}

  async createTask(log: any, requestType: RequestType): Promise<TaskEntity> {
    this.logger.log(`create new ${RequestType[requestType]} Task`);

    const reqId = log.args.reqId;
    // Check if request already exists
    const existRequest = await this.requestRepository.findOneBy({ id: reqId });
    if (existRequest) {
      this.logger.log('Same request already exists, skip.');
      return null;
    }

    // Validate and transform the log data using Zod
    let requestResult: any;
    let validatedRequest: Request | ReencryptRequest | SaveCiphertextRequest;
    switch (requestType) {
      case RequestType.GeneralRequestType:
      case RequestType.GeneralRequestTypeWithAsyncOps:
        requestResult = RequestSchema.safeParse(log.args.req);
        if (!requestResult.success) {
          this.logger.error(
            `Invalid ${RequestType[requestType]} log data:`,
            requestResult.error.errors,
          );
          throw new Error('Invalid request log data');
        }
        validatedRequest = requestResult.data;
        break;
      case RequestType.ReencryptRequestType:
        requestResult = ReencryptRequestSchema.safeParse(log.args.req);
        if (!requestResult.success) {
          this.logger.error(
            `Invalid ${RequestType[requestType]} log data:`,
            requestResult.error.errors,
          );
          throw new Error('Invalid request log data');
        }
        validatedRequest = requestResult.data;
        break;
      case RequestType.SaveCiphertextRequestType:
        requestResult = SaveCiphertextRequestSchema.safeParse(log.args.req);
        if (!requestResult.success) {
          this.logger.error(
            `Invalid ${RequestType[requestType]} log data:`,
            requestResult.error.errors,
          );
          throw new Error('Invalid request log data');
        }
        validatedRequest = requestResult.data;
        break;
      default:
        this.logger.error(
          `Wrong RequestType-${RequestType[requestType]} Branch`,
        );
        throw new Error('Invalid Request Type.');
    }

    const request = new RequestEntity();
    request.id = reqId;
    request.body = validatedRequest;

    await this.requestRepository.save(request);

    const task = new TaskEntity();
    task.requestType = requestType;
    task.transactionHash = log.transactionHash;
    task.transactionIndex = log.transactionIndex;
    task.logIndex = log.logIndex;
    task.blockHash = log.blockHash;
    task.blockNumber = log.blockNumber.toString();
    task.oracleInstanceId = (
      await this.oracleInstanceService.getOracleInstanceEntity()
    ).id;
    task.computeProxyInstanceId = (
      await this.computeProxyInstanceService.getComputeProxyInstanceEntity()
    ).id;
    task.request = request;
    task.status = TaskStatus.CREATED;
    task.executeTxHashs = [];

    this.logger.log(
      `Creating ${RequestType[requestType]} task for requestID: ` +
        task.request.id,
    );
    const savedTask = await this.taskRepository.save(task);
    this.logger.debug(JSON.stringify(savedTask, bigintToJSON));

    return savedTask;
  }

  async executeTask(taskId: string): Promise<void> {
    this.logger.log('Executing task ' + taskId);
    await this.doComputation(taskId);
    this.logger.log('Waitting computation receipt ' + taskId);
  }

  async doComputation(taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['request', 'asyncResponses'],
    });
    if (!task) {
      this.logger.error(`Task with ID ${taskId} not found`);
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const body = task.request.body;
    // Transform task data into the format expected by the ComputeProxy contract
    let request: any;
    const others: any = [0, []];
    switch (task.requestType) {
      case RequestType.GeneralRequestType:
      case RequestType.GeneralRequestTypeWithAsyncOps:
        request = {
          requester: body.requester,
          ops: body.ops,
          opsCursor: body.opsCursor,
          callbackAddr: body.callbackAddr,
          callbackFunc: body.callbackFunc,
          payload: body.payload,
        };
        break;
      case RequestType.ReencryptRequestType:
        request = {
          requester: body.requester,
          target: {
            data: body.target.data,
            valueType: body.target.valueType,
          },
          publicKey: body.publicKey,
          signature: body.signature,
          callbackAddr: body.callbackAddr,
          callbackFunc: body.callbackFunc,
        };
        break;
      case RequestType.SaveCiphertextRequestType:
        request = {
          requester: body.requester,
          ciphertext: body.ciphertext,
          ciphertextType: body.ciphertextType,
          callbackAddr: body.callbackAddr,
          callbackFunc: body.callbackFunc,
        };
        break;
      default:
        this.logger.error(
          `Wrong RequestType-${RequestType[task.requestType]} Branch`,
        );
        throw new Error('Invalid Request Type.');
    }

    try {
      switch (task.requestType) {
        case RequestType.GeneralRequestType:
        case RequestType.SaveCiphertextRequestType:
          const response = await this.computeProxyService.executeRequest(
            (await this.oracleInstanceService.getOracleInstanceEntity()).id,
            task.request.id,
            task.requestType,
            request,
            others,
          );
          this.logger.log(
            `Task ${taskId} computation executingg with response:`,
          );
          this.logger.debug(JSON.stringify(response, bigintToJSON));
          task.status = TaskStatus.COMPUTE_EXECUTING;
          task.executeTxHash = response.hash;
          task.executeTxHashs.push(task.executeTxHash);
          await this.taskRepository.save(task);
          break;
        case RequestType.ReencryptRequestType:
          const result = await this.computeProxyService.executeRequest(
            (await this.oracleInstanceService.getOracleInstanceEntity()).id,
            task.request.id,
            task.requestType,
            request,
          );
          this.logger.log(
            `Task ${taskId} computation executed successful with response:`,
          );
          const body = [task.oracleInstanceId, task.request.id, result];
          this.logger.debug(JSON.stringify(body, bigintToJSON));
          task.status = TaskStatus.COMPUTE_RESPONSE_CAPTURED;
          const task_resp = new ResponseEntity();
          task_resp.reqId = task.request.id;
          task_resp.body = body;
          await this.responseRepository.save(task_resp);
          task.response = task_resp;
          task.executeTxHashs.push(task.executeTxHash);
          await this.taskRepository.save(task);
          break;
        case RequestType.GeneralRequestTypeWithAsyncOps:
          if (task.asyncResponses.length !== 0) {
            const previousAsyncResponse = task.asyncResponses.sort(
              (prev, next) =>
                Number(prev.body.reqIdAsync) - Number(next.body.reqIdAsync),
            )[task.asyncResponses.length - 1];
            others[0] = Number(previousAsyncResponse.body.asyncOpCursor) + 1;
            others[1] = previousAsyncResponse.body.results;
          }
          const asyncResponse = await this.computeProxyService.executeRequest(
            (await this.oracleInstanceService.getOracleInstanceEntity()).id,
            task.request.id,
            task.requestType,
            request,
            others,
          );
          this.logger.log(
            `Task ${taskId} computation async executing with response:`,
          );
          this.logger.debug(JSON.stringify(asyncResponse, bigintToJSON));
          task.status = TaskStatus.COMPUTE_EXECUTING_ASYNC;
          task.executeTxHash = asyncResponse.hash;
          task.executeTxHashs.push(task.executeTxHash);
          task.asynced = false;
          await this.taskRepository.save(task);
          break;
        default:
          this.logger.error(
            `Wrong RequestType-${RequestType[task.requestType]} Branch`,
          );
          throw new Error('Invalid Request Type.');
      }
    } catch (error) {
      this.logger.error(`Error executing task ${taskId}: ${error.message}`);
      task.failed = true;
      await this.taskRepository.save(task);
    }
  }

  async doCallback(taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['request', 'response'],
    });
    if (!task) {
      this.logger.error(`Task with ID ${taskId} not found`);
      throw new Error(`Task with ID ${taskId} not found`);
    }

    if (task.failed) {
      this.logger.error(`Task failed in previous step, skip`);
      return;
    }

    if (task.status !== TaskStatus.COMPUTE_RESPONSE_CAPTURED) {
      this.logger.error('No response captured');
      throw new Error(`Task with ID ${taskId} no response captured`);
    }

    task.status = TaskStatus.CALLBACK_STARTED;
    await this.taskRepository.save(task);

    this.logger.log('Callback following result:');
    this.logger.log(JSON.stringify(task.response, bigintToJSON));

    const callbackRequestParse = OracleCallbackRequestSchema.safeParse({
      chainId: (await this.oracleInstanceService.getOracleInstanceEntity())
        .chainId,
      requestId: task.request.id,
      callbackAddr: task.request.body.callbackAddr,
      callbackFunc: task.request.body.callbackFunc,
      responseResults:
        task.requestType === RequestType.SaveCiphertextRequestType
          ? {
              data: task.response.body[2][0],
              valueType: Number(task.response.body[2][1]),
            }
          : task.requestType === RequestType.GeneralRequestType ||
              task.requestType === RequestType.GeneralRequestTypeWithAsyncOps
            ? task.response.body[2].map((element) => {
                return {
                  data: element[0],
                  valueType: Number(element[1]),
                };
              })
            : task.response.body[2],
    });

    if (!callbackRequestParse.success) {
      this.logger.error(
        'Invalid callbackRequest data:',
        callbackRequestParse.error.errors,
      );
      throw new Error(callbackRequestParse.error.toString());
    }

    try {
      const callbackTxHash = await this.oracleCallbackService.doCallback(
        callbackRequestParse.data,
        task.requestType,
      );
      task.callbackTxHash = callbackTxHash;
      task.status = TaskStatus.CALLBACK_COMPLETE;
      await this.taskRepository.save(task);
    } catch (e) {
      this.logger.error(`task ${taskId} failed to do callback`);
      task.failed = true;
      await this.taskRepository.save(task);
    }
  }
}
