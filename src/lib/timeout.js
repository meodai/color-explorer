// Create a timeout promise that rejects after the specified time
export function timeoutPromise(ms, promise, name = 'request') {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout exceeded for ${name} after ${ms}ms`));
    }, ms);
    
    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}
