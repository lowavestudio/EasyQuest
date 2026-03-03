import { TonClient, WalletContractV4, internal, toNano } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";
import dotenv from 'dotenv';
dotenv.config();

const MNEMONIC = process.env.HOT_WALLET_MNEMONIC ? process.env.HOT_WALLET_MNEMONIC.split(" ") : null;
const IS_TESTNET = process.env.TON_NETWORK === 'testnet';
const API_KEY = process.env.TONCENTER_API_KEY;

const client = new TonClient({
    endpoint: IS_TESTNET
        ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
        : 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: API_KEY,
});

export async function sendTon(toAddress, amountInTon) {
    if (!MNEMONIC) {
        throw new Error("HOT_WALLET_MNEMONIC not set in .env");
    }

    try {
        const key = await mnemonicToWalletKey(MNEMONIC);
        const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
        const contract = client.open(wallet);

        // Get current seqno
        const seqno = await contract.getSeqno();

        // Send transfer
        await contract.sendTransfer({
            secretKey: key.secretKey,
            seqno: seqno,
            messages: [
                internal({
                    to: toAddress,
                    value: toNano((amountInTon).toFixed(9)),
                    bounce: false,
                    body: "Easy Quest Withdrawal",
                })
            ]
        });

        // Wait for confirmation (optional but better for UX)
        let currentSeqno = seqno;
        while (currentSeqno === seqno) {
            console.log("Waiting for confirmation...");
            await new Promise(resolve => setTimeout(resolve, 1500));
            currentSeqno = await contract.getSeqno();
        }

        return { success: true, hash: "Completed" };
    } catch (err) {
        console.error("TON Transfer Error:", err);
        throw err;
    }
}
