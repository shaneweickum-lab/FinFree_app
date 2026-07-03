import type { LiteracyLevel, PlacementQuizQuestion } from "./types";

export const PLACEMENT_QUIZ_QUESTIONS: PlacementQuizQuestion[] = [
  {
    id: "pq-1",
    prompt: "What is a budget?",
    choices: [
      "A plan for how you'll spend and save your money",
      "A type of bank account",
      "A tax form",
      "A loan from a bank",
    ],
    correctIndex: 0,
  },
  {
    id: "pq-2",
    prompt: "What does it mean to save money?",
    choices: [
      "Spending it all right away",
      "Setting money aside instead of spending it now",
      "Giving it to a friend",
      "Investing it in a business you own",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-3",
    prompt: "\"Revenue\" is best described as:",
    choices: [
      "The profit left over after all expenses",
      "The total money a business earns from sales",
      "The cash a business has in the bank",
      "The debt a business owes",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-4",
    prompt: "A company can have high revenue and still lose money. Why?",
    choices: [
      "Revenue and profit are always the same",
      "Its expenses can be larger than its revenue",
      "This is never actually possible",
      "Only small companies can lose money",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-5",
    prompt: "What does a balance sheet show?",
    choices: [
      "A company's performance over an entire year",
      "A company's assets, liabilities, and equity at one point in time",
      "Only a company's cash",
      "A forecast of future stock prices",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-6",
    prompt: "In investing, what is \"diversification\"?",
    choices: [
      "Putting all your money into one stock",
      "Spreading your money across different investments to reduce risk",
      "Only investing in bonds",
      "Trading every single day",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-7",
    prompt: "What does the income statement show that the balance sheet does not?",
    choices: [
      "What a company owns and owes",
      "A company's revenue and expenses over a period of time",
      "A company's stock price history",
      "A company's tax ID number",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-8",
    prompt: "What is compound interest?",
    choices: [
      "Interest paid only on your original deposit",
      "Interest paid on both your original amount and previously earned interest",
      "A fee charged for opening an account",
      "A type of tax on investments",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-9",
    prompt: "In the stock market, the \"bid\" price is:",
    choices: [
      "The highest price a buyer is willing to pay",
      "The lowest price a seller will accept",
      "The company's stock ticker",
      "The company's annual revenue",
    ],
    correctIndex: 0,
  },
  {
    id: "pq-10",
    prompt: "A cash flow statement is most useful for understanding:",
    choices: [
      "How a company's stock price will move tomorrow",
      "Whether a company's actual cash position is healthy, separate from paper profit",
      "How many employees a company has",
      "A company's tax bracket",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-11",
    prompt: "What is a stop-loss order used for?",
    choices: [
      "Guaranteeing a profit on every trade",
      "Automatically selling a position if it drops to a set price, to limit losses",
      "Buying more of a stock automatically as it rises",
      "Avoiding paying broker fees",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-12",
    prompt: "EBITDA is commonly used by analysts because it:",
    choices: [
      "Is required by law on every financial statement",
      "Strips out financing, tax, and accounting differences to compare core operating performance",
      "Only applies to the tech industry",
      "Measures a company's exact cash in the bank",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-13",
    prompt: "\"FOMO\" trading refers to:",
    choices: [
      "A disciplined, plan-based trading strategy",
      "Buying or selling impulsively out of fear of missing a move",
      "A type of limit order",
      "A government trading regulation",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-14",
    prompt: "What does market capitalization (\"market cap\") measure?",
    choices: [
      "A company's total revenue for the year",
      "The total value of a company's outstanding shares (share price × shares outstanding)",
      "A company's total debt",
      "The number of employees at a company",
    ],
    correctIndex: 1,
  },
  {
    id: "pq-15",
    prompt: "Position sizing in trading is primarily about:",
    choices: [
      "Choosing which broker to use",
      "Controlling how much capital you risk on any single trade",
      "Picking stocks based on their ticker symbol length",
      "Deciding what time of day to trade",
    ],
    correctIndex: 1,
  },
];

/** Maps a raw score out of 15 to a computed literacy level. */
export function scoreToLiteracyLevel(correctCount: number): LiteracyLevel {
  if (correctCount <= 3) return "none";
  if (correctCount <= 6) return "a-little";
  if (correctCount <= 9) return "beginner";
  if (correctCount <= 12) return "intermediate-refreshing";
  return "expert-refreshing";
}
