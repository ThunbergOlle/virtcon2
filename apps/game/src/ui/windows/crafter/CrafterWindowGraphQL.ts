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
