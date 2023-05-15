import { gql } from '@apollo/client';

export const ITEMS_QUERY = gql`
  query Items {
    Items {
      name
      display_name
      description
      id
      icon
      recipe {
        requiredItem {
          id
          name
          display_name
        }
        requiredQuantity
      }
    }
  }
`;
export const CRAFT_MUTATION = gql`
  mutation CraftItem($quantity: Int!, $itemId: Int!) {
    craftItem(quantity: $quantity, itemId: $itemId) {
      quantity
      item {
        name
        display_name
        description
      }
    }
  }
`;
