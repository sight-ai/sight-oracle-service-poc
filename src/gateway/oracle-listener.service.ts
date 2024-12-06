import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaskService } from '../task/task.service';
import { oracleAbi } from '../common/oracle.abi';
import { OracleInstanceService } from './oracle-instance.service';
import { bigintToJSON } from '../common/utils';
import { RequestType } from '../common/entities/task.entity';
import { oracleClient as client } from '../common/clients';

// uint8 internal constant decrypt_ebool_async = 52;
// uint8 internal constant decrypt_euint64_async = 53;
// uint8 internal constant decrypt_eaddress_async = 54;
// uint8 internal constant reencrypt = 64;
const async_opcodes = [52, 53, 54, 64];

@Injectable()
export class OracleListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OracleListenerService.name);
  private intervalId;
  private contractAddress: `0x${string}`;

  constructor(
    private readonly taskService: TaskService,
    private readonly configService: ConfigService,
    private readonly oracleInstanceService: OracleInstanceService,
  ) {
    this.logger.log('Initializing service...');
    this.contractAddress = this.configService.get<string>(
      'ORACLE_CONTRACT_ADDRESS',
    ) as `0x${string}`;
  }

  async onModuleInit() {
    this.logger.log('onModuleInit called...');

    // Get the current block height
    this.logger.log(
      'fetching lastBlockHeight as ' +
        (await this.oracleInstanceService.getOracleInstanceHeight()),
    );
    const disable_services = (process.env.DISABLE_SERVICES || '').split(',');
    try {
      if (disable_services.includes('compute-proxy-listener')) {
        while (true) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } else {
        this.startFetchingLogs();
      }
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
        const lastBlockHeight =
          await this.oracleInstanceService.getOracleInstanceHeight();
        if (currentBlockHeight == lastBlockHeight) {
          return;
        }
        this.logger.debug(
          `scanning block from ${lastBlockHeight} to ${currentBlockHeight}`,
        );

        const logs: any[] = await client.getContractEvents({
          address: this.contractAddress,
          abi: oracleAbi,
          fromBlock: lastBlockHeight + BigInt(1),
          toBlock: currentBlockHeight,
        });

        if (logs.length === 0) {
          this.logger.debug('No new events found');
        } else {
          for (const log of logs) {
            this.logger.log(
              `${log.eventName} Event received:`,
              log.transactionHash,
            );
            this.logger.debug(JSON.stringify(log, bigintToJSON));
            switch (log.eventName) {
              case 'RequestSent':
                if (
                  log.args.req.ops.filter((op) =>
                    async_opcodes.includes(Number(op.opcode)),
                  ).length == 0
                ) {
                  await this.taskService.createTask(
                    log,
                    RequestType.GeneralRequestType,
                  ); // Create a new task
                } else {
                  await this.taskService.createTask(
                    log,
                    RequestType.GeneralRequestTypeWithAsyncOps,
                  ); // Create a new task
                }
                break;
              case 'ReencryptSent':
                await this.taskService.createTask(
                  log,
                  RequestType.ReencryptRequestType,
                ); // Create a new task
                break;
              case 'SaveCiphertextSent':
                await this.taskService.createTask(
                  log,
                  RequestType.SaveCiphertextRequestType,
                ); // Create a new task
                break;
              case 'RequestCallback':
              case 'ReencryptCallback':
              case 'SaveCiphertextCallback':
                this.logger.log(
                  `${log.eventName} Event received:`,
                  log.transactionHash,
                );
                break;
              default:
                this.logger.warn(`Skip Event: ${log.eventName}`);
            }
          }
        }

        this.oracleInstanceService.setOracleInstanceHeight(currentBlockHeight);
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
