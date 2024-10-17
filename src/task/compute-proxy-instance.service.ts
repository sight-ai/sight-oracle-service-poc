import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {createPublicClient, http, keccak256} from 'viem';
import { computeProxyChain } from './compute-proxy.chain'; // Import your custom chain definition
import { ComputeProxyInstanceEntity } from 'src/entities/compute-proxy-instance.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Setup viem client with custom chain
const client = createPublicClient({
    chain: computeProxyChain,
    transport: http(process.env.COMPUTE_PROXY_CHAIN_RPC_URL)
});

@Injectable()
export class ComputeProxyInstanceService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ComputeProxyInstanceService.name);
    private computeProxyInstanceEntity: ComputeProxyInstanceEntity;
    constructor(
        @InjectRepository(ComputeProxyInstanceEntity) private computeProxyInstanceRepository: Repository<ComputeProxyInstanceEntity>,
        private readonly configService: ConfigService,
    ) {
    }

    async onModuleInit() {
        this.logger.log('onModuleInit called...');
        const chainId = +this.configService.get<string>('COMPUTE_PROXY_CHAIN_ID');
        const computeProxyInstanceSymbol = Buffer.from(this.configService.get<string>('COMPUTE_PROXY_INSTANCE_SYMBOL') as string || this.configService.get<string>('COMPUTE_PROXY_CHAIN_NAME') as string + this.configService.get<string>('COMPUTE_PROXY_CHAIN_ID') as string);
        this.logger.log(computeProxyInstanceSymbol);
        const computeProxyInstanceId = keccak256(computeProxyInstanceSymbol);
        this.computeProxyInstanceEntity = await this.computeProxyInstanceRepository.findOneBy({id: computeProxyInstanceId});
        if(!this.computeProxyInstanceEntity) {
            const computeProxy = new ComputeProxyInstanceEntity();
            computeProxy.id = computeProxyInstanceId;
            computeProxy.address = this.configService.get<string>('COMPUTE_PROXY_CONTRACT_ADDRESS');
            computeProxy.chainId = chainId;
            computeProxy.height = (await client.getBlockNumber()).toString();
            computeProxy.name = this.configService.get<string>('COMPUTE_PROXY_CHAIN_NAME');
            await this.computeProxyInstanceRepository.save(computeProxy);
            this.computeProxyInstanceEntity = computeProxy;
        }
        this.logger.log(JSON.stringify(this.computeProxyInstanceEntity));
    }

    onModuleDestroy() {
        this.logger.log('onModuleDestroy called...');
    }

    getComputeProxyInstanceEntity(): ComputeProxyInstanceEntity {
        return this.computeProxyInstanceEntity;
    }

    async getComputeProxyInstanceHeight(): Promise<bigint> 
    {
        while(!this.computeProxyInstanceEntity) {
            await new Promise((resolve)=>setTimeout(resolve, 1000));
        }
        return BigInt(parseInt(this.computeProxyInstanceEntity.height));
    }

    async setComputeProxyInstanceHeight(height: bigint) {
        this.computeProxyInstanceEntity.height = height.toString();
        await this.computeProxyInstanceRepository.save(this.computeProxyInstanceEntity);
    }
}
