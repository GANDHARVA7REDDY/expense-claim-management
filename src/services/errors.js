/** Thrown whenever a business rule or validation fails. `errors` carries field-level messages. */
export class RuleError extends Error {
  constructor(message, errors = null) {
    super(message);
    this.name = 'RuleError';
    this.errors = errors;
  }
}
