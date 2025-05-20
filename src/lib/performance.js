// Performance monitoring utilities
let metrics = {
  requests: 0,
  totalTime: 0,
  totalSizeKB: 0,
  slowestRequest: { url: '', time: 0 },
  timings: {}
};

export function resetMetrics() {
  metrics = {
    requests: 0,
    totalTime: 0,
    totalSizeKB: 0,
    slowestRequest: { url: '', time: 0 },
    timings: {}
  };
}

export function recordTiming(category, operation, timeMs) {
  if (!metrics.timings[category]) {
    metrics.timings[category] = {};
  }
  
  if (!metrics.timings[category][operation]) {
    metrics.timings[category][operation] = {
      count: 0,
      totalTime: 0,
      average: 0
    };
  }
  
  const stat = metrics.timings[category][operation];
  stat.count++;
  stat.totalTime += timeMs;
  stat.average = stat.totalTime / stat.count;
}

export function recordRequest(url, timeMs, responseSize = 0) {
  metrics.requests++;
  metrics.totalTime += timeMs;
  metrics.totalSizeKB += responseSize / 1024;
  
  if (timeMs > metrics.slowestRequest.time) {
    metrics.slowestRequest = { url, time: timeMs };
  }
}

export function getMetrics() {
  return {
    ...metrics,
    averageRequestTime: metrics.requests > 0 ? metrics.totalTime / metrics.requests : 0
  };
}

export function logMetricsSummary() {
  const { requests, totalTime, totalSizeKB, slowestRequest, timings } = metrics;
  
  console.group('📊 API Performance Metrics');
  console.log(`Total requests: ${requests}`);
  console.log(`Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average request time: ${(requests > 0 ? totalTime / requests : 0).toFixed(2)}ms`);
  console.log(`Total data: ${totalSizeKB.toFixed(2)}KB`);
  console.log(`Slowest request: ${slowestRequest.url} (${slowestRequest.time.toFixed(2)}ms)`);
  
  console.group('Category Timings');
  Object.entries(timings).forEach(([category, operations]) => {
    console.group(`${category}`);
    Object.entries(operations).forEach(([op, stats]) => {
      console.log(`${op}: ${stats.count} calls, avg ${stats.average.toFixed(2)}ms`);
    });
    console.groupEnd();
  });
  console.groupEnd();
  console.groupEnd();
  
  return metrics;
}

// Instrumented fetch function that records performance metrics
export async function instrumentedFetch(url, options = {}) {
  const startTime = performance.now();
  let size = 0;
  
  try {
    const response = await fetch(url, options);
    
    // Clone the response to read its size without consuming it
    const clone = response.clone();
    const buffer = await clone.arrayBuffer();
    size = buffer.byteLength;
    
    const endTime = performance.now();
    recordRequest(url.toString(), endTime - startTime, size);
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    recordRequest(url.toString(), endTime - startTime, 0);
    throw error;
  }
}

export default {
  resetMetrics,
  recordTiming,
  recordRequest,
  getMetrics,
  logMetricsSummary,
  instrumentedFetch
};
