import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simple test
it('adds two numbers', () => {
  expect(1 + 1).toBe(2);
});

// Describe block
describe('string methods', () => {
  it('uppercases', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });

  it('lowercases', () => {
    expect('HELLO'.toLowerCase()).toBe('hello');
  });
});

// Parametrized tests
describe('math', () => {
  it.each([
    [1, 1, 2],
    [2, 3, 5],
    [3, 4, 7],
 ])('adds %i + %i = %i', (a, b, expected) => {
    expect(a + b).toBe(expected);
  });
});

// Mocking
describe('mocking', () => {
  it('mocks a function', () => {
    const mockFn = vi.fn();
    mockFn.mockReturnValue(42);

    expect(mockFn()).toBe(42);
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('spies on object method', () => {
    const obj = {
      method: () => 'original',
    };
    const spy = vi.spyOn(obj, 'method');
    spy.mockReturnValue('mocked');

    expect(obj.method()).toBe('mocked');
    expect(spy).toHaveBeenCalledOnce();
  });
});

// Snapshots
describe('snapshots', () => {
  it('matches snapshot', () => {
    const user = { name: 'Alice', age: 30 };
    expect(user).toMatchSnapshot();
  });

  it('matches inline snapshot', () => {
    expect(new Date('2024-01-01').toISOString().split('T')[0]).toMatchInlineSnapshot('"2024-01-01"');
  });
});

// Async tests
describe('async', () => {
  it('resolves promise', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  it('rejects promise', async () => {
    await expect(Promise.reject(new Error('fail'))).rejects.toThrow('fail');
  });
});

// Setup and teardown
describe('lifecycle', () => {
  let counter;

  beforeEach(() => {
    counter = 0;
  });

  it('increments counter', () => {
    counter++;
    expect(counter).toBe(1);
  });

  it('increments counter again', () => {
    counter++;
    expect(counter).toBe(1);
  });
});
