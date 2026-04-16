#!/usr/bin/env node

/**
 * Comprehensive System Test for Rosebank Dialer
 * Tests authentication, clients API, and other core functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: {
        email: 'admin@dialersystem.com',
        password: 'admin123'
      }
    });
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.body.token) {
      authToken = response.body.token;
      console.log('✅ Login successful');
      console.log(`   User: ${response.body.user.email}`);
      console.log(`   Role: ${response.body.user.role}`);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed');
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testClients() {
  console.log('\n📋 Testing Clients API...');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest('/api/clients?page=1&limit=10&callStatus=all&clientType=all&sortBy=created_at&sortOrder=desc');
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Clients API working');
      console.log(`   Total clients: ${response.body.totalCount || 0}`);
      console.log(`   Clients returned: ${response.body.clients?.length || 0}`);
      console.log(`   Called: ${response.body.calledCount || 0}`);
      console.log(`   Not called: ${response.body.not_calledCount || 0}`);
      console.log(`   Needs callback: ${response.body.needsCallbackCount || 0}`);
      
      if (response.body.clients && response.body.clients.length > 0) {
        const client = response.body.clients[0];
        console.log('\n   Sample client:');
        console.log(`   - Box Number: ${client.box_number || 'N/A'}`);
        console.log(`   - Contract: ${client.contract_no || 'N/A'}`);
        console.log(`   - Key Holder: ${client.principal_key_holder || 'N/A'}`);
        console.log(`   - Client Type: ${client.client_type || 'N/A'}`);
      }
      return true;
    } else {
      console.log('❌ Clients API failed');
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Clients API error:', error.message);
    return false;
  }
}

async function testDashboardStats() {
  console.log('\n📊 Testing Dashboard Stats...');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest('/api/dashboard/stats');
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Dashboard stats working');
      console.log(`   Total calls today: ${response.body.totalCallsToday || 0}`);
      console.log(`   Pending callbacks: ${response.body.pendingCallbacks || 0}`);
      console.log(`   Total calls: ${response.body.totalCalls || 0}`);
      console.log(`   Success rate: ${response.body.successRate || 0}%`);
      return true;
    } else {
      console.log('❌ Dashboard stats failed');
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard stats error:', error.message);
    return false;
  }
}

async function testNotifications() {
  console.log('\n🔔 Testing Notifications...');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest('/api/notifications?showPending=true&limit=5');
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Notifications API working');
      console.log(`   Notifications returned: ${response.body.notifications?.length || 0}`);
      return true;
    } else {
      console.log('❌ Notifications API failed');
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Notifications API error:', error.message);
    return false;
  }
}

async function testCallLogs() {
  console.log('\n📞 Testing Call Logs...');
  console.log('━'.repeat(50));
  
  try {
    const response = await makeRequest('/api/call-logs?limit=5');
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Call Logs API working');
      console.log(`   Call logs returned: ${response.body.callLogs?.length || 0}`);
      return true;
    } else {
      console.log('❌ Call Logs API failed');
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Call Logs API error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   🧪 ROSEBANK DIALER SYSTEM TEST SUITE 🧪    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\nTesting: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  const results = {
    login: false,
    clients: false,
    dashboardStats: false,
    notifications: false,
    callLogs: false
  };
  
  // Test login first (required for other tests)
  results.login = await testLogin();
  
  if (!results.login) {
    console.log('\n❌ Cannot proceed without successful login');
    return;
  }
  
  // Run remaining tests
  results.clients = await testClients();
  results.dashboardStats = await testDashboardStats();
  results.notifications = await testNotifications();
  results.callLogs = await testCallLogs();
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('═'.repeat(50));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const testName = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${icon} ${testName.charAt(0).toUpperCase() + testName.slice(1)}`);
  });
  
  console.log('\n' + '─'.repeat(50));
  console.log(`RESULT: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! System is working correctly.');
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed. Please review the errors above.`);
  }
  
  console.log('═'.repeat(50) + '\n');
}

// Check if server is running before starting tests
console.log('Checking if development server is running...');
makeRequest('/api/auth/verify', { skipAuth: true })
  .then(() => {
    console.log('✅ Server is running\n');
    runTests().catch(console.error);
  })
  .catch(() => {
    console.log('\n❌ Error: Development server is not running!');
    console.log('Please start the server with: npm run dev\n');
    process.exit(1);
  });
