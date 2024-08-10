import { pMap } from './functional';

describe('pMap', () => {
  it('should map an array of items to promises', async () => {
    const items = [1, 2, 3, 4, 5];
    const mapper = async (item: number) => item * 2;

    const result = await pMap(items, mapper);

    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it('should map an array of items to promises with concurrency', async () => {
    const items = [1, 2, 3, 4, 5];
    const mapper = async (item: number) => item * 2;

    const result = await pMap(items, mapper, { concurrency: 2 });

    expect(result).toEqual([2, 4, 6, 8, 10]);
  });
});
