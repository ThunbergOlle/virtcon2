export class InventoryFullError extends Error {
  constructor() {
    super('Inventory is full');
  }
}
