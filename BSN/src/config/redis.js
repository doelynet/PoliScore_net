
const Redis = require('ioredis');
require('dotenv').config();

// Configure connection options from environment
// Supports either a single REDIS_URL or host/port/password vars
let client = null;

const createClient = () => {
	if (client) return client;
	if (process.env.REDIS_URL) {
		client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
	} else if (process.env.REDIS_HOST) {
		const host = process.env.REDIS_HOST;
		const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;
		const password = process.env.REDIS_PASSWORD || undefined;
		const tls = process.env.REDIS_TLS === 'true' ? { rejectUnauthorized: false } : undefined;

		const options = { host, port, password, tls, maxRetriesPerRequest: null };
		client = new Redis(options);
	} else {
		// No Redis configuration provided; leave client null
		return null;
	}

	// Attach event handlers to avoid unhandled error events and to provide helpful logs
	client.on('error', (err) => {
		console.warn('ioredis error:', err && err.message ? err.message : err);
	});

	client.on('connect', () => {
		console.log('ioredis connecting...');
	});

	client.on('ready', () => {
		console.log('ioredis ready');
	});

	return client;
};

const connectRedis = async () => {
	// Create client only if configuration is present
	const c = createClient();
	if (!c) {
		console.warn('Redis not configured (no REDIS_URL or REDIS_HOST)');
		return;
	}

	try {
		await c.ping();
		console.log('Redis connected');
	} catch (err) {
		// Log but do not throw — allow app to continue without Redis
		console.warn('Redis connection error:', err && err.message ? err.message : err);
	}
};

const disconnectRedis = async () => {
	if (!client) return;
	try {
		await client.quit();
		console.log('Redis disconnected');
	} catch (err) {
		console.warn('Error disconnecting Redis:', err && err.message ? err.message : err);
	}
};

// Convenience helpers for common patterns
const get = async (key) => {
	if (!client) return null;
	const val = await client.get(key);
	try { return JSON.parse(val); } catch (_) { return val; }
};

const set = async (key, value, ttlSeconds) => {
	if (!client) return;
	const payload = typeof value === 'string' ? value : JSON.stringify(value);
	if (ttlSeconds) {
		await client.set(key, payload, 'EX', ttlSeconds);
	} else {
		await client.set(key, payload);
	}
};

const del = async (key) => {
	if (!client) return;
	return client.del(key);
};

module.exports = {
	// Export client reference; may be null until connectRedis() is called
	get redis() { return client; },
	connectRedis,
	disconnectRedis,
	get,
	set,
	del,
	// Expose createClient for internal use if needed
	_createClient: createClient
};

