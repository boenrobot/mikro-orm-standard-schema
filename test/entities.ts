import {
    Entity,
    ManyToOne,
    type Opt,
    PrimaryKey,
    Property,
} from '@mikro-orm/core';

@Entity()
export class MyEntity {
    @PrimaryKey({ type: 'number' })
    id!: number;

    @Property()
    myProp: Opt<string> = 'test';

    @ManyToOne(() => MyOtherEntity, { nullable: true })
    myOtherEntity?: MyOtherEntity;
}

@Entity()
export class MyOtherEntity {
    @PrimaryKey({ type: 'number' })
    id!: number;

    @Property()
    myOtherProp: Opt<string> = 'test2';

    @Property({ type: 'string' })
    myRequiredProp!: string;
}
