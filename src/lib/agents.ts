export type VariableType = 'text' | 'textarea' | 'select';

export interface AgentVariable {
  key: string;
  label: string;
  placeholder: string;
  type: VariableType;
  options?: string[];
  required: boolean;
  rows?: number;
  helpText?: string;
}

export interface AgentMode {
  prompt: string;
  variables: AgentVariable[];
  note?: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  day: string;
  accentColor: string;
  long: AgentMode;
  short: AgentMode;
}

export const AGENTS: Agent[] = [
  {
    id: 1,
    name: 'Market Selection Analyst',
    description: 'Returns a ranked top-3 market recommendation based on your personal context and non-negotiable filters.',
    day: 'Day 1',
    accentColor: 'border-sky-400',
    long: {
      prompt: `You are a market selection expert for a new AI agency owner. Your job is to return a ranked top-3 market recommendation based on the filters below and my personal context.

I uploaded my rubric with the top 4 things each market must hit, fill it out for all 3 markets you think would be good to do research on and fit all 4.

FILTERS (non-negotiable):
1. Market must serve physical, location-based businesses where customers walk in (gyms, dance studios, auto detailing, martial arts studios, pilates / yoga studios).
2. Business in the market must sell a service worth at least $500 per customer transaction OR have a monthly recurring revenue per customer greater than $100.
3. There must be proven demand — other marketing / AI agencies are already making $100K–$500K per month in that market.

MY CONTEXT:
- Background / work experience: {{MY_BACKGROUND}}
- Any family / friends who own a business in any of these markets: {{FAMILY_CONNECTIONS}}
- Any industry I have personal familiarity with (member of, worked in, family connection): {{PERSONAL_FAMILIARITY}}
- Available budget for initial tools and software: {{MY_BUDGET}}

OUTPUT:
Return exactly 3 ranked markets. For each:
- Market name
- Why it ranks where it ranks given MY CONTEXT specifically
- One "unfair advantage" I have in this market based on my background
- Estimate time to first client in this market (weeks, not months)

Rank them #1, #2, #3. Do not include any markets that fail the 3 filters. Be direct. No disclaimers.`,
      variables: [
        { key: 'MY_BACKGROUND', label: 'Background / Work Experience', placeholder: 'e.g. 5 years in healthcare sales, former gym owner', type: 'textarea', required: true, rows: 3 },
        { key: 'FAMILY_CONNECTIONS', label: 'Family / Friends Who Own Businesses', placeholder: 'e.g. cousin owns a CrossFit gym, none', type: 'text', required: false },
        { key: 'PERSONAL_FAMILIARITY', label: 'Industries You Have Personal Familiarity With', placeholder: 'e.g. member of a med spa, worked in HVAC', type: 'text', required: false },
        { key: 'MY_BUDGET', label: 'Available Budget for Tools & Software', placeholder: 'e.g. $2,000', type: 'text', required: true },
      ],
    },
    short: {
      prompt: `Do a deep dive into three markets for me based off my situation.

Experience/Connections: {{EXPERIENCE_AND_CONNECTIONS}}
Available budget for tools/software: {{MY_BUDGET}}

Return exactly three markets that hit all four of these criteria:
1. Proof of Concept (agencies are already succeeding here)
2. Total Addressable Market > 10,000
3. High ticket pricing
4. Growing market trend`,
      variables: [
        { key: 'EXPERIENCE_AND_CONNECTIONS', label: 'Experience, Connections & Background', placeholder: 'e.g. none / former gym member / cousin owns a med spa', type: 'text', required: false },
        { key: 'MY_BUDGET', label: 'Available Budget for Tools/Software', placeholder: 'e.g. $5,000', type: 'text', required: true },
      ],
    },
  },

  {
    id: 2,
    name: 'Franchise Market Researcher',
    description: 'Identifies the top 10 franchise brands in your chosen market ranked by community, location count, and growth signal.',
    day: 'Day 2',
    accentColor: 'border-rose-400',
    long: {
      prompt: `Day 2: Choose Your Ship

You are a franchise market researcher. Given the target market below, identify the top 10 franchise brands that best match the filters. Be specific — use actual brand names only, no generic categories.

TARGET MARKET: {{TARGET_MARKET}}

FILTERS:
1. Franchises must have 30+ locations in the United States.
2. Must have an active franchisee community — Facebook groups, annual conferences, advisory boards, or peer networks where owners communicate regularly.
3. Must be in a growth phase in the last 24 months (opening new locations), not contraction.

OUTPUT:
For each of the 10 franchises:
- Brand Name
- Approximate number of US locations
- Evidence of franchisee community (what group, conference, or network exists)
- Growth signal from recent years
- Why this brand ranks where it ranks

Rank #1, #2, #3. Do not invent brands. If you're not confident in a brand's specifics, say so.`,
      variables: [
        { key: 'TARGET_MARKET', label: 'Target Market', placeholder: 'e.g. Med Spas, HVAC, Martial Arts Studios', type: 'text', required: true, helpText: 'Use the market you selected from Agent 1.' },
      ],
    },
    short: {
      prompt: `You are a franchise market researcher given the target market below. Identify the top 10 franchise brands that best match the filters. Be specific. Use actual brand names only. No generic categories.

Target Market: {{TARGET_MARKET}}
Country: {{COUNTRY}}`,
      variables: [
        { key: 'TARGET_MARKET', label: 'Target Market', placeholder: 'e.g. Med Spas', type: 'text', required: true },
        { key: 'COUNTRY', label: 'Country', placeholder: 'e.g. USA', type: 'text', required: true },
      ],
    },
  },

  {
    id: 3,
    name: 'Database Reactivation Copywriter',
    description: 'Writes a complete SMS + email reactivation campaign for dormant leads — Day 1, Day 2, Day 3 messages plus YES/NO response handlers.',
    day: 'Day 3',
    accentColor: 'border-amber-400',
    long: {
      prompt: `Day 3: Build Pillar 1 of Your Offer

You are a direct-response copywriter specializing in SMS and email reactivation campaigns for local businesses. Write a complete AI Database Reactivation campaign for the following client.

CLIENT CONTEXT:
- Market: {{MARKET}}
- Specific business: {{BUSINESS_NAME}}
- Offer being extended: {{OFFER_TYPE}}
- Prize or offer specifics: {{OFFER_SPECIFICS}}
- Target segment: {{TARGET_SEGMENT}}

DELIVERABLES (in this exact order):
1. THE REACTIVATION OFFER (1-2 sentences) — the hook that will re-engage cold leads.
2. DAY 1 SMS & EMAIL — initial message. Short (under 160 characters for SMS), personal tone, referencing the offer. Include a clear CTA (reply YES or click link).
3. DAY 2 SMS & EMAIL — follow-up for non-responders. Different angle. Increase urgency subtly and politely.
4. DAY 3 SMS & EMAIL — final nudge. Deadline-driven. Make it the last message.
5. "YES" RESPONSE HANDLER — what the AI replies when the contact says yes. Confirms interest and routes them to a booking link (use [BOOKING_LINK] as the placeholder).
6. "NO / STOP" RESPONSE HANDLER — polite, professional opt-out confirmation.

RULES:
- All SMS and email copy must sound like it came from a real person at the business, not an agency.
- No generic "Hi {first name}!" openers. Use conversational hooks.
- American English. Casual tone. No emojis unless they fit the market.
- Every CTA is a single, clear action.`,
      variables: [
        { key: 'MARKET', label: 'Market', placeholder: 'e.g. Med Spa', type: 'text', required: true },
        { key: 'BUSINESS_NAME', label: 'Business Name', placeholder: 'e.g. Glow Med Spa', type: 'text', required: true },
        { key: 'OFFER_TYPE', label: 'Offer Type', placeholder: '', type: 'select', required: true, options: ['Raffle entry for a prize', 'Limited time discount', 'Free trial / consultation'] },
        { key: 'OFFER_SPECIFICS', label: 'Prize or Offer Specifics', placeholder: 'e.g. free 1-year HVAC tune-up package worth $400', type: 'text', required: true },
        { key: 'TARGET_SEGMENT', label: 'Target Segment', placeholder: 'e.g. dormant leads who inquired 6+ months ago and never converted', type: 'text', required: false },
      ],
    },
    short: {
      prompt: `You're a direct response copywriter specializing in SMS and email reactivation campaigns for local businesses. Write a complete AI database reactivation campaign for the following client.

Market: {{MARKET}}
Business Name: {{BUSINESS_NAME}}`,
      variables: [
        { key: 'MARKET', label: 'Market', placeholder: 'e.g. Med Spa', type: 'text', required: true },
        { key: 'BUSINESS_NAME', label: 'Business Name', placeholder: 'e.g. Glow Med Spa', type: 'text', required: true },
      ],
    },
  },

  {
    id: 4,
    name: 'Reviews & Referral System Copywriter',
    description: 'Writes all 5 messages for an automated review + referral system: rating request, 5-star response, low-star response, referral ask, and Google review reply templates.',
    day: 'Day 4',
    accentColor: 'border-violet-400',
    long: {
      prompt: `Day 4: Build Pillar 2 of Your Offer

Write every message for a reviews and referrals system for a local business. Output both SMS and email versions of each message.

CLIENT: {{MARKET}} — {{BUSINESS_NAME}}
PRIZE: {{PRIZE}}
RAFFLE FREQUENCY: Drawn at the end of each quarter. Customers can earn extra entries by referring friends.

WRITE THE FOLLOWING 5 MESSAGES:

1. RATING REQUEST — sent to customers after they finish a service.
- Warm, non-corporate opener.
- Asks them to rate their experience 1–5.
- Makes the raffle mechanic clear: responding enters them to win {{PRIZE}} in this quarter's drawing.

2. 5-STAR RESPONSE — sent when the customer rates 4 or 5.
- Thanks them briefly.
- Asks them to leave a Google Review at [GOOGLE_REVIEW_LINK].
- Mentions their raffle entry is locked in.

3. 1-3 STAR RESPONSE — sent when the customer rates 3 or lower.
- Acknowledges the lower rating without over-apologizing.
- Asks for specific feedback at [FEEDBACK_FORM_LINK].
- Mentions a manager will reach out to make it right.
- Confirms their raffle entry is still locked in.

4. REFERRAL ASK — sent after a customer posts a public 5-star Google review.
- Acknowledges the review they just left.
- Invites them to share [SHARE_LINK] with friends — the link sends friends into a booking flow for [INTRO_OFFER].
- Makes it clear each signup adds 5 extra raffle entries for the referrer.
- Framed as a favor to the customer (better odds), not a favor to the business.

5. AUTO-RESPONSE TEMPLATES — 5 distinct responses the business will post back to 5-star Google reviews.
- Each thanks the customer by name as [CUSTOMER_FIRST_NAME].
- Each references something specific about the business.
- Each is 2–3 sentences maximum.
- All 5 feel distinctly different so they don't look templated when posted in sequence.

SMS versions under 160 characters. Email versions under 100 words.
Tone: casual, human, sounds like a real person at the business wrote it. No marketing-speak.`,
      variables: [
        { key: 'MARKET', label: 'Market', placeholder: 'e.g. Med Spa', type: 'text', required: true },
        { key: 'BUSINESS_NAME', label: 'Business Name', placeholder: 'e.g. Glow Med Spa', type: 'text', required: true },
        { key: 'PRIZE', label: 'Raffle Prize', placeholder: 'e.g. $1,000 gift card', type: 'text', required: true },
      ],
    },
    short: {
      prompt: `Write every message for a reviews and referral system for a local business and output both SMS and email versions of each message.

Market: {{MARKET}}
Incentive / Prize: {{PRIZE}}`,
      variables: [
        { key: 'MARKET', label: 'Market', placeholder: 'e.g. Med Spa', type: 'text', required: true },
        { key: 'PRIZE', label: 'Incentive / Prize', placeholder: 'e.g. $1,000 gift card', type: 'text', required: true },
      ],
    },
  },

  {
    id: 5,
    name: 'Lead Nurturing Copywriter',
    description: 'Writes a complete 5-message lead nurturing sequence: instant response, 24h follow-up, 48h nudge, booking confirmation series, and no-show win-back.',
    day: 'Day 5',
    accentColor: 'border-emerald-400',
    long: {
      prompt: `Day 5: Build Pillar 3 of Your Offer

You are a direct-response copywriter specializing in website lead nurturing sequences. Write a complete 5-message sequence for the following client.

CLIENT CONTEXT:
- Market: {{MARKET}}
- Specific service the lead is inquiring about: {{SERVICE}}
- Business Name: {{BUSINESS_NAME}}
- Primary desired conversion action: {{CONVERSION_ACTION}}

WRITE THE FOLLOWING 5 MESSAGES:

1. THE 5-MINUTE INSTANT RESPONSE — fires within 5 minutes of form submission.
- Acknowledge them by name.
- Reference the specific service they inquired about.
- Direct CTA to book using [BOOKING_LINK].
- Under 160 characters.

2. THE 24-HOUR FOLLOW-UP — for leads who didn't reply.
- Different angle from Message 1.
- Slightly more urgent.
- Still friendly, not pushy.
- Under 160 characters.

3. THE 48-HOUR NUDGE — final attempt.
- Include a scarcity element (limited spots, seasonal offer, etc.).
- Direct, no fluff.
- Under 160 characters.

4. THE BOOKING CONFIRMATION SEQUENCE — for leads who DID book:
- Message 4a: Immediate confirmation after booking.
- Message 4b: 24-hour-before reminder.
- Message 4c: 2-hour-before reminder.
- Under 160 characters each.

5. THE NO-SHOW WIN-BACK — for appointments that were missed.
- Non-judgmental tone.
- Offer to reschedule.
- Include [REBOOKING_LINK] placeholder.
- Under 160 characters.

RULES:
- All copy sounds like a real person at the business, not an agency.
- No generic salutations. Use natural conversational openers.
- American English. Casual tone.`,
      variables: [
        { key: 'MARKET', label: 'Market', placeholder: 'e.g. Med Spa', type: 'text', required: true },
        { key: 'SERVICE', label: 'Service the Lead Is Inquiring About', placeholder: 'e.g. medical weight loss consultation', type: 'text', required: true },
        { key: 'BUSINESS_NAME', label: 'Business Name', placeholder: 'e.g. JP\'s Med Spa', type: 'text', required: true },
        { key: 'CONVERSION_ACTION', label: 'Primary Desired Conversion Action', placeholder: 'e.g. book a free in-person consultation', type: 'text', required: true },
      ],
    },
    short: {
      prompt: `You are a direct response copywriter specializing in website lead nurturing sequences. Write a complete five message sequence for the following client.

Market: {{MARKET}}
Specific service the lead is inquiring about: {{SERVICE}}
Business Name: {{BUSINESS_NAME}}
Primary desired action: {{CONVERSION_ACTION}}`,
      variables: [
        { key: 'MARKET', label: 'Market', placeholder: 'e.g. Med Spa', type: 'text', required: true },
        { key: 'SERVICE', label: 'Service the Lead Is Inquiring About', placeholder: 'e.g. medical weight loss consultation', type: 'text', required: true },
        { key: 'BUSINESS_NAME', label: 'Business Name', placeholder: 'e.g. JP\'s Med Spa', type: 'text', required: true },
        { key: 'CONVERSION_ACTION', label: 'Primary Desired Conversion Action', placeholder: 'e.g. book a free in-person consultation', type: 'text', required: true },
      ],
    },
  },

  {
    id: 6,
    name: 'Advertising Strategist',
    description: 'Analyzes competitor Facebook ads to extract hook patterns, promises, CTAs, visual strategy, then writes 3 ad variations for your offer using the winning formula.',
    day: 'Day 6',
    accentColor: 'border-orange-400',
    long: {
      prompt: `Day 6: Getting Clients

You are a direct-response advertising strategist analyzing competitor Facebook ads for a beginner AI agency owner. Your job is to break down what's working in the market right now so the user can model winning patterns instead of guessing.

MY OFFER: {{MY_OFFER}}
MY TARGET MARKET: {{TARGET_MARKET}}

INPUT — competitor ads I'm pasting below:
{{COMPETITOR_ADS}}

YOUR ANALYSIS — return the following in this exact order:

1. PATTERN BREAKDOWN
For each of the 4 areas below, identify patterns that show up across MULTIPLE ads (not one-offs). Quote specific examples.
a) HOOKS — How are these ads opening? What's the first line pattern?
b) PROMISES — What outcomes are they promising? Specific numbers, timeframes, transformations?
c) CTAs — What actions are they asking for? (Book a call, watch a video, DM keyword, etc.)
d) STRUCTURE — How long is the copy? Where do they place the CTA? Bullets or paragraphs?

2. VISUAL CREATIVE BREAKDOWN
Identify patterns across:
a) IMAGE TYPE — Stock photos, screenshots, founder's face, before/after, results dashboards?
b) COLOR PALETTE — High contrast, muted, brand-heavy, white background?
c) TEXT OVERLAY — Is there text on the image? What does it say? Position and font style?
d) FACE PRESENCE — Is the founder's face in the creative? Pointing, smiling, neutral?
e) VISUAL HIERARCHY — What does the eye see first and why does that work?

3. THE WINNING FORMULA
Synthesize the patterns into a single template:
- Hook [pattern]
- Promise [pattern]
- Body [pattern]
- CTA [pattern]
- Visual [pattern]

4. 3 AD VARIATIONS
Write 3 complete ads for MY offer using the winning formula. For each:
- Headline (the first line that stops the scroll)
- Body copy (3–5 short sentences max)
- CTA
- Visual direction — describe the image to create with specific guidance on color, layout, text overlay, and what should be in frame

RULES:
- Be specific. Don't tell me "use a strong hook" — tell me which pattern to use and why.
- Quote the original ads directly when explaining what's working.
- If you spot a pattern that's risky to copy, flag it.
- Don't fabricate. If the pasted ads don't show a clear pattern in some area, say so.`,
      variables: [
        { key: 'MY_OFFER', label: 'Your Offer', placeholder: 'e.g. AI agency services for HVAC owners — lead follow-up automation and review generation', type: 'text', required: true },
        { key: 'TARGET_MARKET', label: 'Target Market & Ideal Customer', placeholder: 'e.g. HVAC franchise owners with 2–10 trucks, running 3+ years', type: 'text', required: true },
        { key: 'COMPETITOR_ADS', label: 'Competitor Ads (from Facebook Ads Library)', placeholder: 'Paste each competitor ad here — include the full ad copy and a description of the creative (image, video, text overlay, etc.). Paste 3–5 ads.', type: 'textarea', required: true, rows: 10, helpText: 'Find competitor ads at facebook.com/ads/library. Paste the full copy and describe the creative for each ad.' },
      ],
    },
    short: {
      prompt: `You are a direct response advertising strategist analyzing competitor Facebook ads for a beginner AI agency owner. Your job is to break down what's working in the market right now so the user can model winning patterns instead of guessing.

[Attach screenshots of competitor ads from the Facebook Ads Library before submitting this prompt]`,
      variables: [],
      note: 'The short prompt for this agent contains no fill-in variables. Attach competitor ad screenshots directly in Claude before submitting.',
    },
  },

  {
    id: 7,
    name: 'Personal Sales Trainer',
    description: 'Loaded with a 7-step sales framework. Runs in Drill Mode (roleplay as prospect) or Review Mode (analyzes a real call transcript against the framework).',
    day: 'Day 7',
    accentColor: 'border-teal-400',
    long: {
      prompt: `Day 7: Training Day

You are my personal sales trainer. You are loaded with the following 7-step sales framework, which you will use as the standard for both training and reviewing my sales calls.

THE 7-STEP FRAMEWORK:

1. INTRO — Establish authority and rapport. Brief human moment (1–2 mins). Then take control.

2. DISCOVERY — Diagnose the client's current state with black-and-white numbers. Must cover: current marketing spend, monthly lead count, booking rate, show rate, close rate, actual profit after expenses. Build doubt by asking pillar-based questions: "How do you get reviews? How do you handle missed calls? How fast is your lead follow-up?" End discovery with: "Realistically, with your current strategy, do you think you're going to hit your goals in the next 3–6 months if you don't change anything?"

3. TRANSITION QUESTION — "Is there anything else we haven't covered that would help me better understand your situation?" Surfaces hidden obstacles.

4. AUTHORITY POSITIONING — "Based on what we've covered, I've got a good understanding of where you're at and where you want to get. My area of expertise is helping [market] owners just like you. Can I walk you through our process?"

5. PITCH — Logical Pain → Emotional Pain → AI Solution → Benefits. Weave the client's own words back into the solution. After each pillar, ask: "What questions do you have on that specifically?"

6. TEMPERATURE CHECK — "On a scale of 1 to 10 — 1 being you don't think this would help and 10 being you're ready to start right now — where would you fall?" If under 9, re-loop: "Why aren't you a 1? What would make you a 10?"

7. CLOSE — Clarify next steps: "First we process payment, second we sign the agreement, third we schedule your onboarding." Use "investment", not "price." After stating the number, SHUT UP. Let them speak first.

YOU OPERATE IN TWO MODES:

MODE 1 — DRILL MODE:
I will say "start drill mode" and give you: (a) the market, (b) a fictional prospect profile. You will role-play as the prospect, answering my questions in character, raising realistic objections based on the market. After each of my moves, if I break from the framework, STOP and tell me which step I broke from and what I should have said instead.

MODE 2 — REVIEW MODE:
I will say "start review mode" and paste a transcript from a real sales call. You will analyze the transcript against each of the 7 steps. For each step: rate my execution (0–10), identify what I did well, identify where I broke from the framework, and give me a specific revised line I could have used.

Do you understand? Confirm and wait for me to say "start drill mode" or "start review mode".

---

{{TRAINING_MODE}}

{{TRAINING_CONTEXT}}`,
      variables: [
        {
          key: 'TRAINING_MODE',
          label: 'Mode',
          placeholder: '',
          type: 'select',
          options: ['(send as-is — Claude will wait for your mode command)', 'start drill mode', 'start review mode'],
          required: false,
          helpText: 'Select a mode to append it to the prompt, or leave as-is and type the mode command after Claude confirms.',
        },
        {
          key: 'TRAINING_CONTEXT',
          label: 'Mode Context',
          placeholder: 'Drill mode: describe the prospect (e.g., "Be a med spa owner, been open 13 months, trying to get more TRT clients, past agency burned them for $3k/mo")\n\nReview mode: paste the call transcript here',
          type: 'textarea',
          required: false,
          rows: 6,
          helpText: 'For Drill Mode: describe the prospect profile. For Review Mode: paste the call transcript.',
        },
      ],
    },
    short: {
      prompt: `You are my personal sales trainer. You are loaded with the following seven-step sales framework which I've created, which you will use as the standard for both training and reviewing my sales calls.

start drill mode

{{PROSPECT_PROFILE}}`,
      variables: [
        {
          key: 'PROSPECT_PROFILE',
          label: 'Prospect Profile',
          placeholder: 'e.g. Be a med spa owner... been open for 13 months... trying to get more TRT clients... past agency burned them for $3k/mo',
          type: 'textarea',
          required: true,
          rows: 4,
          helpText: 'Describe the fictional prospect Claude should roleplay as.',
        },
      ],
    },
  },
];

export function getAgent(id: number): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}
