import { describe, expect, it } from '@jest/globals';
import { defineConfig, MikroORM } from '@mikro-orm/libsql';

import { factory } from '../src/factory';
import { MyEntity, MyOtherEntity } from './entities';

describe('factory', () => {
    it('works', async () => {
        expect.hasAssertions();

        const orm = await MikroORM.init(
            defineConfig({
                entities: [MyEntity, MyOtherEntity],
                connect: false,
                dbName: ':memory:',
                ensureDatabase: {
                    create: true,
                    clear: true,
                    forceCheck: true,
                },
            }),
        );

        // Factories can only be prepared after an ORM init, though they don't need a fork
        const myEntityFactory = factory(MyEntity, orm);
        const myOtherEntityFactory = factory(MyOtherEntity, orm);

        const createMyEntityManual = orm.em.fork().create(MyEntity, {});
        const createMyEntityStd = myEntityFactory['~validate']({ value: {} });

        expect(createMyEntityStd).toMatchObject({
            value: createMyEntityManual,
        });

        const createMyOtherEntityManual = orm.em
            .fork()
            .create(MyOtherEntity, { myRequiredProp: 'test3' });
        const createMyOtherEntityStd = myOtherEntityFactory['~validate']({
            value: { myRequiredProp: 'test3' },
        });

        expect(createMyOtherEntityStd).toMatchObject({
            value: createMyOtherEntityManual,
        });

        const createMyOtherEntityStdFail = myOtherEntityFactory['~validate']({
            value: {},
        });

        expect(createMyOtherEntityStdFail).toHaveProperty('issues');
        expect(createMyOtherEntityStdFail).not.toHaveProperty('value');

        await orm.close();
    });
});
