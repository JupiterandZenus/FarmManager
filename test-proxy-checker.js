const http = require('http');
const https = require('https');
const net = require('net');
const url = require('url');

console.log('🔍 Proxy Checker Test - Using Built-in Node.js Modules');

// Simple proxy checker using built-in modules
async function checkProxyBuiltIn(proxyConfig) {
    const { host, port, type = 'http' } = proxyConfig;
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        const timeout = 10000;
        
        const result = {
            proxy: `${type}://${host}:${port}`,
            working: false,
            responseTime: null,
            error: null
        };
        
        // Simple TCP connection test
        const socket = new net.Socket();
        
        const timer = setTimeout(() => {
            socket.destroy();
            result.error = 'Connection timeout';
            resolve(result);
        }, timeout);
        
        socket.connect(port, host, () => {
            const endTime = Date.now();
            result.responseTime = endTime - startTime;
            result.working = true;
            clearTimeout(timer);
            socket.destroy();
            resolve(result);
        });
        
        socket.on('error', (error) => {
            clearTimeout(timer);
            result.error = error.message;
            socket.destroy();
            resolve(result);
        });
    });
}

// Test some common proxy configurations
async function runTests() {
    const testProxies = [
        { host: '127.0.0.1', port: 8080, type: 'http' },
        { host: '127.0.0.1', port: 1080, type: 'socks5' },
        { host: 'proxy.example.com', port: 3128, type: 'http' }
    ];
    
    console.log('\n🧪 Testing proxy connections...\n');
    
    for (const proxy of testProxies) {
        try {
            const result = await checkProxyBuiltIn(proxy);
            const status = result.working ? '✅ WORKING' : '❌ FAILED';
            const responseTime = result.responseTime ? `${result.responseTime}ms` : 'N/A';
            const error = result.error ? ` (${result.error})` : '';
            
            console.log(`${status} ${result.proxy} - ${responseTime}${error}`);
        } catch (error) {
            console.log(`❌ ERROR ${proxy.host}:${proxy.port} - ${error.message}`);
        }
    }
    
    console.log('\n✅ Proxy checker test completed!');
    console.log('\n📝 Note: This is a basic connectivity test.');
    console.log('   For full HTTP/HTTPS testing, install the proxy dependencies:');
    console.log('   npm install axios socks-proxy-agent https-proxy-agent http-proxy-agent');
}

// Run the tests
runTests().catch(console.error); 