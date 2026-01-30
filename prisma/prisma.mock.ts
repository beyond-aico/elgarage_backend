export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  inventoryItem: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};
