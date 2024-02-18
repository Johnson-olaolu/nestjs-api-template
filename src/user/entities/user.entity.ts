import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Profile } from './profile.entity';

import { Exclude, instanceToPlain } from 'class-transformer';
import { Role } from '../role/entities/role.entity';

@Entity({
  name: '_user',
})
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column({
  //   unique: true,
  // })
  // userName: string;

  @Column({
    unique: true,
  })
  email: string;

  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @Exclude({ toPlainOnly: true })
  @Column({
    nullable: true,
  })
  emailVerificationToken: string;

  @Exclude({ toPlainOnly: true })
  @Column({
    nullable: true,
  })
  emailVerificationTokenTTL: Date;

  @Exclude({ toPlainOnly: true })
  @Column({
    nullable: true,
  })
  passwordResetToken: string;

  @Exclude({ toPlainOnly: true })
  @Column({
    nullable: true,
  })
  passwordResetTokenTTL: Date;

  @Column({
    default: false,
  })
  isEmailVerified: boolean;

  @OneToOne(() => Profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  profile: Profile;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleName', referencedColumnName: 'name' })
  role: Role;

  @Column()
  roleName: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 3); // You can adjust the salt rounds as needed
    }
  }

  async comparePasswords(password: string): Promise<boolean> {
    const result = await bcrypt.compareSync(password, this.password);
    return result;
  }

  toJSON() {
    return instanceToPlain(this);
  }
}
