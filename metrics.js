// metrics.js - script to collect and print performance and system metrics
const { chromium } = require('playwright');
const os = require('os');
const process = require('process');
const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

(async () => {
  console.log('🎯 Collecting metrics...');

  // 1. Dashboard Load Time
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const startNav = Date.now();
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    const dashboardLoad = Date.now() - startNav;
    console.log(`🖥️  Dashboard Load Time: ${dashboardLoad} ms`);
    await browser.close();
  } catch (e) {
    console.error('Error measuring Dashboard Load Time:', e);
  }

  // 2. API Response Time
  try {
    const apiStart = Date.now();
    await fetch('http://localhost:3000/api/health');
    const apiResponse = Date.now() - apiStart;
    console.log(`🔄 API Response Time: ${apiResponse} ms`);
  } catch (e) {
    console.error('Error measuring API Response Time:', e);
  }

  // 3. CPU Load (1-minute average)
  const loadAvg = os.loadavg()[0];
  console.log(`⚙️  CPU Load (1m avg): ${loadAvg.toFixed(2)}`);

  // 4. Memory Consumption
  const mem = process.memoryUsage();
  console.log(`💾 Memory Usage: RSS ${(mem.rss/1024/1024).toFixed(2)} MB, HeapUsed ${(mem.heapUsed/1024/1024).toFixed(2)} MB`);

  // 5. Query Latency (Prisma user.count)
  try {
    const prisma = new PrismaClient();
    const qStart = Date.now();
    await prisma.user.count();
    const qLatency = Date.now() - qStart;
    console.log(`📊 Query Latency (user.count): ${qLatency} ms`);
    await prisma.$disconnect();
  } catch (e) {
    console.error('Error measuring Query Latency:', e);
  }

  // 6. Server Uptime (OS Uptime)
  const uptimeSec = os.uptime();
  console.log(`⏱️  Server Uptime: ${(uptimeSec/3600).toFixed(2)} hours`);
})();