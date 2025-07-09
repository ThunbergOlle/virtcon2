import { gql, useQuery } from '@apollo/client';
import { ClientPacket, InventoryType, PacketType, RequestMoveInventoryItemPacketData } from '@virtcon2/network-packet';
import { DBUserInventoryItem } from '@virtcon2/static-game-data';
import { prop, sortBy } from 'ramda';
import { useCallback, useEffect, useRef } from 'react';
import { events } from '../../../events/Events';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Game from '../../../scenes/Game';
import InventoryItem, { InventoryItemPlaceholder, InventoryItemType } from '../../components/inventoryItem/InventoryItem';
import Window from '../../components/window/Window';
import { useUser } from '../../context/user/UserContext';
import { startPlaceBuildingIntent } from '../../lib/buildingPlacement';
import { close, isWindowOpen, toggle, WindowType } from '../../lib/WindowSlice';

const PLAYER_INVENTORY_FRAGMENT = gql`
  fragment PlayerInventoryFragment on UserInventoryItem {
    id
    quantity
    slot
    item {
      id
      display_name
      name
      is_building
      building {
        id
        is_rotatable
      }
    }
  }
`;

export const PLAYER_INVENTORY_QUERY = gql`
  ${PLAYER_INVENTORY_FRAGMENT}
  query PlayerInventoryWindow($userId: ID!) {
    userInventory(userId: $userId) {
      id
      ...PlayerInventoryFragment
    }
  }
`;

const PLAYER_INVENTORY_SUBSCRIPTION = gql`
  ${PLAYER_INVENTORY_FRAGMENT}
  subscription PlayerInventoryWindow($userId: ID!) {
    userInventory(userId: $userId) {
      id
      ...PlayerInventoryFragment
    }
  }
`;

export default function PlayerInventoryWindow() {
  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_PLAYER_INVENTORY));
  const user = useUser();
  const dispatch = useAppDispatch();

  const { subscribeToMore, data, loading, error } = useQuery<{ userInventory: DBUserInventoryItem[] }>(PLAYER_INVENTORY_QUERY, {
    variables: { userId: user.id },
    skip: !isOpen,
  });

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: PLAYER_INVENTORY_SUBSCRIPTION,
      variables: { userId: user.id },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        return subscriptionData.data;
      },
    });

    return unsubscribe;
  }, [subscribeToMore, user.id]);

  const onInventoryButtonPressed = useCallback(() => dispatch(toggle(WindowType.VIEW_PLAYER_INVENTORY)), [dispatch]);

  useEffect(() => {
    events.subscribe('onInventoryButtonPressed', onInventoryButtonPressed);
    return () => {
      events.unsubscribe('onInventoryButtonPressed', () => onInventoryButtonPressed);
    };
  }, [onInventoryButtonPressed]);

  const onItemWasClicked = (inventoryItem: DBUserInventoryItem) => {
    if (!inventoryItem.item?.is_building) return;

    dispatch(close(WindowType.VIEW_PLAYER_INVENTORY));

    startPlaceBuildingIntent(inventoryItem);
  };

  const onInventoryDropItem = (item: InventoryItemType, slot: number, inventoryId: number) => {
    // Construct network packet to move the item to the new invenory.
    const packet: ClientPacket<RequestMoveInventoryItemPacketData> = {
      data: {
        ...item,
        toInventoryId: inventoryId,
        toInventorySlot: slot,
        toInventoryType: InventoryType.PLAYER,
      },
      packet_type: PacketType.REQUEST_MOVE_INVENTORY_ITEM,
    };
    Game.network.sendPacket(packet);
  };

  const sortedInventory = sortBy(prop('slot'))(data?.userInventory ?? []);

  return (
    <Window
      title="Inventory"
      width={600}
      height={650}
      defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }}
      windowType={WindowType.VIEW_PLAYER_INVENTORY}
      fullWindowLoading={loading}
      errors={[error]}
    >
      <div className="grid grid-cols-8 grid-rows-8 gap-2">
        {sortedInventory.map((inventoryItem: DBUserInventoryItem) => {
          return inventoryItem.item ? (
            <InventoryItem
              key={inventoryItem.slot}
              inventoryItem={inventoryItem}
              slot={inventoryItem.slot}
              onDrop={onInventoryDropItem}
              onClick={() => onItemWasClicked(inventoryItem)}
              fromInventoryType={InventoryType.PLAYER}
              fromInventoryId={0}
              fromInventorySlot={inventoryItem.slot}
            />
          ) : (
            <InventoryItemPlaceholder key={inventoryItem.slot} inventoryId={0} slot={inventoryItem.slot} onDrop={onInventoryDropItem} />
          );
        })}
      </div>
    </Window>
  );
}
