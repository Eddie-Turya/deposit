import express from "express";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl
} from "@solana/web3.js";

import {
  getAssociatedTokenAddress,
  createTransferInstruction
} from "@solana/spl-token";

const app = express();
const PORT = process.env.PORT || 3000;

// Constants
const USDT_MINT = new PublicKey("Es9vMFrzaCERr3cQ1YxW6gSE6SnQMCZpdaYATp8uWJ7");
const ADMIN_WALLET = new PublicKey("2YTTbiNn4tQ14sXMC1L2HivhRo8JURS1UzPcdk6UyTRx");
const DECIMALS = 6;

const connection = new Connection(clusterApiUrl("mainnet-beta"));

app.get("/generate-tx", async (req, res) => {
  try {
    const { wallet, amount } = req.query;

    if (!wallet || !amount) {
      return res.status(400).json({ error: "Missing wallet or amount" });
    }

    const payer = new PublicKey(wallet);
    const lamports = BigInt(Math.floor(parseFloat(amount) * 10 ** DECIMALS));

    const fromATA = await getAssociatedTokenAddress(USDT_MINT, payer);
    const toATA = await getAssociatedTokenAddress(USDT_MINT, ADMIN_WALLET);

    const ix = createTransferInstruction(fromATA, toATA, payer, lamports);

    const latestBlockhash = await connection.getLatestBlockhash();

    const tx = new Transaction({
      recentBlockhash: latestBlockhash.blockhash,
      feePayer: payer
    }).add(ix);

    const serializedTx = tx.serialize({ requireAllSignatures: false });

    res.json({
      transaction: serializedTx.toString("base64"),
      message: "Pay USDT to Beemx Admin"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to build transaction" });
  }
});

app.get("/", (req, res) => {
  res.send("Phantom USDT payment backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
