class ItemDTO {
  item_name: string;
  upper_price: number | null = null;
  lower_price: number | null = null;
  link: string | null = null;
  description: string | null = null;
  item_priority: number = 0;

  constructor(
    item_name: string,
    upper_price: number | null = null,
    lower_price: number | null = null,
    link: string | null = null,
    description: string | null = null,
    item_priority: number = 0
  ) {
    this.item_name = item_name;
    this.upper_price = upper_price;
    this.lower_price = lower_price;
    this.link = link;
    this.description = description;
    this.item_priority = item_priority;
  }

  /**
   * Returns true if the DTO is valid for submission.
   * Validation rule: item_name is required, and either `link` or `description` (or both) must be non-empty.
   */
  isValid(): boolean {
    const hasName = typeof this.item_name === "string" && this.item_name.trim().length > 0;
    const hasLink = typeof this.link === "string" && this.link.trim().length > 0;
    const hasDescription = typeof this.description === "string" && this.description.trim().length > 0;
    return hasName && (hasLink || hasDescription);
  }

  /**
   * Returns a validation error message or null when valid.
   */
  validationError(): string | null {
    if (!this.item_name || this.item_name.trim().length === 0) {
      return "Item name is required.";
    }
    const hasLink = typeof this.link === "string" && this.link.trim().length > 0;
    const hasDescription = typeof this.description === "string" && this.description.trim().length > 0;
    if (!hasLink && !hasDescription) {
      return "Either 'link' or 'description' must be provided.";
    }
    return null;
  }
  
  /**
   * Returns true if both prices are 0 or null
   */
  hasNoPrice(): boolean {
    return (this.upper_price === 0 || this.upper_price === null) && (this.lower_price === 0 || this.lower_price === null);
  }
}export default ItemDTO;

export function validateItemDTO(dto: ItemDTO): { valid: boolean; error?: string } {
    const valid = dto.isValid();
    return valid ? { valid } : { valid: false, error: dto.validationError() || "Invalid ItemDTO" };
}