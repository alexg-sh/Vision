import { prisma } from './prisma';

describe('Prisma Client Initialization', () => {
  it('should initialize Prisma client successfully', () => {
    // Basic check: Does the imported prisma object exist?
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
  });



});
