
import { get_token_amount } from "./modules/fetch_token"
import { get_wallet } from "./modules/get_keypair"
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { fetchPoolKeys } from './modules/pool_keys';
import { compute } from "./modules/compute";
import { swap } from "./modules/swap";
import { getTokenAccountsByOwner } from "./modules/get_accounts";

const solanaWeb3 = require('@solana/web3.js');

// Sender's wallet: Make sure to keep the private key secure
const senderPrivateKey = [/* Array of private key bytes */];
const senderWallet = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(senderPrivateKey));

// Receiver's public key
// const receiverPublicKey = new solanaWeb3.PublicKey('ReceiverPublicKeyHere');

// async function sendSol() {
//   // Create a transaction
//   const transaction = new solanaWeb3.Transaction().add(
//     solanaWeb3.SystemProgram.transfer({
//       fromPubkey: senderWallet.publicKey,
//       toPubkey: receiverPublicKey,
//       lamports: solanaWeb3.LAMPORTS_PER_SOL * 0.1, // Sending 0.1 SOL. Adjust the amount as needed.
//     }),
//   );

//   // Sign the transaction
//   const signature = await solanaWeb3.sendAndConfirmTransaction(
//     connection,
//     transaction,
//     [senderWallet], // Array of signers, in this case only the sender
//   );
//   return signature;
// }


// async function main() {
//   const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');
//   const publicKey = new solanaWeb3.PublicKey('YourPublicKeyHere');

//   try {
//     const balance = await connection.getBalance(publicKey);
//     console.log(`Balance for ${publicKey.toString()} is ${balance}`);
//   } catch (error) {
//     console.error("Error fetching balance:", error);
//   }
// }

//main();

async function swapTransaction(
  connection: Connection,
  is_snipe: boolean,
  amount_in: number,
  pool: string,
  slip: number,
  owner: Keypair
) {
  var finished = false;
  const pool_keys = await fetchPoolKeys(connection, new solanaWeb3.PublicKey(pool));

  var token_in_key;
  var token_out_key;

  if (is_snipe) {
    token_in_key = pool_keys.quoteMint;
    token_out_key = pool_keys.baseMint;
  } else {
    token_in_key = pool_keys.baseMint;
    token_out_key = pool_keys.quoteMint;
  }

  while (!finished) {

    const computation = await compute(connection, pool_keys, token_in_key, token_out_key, amount_in, slip);

    const amountOut = computation[0];

    const minAmountOut = computation[1];

    const currentPrice = computation[2];

    const executionPrice = computation[3];

    const priceImpact = computation[4];

    const fee = computation[5];

    const amountIn = computation[6];

    console.log(`\n\tAmount out: ${amountOut.toFixed()},\n\tMin Amount out: ${minAmountOut.toFixed()}`)
    if (priceImpact.toFixed() > 5) {
      console.log(`\tpriceImpact: ${priceImpact.toFixed()}`)
    } else if (priceImpact.toFixed() < 5 && priceImpact.toFixed() > 1) {
      console.log(`\tpriceImpact: ${priceImpact.toFixed()}`)
    } else {
      console.log(`\tpriceImpact: ${priceImpact.toFixed()}`)
    }


    console.log('\n')

    const token_accounts = await getTokenAccountsByOwner(connection, owner.publicKey);

    const swap_status = await swap(connection, pool_keys, owner, token_accounts, is_snipe, amountIn, minAmountOut);

    if (swap_status == 0) {
      console.log('\tSwap successful!')
      break
    } else {
      console.log('\tSwap failed, retrying...')
      continue
    }
  }
}