import { describe, expect, it } from '@jest/globals';
import { wrap } from '@mikro-orm/core';
import { defineConfig, MikroORM } from '@mikro-orm/libsql';

import { serializer } from '../src';
import { MyEntity, MyOtherEntity } from './entities';

describe('serializer', () => {
    it('works', async () => {
        expect.hasAssertions();

        // Serializer is prepared before ORM init...
        const serializerWithoutPopulate = serializer(MyEntity, {
            populate: [],
            forceObject: true,
        });
        const serializerWithPopulate = serializer(MyEntity, {
            populate: ['myOtherEntity'],
            forceObject: true,
        });

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
        await orm.schema.ensureDatabase({ create: true });

        const em = orm.em.fork();

        em.create(
            MyOtherEntity,
            { myRequiredProp: 'test3' },
            { persist: true, managed: true },
        );

        let value = em.create(
            MyEntity,
            { myProp: 'test' },
            { persist: true, managed: true },
        );

        await em.flush();

        // ... but actual validator call happens only after ORM init
        const withoutPopulateStd = serializerWithoutPopulate['~validate']({
            value,
        });

        expect(withoutPopulateStd).toStrictEqual({
            value: { id: 1, myProp: 'test' },
        });

        const withoutPopulateManual = wrap(value).serialize({
            populate: [],
            forceObject: true,
        });

        expect(serializerWithoutPopulate['~validate']({ value })).toStrictEqual(
            {
                value: withoutPopulateManual,
            },
        );

        const serializerWithPopulatePreInsertManual = wrap(value).serialize({
            populate: ['myOtherEntity'],
            forceObject: true,
        });

        expect(serializerWithPopulate['~validate']({ value })).toStrictEqual({
            value: serializerWithPopulatePreInsertManual,
        });

        // Update manually, to ensure re-fetch, rather than identity map match
        await em
            .getDriver()
            .getConnection()
            .execute(
                `UPDATE my_entity
            SET
                my_other_entity_id = (
                    SELECT id
                        FROM my_other_entity
                        WHERE my_other_prop = 'test2'
                )
            WHERE
                my_prop = 'test'
    `,
            );
        em.clear();

        value = await em.findOneOrFail(
            MyEntity,
            { id: 1 },
            { populate: ['myOtherEntity'] },
        );

        const withoutPopulateManualWhenRelationIsPresent = wrap(
            value,
        ).serialize({
            populate: [],
            forceObject: true,
        });

        expect(serializerWithoutPopulate['~validate']({ value })).toStrictEqual(
            {
                value: withoutPopulateManualWhenRelationIsPresent,
            },
        );

        const serializerWithPopulatePostInsertManual = wrap(value).serialize({
            populate: ['myOtherEntity'],
            forceObject: true,
        });

        expect(serializerWithPopulate['~validate']({ value })).toStrictEqual({
            value: serializerWithPopulatePostInsertManual,
        });

        await orm.close();
    });
});
