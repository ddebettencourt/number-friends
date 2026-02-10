import React from 'react';

// Diamond shape for prime numbers
function PrimeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 0L10 5L5 10L0 5Z" />
    </svg>
  );
}

// Double diamond for twin primes
function TwinPrimeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 0L7 3.5L3.5 7L0 3.5Z" transform="translate(0,1.5)" />
      <path d="M3.5 0L7 3.5L3.5 7L0 3.5Z" transform="translate(7,1.5)" />
    </svg>
  );
}

// Star for multiples of 10
function MultipleOf10Icon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );
}

// Spiral for Fibonacci numbers
function FibonacciIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5 A1 1 0 0 1 6 4 A2 2 0 0 1 7 6 A3 3 0 0 1 4 7 A4 4 0 0 1 2 3 A5 5 0 0 1 7 1" strokeLinecap="round" />
    </svg>
  );
}

// Small square outline for perfect squares
function PerfectSquareIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="7" height="7" />
    </svg>
  );
}

// Cube wireframe for perfect cubes
function PerfectCubeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="0.8" xmlns="http://www.w3.org/2000/svg">
      {/* Front face */}
      <rect x="1" y="3" width="5.5" height="5.5" />
      {/* Back face top-right edges */}
      <line x1="6.5" y1="3" x2="9" y2="1" />
      <line x1="1" y1="3" x2="3.5" y2="1" />
      <line x1="3.5" y1="1" x2="9" y2="1" />
      <line x1="9" y1="1" x2="9" y2="6.5" />
      <line x1="6.5" y1="8.5" x2="9" y2="6.5" />
    </svg>
  );
}

// Infinity symbol for perfect numbers
function PerfectNumberIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="1.3" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4C4 2 2 1 1.5 2.5C1 4 2 6 4 4C6 2 7 1 7 4C7 4 7 6 9 6C11 6 11.5 4 11 2.5C10.5 1 9 2 7 4" strokeLinecap="round" />
    </svg>
  );
}

// Plus symbol for abundant numbers
function AbundantIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.5" y="1" width="3" height="8" rx="0.5" />
      <rect x="1" y="3.5" width="8" height="3" rx="0.5" />
    </svg>
  );
}

export function getSquareIcon(type: string): React.ReactNode {
  switch (type) {
    case 'prime':
      return <PrimeIcon />;
    case 'twin_prime':
      return <TwinPrimeIcon />;
    case 'multiple_of_10':
      return <MultipleOf10Icon />;
    case 'fibonacci':
      return <FibonacciIcon />;
    case 'perfect_square':
      return <PerfectSquareIcon />;
    case 'perfect_cube':
      return <PerfectCubeIcon />;
    case 'perfect_number':
      return <PerfectNumberIcon />;
    case 'abundant':
      return <AbundantIcon />;
    default:
      return null;
  }
}
