import { describe, it, expect } from 'vitest';
import { parseHandHistories } from './parser.js';
import fs from 'fs';
import path from 'path';

// Helper function to read a file from the demo_data directory
const readDemoFile = (filePath) => {
  // Note: Vitest runs from the project root, so paths should be relative to that.
  const absolutePath = path.resolve(process.cwd(), filePath);
  return fs.readFileSync(absolutePath, 'utf-8');
};

describe('parseHandHistories', () => {

  it('should parse only hands involving Hero from a file', () => {
    const handHistoryText = readDemoFile('demo_data/lite_data/test01/GG20250910-2119 - RushAndCash17757914 - 0.01 - 0.02 - 6max.txt');
    const hands = parseHandHistories([handHistoryText]);

    // This specific file contains many hands, but only some involve "Hero".
    // We expect the parser to correctly identify and parse only those hands.
    const heroHandCount = (handHistoryText.match(/Dealt to Hero/g) || []).length;

    expect(hands.length).toBeGreaterThan(0);
    expect(hands.length).toBe(heroHandCount);
  });

  it('should correctly parse a single hand\'s ID and hero\'s cards', () => {
    const singleHandText = `
Poker Hand #RC3877234041: Hold'em No Limit ($0.01/$0.02) - 2025/09/11 05:33:30
Table 'RushAndCash17757914' 6-max Seat #1 is the button
Seat 1: 9e47efb ($2.05 in chips)
Seat 2: Hero ($1.13 in chips)
Seat 3: e329e9c8 ($1.99 in chips)
Seat 4: 6051b484 ($2.87 in chips)
Seat 5: 7a0a5e1a ($2.06 in chips)
Seat 6: 6cef3573 ($1.36 in chips)
Hero: posts small blind $0.01
e329e9c8: posts big blind $0.02
*** HOLE CARDS ***
Dealt to Hero [7s 6c]
6051b484: folds
7a0a5e1a: folds
6cef3573: folds
9e47efb: folds
Hero: raises $0.04 to $0.06
e329e9c8: folds
Uncalled bet ($0.04) returned to Hero
*** SHOWDOWN ***
Hero collected $0.04 from pot
*** SUMMARY ***
Total pot $0.04 | Rake $0 | Jackpot $0 | Bingo $0 | Fortune $0 | Tax $0
Seat 2: Hero (small blind) collected ($0.04)
`;

    const hands = parseHandHistories([singleHandText]);

    expect(hands.length).toBe(1);
    const hand = hands[0];
    expect(hand.info.id).toBe('RC3877234041');
    expect(hand.hero.cards).toEqual(['7s', '6c']);
  });

});