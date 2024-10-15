import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {createPublicClient, http, keccak256} from 'viem';
import { oracleChain } from './oracle.chain'; // Import your custom chain definition
import { OracleInstanceEntity } from 'src/entities/oracle-instance.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { bigint } from 'zod';

// Setup viem client with custom chain
const client = createPublicClient({
    chain: oracleChain,
    transport: http(process.env.ORACLE_CHAIN_RPC_URL)
});

@Injectable()
export class OracleInstanceService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OracleInstanceService.name);
    private oracleInstanceEntity: OracleInstanceEntity;
    constructor(
        @InjectRepository(OracleInstanceEntity) private oracleInstanceRepository: Repository<OracleInstanceEntity>,
        private readonly configService: ConfigService,
    ) {
    }

    async onModuleInit() {
        this.logger.log('onModuleInit called...');
        const chainId = +this.configService.get<string>('ORACLE_CHAIN_ID');
        const oracleInstanceSymbol = Buffer.from(this.configService.get<string>('ORACLE_INSTANCE_SYMBOL') as string || this.configService.get<string>('ORACLE_CHAIN_NAME') as string + this.configService.get<string>('ORACLE_CHAIN_ID') as string);
        this.logger.log(oracleInstanceSymbol);
        const oracleInstanceId = keccak256(oracleInstanceSymbol);
        this.oracleInstanceEntity = await this.oracleInstanceRepository.findOneBy({id: oracleInstanceId});
        if(!this.oracleInstanceEntity) {
            const oracle = new OracleInstanceEntity();
            oracle.id = oracleInstanceId;
            oracle.address = this.configService.get<string>('ORACLE_CONTRACT_ADDRESS');
            oracle.chainId = chainId;
            oracle.height = (await client.getBlockNumber()).toString();
            oracle.name = this.configService.get<string>('ORACLE_CHAIN_NAME');
            await this.oracleInstanceRepository.save(oracle);
            this.oracleInstanceEntity = oracle;
        }
        this.logger.log(JSON.stringify(this.oracleInstanceEntity));
    }

    onModuleDestroy() {
        this.logger.log('onModuleDestroy called...');
    }

    getOracleInstanceEntity(): OracleInstanceEntity {
        return this.oracleInstanceEntity;
    }

    async getOracleInstanceHeight(): Promise<bigint> 
    {
        while(!this.oracleInstanceEntity) {
            await new Promise((resolve)=>setTimeout(resolve, 1000));
        }
        return BigInt(parseInt(this.oracleInstanceEntity.height));
    }

    async setOracleInstanceHeight(height: bigint) {
        this.oracleInstanceEntity.height = height.toString();
        await this.oracleInstanceRepository.save(this.oracleInstanceEntity);
    }
}
