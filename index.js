const express = require("express");
const { Connection, PublicKey, Transaction, clusterApiUrl } = require("@solana/web3.js");
const {
  getAssociatedTokenAddress,
  createTransferInstruction,
} = require("@solana/spl-token");

const app = express();
const PORT = process.env.PORT || 3000;

// CONFIG
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
    const fromATA = await getAssociatedTokenAddress(USDT_MINT, payer);
    const toATA = await getAssociatedTokenAddress(USDT_MINT, ADMIN_WALLET);

    const lamports = parseInt(parseFloat(amount) * Math.pow(10, DECIMALS));
    const ix = createTransferInstruction(fromATA, toATA, payer, lamports);

    const latestBlockhash = await connection.getLatestBlockhash();

    const tx = new Transaction({
      recentBlockhash: latestBlockhash.blockhash,
      feePayer: payer,
    }).add(ix);

    const serialized = tx.serialize({
      requireAllSignatures: false,
    });

    res.json({
      transaction: serialized.toString("base64"),
      message: "Pay USDT to Beemx Admin",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transaction creation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
