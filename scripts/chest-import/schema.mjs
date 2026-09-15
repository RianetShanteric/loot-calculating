export const chestDraftSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      maxLength: 80,
      description: 'Stable ASCII slug for the chest.',
    },
    name: { type: 'string', minLength: 1, maxLength: 160 },
    sourceUrl: { type: 'string', minLength: 1, maxLength: 2048 },
    iconUrl: { type: 'string', minLength: 1, maxLength: 2048 },
    rewards: {
      type: 'array',
      minItems: 1,
      maxItems: 500,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          iconUrl: { type: 'string', minLength: 1, maxLength: 2048 },
          quantity: { type: 'integer', minimum: 1, maximum: 1_000_000_000 },
          chancePercent: { type: 'number', exclusiveMinimum: 0, maximum: 100 },
        },
        required: ['name', 'iconUrl', 'quantity', 'chancePercent'],
      },
    },
  },
  required: ['id', 'name', 'sourceUrl', 'iconUrl', 'rewards'],
};
