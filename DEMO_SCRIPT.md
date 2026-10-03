# HarvestX — 3-Minute Demo Voiceover Script

Runtime: ~2:50 at 145 wpm (424 words). Paste the narration blocks into a
teleprompter, or read them over screen recordings of the Sepolia deployment.

Deployments referenced (Sepolia):

- HarvestX 0x0bb5B927aED4FE97483b0bF72AD9999Fd9BB3195
- HarvestXToken 0x377175AFb7E98c3302E4d47D570AfED6374AD658
- MockUSDC 0x59Ca3C55C723674cD7Be54cEE7CcD735168bafd1
- MockPriceOracle 0x6257Fcf9BBD032168E39aF1349f1EE3598229EB7

## [0:00] HOOK

_Show: landfill / farm waste b-roll, or the landing page hero._

Over two billion tonnes of organic waste are produced every year, and a
third of it is handled badly. Methane from that waste is twenty-five times
more potent than carbon dioxide. And the people who could actually fix
it — the farmers — get nothing for it. HarvestX is what I'm building to
change that.

## [0:25] WHAT IT IS

_Show: landing page, scroll to the four connected activities._

HarvestX turns farm waste into two real assets: reward tokens and
verified carbon credits. A farmer registers, logs the organic waste they
process, and the smart contract does the rest. It calculates the emissions
avoided and mints them HX tokens. Carbon buyers then come in, pay in
USDC, and that money flows straight to the farmer.

## [0:50] THE FARMER FLOW

_Show: /dashboard, then /process with 50 kg of coffee husks filled in._

Here's the farmer side. One, register — one signature. Two, submit a
waste collection: say fifty kilos of coffee husks, the number of workers
involved, and what they were paid. The contract applies fixed protocol
rules — one HX token per ten kilos, and four hundred grams of CO2 avoided
per kilo. Those twenty grams are recorded as carbon credits. Every step is
a transaction on-chain, so the record can't be quietly edited later.

## [1:30] BUYING CREDITS

_Show: /carbon-credits, buyer flow, price quote, then the success receipt._

On the buyer side, a corporation looks up a farmer, requests a price quote
from the oracle, approves USDC, and buys. The contract checks the farmer
really has enough unsold credits, enforces a minimum price, takes a two
percent platform fee, and transfers the rest directly to the farmer.
No middleman, no paper trail.sda

## [1:55] REDEEMING

_Show: /balance, redemption panel._

Farmers are never forced to hold tokens. A verified farmer can redeem HX
for USDC one to one at any time, backed by the protocol's USDC reserve —
and the tokens are burned on the way out, so supply always reflects real
activity.

## [2:15] UNDER THE HOOD

_Show: GitHub repo tree, src/ folder, then a forge test run._

Under the hood it's two Solidity contracts — an ERC-20 reward token and
the main HarvestX contract — written in Foundry, with a Next.js frontend
using wagmi and RainbowKit. It's live on Ethereum Sepolia right now, with
mock USDC and a mock price oracle. The test suite passes, and the full
flow — register, process, buy, redeem — runs end to end.

## [2:45] HONEST STATUS AND CLOSE

_Show: roadmap slide or the repo README._

To be clear on where it stands: this is an MVP. Credits are recorded
on-chain, not yet registered with an external carbon registry, and pricing
comes from a mock oracle. Next is IoT sensor verification, so waste data is
proven by hardware instead of self-reported. HarvestX — waste turned into
income, and income turned into measurable climate action.
