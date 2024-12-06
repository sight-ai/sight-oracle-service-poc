import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestType, TaskEntity } from 'src/common/entities/task.entity';
import { Repository } from 'typeorm';
import { ComputeProxyService } from './compute-proxy.service';
import { ComputeProxyInstanceService } from './compute-proxy-instance.service';
import { OracleInstanceService } from '../gateway/oracle-instance.service';
import { computeProxyAbi } from '../common/compute-proxy.abi';
import { bigintToJSON } from '../common/utils';
import { computeProxyClient as client } from '../common/clients';

@Injectable()
export class ComputeProxyListenerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ComputeProxyListenerService.name);
  private intervalId;
  private contractAddress: `0x${string}`;

  constructor(
    private readonly configService: ConfigService,
    private readonly computeProxyService: ComputeProxyService,
    private readonly computeProxyInstanceService: ComputeProxyInstanceService,
    private readonly oracleInstanceService: OracleInstanceService,
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
  ) {
    this.logger.log('Initializing service...');
    this.contractAddress = this.configService.get<string>(
      'COMPUTE_PROXY_CONTRACT_ADDRESS',
    ) as `0x${string}`;
  }

  async onModuleInit() {
    this.logger.log('onModuleInit called...');

    // Get the current block height
    this.logger.log(
      'fetching lastBlockHeight as ' +
        (await this.computeProxyInstanceService.getComputeProxyInstanceHeight()),
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
          await this.computeProxyInstanceService.getComputeProxyInstanceHeight();
        if (currentBlockHeight == lastBlockHeight) {
          return;
        }
        this.logger.debug(
          `scanning block from ${lastBlockHeight} to ${currentBlockHeight}`,
        );

        const logs: any[] = await client.getContractEvents({
          address: this.contractAddress,
          abi: computeProxyAbi,
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
              case 'RequestResolved':
                if (
                  log.args.oracleInstanceId !=
                  (await this.oracleInstanceService.getOracleInstanceEntity())
                    .id
                ) {
                  this.logger.warn(
                    `Skip Event: ${log.eventName}, oracleInstanceId not matched`,
                  );
                  break;
                }
                this.computeProxyService.doSaveResponseResults(
                  log,
                  RequestType.GeneralRequestType,
                );
                break;
              case 'SaveCiphertextResolved':
                if (
                  log.args.oracleInstanceId !=
                  (await this.oracleInstanceService.getOracleInstanceEntity())
                    .id
                ) {
                  this.logger.warn(
                    `Skip Event: ${log.eventName}, oracleInstanceId not matched`,
                  );
                  break;
                }
                this.computeProxyService.doSaveResponseResults(
                  log,
                  RequestType.SaveCiphertextRequestType,
                );
                break;
              case 'RequestAsyncResolved':
              case 'DecryptAsyncResolved':
              case 'ReencryptRequestResolved':
                if (
                  log.args.oracleInstanceId !=
                  (await this.oracleInstanceService.getOracleInstanceEntity())
                    .id
                ) {
                  this.logger.warn(
                    `Skip Event: ${log.eventName}, oracleInstanceId not matched`,
                  );
                  break;
                }
                this.computeProxyService.doSaveResponseResults(
                  log,
                  RequestType.GeneralRequestTypeWithAsyncOps,
                );
                break;
              default:
                this.logger.warn(`Skip Event: ${log.eventName}`);
            }
          }
        }

        this.computeProxyInstanceService.setComputeProxyInstanceHeight(
          currentBlockHeight,
        );
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
