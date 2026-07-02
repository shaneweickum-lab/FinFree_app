import type { Course, Lesson, Module, Pathway } from "./types";

export const COURSE: Course = {
  slug: "building-your-financial-house",
  title: "Building Your Financial House",
  tagline: "Financial literacy and day trading fundamentals, built from the foundation up.",
  pathwayIds: ["foundation", "vocabulary", "application"],
};

export const PATHWAYS: Pathway[] = [
  {
    id: "foundation",
    order: 1,
    title: "Foundation Course",
    subtitle: "The Blueprint",
    description:
      "Core financial definitions and the three fundamental financial statements.",
    moduleIds: ["m1", "m2", "m3", "m4"],
  },
  {
    id: "vocabulary",
    order: 2,
    title: "Vocabulary Course",
    subtitle: "Speaking the Language",
    description: "Accounting terminology and day trading terminology.",
    moduleIds: ["m5", "m6"],
  },
  {
    id: "application",
    order: 3,
    title: "Application Course",
    subtitle: "Putting It All Together",
    description: "Day trading basics that synthesize everything learned.",
    moduleIds: ["m7"],
  },
];

export const MODULES: Module[] = [
  {
    id: "m1",
    number: 1,
    pathwayId: "foundation",
    houseTitle: "The Foundation",
    subtitle: "Understanding Core Financial Definitions",
    purpose: "Establish the bedrock vocabulary so everything else in the platform makes sense.",
    whyItMatters:
      "Most beginners confuse revenue with profit, and profit with cash flow. This module prevents that confusion from day one, and its concepts are reinforced throughout every module that follows.",
    connectionToNext:
      "These definitions are the building blocks for everything ahead. Module 2 takes a company's complete financial snapshot — the balance sheet — and shows how these definitions apply to what a company actually owns and owes.",
    lessonIds: ["m1-l1", "m1-l2", "m1-l3", "m1-l4"],
  },
  {
    id: "m2",
    number: 2,
    pathwayId: "foundation",
    houseTitle: "The Floor Plan",
    subtitle: "Understanding Balance Sheets",
    purpose: "Teach how to read a snapshot of a company's financial position at one specific moment in time.",
    whyItMatters:
      "Balance sheets reveal what a company owns and owes — the skeleton of its financial health. Day traders need this to evaluate whether a company is actually stable.",
    connectionToNext:
      "Balance sheets are static snapshots. Module 3 shows what actually happened during the period the balance sheet covers — the movement of revenue, expenses, and profit.",
    lessonIds: ["m2-l1", "m2-l2", "m2-l3", "m2-l4"],
  },
  {
    id: "m3",
    number: 3,
    pathwayId: "foundation",
    houseTitle: "The Walls",
    subtitle: "Understanding Income Statements",
    purpose: "Show how a company performed financially over a period of time.",
    whyItMatters:
      "This is where revenue, expenses, and profit actually meet — where people finally see why a company can earn millions in revenue and still lose money. Critical for evaluating company performance as a trader.",
    connectionToNext:
      "Income statements show what happened on paper, but not where the cash actually went. A company can report a profit and still run out of cash. Module 4 introduces cash flow — the third and final piece of the foundational puzzle.",
    lessonIds: ["m3-l1", "m3-l2", "m3-l3", "m3-l4"],
  },
  {
    id: "m4",
    number: 4,
    pathwayId: "foundation",
    houseTitle: "The Plumbing and Wiring",
    subtitle: "Understanding Cash Flow Statements",
    purpose: "Show the actual movement of cash into and out of a business.",
    whyItMatters:
      "Companies can look profitable on paper but be broke in reality if cash isn't flowing correctly. This is the most misunderstood financial statement and one of the most important for both accounting literacy and trading decisions.",
    connectionToNext:
      "Users now understand all three foundational financial statements and how they interconnect. Module 5 teaches the specific vocabulary used across all of them, so users can read real-world filings fluently.",
    lessonIds: ["m4-l1", "m4-l2", "m4-l3", "m4-l4"],
  },
  {
    id: "m5",
    number: 5,
    pathwayId: "vocabulary",
    houseTitle: "The Builder's Dictionary",
    subtitle: "Accounting and Financial Terminology",
    purpose: "Deep dive into the specific vocabulary used across financial statements.",
    whyItMatters:
      "Without fluency in the language, statements can't be read with confidence. This module builds that fluency and removes intimidation from financial documents.",
    connectionToNext:
      "With the foundation and the accounting language in place, Module 6 introduces the separate vocabulary of day trading and stock markets, and connects it back to everything already learned.",
    lessonIds: ["m5-l1", "m5-l2", "m5-l3"],
  },
  {
    id: "m6",
    number: 6,
    pathwayId: "vocabulary",
    houseTitle: "The Trading Lexicon",
    subtitle: "Day Trading and Market Terminology",
    purpose: "Teach the specific vocabulary used in day trading and the stock market.",
    whyItMatters:
      "Traders speak a different language than accountants. Understanding it means understanding what traders are actually doing, and why, before ever placing a trade.",
    connectionToNext:
      "Users now hold the complete vocabulary toolkit — accounting and trading. Module 7 puts everything together and teaches how real day traders use financial statements alongside trading mechanics to make decisions.",
    lessonIds: ["m6-l1", "m6-l2", "m6-l3"],
  },
  {
    id: "m7",
    number: 7,
    pathwayId: "application",
    houseTitle: "The Roofing",
    subtitle: "Day Trading Basics",
    purpose: "Teach foundational day trading strategy and decision-making using everything learned so far.",
    whyItMatters:
      "This is where theory meets practice. Users can now understand why a trader would examine a balance sheet, which signals actually matter, and how to avoid the emotional traps that destroy most new traders.",
    connectionToNext:
      "Upon completion, users have reached an intermediate readiness level and unlock the capstone simulation. From here, FinFree App can expand into advanced trading strategies, options trading, or entirely new financial topics.",
    lessonIds: ["m7-l1", "m7-l2", "m7-l3", "m7-l4"],
  },
];

export const LESSONS: Lesson[] = [
  // ---- Module 1: The Foundation ----
  {
    id: "m1-l1",
    moduleId: "m1",
    order: 1,
    title: "Revenue, Profit & Cash Flow",
    type: "explanatory",
    concepts: ["revenue", "net-profit", "net-loss", "net-income", "cash-flow"],
    summary:
      "Revenue defined and explained with real, relatable examples, then broken down into net profit, net loss, net income, and cash flow.",
    bulletPoints: [
      "Revenue defined and explained with real, relatable examples",
      "Net profit versus net loss — what each actually means for a business",
      "Net income broken down in plain language",
      "Cash flow explained as a distinct concept from profitability",
      "Real case studies of companies earning millions in revenue while posting net losses",
    ],
    finCoinReward: 10,
  },
  {
    id: "m1-l2",
    moduleId: "m1",
    order: 2,
    title: "Revenue vs. Profit: Side by Side",
    type: "interactive",
    concepts: ["revenue", "net-profit"],
    summary:
      "Interactive side-by-side comparisons showing how revenue can be $50 million while net profit is negative $2 million — and why that gap matters for evaluating companies as a day trader.",
    bulletPoints: [
      "Visual demonstrations showing how revenue can be $50 million while net profit is negative $2 million",
      "Why these distinctions matter specifically for evaluating companies as a day trader",
    ],
    finCoinReward: 10,
  },
  {
    id: "m1-l3",
    moduleId: "m1",
    order: 3,
    title: "Match the Outcome",
    type: "minigame",
    concepts: ["revenue", "net-profit", "net-loss"],
    summary:
      "Match revenue, profit, and loss scenarios to real company outcomes.",
    bulletPoints: ["Mini-game: match revenue / profit / loss scenarios to real company outcomes"],
    finCoinReward: 15,
    miniGame: {
      id: "m1-mg1",
      title: "Match the Outcome",
      description: "Drag each scenario to the company outcome it actually describes.",
      kind: "match",
    },
  },
  {
    id: "m1-l4",
    moduleId: "m1",
    order: 4,
    title: "Foundation Check",
    type: "quiz",
    concepts: ["revenue", "net-profit", "net-loss", "net-income", "cash-flow"],
    summary: "Quiz testing understanding of definitions applied in context, not rote memorization.",
    bulletPoints: [],
    finCoinReward: 20,
    quiz: {
      id: "m1-q1",
      passingScore: 0.7,
      questions: [
        {
          id: "m1-q1-1",
          concept: "revenue",
          prompt: "A company sells $50M worth of products this year. This figure is best described as its:",
          choices: ["Net profit", "Revenue", "Cash flow", "Equity"],
          correctIndex: 1,
          explanation: "Revenue is the total amount earned from sales before any costs are subtracted.",
        },
        {
          id: "m1-q1-2",
          concept: "net-profit",
          prompt: "A company can have high revenue and still post a net loss. Why?",
          choices: [
            "Revenue and net profit are always equal",
            "Expenses can exceed revenue even when sales are strong",
            "Net loss only happens to small companies",
            "Cash flow determines revenue",
          ],
          correctIndex: 1,
          explanation: "Net profit subtracts all expenses from revenue — high sales don't guarantee low costs.",
        },
        {
          id: "m1-q1-3",
          concept: "cash-flow",
          prompt: "Why is cash flow treated as a separate concept from profitability?",
          choices: [
            "It isn't — they're the same thing",
            "Cash flow only matters for banks",
            "A company can be profitable on paper but still run out of actual cash",
            "Cash flow is only tracked once a year",
          ],
          correctIndex: 2,
          explanation: "Profit is an accounting figure; cash flow tracks real money moving in and out.",
        },
      ],
    },
  },

  // ---- Module 2: The Floor Plan ----
  {
    id: "m2-l1",
    moduleId: "m2",
    order: 1,
    title: "Reading a Balance Sheet",
    type: "explanatory",
    concepts: ["balance-sheet", "assets", "liabilities", "equity"],
    summary:
      "What a balance sheet is, the moment in time it captures, and how assets, liabilities, and equity fit together.",
    bulletPoints: [
      "What a balance sheet is and the specific moment in time it captures",
      "Assets: current assets, non-current assets, tangible versus intangible",
      "Liabilities: current liabilities and long-term liabilities",
      "Equity: shareholder equity and what it represents",
      "The balance sheet equation — Assets = Liabilities + Equity",
      "Direct callbacks to Module 1 definitions as they appear on the balance sheet",
    ],
    finCoinReward: 10,
  },
  {
    id: "m2-l2",
    moduleId: "m2",
    order: 2,
    title: "Fill In the Balance Sheet",
    type: "interactive",
    concepts: ["balance-sheet", "assets", "liabilities"],
    summary:
      "Fill in missing sections of a real balance sheet and learn how its structure varies by industry.",
    bulletPoints: [
      "How to read an actual balance sheet section by section",
      "How balance sheet structure varies by industry",
      "Red flags: high debt loads, low equity, declining assets over time",
    ],
    finCoinReward: 10,
  },
  {
    id: "m2-l3",
    moduleId: "m2",
    order: 3,
    title: "Balance Sheet Audit",
    type: "minigame",
    concepts: ["balance-sheet", "liabilities", "equity"],
    summary: "Hunt for planted errors in a balance sheet audit, then spot the healthy company versus the struggling one.",
    bulletPoints: [
      "Pattern-recognition game: spot the healthy balance sheet versus the struggling one",
      "Mini-game: balance sheet audit where users hunt for planted errors",
    ],
    finCoinReward: 15,
    miniGame: {
      id: "m2-mg1",
      title: "Balance Sheet Audit",
      description: "Hunt for the planted errors before the clock runs out.",
      kind: "spot-the-error",
    },
  },
  {
    id: "m2-l4",
    moduleId: "m2",
    order: 4,
    title: "Floor Plan Check",
    type: "quiz",
    concepts: ["balance-sheet", "assets", "liabilities", "equity"],
    summary: "Quiz on interpreting balance sheet data and what it reveals about a company.",
    bulletPoints: [],
    finCoinReward: 20,
    quiz: {
      id: "m2-q1",
      passingScore: 0.7,
      questions: [
        {
          id: "m2-q1-1",
          concept: "balance-sheet",
          prompt: "A balance sheet shows a company's financial position:",
          choices: ["Over an entire year", "At one specific moment in time", "Only during tax season", "As a forecast"],
          correctIndex: 1,
          explanation: "A balance sheet is a snapshot, unlike the income statement which covers a period.",
        },
        {
          id: "m2-q1-2",
          concept: "assets",
          prompt: "Which of these is the balance sheet equation?",
          choices: [
            "Revenue = Expenses + Profit",
            "Assets = Liabilities + Equity",
            "Equity = Assets - Revenue",
            "Liabilities = Assets + Equity",
          ],
          correctIndex: 1,
          explanation: "Assets must always equal liabilities plus equity — that's what keeps the sheet 'balanced.'",
        },
        {
          id: "m2-q1-3",
          concept: "liabilities",
          prompt: "A company with a high debt load and declining assets over time is showing:",
          choices: ["A healthy growth pattern", "A red flag worth investigating", "Guaranteed future profit", "Nothing unusual"],
          correctIndex: 1,
          explanation: "High debt paired with shrinking assets is a classic balance sheet red flag.",
        },
      ],
    },
  },

  // ---- Module 3: The Walls ----
  {
    id: "m3-l1",
    moduleId: "m3",
    order: 1,
    title: "Anatomy of an Income Statement",
    type: "explanatory",
    concepts: ["income-statement", "gross-profit", "operating-income", "net-income"],
    summary:
      "What an income statement is, the time period it covers, and how revenue flows down to net income step by step.",
    bulletPoints: [
      "What an income statement is and the time period it covers",
      "Revenue and gross revenue, cost of goods sold (COGS), gross profit calculation",
      "Operating expenses, broken down by category, and operating income",
      "Interest and taxes, and net income calculated step by step, start to finish",
    ],
    finCoinReward: 10,
  },
  {
    id: "m3-l2",
    moduleId: "m3",
    order: 2,
    title: "Build an Income Statement",
    type: "interactive",
    concepts: ["income-statement", "gross-profit", "operating-income"],
    summary: "Reconstruct an income statement from raw data, line by line.",
    bulletPoints: [
      "Side-by-side comparison: revenue versus net profit with real explanations for the gap",
      "Why expense trends matter more than revenue headlines",
    ],
    finCoinReward: 10,
  },
  {
    id: "m3-l3",
    moduleId: "m3",
    order: 3,
    title: "Spot the Red Flag",
    type: "minigame",
    concepts: ["income-statement", "net-income"],
    summary: "Scenario challenge: revenue grew 30%, but profit fell 10% — why? Spot red flags in expense patterns.",
    bulletPoints: [
      "Red flags: growing revenue paired with shrinking profit, unsustainable expense growth",
      "Scenario challenge: \"Revenue grew 30%, but profit fell 10% — why?\"",
    ],
    finCoinReward: 15,
    miniGame: {
      id: "m3-mg1",
      title: "Spot the Red Flag",
      description: "Find the expense pattern that explains the profit drop.",
      kind: "scenario",
    },
  },
  {
    id: "m3-l4",
    moduleId: "m3",
    order: 4,
    title: "Walls Check",
    type: "quiz",
    concepts: ["income-statement", "gross-profit", "operating-income", "net-income"],
    summary: "Quiz on interpreting income statement data and forecasting trends.",
    bulletPoints: [],
    finCoinReward: 20,
    quiz: {
      id: "m3-q1",
      passingScore: 0.7,
      questions: [
        {
          id: "m3-q1-1",
          concept: "income-statement",
          prompt: "An income statement reports performance:",
          choices: ["At a single moment", "Over a period of time", "Only for public companies", "In cash only"],
          correctIndex: 1,
          explanation: "Unlike the balance sheet, the income statement covers a span of time, like a quarter or year.",
        },
        {
          id: "m3-q1-2",
          concept: "gross-profit",
          prompt: "Gross profit is calculated as:",
          choices: [
            "Revenue minus cost of goods sold",
            "Revenue minus taxes",
            "Net income plus interest",
            "Operating income minus COGS",
          ],
          correctIndex: 0,
          explanation: "Gross profit = Revenue − COGS, before operating expenses are factored in.",
        },
        {
          id: "m3-q1-3",
          concept: "net-income",
          prompt: "Revenue grew 30% but profit fell 10%. What should a trader investigate first?",
          choices: ["The stock's ticker symbol", "Expense trends", "The company's logo", "Its founding date"],
          correctIndex: 1,
          explanation: "When revenue and profit diverge, the story is almost always in the expense line items.",
        },
      ],
    },
  },

  // ---- Module 4: The Plumbing and Wiring ----
  {
    id: "m4-l1",
    moduleId: "m4",
    order: 1,
    title: "Tracing Cash Flow",
    type: "explanatory",
    concepts: ["cash-flow", "operating-cash-flow", "investing-cash-flow", "financing-cash-flow"],
    summary:
      "What a cash flow statement is, why it differs from the income statement, and how operating, investing, and financing activities each move cash.",
    bulletPoints: [
      "What a cash flow statement is and why it differs from the income statement",
      "Operating cash flow — money generated from core business activity",
      "Investing cash flow — money spent on or gained from long-term assets",
      "Financing cash flow — money from loans, equity, and dividend payments",
      "Why net income and cash flow frequently don't match",
      "Accrual accounting versus actual cash movement",
    ],
    finCoinReward: 10,
  },
  {
    id: "m4-l2",
    moduleId: "m4",
    order: 2,
    title: "Reconcile the Gap",
    type: "interactive",
    concepts: ["cash-flow", "operating-cash-flow"],
    summary: "Reconcile net income against actual cash flow and explain the gap.",
    bulletPoints: [
      "Real examples of profitable companies that failed due to cash flow problems",
      "How all three statements — balance sheet, income statement, cash flow — connect into one full financial picture",
    ],
    finCoinReward: 10,
  },
  {
    id: "m4-l3",
    moduleId: "m4",
    order: 3,
    title: "Financial Health Diagnosis",
    type: "minigame",
    concepts: ["operating-cash-flow", "investing-cash-flow", "financing-cash-flow"],
    summary: "Capstone mini-game: diagnose whether a company is financially healthy using all three statements together.",
    bulletPoints: ["Capstone mini-game: diagnose whether a company is financially healthy using all three statements together"],
    finCoinReward: 20,
    miniGame: {
      id: "m4-mg1",
      title: "Financial Health Diagnosis",
      description: "Use the balance sheet, income statement, and cash flow statement together to render a verdict.",
      kind: "diagnose",
    },
  },
  {
    id: "m4-l4",
    moduleId: "m4",
    order: 4,
    title: "Plumbing & Wiring Check",
    type: "quiz",
    concepts: ["cash-flow", "operating-cash-flow", "investing-cash-flow", "financing-cash-flow"],
    summary: "Quiz on classifying cash flow items into operating, investing, or financing.",
    bulletPoints: [],
    finCoinReward: 20,
    quiz: {
      id: "m4-q1",
      passingScore: 0.7,
      questions: [
        {
          id: "m4-q1-1",
          concept: "operating-cash-flow",
          prompt: "Cash received from selling the company's core product belongs to which category?",
          choices: ["Investing cash flow", "Financing cash flow", "Operating cash flow", "Equity"],
          correctIndex: 2,
          explanation: "Money generated from core business activity is operating cash flow.",
        },
        {
          id: "m4-q1-2",
          concept: "investing-cash-flow",
          prompt: "Buying new manufacturing equipment shows up under:",
          choices: ["Operating cash flow", "Investing cash flow", "Financing cash flow", "Net income"],
          correctIndex: 1,
          explanation: "Money spent on long-term assets like equipment falls under investing activities.",
        },
        {
          id: "m4-q1-3",
          concept: "cash-flow",
          prompt: "Why can a profitable company still fail?",
          choices: [
            "Profit and cash are always identical",
            "It can run out of actual cash even while reporting net income",
            "Profitable companies never fail",
            "Cash flow doesn't affect solvency",
          ],
          correctIndex: 1,
          explanation: "Accrual accounting can show profit on paper while cash isn't actually available when bills are due.",
        },
      ],
    },
  },

  // ---- Module 5: The Builder's Dictionary ----
  {
    id: "m5-l1",
    moduleId: "m5",
    order: 1,
    title: "The Accounting Glossary",
    type: "explanatory",
    concepts: ["accounts-receivable", "depreciation", "working-capital", "ebitda"],
    summary:
      "Deep dive into accounts receivable and payable, depreciation and amortization, working capital, and EBITDA — taught with real context from statements already covered.",
    bulletPoints: [
      "Accounts receivable and accounts payable",
      "Depreciation and amortization",
      "Working capital",
      "EBITDA and why it's used",
      "Liquidity ratios and solvency ratios",
      "Industry-specific terminology variations",
      "Common financial abbreviations and acronyms",
    ],
    finCoinReward: 10,
  },
  {
    id: "m5-l2",
    moduleId: "m5",
    order: 2,
    title: "Term Match-Up",
    type: "minigame",
    concepts: ["accounts-receivable", "depreciation", "working-capital", "ebitda"],
    summary: "Interactive matching games pairing terms with definitions and real examples.",
    bulletPoints: ["Interactive matching games pairing terms with definitions and real examples"],
    finCoinReward: 15,
    miniGame: {
      id: "m5-mg1",
      title: "Term Match-Up",
      description: "Pair each accounting term with its real-world definition before time runs out.",
      kind: "match",
    },
  },
  {
    id: "m5-l3",
    moduleId: "m5",
    order: 3,
    title: "Builder's Dictionary Check",
    type: "quiz",
    concepts: ["accounts-receivable", "depreciation", "working-capital", "ebitda"],
    summary: "Applied quizzes that test usage in context, not just definitions, plus spaced-repetition flashcard review.",
    bulletPoints: ["Flashcard-style review sessions with spaced repetition"],
    finCoinReward: 20,
    quiz: {
      id: "m5-q1",
      passingScore: 0.7,
      questions: [
        {
          id: "m5-q1-1",
          concept: "accounts-receivable",
          prompt: "Accounts receivable represents:",
          choices: [
            "Money the company owes to suppliers",
            "Money owed to the company by customers",
            "Cash already collected",
            "Long-term debt",
          ],
          correctIndex: 1,
          explanation: "Accounts receivable is money customers owe the company for goods or services already delivered.",
        },
        {
          id: "m5-q1-2",
          concept: "ebitda",
          prompt: "EBITDA is used because it:",
          choices: [
            "Replaces net income entirely",
            "Strips out financing and accounting decisions to compare core operating performance",
            "Only applies to small businesses",
            "Measures cash in the bank",
          ],
          correctIndex: 1,
          explanation: "EBITDA lets analysts compare operating performance across companies with different debt and tax situations.",
        },
        {
          id: "m5-q1-3",
          concept: "working-capital",
          prompt: "Working capital measures:",
          choices: [
            "Total company revenue",
            "A company's short-term ability to cover its short-term obligations",
            "Long-term investment returns",
            "Shareholder equity",
          ],
          correctIndex: 1,
          explanation: "Working capital (current assets minus current liabilities) reflects short-term financial health.",
        },
      ],
    },
  },

  // ---- Module 6: The Trading Lexicon ----
  {
    id: "m6-l1",
    moduleId: "m6",
    order: 1,
    title: "Speaking Trader",
    type: "explanatory",
    concepts: ["bid-ask", "order-types", "long-short", "candlesticks"],
    summary:
      "Bid, ask, and spread; market, limit, and stop-loss orders; long and short positions and margin; and what candlestick shapes communicate.",
    bulletPoints: [
      "Bid, ask, and spread",
      "Market order, limit order, and stop-loss order",
      "Long positions, short positions, and margin",
      "Candlestick terminology and what each shape communicates",
      "Volatility, liquidity, and volume",
      "Bull market versus bear market",
      "Core technical analysis terms",
    ],
    finCoinReward: 10,
  },
  {
    id: "m6-l2",
    moduleId: "m6",
    order: 2,
    title: "Know Your Triggers",
    type: "minigame",
    concepts: ["emotional-trading"],
    summary: "Scenario recognition game: identify the emotional trigger at play in a sample trade decision.",
    bulletPoints: [
      "Emotional trading triggers — FOMO, revenge trading, overconfidence — and how to recognize them in yourself",
      "Scenario recognition game: identify the emotional trigger at play in a sample trade decision",
    ],
    finCoinReward: 15,
    miniGame: {
      id: "m6-mg1",
      title: "Know Your Triggers",
      description: "Read the trade scenario and name the emotional trigger driving the decision.",
      kind: "scenario",
    },
  },
  {
    id: "m6-l3",
    moduleId: "m6",
    order: 3,
    title: "Trading Lexicon Check",
    type: "quiz",
    concepts: ["bid-ask", "order-types", "long-short", "candlesticks", "emotional-trading"],
    summary: "Quizzes testing both definitions and how each term connects back to the financial statements already studied.",
    bulletPoints: ["Interactive flashcard games for rapid vocabulary reinforcement"],
    finCoinReward: 20,
    quiz: {
      id: "m6-q1",
      passingScore: 0.7,
      questions: [
        {
          id: "m6-q1-1",
          concept: "bid-ask",
          prompt: "The 'spread' is:",
          choices: [
            "The difference between the bid and ask price",
            "A type of stop-loss order",
            "A company's profit margin",
            "The number of shares traded",
          ],
          correctIndex: 0,
          explanation: "The spread is the gap between what buyers will pay (bid) and sellers will accept (ask).",
        },
        {
          id: "m6-q1-2",
          concept: "order-types",
          prompt: "A stop-loss order is designed to:",
          choices: [
            "Guarantee a profit",
            "Automatically sell a position if it falls to a set price, limiting losses",
            "Buy more shares automatically",
            "Cancel all other open orders",
          ],
          correctIndex: 1,
          explanation: "A stop-loss order limits downside by triggering a sale at a predetermined price.",
        },
        {
          id: "m6-q1-3",
          concept: "emotional-trading",
          prompt: "Buying a stock purely because 'everyone else is buying it' is a sign of:",
          choices: ["Fundamental analysis", "FOMO", "Diversification", "Dollar-cost averaging"],
          correctIndex: 1,
          explanation: "Fear of missing out (FOMO) drives impulsive trades disconnected from analysis.",
        },
      ],
    },
  },

  // ---- Module 7: The Roofing ----
  {
    id: "m7-l1",
    moduleId: "m7",
    order: 1,
    title: "Strategy & Risk Management",
    type: "explanatory",
    concepts: ["position-sizing", "stop-loss-strategy", "technical-analysis"],
    summary:
      "Position sizing and risk management as the foundation of any strategy, why stop-loss orders matter, and how to read candlestick patterns alongside financial statements.",
    bulletPoints: [
      "Position sizing and risk management as the foundation of any strategy",
      "Why stop-loss orders matter and how to set them",
      "Reading candlestick patterns and what they actually communicate",
      "Combining fundamental analysis (financial statements) with technical analysis (charts)",
    ],
    finCoinReward: 10,
  },
  {
    id: "m7-l2",
    moduleId: "m7",
    order: 2,
    title: "Build a Trading Plan",
    type: "interactive",
    concepts: ["position-sizing", "trading-plan"],
    summary: "Interactive decision scenarios with visible consequences while building a simple, repeatable trading plan.",
    bulletPoints: [
      "Common beginner mistakes: overtrading, chasing FOMO, holding losses, cutting winners early",
      "Building a simple, repeatable trading plan",
    ],
    finCoinReward: 10,
  },
  {
    id: "m7-l3",
    moduleId: "m7",
    order: 3,
    title: "Under Pressure",
    type: "minigame",
    concepts: ["stop-loss-strategy", "trading-plan"],
    summary: "Timed decision-making games that simulate real trading pressure, using paper-trading simulations with realistic market data.",
    bulletPoints: ["Paper-trading simulations using realistic market data and financial statements"],
    finCoinReward: 20,
    miniGame: {
      id: "m7-mg1",
      title: "Under Pressure",
      description: "Make entry and exit calls against the clock in a paper-trading scenario.",
      kind: "scenario",
    },
  },
  {
    id: "m7-l4",
    moduleId: "m7",
    order: 4,
    title: "Roofing Check — Final Exam",
    type: "quiz",
    concepts: ["position-sizing", "stop-loss-strategy", "technical-analysis", "trading-plan"],
    summary: "Quiz covering entry timing, exit timing, and emotional discipline.",
    bulletPoints: [],
    finCoinReward: 30,
    quiz: {
      id: "m7-q1",
      passingScore: 0.7,
      questions: [
        {
          id: "m7-q1-1",
          concept: "position-sizing",
          prompt: "Position sizing primarily helps a trader:",
          choices: [
            "Guarantee a winning trade",
            "Control how much capital is at risk on any single trade",
            "Avoid paying taxes",
            "Predict future prices",
          ],
          correctIndex: 1,
          explanation: "Position sizing limits exposure so no single trade can cause catastrophic losses.",
        },
        {
          id: "m7-q1-2",
          concept: "technical-analysis",
          prompt: "Combining fundamental and technical analysis means:",
          choices: [
            "Only looking at charts",
            "Only looking at financial statements",
            "Using both a company's financial health and price/chart patterns to decide",
            "Ignoring both and trading on tips",
          ],
          correctIndex: 2,
          explanation: "Strong traders weigh both what a company's financials say and what the chart is showing.",
        },
        {
          id: "m7-q1-3",
          concept: "trading-plan",
          prompt: "A common beginner mistake is:",
          choices: [
            "Setting a stop-loss in advance",
            "Cutting winners early while holding on to losing positions",
            "Sizing positions consistently",
            "Reviewing trades after the fact",
          ],
          correctIndex: 1,
          explanation: "Beginners often exit winners too soon out of fear and hold losers too long out of hope.",
        },
      ],
    },
  },
];

export function getModulesByPathway(pathwayId: string): Module[] {
  return MODULES.filter((m) => m.pathwayId === pathwayId).sort((a, b) => a.number - b.number);
}

export function getLessonsByModule(moduleId: string): Lesson[] {
  return LESSONS.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
}

export function getModule(moduleId: string): Module | undefined {
  return MODULES.find((m) => m.id === moduleId);
}

export function getLesson(lessonId: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === lessonId);
}

export function getPathway(pathwayId: string): Pathway | undefined {
  return PATHWAYS.find((p) => p.id === pathwayId);
}

export const MODULE_COMPLETION_BONUS = 50;
export const QUIZ_HIGH_SCORE_BONUS = 15;
export const QUIZ_HIGH_SCORE_THRESHOLD = 0.9;
