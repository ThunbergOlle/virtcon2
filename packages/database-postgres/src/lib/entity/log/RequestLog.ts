import { Entity, PrimaryGeneratedColumn, BaseEntity, Column } from 'typeorm';

@Entity()
export class RequestLog extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true, type: 'text' })
  requestName: string;

  @Column({ nullable: true, type: 'text' })
  url: string;

  @Column({ nullable: true, type: 'varchar' })
  ip: string;

  @Column({ nullable: true, type: 'integer' })
  time: number;

  @Column({ nullable: true, type: 'timestamp' })
  timestamp?: Date;

  @Column({ nullable: true, type: 'text' })
  message?: string;

  @Column({ nullable: true, type: 'text' })
  stack_trace?: string;
}
