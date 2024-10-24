import {
    CreateOptions,
    EntityData,
    EntityKey,
    type EntityName,
    EntitySchema,
    type MikroORM,
    RequiredEntityData,
} from '@mikro-orm/core';
import { type v1 } from '@standard-schema/spec';

import { base } from './base';

export function factory<Entity extends object, C extends boolean = false>(
    entityType: EntityName<Entity>,
    orm: MikroORM,
    options?: Omit<CreateOptions<C>, 'persist'>,
): v1.StandardSchema<EntityData<Entity, C>, Entity> {
    if (entityType instanceof EntitySchema) {
        entityType = entityType.meta.class as EntityName<Entity>;
    }
    if (typeof entityType !== 'function') {
        throw new TypeError('entityType must be a class or EntitySchema');
    }

    const properties = orm.getMetadata().get(entityType).properties;

    const em = orm.em.fork();

    return Object.assign({}, base, {
        '~validate': function (
            validateInput: v1.StandardInput,
        ): v1.StandardOutput<Entity> {
            const inputValue = validateInput.value;
            if (typeof inputValue !== 'object' || inputValue === null) {
                return {
                    issues: [
                        {
                            path: [],
                            message: 'Payload is not an object',
                        },
                    ],
                };
            }

            const filteredValue: Partial<EntityData<Entity>> = {};
            const issues: v1.StandardIssue[] = [];
            for (const property in properties) {
                const p = property as EntityKey<Entity>;
                if (property in inputValue) {
                    // TODO: Check property type before considering it filtered.
                    filteredValue[p] =
                        inputValue[property as keyof typeof inputValue];
                    continue;
                }
                if (
                    properties[p].optional ||
                    properties[p].nullable ||
                    properties[p].defaultRaw !== undefined ||
                    properties[p].autoincrement
                ) {
                    continue;
                }
                issues.push({
                    path: [p],
                    message: 'Property is required',
                });
            }

            if (issues.length > 0) {
                return { issues };
            }

            const value = em.create(
                entityType,
                filteredValue as RequiredEntityData<Entity, never, C>,
                {
                    ...options,
                    persist: false,
                },
            );
            em.clear();

            return { value };
        },
    });
}
