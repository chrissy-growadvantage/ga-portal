import type { Client, DeliveryItem, ScopeAllocation, Operator } from './database';

export interface PortalData {
  client: Pick<Client, 'id' | 'company_name' | 'contact_name' | 'status'>;
  operator: Pick<Operator, 'full_name' | 'business_name'>;
  deliveries: DeliveryItem[];
  scope_allocations: ScopeAllocation[];
}

export interface PortalError {
  code: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'NOT_FOUND' | 'SERVER_ERROR';
  message: string;
}
