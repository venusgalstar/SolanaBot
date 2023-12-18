const solanaWeb3 = require('@solana/web3.js');

async function main() {
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');
    const publicKey = new solanaWeb3.PublicKey('YourPublicKeyHere');

    try {
        const balance = await connection.getBalance(publicKey);
        console.log(`Balance for ${publicKey.toString()} is ${balance}`);
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

main();
