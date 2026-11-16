import { describeRepositories } from './contract';
import { createMemoryRepositories } from './memory';

describeRepositories('bộ nhớ', async () => createMemoryRepositories());
