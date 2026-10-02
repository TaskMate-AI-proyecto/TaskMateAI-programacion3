export const errorResponse = {
  type: 'object',
  required: ['success', 'message'],
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
  },
} as const;

export const categoryResponse = {
  type: 'object',
  required: ['id', 'name', 'color'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
  },
} as const;

export const taskResponse = {
  type: 'object',
  required: ['id', 'title', 'status', 'priority'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
    priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    dueDate: { type: ['string', 'null'], format: 'date-time' },
    categoryId: { type: ['string', 'null'] },
    category: { anyOf: [categoryResponse, { type: 'null' }] },
  },
} as const;

export function publicRoute(tag: string, summary: string, schema: Record<string, unknown> = {}) {
  return { tags: [tag], summary, ...schema };
}

export function protectedRoute(tag: string, summary: string, schema: Record<string, unknown> = {}) {
  return { tags: [tag], summary, security: [{ bearerAuth: [] }], ...schema };
}