export const queryKeys = {
  clients: {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', id] as const,
    deliveries: (clientId: string) => ['clients', clientId, 'deliveries'] as const,
    scope: (clientId: string) => ['clients', clientId, 'scope'] as const,
    scopeRequests: (clientId: string) => ['clients', clientId, 'scope-requests'] as const,
  },
  operator: {
    profile: ['operator', 'profile'] as const,
    capacity: ['operator', 'capacity'] as const,
  },
  timeEntries: {
    all: ['time-entries'] as const,
    list: (filters?: { clientId?: string }) =>
      filters?.clientId
        ? ['time-entries', { clientId: filters.clientId }] as const
        : ['time-entries'] as const,
    running: ['time-entries', 'running'] as const,
  },
  portal: {
    data: (token: string) => ['portal', token] as const,
  },
};
