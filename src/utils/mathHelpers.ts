// Prime number utilities
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function getNextPrime(current: number): number {
  let next = current + 1;
  while (!isPrime(next) && next <= 100) {
    next++;
  }
  return next <= 100 ? next : current;
}

export function getPreviousPrime(current: number): number {
  let prev = current - 1;
  while (!isPrime(prev) && prev >= 2) {
    prev--;
  }
  return prev >= 2 ? prev : current;
}

// Get previous twin prime position
export function getPreviousTwinPrime(current: number): number {
  const twinPrimes = [3, 5, 7, 11, 13, 17, 19, 29, 31, 41, 43, 59, 61, 71, 73];
  for (let i = twinPrimes.length - 1; i >= 0; i--) {
    if (twinPrimes[i] < current) {
      return twinPrimes[i];
    }
  }
  return 1;
}

// Fibonacci utilities
export function isFibonacci(n: number): boolean {
  const isPerfectSquare = (x: number) => {
    const s = Math.sqrt(x);
    return s * s === x;
  };
  return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4);
}

// Perfect square/cube utilities
export function isPerfectSquare(n: number): boolean {
  const sqrt = Math.sqrt(n);
  return sqrt === Math.floor(sqrt);
}

export function isPerfectCube(n: number): boolean {
  const cbrt = Math.cbrt(n);
  return Math.round(cbrt) ** 3 === n;
}

// Factor utilities
export function getProperDivisors(n: number): number[] {
  const divisors: number[] = [];
  for (let i = 1; i < n; i++) {
    if (n % i === 0) divisors.push(i);
  }
  return divisors;
}

export function isPerfectNumber(n: number): boolean {
  return getProperDivisors(n).reduce((a, b) => a + b, 0) === n;
}

// Generate a random n-digit perfect square (legacy, kept for compatibility)
export function generatePerfectSquare(digits: number): { number: number; root: number } {
  const minRoot = Math.ceil(Math.sqrt(Math.pow(10, digits - 1)));
  const maxRoot = Math.floor(Math.sqrt(Math.pow(10, digits) - 1));
  const root = Math.floor(Math.random() * (maxRoot - minRoot + 1)) + minRoot;
  return { number: root * root, root };
}

// Generate a random n-digit perfect cube (legacy, kept for compatibility)
export function generatePerfectCube(digits: number): { number: number; root: number } {
  const minRoot = Math.ceil(Math.cbrt(Math.pow(10, digits - 1)));
  const maxRoot = Math.floor(Math.cbrt(Math.pow(10, digits) - 1));
  const root = Math.floor(Math.random() * (maxRoot - minRoot + 1)) + minRoot;
  return { number: root * root * root, root };
}

// Generate a random number with its square root (harder - 2-5 digit numbers)
export function generateSquareRootChallenge(): { number: number; root: number } {
  // Random number of digits: 2-5
  const digits = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, or 5
  const minNum = Math.pow(10, digits - 1);
  const maxNum = Math.pow(10, digits) - 1;

  const useInteger = Math.random() < 0.25; // 25% chance of perfect square

  if (useInteger) {
    // Perfect square - find a root that gives us a number in the right range
    const minRoot = Math.ceil(Math.sqrt(minNum));
    const maxRoot = Math.floor(Math.sqrt(maxNum));
    const root = Math.floor(Math.random() * (maxRoot - minRoot + 1)) + minRoot;
    return { number: root * root, root };
  } else {
    // Non-perfect square - pick a random number in range
    const number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    const root = Math.round(Math.sqrt(number) * 100) / 100; // Round to 2 decimal places
    return { number, root };
  }
}

// Generate a random number with its cube root (harder - 2-5 digit numbers)
export function generateCubeRootChallenge(): { number: number; root: number } {
  // Random number of digits: 2-5
  const digits = Math.floor(Math.random() * 4) + 2; // 2, 3, 4, or 5
  const minNum = Math.pow(10, digits - 1);
  const maxNum = Math.pow(10, digits) - 1;

  const useInteger = Math.random() < 0.2; // 20% chance of perfect cube

  if (useInteger) {
    // Perfect cube - find a root that gives us a number in the right range
    const minRoot = Math.ceil(Math.cbrt(minNum));
    const maxRoot = Math.floor(Math.cbrt(maxNum));
    if (maxRoot >= minRoot) {
      const root = Math.floor(Math.random() * (maxRoot - minRoot + 1)) + minRoot;
      return { number: root * root * root, root };
    }
  }

  // Non-perfect cube - pick a random number in range
  const number = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  const root = Math.round(Math.cbrt(number) * 100) / 100;
  return { number, root };
}

// Generate primes for Prime-Off minigame
export function generatePrimeOffScreens(): {
  screen1: { number: number; color: string }[];
  screen2: { number: number; color: string }[];
  answer: number;
} {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

  // Shuffle primes to pick from
  const shuffledPrimes = [...primes].sort(() => Math.random() - 0.5);

  // Pick a random prime as the answer (the ONLY one on both screens)
  const answer = shuffledPrimes[0];

  // Split remaining primes into two groups - no overlap!
  const remainingPrimes = shuffledPrimes.slice(1);
  const screen1Extras = remainingPrimes.slice(0, 7); // 7 unique to screen 1
  const screen2Extras = remainingPrimes.slice(7, 14); // 7 unique to screen 2

  // Generate screen 1: answer + 7 unique primes
  const screen1Numbers = [answer, ...screen1Extras];

  // Generate screen 2: answer + 7 different unique primes
  const screen2Numbers = [answer, ...screen2Extras];

  const shuffleArray = <T>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const screen1 = shuffleArray(screen1Numbers).map(num => ({
    number: num,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  const screen2 = shuffleArray(screen2Numbers).map(num => ({
    number: num,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  return { screen1, screen2, answer };
}

// Generate Fibonacci sequence challenge
export function generateFibonacciChallenge(): {
  sequence: (number | null)[];
  answer: number;
  missingIndex: number;
} {
  const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  const startIndex = Math.floor(Math.random() * (fib.length - 5));
  const sequence = fib.slice(startIndex, startIndex + 5);
  const missingIndex = Math.floor(Math.random() * 5);
  const answer = sequence[missingIndex];

  const displaySequence: (number | null)[] = [...sequence];
  displaySequence[missingIndex] = null;

  return { sequence: displaySequence, answer, missingIndex };
}
