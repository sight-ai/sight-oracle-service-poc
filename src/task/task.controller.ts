import { Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { TaskEntity } from 'src/common/entities/task.entity';
import { bigintToJSON } from 'src/common/utils';
import { Repository } from 'typeorm';

@Controller('task')
export class TaskController {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) {}
  @Get('/status')
  async status(
    @Query() query: { pageIndex: number; pageSize: number },
    @Res() res: Response,
  ) {
    const results = await this.taskRepository.find({
      where: [
        {
          failed: false,
        },
      ],
      relations: {
        request: false,
        response: false,
        asyncResponses: false,
      },
      take: query.pageSize,
      skip: query.pageIndex * query.pageSize,
      order: {
        blockNumber: 'ASC',
        transactionIndex: 'ASC',
        logIndex: 'ASC',
      },
    });
    return res
      .status(HttpStatus.OK)
      .json(JSON.parse(JSON.stringify(results, bigintToJSON)));
  }
  @Get('/:reqId')
  async reqStatus(@Param() param, @Res() res: Response) {
    const result = await this.taskRepository.findOne({
      where: [
        {
          request: { id: param.reqId },
        },
      ],
      relations: {
        request: true,
        response: false,
        asyncResponses: false,
      },
      order: {
        blockNumber: 'ASC',
        transactionIndex: 'ASC',
        logIndex: 'ASC',
      },
    });
    return res.json(JSON.parse(JSON.stringify(result || {}, bigintToJSON)));
  }
}
