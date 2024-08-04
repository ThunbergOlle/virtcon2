import { gql, useMutation, useQuery } from '@apollo/client';
import { UserInventoryItem } from '@virtcon2/database-postgres';
import { DBItem, DBItemRecipe } from '@virtcon2/static-game-data';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { events } from '../../../events/Events';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import Window from '../../components/window/Window';
import { useUser } from '../../context/user/UserContext';
import { isWindowOpen, toggle, WindowType } from '../../lib/WindowSlice';
import { CRAFTER_SIDE_BAR_ITEM_FRAGMENT, CrafterSideBarItem } from './CrafterSidebarItem';
import { CRAFT_MUTATION } from './CrafterWindowGraphQL';
import { CRAFTER_RECIPE_ITEM_FRAGMENT, CrafterRecipeItem } from './RecipeItem';

const CRAFTER_WINDOW_QUERY = gql`
  ${CRAFTER_SIDE_BAR_ITEM_FRAGMENT}
  ${CRAFTER_RECIPE_ITEM_FRAGMENT}
  query CrafterWindow($userId: ID!) {
    userInventory(userId: $userId) {
      quantity
      slot
      item {
        id
        display_name
      }
      ...CrafterRecipeInventoryFragment
    }
    items {
      id
      display_name
      recipe {
        id
      }
      ...CrafterSideBarItemFragment
      ...CrafterRecipeItemFragment
    }
  }
`;

const PLAYER_INVENTORY_SUBSCRIPTION = gql`
  subscription CrafterWindow($userId: ID!) {
    userInventory(userId: $userId) {
      quantity
      slot
      item {
        id
        display_name
      }
    }
  }
`;

export default function CrafterWindow() {
  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_CRAFTER));
  const { id } = useUser();

  const { data, error, loading } = useQuery<{ items: DBItem[]; userInventory: UserInventoryItem[] }>(CRAFTER_WINDOW_QUERY, {
    variables: { userId: id },
    skip: !isOpen,
  });

  const [mutateCraftItem, craftItemMutation] = useMutation(CRAFT_MUTATION);

  const quantityInput = useRef<HTMLInputElement>(null);
  const [quantityToCraft, setQuantityToCraft] = useState<string>('1');
  const [selectedItem, setSelectedItem] = useState<DBItem | null>(null);

  const dispatch = useAppDispatch();

  const onCrafterButtonPressed = useCallback(() => dispatch(toggle(WindowType.VIEW_CRAFTER)), [dispatch]);

  useEffect(() => {
    events.subscribe('onCrafterButtonPressed', onCrafterButtonPressed);

    return () => {
      events.unsubscribe('onCrafterButtonPressed', () => onCrafterButtonPressed);
    };
  }, [onCrafterButtonPressed]);

  const craftItem = () => {
    mutateCraftItem({
      variables: {
        quantity: parseInt(quantityToCraft),
        itemId: selectedItem?.id,
      },
      onCompleted: () => {
        toast(`Crafted ${quantityToCraft}x ${selectedItem?.display_name}`, { type: 'success' });
      },
    });
  };

  const onSelectedItem = (itemId: number) => {
    setSelectedItem(data?.items.find((i) => i.id === itemId) || null);
  };

  const items = data?.items.filter((i) => i.recipe && i.recipe.length > 0) || [];

  return (
    <Window
      loading={[loading, craftItemMutation.loading]}
      errors={[error, craftItemMutation.error]}
      title="Crafter"
      width={800}
      height={600}
      defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }}
      windowType={WindowType.VIEW_CRAFTER}
    >
      <div className="flex flex-row h-full">
        <div className="flex-1">
          {items.map(({ id }) => (
            <CrafterSideBarItem key={`craftersidebaritem-${id}`} itemId={id} selectItem={onSelectedItem} />
          ))}
        </div>
        <div className="flex-[2]">
          {selectedItem ? (
            <div className="text-center flex flex-col justify-between h-full">
              <div className="flex-1">
                <h3 className="text-2xl ">{selectedItem.display_name}</h3>
                <p>{selectedItem.description}</p>
              </div>

              <div className="flex flex-[5] flex-row flex-wrap  bg-[#282828] mx-10 ">
                {selectedItem.recipe?.map((recipeItem: DBItemRecipe) => (
                  <CrafterRecipeItem itemRecipeId={recipeItem.id} inventoryItems={data?.userInventory || []} />
                ))}
              </div>
              <div className="my-4 mx-10 flex-1 flex flex-col  ">
                <div className="flex-row flex flex-1 items-center">
                  <label htmlFor="quantityToCraft" className="flex-1">
                    Quantity
                  </label>
                  <input
                    ref={quantityInput}
                    name="quantityToCraft"
                    className="min-w-[200] h-9 text-center flex-[4]"
                    type="number"
                    value={quantityToCraft}
                    min={1}
                    max={2147483647}
                    onChange={(e) => {
                      setQuantityToCraft(e.target.value);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Button onClick={() => craftItem()} variant="primary" disabled={!quantityInput.current?.validity.valid} className="float-right">
                    Craft
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>Please select an item to craft</div>
          )}
        </div>
      </div>
    </Window>
  );
}
