import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ethers,
  Wallet,
  Mnemonic,
  HDNodeWallet,
  JsonRpcProvider,
  TransactionResponse,
} from 'ethers';
import { computeProxyAbi } from '../common/compute-proxy.abi';
import { RequestType, TaskEntity } from 'src/common/entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskStatus } from '../common/schemas/task.schema';
import { bigintToJSON } from '../common/utils';
import {
  AsyncResponseEntity,
  ResponseEntity,
} from 'src/common/entities/response.entity';
import { TaskService } from './task.service';

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

@Injectable()
export class ComputeProxyService implements OnModuleInit {
  private readonly logger = new Logger(ComputeProxyService.name);
  private contractAddress: string;
  private provider: JsonRpcProvider;
  private wallet: HDNodeWallet;
  private wallets: HDNodeWallet[];
  private wallets_idx: number = 0;
  private contract: ethers.Contract;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    @InjectRepository(ResponseEntity)
    private responseRepository: Repository<ResponseEntity>,
    @InjectRepository(AsyncResponseEntity)
    private asyncResponseRepository: Repository<AsyncResponseEntity>,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
  ) {
    this.contractAddress = this.configService.get<string>(
      'COMPUTE_PROXY_CONTRACT_ADDRESS',
    ) as string;
    this.logger.log('COMPUTE_PROXY_CONTRACT_ADDRESS: ' + this.contractAddress);

    // Initialize the provider, wallet, and contract
    const rpcUrl = this.configService.get<string>(
      'COMPUTE_PROXY_CHAIN_RPC_URL',
    );
    const mnemonic = this.configService.get<string>(
      'COMPUTE_PROXY_CHAIN_MNEMONIC',
    );

    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = Wallet.fromPhrase(mnemonic).connect(this.provider);
    this.contract = new ethers.Contract(
      this.contractAddress,
      computeProxyAbi,
      this.wallet,
    );
    this.logger.debug(`wallet default: ${this.wallet.address}`);

    const mnemonic_count =
      parseInt(
        this.configService.get<string>('COMPUTE_PROXY_CHAIN_MNEMONIC_COUNT'),
      ) || 1;

    this.wallets = Array.from(Array(Number(mnemonic_count)).keys()).map(
      (v, i) => {
        const wallet = HDNodeWallet.fromMnemonic(
          Mnemonic.fromPhrase(mnemonic),
          "m/44'/60'/0'/0",
        )
          .deriveChild(i)
          .connect(this.provider);
        this.logger.debug(`wallet derive child-${v}: ${wallet.address}`);
        return wallet;
      },
    );
  }

  async onModuleInit() {
    this.logger.log(`initializing compute proxy service...`);
    this.handleCallback();
  }

  async handleCallback() {
    while (true) {
      const tasks = await this.taskRepository.find({
        select: {
          id: true,
          blockNumber: true,
          transactionIndex: true,
          logIndex: true,
          status: true,
        },
        where: [
          {
            status: TaskStatus.CREATED,
            failed: false,
          },
          {
            status: TaskStatus.COMPUTE_EXECUTING_ASYNC,
            failed: false,
            asynced: true,
          },
        ],
        relations: {
          request: false,
          response: false,
        },
        take: this.wallets.length,
        skip: 0,
        order: {
          blockNumber: 'ASC',
          transactionIndex: 'ASC',
          logIndex: 'ASC',
        },
      });
      await Promise.all(
        tasks.map(async (task) => {
          await this.taskService.executeTask(task.id);
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async executeRequest(
    oracleInstanceId: string,
    reqId: string,
    requestType: RequestType,
    input: any,
    others: any = null,
  ): Promise<any> {
    const maxRetries =
      +this.configService.get<string>('COMPUTE_PROXY_CHAIN_MAX_RETRIES') || 50;
    const retryDelay = 5000; // 5 seconds
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        attempt++;
        this.logger.log('Doing computation with the following args:');
        this.logger.debug(input);
        this.logger.debug(JSON.stringify(input, bigintToJSON));
        this.logger.debug(
          'Compute Proxy Contract Address:' + this.contractAddress,
        );

        let transactionResponse: TransactionResponse | any;

        try {
          switch (requestType) {
            case RequestType.GeneralRequestType:
            case RequestType.GeneralRequestTypeWithAsyncOps:
              transactionResponse = await (
                this.contract.connect(
                  this.wallets[this.wallets_idx++ % this.wallets.length],
                ) as ethers.Contract
              ).executeRequest(
                oracleInstanceId,
                reqId,
                input,
                others[0],
                others[1],
                {
                  gasLimit: 10000000n,
                },
              );
              break;
            case RequestType.SaveCiphertextRequestType:
              transactionResponse = await (
                this.contract.connect(
                  this.wallets[this.wallets_idx++ % this.wallets.length],
                ) as ethers.Contract
              ).executeSaveCiphertextRequest(oracleInstanceId, reqId, input, {
                gasLimit: 10000000n,
              });
              break;
            case RequestType.ReencryptRequestType:
              transactionResponse = await (
                this.contract.connect(
                  this.wallets[this.wallets_idx++ % this.wallets.length],
                ) as ethers.Contract
              ).executeReencryptRequest(oracleInstanceId, reqId, input, {
                gasLimit: 10000000n,
              });
              break;
          }
          this.logger.log(
            `Compute transaction ${transactionResponse.hash || transactionResponse} handing`,
          );
        } catch (e) {
          this.logger.error(
            `wallet-${this.wallets[(this.wallets_idx - 1) % this.wallets.length].address} failed at req-${reqId}`,
          );
          throw e;
        }

        this.logger.log(
          `Compute Transaction sent: ${transactionResponse.hash || transactionResponse}`,
        );
        return transactionResponse;
      } catch (error) {
        this.logger.error(
          `Error executing request, attempt ${attempt} of ${maxRetries}: ${error.message}`,
        );
        lastError = error;

        if (attempt < maxRetries) {
          this.logger.log(
            `Waiting for ${retryDelay / 1000} seconds before retrying...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay)); // Wait for 5 seconds before retrying
        } else {
          this.logger.error(
            `Max retry attempts reached. Failing with error: ${lastError.message}`,
          );
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unexpected error in executeRequest');
  }

  async doSaveResponseResults(
    log: {
      transactionHash: string;
      topics: string[];
      data: string;
      eventName: string;
      args: any;
    },
    requestType: RequestType,
  ) {
    const event = this.contract.interface.parseLog({
      topics: log.topics,
      data: log.data,
    });

    if (
      ![
        'RequestResolved',
        'ReencryptRequestResolved',
        'SaveCiphertextResolved',
        'RequestAsyncResolved',
        'DecryptAsyncResolved',
      ].includes(event.name)
    ) {
      this.logger.error(
        `Unexpected event type ${event.name} when deal with ${RequestType[requestType]}`,
      );
      throw new Error('Unexpected event type');
    } else {
      this.logger.debug(JSON.stringify(event, bigintToJSON));
    }
    if (
      requestType !== RequestType.GeneralRequestTypeWithAsyncOps ||
      log.eventName === 'RequestResolved'
    ) {
      const task = await this.taskRepository.findOne({
        where: { executeTxHash: log.transactionHash },
        relations: ['request'],
      });
      const response = new ResponseEntity();
      response.reqId = task.request.id;
      response.body = event.args;

      await this.responseRepository.save(response);
      task.response = response;
      task.status = TaskStatus.COMPUTE_RESPONSE_CAPTURED;
      await this.taskRepository.save(task);
      this.logger.log('Task computation response captured');
    } else {
      const task = await this.taskRepository.findOne({
        where: {
          request: {
            id: log.args.reqId,
          },
        },
        relations: ['request', 'asyncResponses'],
      });
      switch (event.name) {
        case 'RequestAsyncResolved':
          const asyncResponse = new AsyncResponseEntity();
          asyncResponse.reqIdAsync = Number(log.args.reqIdAsync);
          asyncResponse.transactionHash = log.transactionHash;
          asyncResponse.body = log.args;

          await this.asyncResponseRepository.save(asyncResponse);
          task.asyncResponses.push(asyncResponse);
          await this.taskRepository.save(task);
          this.logger.log('Task computation async response captured');
          break;
        case 'DecryptAsyncResolved':
          const previousAsyncResponse =
            await this.asyncResponseRepository.findOne({
              where: {
                reqIdAsync: Number(log.args.reqIdAsync),
              },
            });
          previousAsyncResponse.body.results[
            Number(previousAsyncResponse.body.asyncOpCursor)
          ] = log.args.results[0];
          previousAsyncResponse.transactionHashAsync = log.transactionHash;
          await this.asyncResponseRepository.save(previousAsyncResponse);
          this.logger.log('Doing async computation with the following args:');
          this.logger.debug(
            JSON.stringify(task.request.body, bigintToJSON),
            Number(previousAsyncResponse.body.asyncOpCursor) + 1,
            JSON.stringify(previousAsyncResponse.body.results, bigintToJSON),
          );
          task.asynced = true;
          await this.taskRepository.save(task);
          break;
        case 'ReencryptRequestResolved':
          const asyncReencryptResponse = new AsyncResponseEntity();
          asyncReencryptResponse.reqIdAsync = -1;
          asyncReencryptResponse.transactionHash = log.transactionHash;
          asyncReencryptResponse.body = log.args;

          await this.asyncResponseRepository.save(asyncReencryptResponse);
          task.asyncResponses.push(asyncReencryptResponse);
          await this.taskRepository.save(task);
          this.logger.log('Task computation async reencrypt response captured');

          const operands =
            task.request.body.ops[Number(log.args.asyncOpCursor)].operands;
          try {
            const reencrypt_result = await (
              this.contract.connect(
                this.wallets[this.wallets_idx++ % this.wallets.length],
              ) as ethers.Contract
            ).reencrypt(
              asyncReencryptResponse.body.results[
                Number(abiCoder.decode(['uint256'], operands[0].data)[0])
              ],
              abiCoder.decode(['bytes32'], operands[1].data)[0],
              operands[2].data,
              {
                gasLimit: 10000000n,
              },
            );
            asyncReencryptResponse.body.results[
              Number(asyncReencryptResponse.body.asyncOpCursor)
            ] = reencrypt_result;
            asyncReencryptResponse.transactionHashAsync = log.transactionHash;
            await this.asyncResponseRepository.save(asyncReencryptResponse);
            this.logger.log(
              'Doing async reencrypt computation with the following args:',
            );
            this.logger.debug(
              JSON.stringify(task.request.body, bigintToJSON),
              Number(asyncReencryptResponse.body.asyncOpCursor) + 1,
              JSON.stringify(asyncReencryptResponse.body.results, bigintToJSON),
            );
            task.asynced = true;
          } catch (error) {
            task.failed = true;
          }
          await this.taskRepository.save(task);
          break;
        default:
          this.logger.warn(`Skip Event: ${log.eventName}`);
      }
    }
  }
}
