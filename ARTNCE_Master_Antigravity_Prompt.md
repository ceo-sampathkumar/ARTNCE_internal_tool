ARTNCE — BUILD A SEPARATE STARTUP GROWTH & FINANCIAL TARGET DASHBOARD

IMPORTANT:
Create this as a COMPLETELY SEPARATE dashboard/view/module from the existing "05 PERFORMANCE — COMPANY PERFORMANCE & TARGET" dashboard.

DO NOT redesign, remove, replace, break, or alter the existing COST, BATCH, CURATE, SUBSCRIPTION, or PERFORMANCE workflows.

The new dashboard should be specifically designed to answer:

"ARTNCE is starting as a growing company. If we acquire clients slowly over time, when do we reach break-even, when do we recover our initial investment (ROI), how much profit do we generate, and what combination of Essential, Professional, Enterprise and Signature plans is required to reach our company target?"

==================================================
1. NEW DASHBOARD NAME
==================================================

Create a new dashboard called:

"STARTUP GROWTH & FINANCIAL TARGET"

Subtitle:

"Model ARTNCE's path from early-stage growth to break-even, ROI recovery and sustainable profit."

Use a new stage/navigation item if appropriate:

06 STARTUP GROWTH

Do not replace Stage 05 PERFORMANCE.

==================================================
2. SOURCE OF TRUTH
==================================================

CRITICAL:

Reuse the EXISTING centralized ARTNCE calculation engine and existing Subscription plan data.

Do NOT create duplicate hard-coded pricing or contribution calculations.

The new dashboard must read:

- Essential plan price
- Essential plan cost
- Essential contribution
- Professional plan price
- Professional plan cost
- Professional contribution
- Enterprise plan price
- Enterprise plan cost
- Enterprise contribution
- Signature plan price
- Signature plan cost
- Signature contribution

directly from the existing Subscription model/calculation engine.

If a value already exists elsewhere in the application, use that value.

If the current Subscription model does not expose a required value, extend the shared calculation engine rather than creating a second independent calculation system.

==================================================
3. CURRENT BASELINE
==================================================

The dashboard should automatically pull the current company situation.

Current example from the existing dashboard:

Active subscription clients:
5

Monthly subscription revenue:
₹90,000

Current monthly contribution:
₹65,300

Company monthly requirement:
₹6,10,000

Current shortfall:
₹5,44,700

These values are EXAMPLES from the current state.

Do NOT hard-code them.

They must dynamically update whenever the underlying Subscription or Expense data changes.

==================================================
4. TOP EXECUTIVE KPI CARDS
==================================================

Create these KPI cards at the top:

CARD 1
CURRENT ACTIVE CLIENTS

Show current active subscription clients.

CARD 2
CURRENT MONTHLY REVENUE

Show current monthly subscription revenue.

CARD 3
CURRENT MONTHLY CONTRIBUTION

Show current contribution after applicable plan/service costs.

CARD 4
MONTHLY COMPANY REQUIREMENT

Show total monthly operating expenses.

CARD 5
BREAK-EVEN MONTH

Show:

"Month X"

and the expected calendar month/year.

Example:

BREAK-EVEN
Month 11
August 2027

CARD 6
ROI RECOVERY

Show:

"Month X"

and expected calendar month/year.

Example:

ROI RECOVERY
Month 17
February 2028

CARD 7
MONTHLY PROFIT AT TARGET

Show projected monthly operating profit once the target is reached.

CARD 8
TARGET SURPLUS

Show contribution above company requirement after break-even.

==================================================
5. BREAK-EVEN MODEL
==================================================

Create a dedicated section:

"BREAK-EVEN ANALYSIS"

The system must calculate:

Company monthly requirement
Current contribution
Contribution gap
Required additional contribution
Required client/plan count
Projected break-even month
Projected break-even date

Formula concept:

Monthly operating profit =
Total plan contribution - company monthly expenses

Break-even occurs when:

Total monthly contribution >= company monthly requirement

DO NOT assume all customers are Essential.

Break-even must work with a MIX of:

Essential
Professional
Enterprise
Signature

Allow the user to model different mixes.

==================================================
6. STARTUP GROWTH MODEL
==================================================

This is the MOST IMPORTANT feature.

ARTNCE should NOT assume that all required clients are acquired immediately.

Create:

"STARTUP GROWTH ASSUMPTIONS"

Inputs:

A. Starting active clients
Default:
Use current active clients.

B. New clients in Month 1
Editable.

C. Monthly new client growth
Editable.

D. Growth acceleration
Example:

Start with:
1 new client/month

Then:
+1 additional client every 3 months

This means:

Month 1 = 1
Month 2 = 1
Month 3 = 1
Month 4 = 2
Month 5 = 2
Month 6 = 2
Month 7 = 3
Month 8 = 3
Month 9 = 3
etc.

Allow the user to change this.

E. Monthly churn %
Default:
2%

Editable.

F. Average client acquisition rate

G. Projection period

Default:
36 months

Allow:
12 / 24 / 36 / 60 months.

==================================================
7. CLIENT GROWTH MODEL
==================================================

For every month calculate:

Opening clients
New clients
Churned clients
Closing clients
Revenue
Contribution
Company expenses
Operating profit
Cumulative profit
Cumulative investment recovered
Gap to break-even

Example:

MONTH 1

Opening clients: 5
New clients: 1
Churn: 0
Closing clients: 6

Then calculate actual revenue/contribution from the selected plan mix.

Do NOT simply multiply all clients by Essential contribution unless Essential is actually selected as the plan mix.

==================================================
8. PLAN MIX MODEL
==================================================

Create a section:

"PLAN MIX"

Show:

Essential
Professional
Enterprise
Signature

For each plan allow:

Number of clients
Selling price
Contribution
Contribution margin

Example UI:

ESSENTIAL
Clients: [ 10 ]
Price: ₹12,500
Contribution/client: ₹10,608
Monthly contribution: ₹106,080

PROFESSIONAL
Clients: [ 5 ]
Price: ₹X
Contribution/client: ₹X
Monthly contribution: ₹X

ENTERPRISE
Clients: [ 2 ]
Price: ₹X
Contribution/client: ₹X
Monthly contribution: ₹X

SIGNATURE
Clients: [ 1 ]
Price: ₹X
Contribution/client: ₹X
Monthly contribution: ₹X

All values must come from the existing Subscription model wherever available.

==================================================
9. PLAN REQUIRED TO REACH TARGET
==================================================

Create:

"PLANS REQUIRED TO REACH BREAK-EVEN"

Show FOUR separate calculations:

ESSENTIAL-ONLY
X Essential plans required

PROFESSIONAL-ONLY
X Professional plans required

ENTERPRISE-ONLY
X Enterprise plans required

SIGNATURE-ONLY
X Signature plans required

The calculation must be:

Required additional contribution
divided by
contribution per plan

Round UP to the next whole plan.

Also show:

"Additional plans required"

and

"Total clients at break-even"

==================================================
10. MIXED PLAN TARGET
==================================================

Create:

"BREAK-EVEN PLAN MIX"

Allow users to enter a mix.

Example:

Essential: 20
Professional: 10
Enterprise: 3
Signature: 1

Then calculate:

Total clients
Total revenue
Total contribution
Company requirement
Operating profit
Contribution margin
Target status

Show a clear status:

TARGET NOT REACHED

or

BREAK-EVEN REACHED

or

PROFITABLE

Do not use misleading wording.

==================================================
11. ₹12,500 PLAN PROFIT CALCULATOR
==================================================

Create a dedicated mini calculator:

"PLAN ECONOMICS"

Allow user to enter:

Selling price:
₹12,500

Direct plan/service cost:
Automatically calculated from the existing Subscription model if this corresponds to an existing plan.

Show:

Selling price
Direct cost
Contribution
Contribution margin

For the current example where:

Selling price = ₹12,500
Contribution = approximately ₹10,608.33

Show:

Contribution:
₹10,608.33

Contribution margin:
84.87%

IMPORTANT:

Do not call contribution "net profit".

Use:

REVENUE
DIRECT COST
CONTRIBUTION
CONTRIBUTION MARGIN

Then separately calculate company-level operating profit.

==================================================
12. ROI MODEL
==================================================

Create:

"ROI & INVESTMENT RECOVERY"

Inputs:

Initial ARTNCE investment:
₹ [editable]

Optional additional investment:
₹ [editable]

Total invested capital:
₹X

For each projected month calculate:

Monthly operating profit
Cumulative operating profit
Investment balance remaining

ROI recovery occurs when:

Cumulative operating profit >= total invested capital

Show:

Initial investment
Current cumulative profit
Remaining investment to recover
ROI recovery month
ROI recovery date

Also show:

ROI % by month

Formula:

ROI % =
(Cumulative operating profit - initial investment)
/
initial investment
× 100

Be careful with negative ROI during the early startup period.

==================================================
13. PROFIT MODEL
==================================================

Create:

"PROFITABILITY"

Show three levels clearly:

REVENUE

CONTRIBUTION

OPERATING PROFIT

Definitions:

Revenue:
Subscription billing.

Contribution:
Revenue minus direct plan/service costs.

Operating profit:
Total contribution minus company operating expenses.

Show:

Current monthly operating profit

Projected monthly operating profit at:

Month 3
Month 6
Month 12
Month 24
Month 36

==================================================
14. GROWTH SCENARIOS
==================================================

Create three selectable scenarios:

CONSERVATIVE

BASE

AGGRESSIVE

Each scenario has independent assumptions.

Example:

CONSERVATIVE
Starting new clients/month: 1
Monthly increase: +0
Churn: 3%

BASE
Starting new clients/month: 2
Monthly increase: +1 every 3 months
Churn: 2%

AGGRESSIVE
Starting new clients/month: 4
Monthly increase: +1 every 2 months
Churn: 1%

These are DEFAULT EXAMPLES ONLY.

Make all values editable.

When scenario changes, update the entire model.

Show:

Break-even month
ROI month
36-month cumulative profit
Clients at Month 12
Clients at Month 24
Clients at Month 36

==================================================
15. MONTH-BY-MONTH PROJECTION TABLE
==================================================

Create a detailed table:

MONTH
OPENING CLIENTS
NEW CLIENTS
CHURN
CLOSING CLIENTS
REVENUE
CONTRIBUTION
COMPANY EXPENSE
OPERATING PROFIT
CUMULATIVE PROFIT
ROI %
BREAK-EVEN STATUS

Example:

Month 1
Month 2
Month 3
...
Month 36

Highlight the exact month where:

BREAK-EVEN IS REACHED

Also highlight:

ROI RECOVERED

==================================================
16. CHARTS
==================================================

Create premium charts.

CHART 1:

"CONTRIBUTION VS COMPANY REQUIREMENT"

X-axis:
Months

Y-axis:
₹

Show:

Monthly contribution
Company requirement

Clearly mark the break-even intersection.

CHART 2:

"CLIENT GROWTH"

Show:

Opening clients
New clients
Closing clients

CHART 3:

"REVENUE VS CONTRIBUTION VS EXPENSE"

Show monthly:

Revenue
Contribution
Expenses

CHART 4:

"CUMULATIVE PROFIT & ROI RECOVERY"

Show cumulative operating profit.

Mark the investment recovery point.

CHART 5:

"PLAN MIX"

Show distribution of:

Essential
Professional
Enterprise
Signature

==================================================
17. TARGET TIMELINE
==================================================

Create a visual timeline:

TODAY
↓
STARTUP
↓
FIRST PROFITABLE MONTH
↓
BREAK-EVEN
↓
ROI RECOVERY
↓
TARGET SURPLUS
↓
SUSTAINABLE PROFIT

Each milestone should display:

Month
Calendar date
Clients
Revenue
Contribution
Operating profit

==================================================
18. "HOW MANY CLIENTS DO I NEED?"
==================================================

Create a highly visible calculator:

"HOW MANY CLIENTS DO I NEED TO REACH ₹6.10L?"

Allow selection:

Essential only
Professional only
Enterprise only
Signature only
Custom mix

Output:

Required clients
Required monthly revenue
Required contribution
Expected monthly profit

The company requirement must come dynamically from Expenses.

Do not hard-code ₹6,10,000.

==================================================
19. "WHEN WILL WE REACH THE TARGET?"
==================================================

Create a prominent result:

TARGET TIMELINE

Example:

At current growth assumptions:

Break-even:
Month 11

Expected date:
August 2027

ROI recovery:
Month 17

Expected date:
February 2028

Monthly profit after break-even:
₹XX,XXX

IMPORTANT:

These dates must be calculated dynamically from today's date and the selected growth assumptions.

Do not hard-code dates.

==================================================
20. SLOW-GROWTH REALITY
==================================================

The model should support realistic startup growth.

Do not assume:

52 clients appear immediately.

Instead calculate:

Month 1
Month 2
Month 3
Month 4
...

until break-even.

If the assumptions never reach break-even within the selected projection period, show:

"BREAK-EVEN NOT REACHED WITHIN 36 MONTHS"

and explain the required change:

Additional clients/month required
OR
Higher-value plan mix required
OR
Lower company expenses required

==================================================
21. SENSITIVITY / WHAT-IF MODEL
==================================================

Add a section:

"WHAT IF?"

Allow user to change:

+1 new client/month
+2 new clients/month
+5 new clients/month

and instantly see:

Break-even month
ROI month
Profit
Required clients

Also allow:

Increase Essential price
Increase Professional price
Increase Enterprise price
Increase Signature price

and recalculate.

==================================================
22. EXPENSE CONTROL
==================================================

Company expenses should come from the existing expense system.

Show:

Salary
Rent
Travel
Technology
Marketing
Other

Total company requirement.

Allow the user to edit these through the existing expense mechanism.

Do not create a second unrelated expense database.

==================================================
23. DATA PERSISTENCE
==================================================

Persist all new dashboard assumptions using the existing localStorage/state architecture.

Persist:

Growth assumptions
Scenario settings
Initial investment
Plan mix
Projection period

Refreshing the browser must not reset the user's inputs.

Do not interfere with existing localStorage keys.

Use a namespaced key for the new dashboard if necessary.

==================================================
24. UX / DESIGN
==================================================

Match the existing ARTNCE visual language.

Premium.
Minimal.
Executive.
Editorial.
Financial dashboard.

Use:

Cream/off-white background
Dark typography
Fine borders
Muted gold/orange for warnings
Green for positive contribution/profit
Black/dark panels for major target numbers

Avoid:

Generic SaaS blue dashboards
Excessive rounded cards
Huge gradients
Clutter
Unnecessary animations

The dashboard should feel like:

ARTNCE internal financial command center.

==================================================
25. IMPORTANT FINANCIAL DEFINITIONS
==================================================

Display tooltips/help text for:

Revenue
Contribution
Contribution Margin
Operating Profit
Break-even
ROI Recovery
Churn
Plan Mix

Use these definitions consistently throughout the dashboard.

Do not use "profit" when the calculation is actually contribution.

==================================================
26. CALCULATION ENGINE
==================================================

Create clean reusable functions such as:

calculateMonthlyProjection()
calculateBreakEvenMonth()
calculateROIMonth()
calculatePlanRequirements()
calculatePlanMix()
calculateOperatingProfit()
calculateContribution()
calculateContributionMargin()
calculateClientGrowth()
calculateScenario()
calculateTargetTimeline()

Keep calculation logic separate from UI.

Add safeguards against:

Division by zero
Negative client counts
Negative prices
Negative contribution
Invalid growth rates
100%+ churn
Empty plan data

==================================================
27. EXAMPLE CURRENT STATE
==================================================

The existing ARTNCE dashboard currently shows approximately:

5 active clients
₹90,000 monthly revenue
₹65,300 monthly contribution
₹6,10,000 monthly company requirement
₹5,44,700 remaining requirement

The Essential example shows:

Contribution per Essential:
₹10,608.33

Therefore the current dashboard shows:

52 Essential plans needed

Use this only as a validation example.

Do NOT hard-code these values.

The new dashboard should reproduce the same result when using the same underlying data and Essential-only scenario.

==================================================
28. ACCEPTANCE TESTS
==================================================

After implementation verify:

TEST 1
Existing dashboards still work exactly as before.

TEST 2
Changing company expenses updates the new dashboard.

TEST 3
Changing subscription plan pricing/cost updates the new dashboard.

TEST 4
Changing growth assumptions changes break-even month.

TEST 5
Changing churn changes break-even month.

TEST 6
Changing plan mix changes break-even.

TEST 7
Changing initial investment changes ROI recovery month.

TEST 8
₹12,500 plan economics correctly shows revenue, direct cost, contribution and contribution margin.

TEST 9
Projection table and charts match the underlying calculations.

TEST 10
Refreshing the page preserves the new dashboard inputs.

TEST 11
The existing Performance dashboard remains untouched.

==================================================
29. FINAL RESULT
==================================================

The new dashboard should answer these questions immediately:

1. What is our current monthly contribution?

2. How much more contribution do we need?

3. How many Essential plans would reach break-even?

4. How many Professional plans?

5. How many Enterprise plans?

6. How many Signature plans?

7. What combination of plans reaches break-even?

8. How many new clients do we need per month?

9. If we grow slowly, in which month do we reach break-even?

10. When do we become operationally profitable?

11. When do we recover our initial investment?

12. What is our monthly profit after break-even?

13. What happens under Conservative, Base and Aggressive growth?

14. What happens if we increase/decrease client acquisition?

15. What happens if we change the plan mix?

16. What happens if company expenses increase?

17. What is the projected 12/24/36-month financial trajectory?

This must be a REAL CALCULATION DASHBOARD, not a static visual mockup.

Build the functionality completely and connect it to the existing ARTNCE data/calculation engine.