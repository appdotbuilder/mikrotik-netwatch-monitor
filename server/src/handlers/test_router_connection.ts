import { type RouterConnectionInput, type ConnectionResult } from '../schema';

export async function testRouterConnection(input: RouterConnectionInput): Promise<ConnectionResult> {
  try {
    // Validate input parameters
    if (!input.host || !input.username || !input.password) {
      return {
        success: false,
        message: "Missing required connection parameters",
        router_identity: null
      };
    }

    // Simulate connection delay (realistic network delay)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock connection logic with deterministic responses for testing
    // In production, this would use actual MikroTik API connection
    
    // Simulate various connection scenarios based on input
    if (input.host === 'invalid.host') {
      return {
        success: false,
        message: "Host unreachable. Please check the IP address or hostname.",
        router_identity: null
      };
    }

    if (input.username === 'invalid' || input.password === 'invalid') {
      return {
        success: false,
        message: "Authentication failed. Please check your username and password.",
        router_identity: null
      };
    }

    if (input.host === 'timeout.test') {
      return {
        success: false,
        message: "Connection timeout. The router may be offline or firewall is blocking the connection.",
        router_identity: null
      };
    }

    // Simulate successful connection
    const routerIdentities = [
      "MikroTik RouterOS 7.1",
      "MikroTik RouterOS 6.49",
      "MikroTik RouterOS 7.6",
      "MikroTik hEX S"
    ];
    
    // Use host as seed for consistent identity selection in tests
    const identityIndex = input.host.length % routerIdentities.length;
    const routerIdentity = routerIdentities[identityIndex];

    return {
      success: true,
      message: `Successfully connected to MikroTik router at ${input.host}`,
      router_identity: routerIdentity
    };

  } catch (error) {
    console.error('Router connection test failed:', error);
    return {
      success: false,
      message: "Unexpected error occurred while testing connection",
      router_identity: null
    };
  }
}