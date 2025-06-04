#!/usr/bin/env node

/**
 * Comprehensive Database Test Script
 * Tests all tables, relationships, and constraints
 */

const mysql = require('mysql2/promise');

const DATABASE_CONFIG = {
    host: 'mariadb',
    port: 3306,
    user: 'farmboy',
    password: 'Sntioi004!',
    database: 'farmboy_db'
};

class DatabaseTester {
    constructor() {
        this.connection = null;
        this.issues = [];
        this.successes = [];
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection(DATABASE_CONFIG);
            this.log('✅ Database connection established');
            return true;
        } catch (error) {
            this.logError('❌ Database connection failed', error);
            return false;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            this.log('🔌 Database connection closed');
        }
    }

    log(message) {
        console.log(message);
        this.successes.push(message);
    }

    logError(message, error = null) {
        const fullMessage = error ? `${message}: ${error.message}` : message;
        console.error(fullMessage);
        this.issues.push(fullMessage);
    }

    async runQuery(sql, params = []) {
        try {
            const [results] = await this.connection.execute(sql, params);
            return results;
        } catch (error) {
            this.logError(`Query failed: ${sql}`, error);
            return null;
        }
    }

    async testTableExists(tableName) {
        const result = await this.runQuery(
            'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
            ['farmboy_db', tableName]
        );

        if (result && result[0].count > 0) {
            this.log(`✅ Table '${tableName}' exists`);
            return true;
        } else {
            this.logError(`❌ Table '${tableName}' does not exist`);
            return false;
        }
    }

    async testTableStructure(tableName, expectedColumns) {
        const columns = await this.runQuery(
            'SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.columns WHERE table_schema = ? AND table_name = ?',
            ['farmboy_db', tableName]
        );

        if (!columns) return false;

        const columnNames = columns.map(col => col.COLUMN_NAME);
        let allColumnsExist = true;

        for (const expectedColumn of expectedColumns) {
            if (columnNames.includes(expectedColumn)) {
                this.log(`✅ Column '${tableName}.${expectedColumn}' exists`);
            } else {
                this.logError(`❌ Column '${tableName}.${expectedColumn}' is missing`);
                allColumnsExist = false;
            }
        }

        return allColumnsExist;
    }

    async testForeignKeyConstraints() {
        const constraints = await this.runQuery(`
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE CONSTRAINT_SCHEMA = 'farmboy_db' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        if (constraints && constraints.length > 0) {
            this.log(`✅ Found ${constraints.length} foreign key constraints`);
            constraints.forEach(constraint => {
                this.log(`   - ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
            });
        } else {
            this.logError('❌ No foreign key constraints found');
        }
    }

    async testBasicCRUD() {
        // Test inserting into each table
        try {
            const now = new Date().toISOString().slice(0, 23).replace('T', ' ');

            // Test proxy categories
            const proxyCategory = await this.runQuery(
                'INSERT INTO proxy_categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
                ['test_proxy_category', 'Test proxy category', now, now]
            );

            // Test account categories
            const accountCategory = await this.runQuery(
                'INSERT INTO account_categories (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)',
                ['test_account_category', 'Test account category', now, now]
            );

            // Test agents
            const agent = await this.runQuery(
                'INSERT INTO agents (name, status, ip_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                ['test_agent', 'online', '192.168.1.100', now, now]
            );

            // Test proxies
            const proxy = await this.runQuery(
                'INSERT INTO proxies (host, port, username, password, type, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ['proxy.example.com', 8080, 'proxyuser', 'proxypass', 'http', proxyCategory?.insertId || 1, now, now]
            );

            // Test accounts
            const account = await this.runQuery(
                'INSERT INTO accounts (username, password, email, type, category_id, proxy_id, agent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                ['testuser123', 'testpass', 'test@example.com', 'p2p', accountCategory?.insertId || 1, proxy?.insertId || 1, agent?.insertId || 1, now, now]
            );

            // Test bots
            const bot = await this.runQuery(
                'INSERT INTO bots (name, type, version, agent_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['DreamBot', 'OSRS', '3.0.1', agent?.insertId || 1, 'running', now, now]
            );

            // Test tasks
            const task = await this.runQuery(
                'INSERT INTO tasks (name, script, account_id, agent_id, bot_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ['Test Task', 'TestScript', account?.insertId || 1, agent?.insertId || 1, bot?.insertId || 1, 'pending', now, now]
            );

            // Test prime link requests
            const primeRequest = await this.runQuery(
                'INSERT INTO prime_link_requests (account_id, status, notes) VALUES (?, ?, ?)',
                [account?.insertId || 1, 'pending', 'Test prime link request']
            );

            this.log('✅ Basic CRUD operations successful');

            // Clean up test data
            await this.cleanupTestData();

        } catch (error) {
            this.logError('❌ Basic CRUD operations failed', error);
        }
    }

    async cleanupTestData() {
        const cleanupQueries = [
            'DELETE FROM prime_link_requests WHERE notes = "Test prime link request"',
            'DELETE FROM tasks WHERE name = "Test Task"',
            'DELETE FROM bots WHERE name = "DreamBot" AND type = "OSRS"',
            'DELETE FROM accounts WHERE username = "testuser123"',
            'DELETE FROM proxies WHERE host = "proxy.example.com"',
            'DELETE FROM agents WHERE name = "test_agent"',
            'DELETE FROM account_categories WHERE name = "test_account_category"',
            'DELETE FROM proxy_categories WHERE name = "test_proxy_category"'
        ];

        for (const query of cleanupQueries) {
            await this.runQuery(query);
        }
        this.log('🧹 Test data cleaned up');
    }

    async runFullTest() {
        console.log('🧪 Starting Comprehensive Database Test\n');

        if (!(await this.connect())) {
            return false;
        }

        // Test table existence
        const tables = [
            'accounts', 'account_categories', 
            'proxies', 'proxy_categories',
            'agents', 'bots', 'tasks', 'prime_link_requests'
        ];

        for (const table of tables) {
            await this.testTableExists(table);
        }

        // Test table structures
        await this.testTableStructure('accounts', [
            'id', 'username', 'password', 'email', 'type', 'status',
            'category_id', 'proxy_id', 'agent_id', 'tutorial_status',
            'otp_key', 'last_checked_at', 'created_at', 'updated_at'
        ]);

        await this.testTableStructure('agents', [
            'id', 'name', 'status', 'last_seen', 'ip_address',
            'created_at', 'updated_at', 'eternal_farm_id', 'needs_sync',
            'last_synced', 'cpu_usage', 'memory_usage', 'disk_usage', 'auth_key'
        ]);

        await this.testTableStructure('proxies', [
            'id', 'host', 'port', 'username', 'password', 'type',
            'category_id', 'is_active', 'created_at', 'updated_at'
        ]);

        await this.testTableStructure('bots', [
            'id', 'name', 'type', 'version', 'agent_id', 'status',
            'created_at', 'updated_at'
        ]);

        await this.testTableStructure('tasks', [
            'id', 'name', 'script', 'account_id', 'agent_id', 'bot_id',
            'status', 'priority', 'scheduled_at', 'started_at', 'completed_at',
            'error_message', 'result_data', 'process_id', 'created_at', 'updated_at'
        ]);

        // Test foreign key constraints
        await this.testForeignKeyConstraints();

        // Test basic CRUD operations
        await this.testBasicCRUD();

        await this.disconnect();

        // Print summary
        console.log('\n📊 Test Summary:');
        console.log(`✅ Successes: ${this.successes.length}`);
        console.log(`❌ Issues: ${this.issues.length}`);

        if (this.issues.length > 0) {
            console.log('\n🚨 Issues Found:');
            this.issues.forEach(issue => console.log(`   ${issue}`));
        }

        console.log('\n🏁 Database test completed!');
        
        return this.issues.length === 0;
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    const tester = new DatabaseTester();
    tester.runFullTest()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test runner error:', error);
            process.exit(1);
        });
}

module.exports = DatabaseTester; 