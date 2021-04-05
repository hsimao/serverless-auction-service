import { getEndedAuctions } from "../lib/getEndedAuctions";

async function processAuctions(event, context) {
  const auctionsToClose = await getEndedAuctions();
  console.log("processing auctions!");
  console.log("close auctions: ", auctionsToClose);
}

export const handler = processAuctions;
