import AWS from "aws-sdk";
import commonMiddleware from "../lib/commonMiddleware";
import createError from "http-errors";
import { getAuctionById } from "./getAuction";
import validator from "@middy/validator";
import placeBidSchema from "../lib/schemas/placeBidSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  // 驗證當前出標者是否和拍賣擁有者是相同
  if (email === auction.seller) {
    throw new createError.Forbidden("You cannot bid on your own auctions!");
  }

  // 驗證是否同一位競標, 重複出高價
  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden("You are already the highest bidder");
  }

  if (auction.status !== "OPEN") {
    throw new createError.Forbidden("You cannot bid on closed auctions!");
  }
  const currentAmount = auction.highestBid.amount;

  if (amount <= currentAmount) {
    throw new createError.Forbidden(
      `Your bid must be higher than ${currentAmount}`
    );
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidder = :bidder",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email
    },
    ReturnValues: "ALL_NEW"
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction)
  };
}

export const handler = commonMiddleware(placeBid).use(
  validator({ inputSchema: placeBidSchema })
);
