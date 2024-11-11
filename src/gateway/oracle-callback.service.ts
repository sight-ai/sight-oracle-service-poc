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
  HDNodeWallet,
  JsonRpcProvider,
  Mnemonic,
  TransactionResponse,
} from 'ethers';
import {
  OracleCallbackRequest,
  OracleCallbackRequestSchema,
} from '../common/schemas/oracle-callback.schema';
import { Repository } from 'typeorm';
import { RequestType, TaskEntity } from 'src/common/entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskStatus } from 'src/common/schemas/task.schema';
import { TaskService } from 'src/task/task.service';
import { oracleAbi } from 'src/common/oracle.abi';

@Injectable()
export class OracleCallbackService implements OnModuleInit {
  private readonly logger = new Logger(OracleCallbackService.name);
  private provider: JsonRpcProvider;
  private wallet: HDNodeWallet;
  private wallets: HDNodeWallet[];
  private wallets_idx: number = 0;
  private contract: ethers.Contract;
  private oracleChainId: number;
  private contractAddress: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) {
    const rpcUrl = this.configService.get<string>('ORACLE_CHAIN_RPC_URL');
    const mnemonic = this.configService.get<string>('ORACLE_CHAIN_MNEMONIC');

    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = ethers.Wallet.fromPhrase(mnemonic).connect(this.provider);

    this.oracleChainId = parseInt(
      this.configService.get<string>('ORACLE_CHAIN_ID'),
      10,
    );
    this.contractAddress = this.configService.get<string>(
      'ORACLE_CONTRACT_ADDRESS',
    ) as string;

    this.contract = new ethers.Contract(
      this.contractAddress,
      oracleAbi,
      this.wallet,
    );
    this.logger.debug(`wallet default: ${this.wallet.address}`);

    const mnemonic_count =
      parseInt(this.configService.get<string>('ORACLE_CHAIN_MNEMONIC_COUNT')) ||
      1;

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
    this.logger.log(`initializing oracle callback service...`);
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
        where: {
          status: TaskStatus.COMPUTE_RESPONSE_CAPTURED,
          failed: false,
        },
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
          await this.taskService.doCallback(task.id);
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async doCallback(
    callbackRequest: OracleCallbackRequest,
    requestType: RequestType,
  ): Promise<string> {
    const maxRetries =
      +this.configService.get<string>('ORACLE_CHAIN_MAX_RETRIES') || 50;
    const retryDelay = 5000; // 5 seconds
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        attempt++;
        // Validate the callback request using Zod
        OracleCallbackRequestSchema.parse(callbackRequest);

        // Check if chain IDs match
        if (callbackRequest.chainId !== this.oracleChainId) {
          attempt = maxRetries;
          throw new Error(
            `Chain ID mismatch: expected ${this.oracleChainId}, got ${callbackRequest.chainId}`,
          );
        }

        let tx: TransactionResponse;
        let contract = this.contract.connect(
          this.wallets[this.wallets_idx++ % this.wallets.length],
        ) as ethers.Contract;
        switch (requestType) {
          case RequestType.GeneralRequestType:
          case RequestType.GeneralRequestTypeWithAsyncOps:
            tx = await contract.callback(
              callbackRequest.requestId,
              callbackRequest.responseResults,
            );
            break;
          case RequestType.ReencryptRequestType:
            tx = await contract.reencryptCallback(
              callbackRequest.requestId,
              callbackRequest.responseResults,
            );
            break;
          case RequestType.SaveCiphertextRequestType:
            tx = await contract.saveCiphertextCallback(
              callbackRequest.requestId,
              callbackRequest.responseResults,
            );
            break;
          default:
            throw new Error(
              `Wrong RequestType-${RequestType[requestType]} Branch`,
            );
        }

        this.logger.log(`Callback transaction sent: ${tx.hash}`);
        await tx.wait();
        this.logger.log(`Callback transaction mined: ${tx.hash}`);
        return tx.hash;
      } catch (error) {
        this.logger.error(
          `Error in callback task, attempt ${attempt} of ${maxRetries}: ${error.message}, ${error.stack}`,
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

    throw lastError || new Error('Unexpected error in doCallback');
  }
}
