// ... existing code ...

// TypeScript type for creating a new Moneybird contact (customer)
export interface MoneybirdContactCustomField {
  id: number;
  value: string;
}

export interface MoneybirdContactPerson {
  firstname: string;
  lastname: string;
}

export interface CreateMoneybirdContactRequest {
  company_name?: string;
  address1?: string;
  address2?: string;
  zipcode?: string;
  city?: string;
  country?: string; // ISO two-character country code, e.g. NL or DE
  phone?: string;
  delivery_method?: 'Email' | 'Simplerinvoicing' | 'Peppol' | 'Manual' | 'Post';
  customer_id?: string;
  tax_number?: string;
  firstname?: string;
  lastname?: string;
  chamber_of_commerce?: string;
  bank_account?: string;
  send_invoices_to_attention?: string;
  send_invoices_to_email?: string;
  send_estimates_to_attention?: string;
  send_estimates_to_email?: string;
  sepa_active?: boolean;
  sepa_iban?: string;
  sepa_iban_account_name?: string;
  sepa_bic?: string;
  sepa_mandate_id?: string;
  sepa_mandate_date?: string; // Should be a date in the past
  sepa_sequence_type?: 'RCUR' | 'FRST' | 'OOFF' | 'FNAL';
  si_identifier_type?: string; // See allowed values in docs
  si_identifier?: string;
  invoice_workflow_id?: number;
  estimate_workflow_id?: number;
  email_ubl?: boolean;
  direct_debit?: boolean;
  custom_fields_attributes?: MoneybirdContactCustomField[];
  contact_person?: MoneybirdContactPerson;
  from_checkout?: boolean;
}
export interface MoneybirdContactEvent {
  administration_id: number;
  user_id: number;
  action: string;
  link_entity_id: string | null;
  link_entity_type: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MoneybirdContactResponse {
  id: string;
  administration_id: number;
  company_name: string;
  firstname: string;
  lastname: string;
  address1: string;
  address2: string;
  zipcode: string;
  city: string;
  country: string;
  phone: string;
  delivery_method: string;
  customer_id: string;
  tax_number: string;
  chamber_of_commerce: string;
  bank_account: string;
  is_trusted: boolean;
  max_transfer_amount: number | null;
  attention: string;
  email: string;
  email_ubl: boolean;
  send_invoices_to_attention: string;
  send_invoices_to_email: string;
  send_estimates_to_attention: string;
  send_estimates_to_email: string;
  sepa_active: boolean;
  sepa_iban: string;
  sepa_iban_account_name: string;
  sepa_bic: string;
  sepa_mandate_id: string;
  sepa_mandate_date: string | null;
  sepa_sequence_type: string;
  credit_card_number: string;
  credit_card_reference: string;
  credit_card_type: string | null;
  tax_number_validated_at: string | null;
  tax_number_valid: boolean | null;
  invoice_workflow_id: number | null;
  estimate_workflow_id: number | null;
  si_identifier: string;
  si_identifier_type: string | null;
  moneybird_payments_mandate: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  sales_invoices_url: string;
  notes: any[];
  custom_fields: any[];
  contact_people: any[];
  archived: boolean;
  events: MoneybirdContactEvent[];
}
// ... existing code ...