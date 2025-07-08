import { gql, useQuery } from '@apollo/client';
import { useCallback } from 'react';
import { useUser } from '../ui/context/user/UserContext';

const INVENTORY_QUERY = gql`
  query useInventoryQuery($userId: ID!) {
    userInventory(userId: $userId) {
      id
      item {
        id
        name
        display_name
      }
      quantity
    }
  }
`;

export const useInventory = () => {
  const user = useUser();

  const { data, loading } = useQuery(INVENTORY_QUERY, {
    variables: { userId: user.id },
  });

  const inventoryCount = useCallback(
    (itemId: number): number => {
      if (!data || loading) return 0;
      let count = 0;
      for (const slot of data.userInventory) {
        if (!slot.item) continue;
        if (slot.item.id === itemId) {
          count += slot.quantity;
        }
      }
      return count;
    },
    [data, loading],
  );

  return {
    inventory: data?.userInventory || [],
    loading,
    inventoryCount,
  };
};
