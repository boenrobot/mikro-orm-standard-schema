import {
    type EntityDTO,
    type EntityName,
    EntitySchema,
    type Loaded,
    type SerializeOptions,
    type TypeConfig,
    wrap,
} from '@mikro-orm/core';
import { type v1 } from '@standard-schema/spec';

import { base } from './base';

export function serializer<
    Entity extends object,
    Populated extends string = never,
    E extends string = never,
    C extends TypeConfig = TypeConfig,
    Dto extends EntityDTO<Loaded<Entity, Populated, '*', E>, C> = EntityDTO<
        Loaded<Entity, Populated, '*', E>,
        C
    >,
>(
    entityType: EntityName<Entity>,
    options?: Readonly<SerializeOptions<Entity, Populated, E>>,
): v1.StandardSchema<Entity, Dto> {
    if (entityType instanceof EntitySchema) {
        entityType = entityType.meta.class as EntityName<Entity>;
    }
    if (typeof entityType !== 'function') {
        throw new TypeError('entityType must be a class or EntitySchema');
    }

    return Object.assign({}, base, {
        '~validate': function (
            validateInput: v1.StandardInput,
        ): v1.StandardOutput<Dto> {
            const value = validateInput.value;
            if (!(value instanceof entityType)) {
                return {
                    issues: [
                        {
                            path: [],
                            message: `Input is not an entity of type ${entityType.name}`,
                        },
                    ],
                };
            }
            const wrappedEntity = wrap(value as Entity);
            return {
                value: wrappedEntity.serialize(options) as Dto,
            };
        },
    } as const);
}
