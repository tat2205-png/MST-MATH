import { discoverProviders } from "../agents/providerDiscovery.ts";

console.log(JSON.stringify({ AGENT_PROVIDER_STATUS: discoverProviders() }, null, 2));