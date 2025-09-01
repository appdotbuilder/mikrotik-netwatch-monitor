import { describe, expect, it } from 'bun:test';
import { type RouterConnectionInput } from '../schema';
import { testRouterConnection } from '../handlers/test_router_connection';

// Valid test input
const validInput: RouterConnectionInput = {
  host: '192.168.1.1',
  username: 'admin',
  password: 'password123'
};

describe('testRouterConnection', () => {
  it('should successfully connect with valid credentials', async () => {
    const result = await testRouterConnection(validInput);

    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully connected');
    expect(result.message).toContain('192.168.1.1');
    expect(result.router_identity).toBeDefined();
    expect(result.router_identity).toContain('MikroTik');
  });

  it('should return consistent router identity for same host', async () => {
    const result1 = await testRouterConnection(validInput);
    const result2 = await testRouterConnection(validInput);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.router_identity).toEqual(result2.router_identity);
  });

  it('should fail with invalid host', async () => {
    const input: RouterConnectionInput = {
      ...validInput,
      host: 'invalid.host'
    };

    const result = await testRouterConnection(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Host unreachable');
    expect(result.router_identity).toBeNull();
  });

  it('should fail with invalid username', async () => {
    const input: RouterConnectionInput = {
      ...validInput,
      username: 'invalid'
    };

    const result = await testRouterConnection(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Authentication failed');
    expect(result.router_identity).toBeNull();
  });

  it('should fail with invalid password', async () => {
    const input: RouterConnectionInput = {
      ...validInput,
      password: 'invalid'
    };

    const result = await testRouterConnection(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Authentication failed');
    expect(result.router_identity).toBeNull();
  });

  it('should fail with timeout scenario', async () => {
    const input: RouterConnectionInput = {
      ...validInput,
      host: 'timeout.test'
    };

    const result = await testRouterConnection(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Connection timeout');
    expect(result.router_identity).toBeNull();
  });

  it('should fail with missing host', async () => {
    const input: RouterConnectionInput = {
      ...validInput,
      host: ''
    };

    const result = await testRouterConnection(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing required connection parameters');
    expect(result.router_identity).toBeNull();
  });

  it('should fail with missing username', async () => {
    const input: RouterConnectionInput = {
      ...validInput,
      username: ''
    };

    const result = await testRouterConnection(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing required connection parameters');
    expect(result.router_identity).toBeNull();
  });

  it('should fail with missing password', async () => {
    const input: RouterConnectionInput = {
      ...validInput,
      password: ''
    };

    const result = await testRouterConnection(input);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing required connection parameters');
    expect(result.router_identity).toBeNull();
  });

  it('should handle different host formats correctly', async () => {
    const hostVariations = [
      '10.0.0.1',
      '172.16.1.1',
      'router.local',
      'mikrotik-main'
    ];

    for (const host of hostVariations) {
      const input: RouterConnectionInput = {
        ...validInput,
        host
      };

      const result = await testRouterConnection(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain(`Successfully connected to MikroTik router at ${host}`);
      expect(result.router_identity).toBeDefined();
      expect(typeof result.router_identity).toBe('string');
    }
  });

  it('should return different router identities for different hosts', async () => {
    const host1Input: RouterConnectionInput = {
      ...validInput,
      host: '192.168.1.1' // Length 11
    };
    
    const host2Input: RouterConnectionInput = {
      ...validInput,
      host: '10.0.0.1' // Length 8
    };

    const result1 = await testRouterConnection(host1Input);
    const result2 = await testRouterConnection(host2Input);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.router_identity).not.toEqual(result2.router_identity);
  });

  it('should complete connection test within reasonable time', async () => {
    const startTime = Date.now();
    
    const result = await testRouterConnection(validInput);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(result.success).toBe(true);
    expect(duration).toBeGreaterThan(400); // Should take at least 400ms due to simulated delay
    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
  });

  it('should handle various credential combinations', async () => {
    const credentialTests = [
      { username: 'admin', password: 'admin123', shouldSucceed: true },
      { username: 'user', password: 'userpass', shouldSucceed: true },
      { username: 'root', password: 'rootpassword', shouldSucceed: true },
      { username: 'invalid', password: 'validpass', shouldSucceed: false },
      { username: 'validuser', password: 'invalid', shouldSucceed: false }
    ];

    for (const test of credentialTests) {
      const input: RouterConnectionInput = {
        host: '192.168.1.1',
        username: test.username,
        password: test.password
      };

      const result = await testRouterConnection(input);

      expect(result.success).toBe(test.shouldSucceed);
      
      if (test.shouldSucceed) {
        expect(result.router_identity).toBeDefined();
        expect(result.message).toContain('Successfully connected');
      } else {
        expect(result.router_identity).toBeNull();
        expect(result.message).toContain('Authentication failed');
      }
    }
  });
});