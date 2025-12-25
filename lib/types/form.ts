/**
 * Form field type definitions
 */

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'url';

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  defaultValue?: string;
  validation?: FormFieldValidation;
  options?: string[]; // for select, radio, checkbox
}

export interface FormSettings {
  emailRecipients: string[]; // comma-separated emails
  successMessage: string;
  redirectUrl?: string;
}
