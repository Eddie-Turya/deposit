import express from "express";
import { Connection, clusterApiUrl, PublicKey, Transaction } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { createPayload } from "@phantom-web3/connect";

const app = express();
const PORT = process.env.PORT || 3000;

const USDT_MINT = new PublicKey("Es9vMFrzaCERr3cQ1YxW6gSE6SnQMCZpdaYATp8uWJ7");
const ADMIN_WALLET = new PublicKey("2YTTbiNn4tQ14sXMC1L2HivhRo8JURS1UzPcdk6UyTRx");
const DECIMALS = 6;

const connection = new Connection(clusterApiUrl("mainnet-beta"));

app.get("/link", async (req, res) => {
  try {
    const { wallet, amount } = req.query;
    if (!wallet || !amount) return res.status(400).send("Missing wallet or amount");

    const sender = new PublicKey(wallet);
    const receiver = ADMIN_WALLET;
    const usdtAmount = BigInt(parseFloat(amount) * 10 ** DECIMALS);

    const fromATA = await getAssociatedTokenAddress(USDT_MINT, sender);
    const toATA = await getAssociatedTokenAddress(USDT_MINT, receiver);

    const ix = createTransferInstruction(fromATA, toATA, sender, usdtAmount);

    const blockhash = await connection.getLatestBlockhash();
    const tx = new Transaction({
      recentBlockhash: blockhash.blockhash,
      feePayer: sender,
    }).add(ix);

    const serializedTx = tx.serialize({ requireAllSignatures: false });

    // Create secure Phantom link
    const { url } = await createPayload({
      payload: serializedTx.toString("base64"),
      app_url: "https://beemxchain.io", // your brand website
      redirect_link: "https://beemxchain.io/market/dash.php" // after payment
    });

    res.redirect(url); // Open Phantom app
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
