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
  proposals: {
    all: ['proposals'] as const,
    list: (filters?: { status?: string; clientId?: string }) => ['proposals', 'list', filters] as const,
    detail: (id: string) => ['proposals', 'detail', id] as const,
  },
  agreements: {
    all: ['agreements'] as const,
    list: (clientId?: string) => ['agreements', 'list', clientId] as const,
    detail: (id: string) => ['agreements', 'detail', id] as const,
  },
  addonTemplates: {
    all: ['addon-templates'] as const,
    list: () => ['addon-templates', 'list'] as const,
  },
  payments: {
    all: ['payments'] as const,
    list: (filters?: { clientId?: string; status?: string }) => ['payments', 'list', filters] as const,
    revenue: () => ['payments', 'revenue'] as const,
  },
  webhooks: {
    all: ['webhooks'] as const,
    list: () => ['webhooks', 'list'] as const,
    deliveries: (endpointId: string) => ['webhooks', 'deliveries', endpointId] as const,
  },
  contentBlocks: {
    all: ['content-blocks'] as const,
    byProposal: (proposalId: string) => ['content-blocks', proposalId] as const,
  },
  proposalTemplates: {
    all: ['proposal-templates'] as const,
    list: (category?: string) => ['proposal-templates', 'list', category] as const,
  },
};
