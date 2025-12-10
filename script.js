// --- 1. Fungsi Hashing SHA256 (Simulasi) ---
const SHA256 = function(s) {
    const encoder = new TextEncoder();
    const data = encoder.encode(s);
    return window.crypto.subtle.digest('SHA-256', data).then(hash => {
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    });
};

// --- KELAS SMART CONTRACT (TAMBAHAN) ---
class SmartContractTransfer {
    constructor() {
        this.contractAddress = "0xc0ffee254729296a45a3885639ac70f2";
    }

    execute(transaction) {
        console.log(`Smart Contract: Menjalankan kontrak di alamat ${this.contractAddress}`);
        if (transaction.amount > 100) {
            console.log(`Smart Contract: Kondisi terpenuhi. Transaksi disetujui.`);
            return { status: 'success', message: 'Transaksi smart contract berhasil.', newTransaction: transaction };
        } else {
            console.log(`Smart Contract: Kondisi tidak terpenuhi. Transaksi ditolak.`);
            return { status: 'failed', message: 'Transaksi ditolak oleh smart contract (jumlah kurang dari 100).', newTransaction: null };
        }
    }
}

// --- 2. Definisi Kelas untuk Blockchain ---
class Transaction {
    constructor(sender, receiver, amount, crypto, network, note, fee = 0, isSmartContract = false, contractAddress = null, contractResult = null) {
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.crypto = crypto;
        this.network = network;
        this.note = note;
        this.fee = fee;
        this.isSmartContract = isSmartContract;
        this.contractAddress = contractAddress;
        this.contractResult = contractResult;
        this.timestamp = Date.now();
    }
    
    signTransaction(privateKey) {
        this.signature = SHA256(this.sender + this.receiver + this.amount + this.timestamp + privateKey);
    }
}

class Block {
    // Tambahan: properti version dan merkleRootHash
    constructor(index, transactions, previousHash = '', version = 1) {
        this.index = index;
        this.timestamp = new Date();
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.version = version; // Versi blok
        this.merkleRootHash = this.calculateMerkleRoot(transactions); // Merkle Root Hash
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    async calculateHash() {
        // Tambahan: masukkan Merkle Root Hash ke dalam perhitungan
        const data = this.version + this.index + this.previousHash + this.timestamp.toString() + this.merkleRootHash + this.nonce;
        return SHA256(data);
    }

    // Fungsi untuk menghitung Merkle Root Hash
    // Ini adalah simulasi sederhana, bukan implementasi Merkle Tree yang sebenarnya
    calculateMerkleRoot(transactions) {
        if (!transactions || transactions.length === 0) {
            return "0".repeat(64); // Return hash kosong jika tidak ada transaksi
        }
        
        // Gabungkan semua data transaksi menjadi satu string dan hash
        const combinedData = transactions.map(tx => JSON.stringify(tx)).join('');
        return SHA256(combinedData);
    }
}

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
    }

    async initializeChain() {
        this.chain.push(await this.createGenesisBlock());
    }

    async createGenesisBlock() {
        const genesisTransaction = new Transaction("genesis", "genesis", 0, "N/A", "N/A", "Blok pertama (Genesis Block)");
        const genesisBlock = new Block(0, [genesisTransaction], "0");
        genesisBlock.hash = await genesisBlock.calculateHash();
        return genesisBlock;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async minePendingTransactions() {
        if (this.pendingTransactions.length === 0) {
            return { success: false, message: "Tidak ada transaksi yang menunggu untuk ditambang. Silakan tambahkan transaksi terlebih dahulu." };
        }
        
        const newBlock = new Block(this.chain.length, this.pendingTransactions);
        newBlock.previousHash = await this.getLatestBlock().hash;
        
        let hash = '';
        const difficulty = 2;
        const prefix = '0'.repeat(difficulty);

        while (!hash.startsWith(prefix)) {
            newBlock.nonce++;
            hash = await newBlock.calculateHash();
        }

        newBlock.hash = hash;
        this.chain.push(newBlock);
        this.pendingTransactions = [];
        return { success: true, newBlock: newBlock };
    }

    addTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }
}

// --- 3. Kode Utama (Berjalan setelah DOM dimuat) ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- Data Awal (Alamat dan Saldo) ---
    const myAddress = "1BvLqj1k5J6kE7yZ8xW9vU0tS1a";
    const myPrivateKey = "e9876543210e9876543210e9876543210";
    const receiverAddresses = [
        "1P5ZEDWTktRxQyPpnA2G25hSEz",
        "1B9fG8yX4jH2sM5kL7pQ0qT1aV",
        "3J98t1WpEZ73CNmQviecrnyiW",
        "1DdXaFjK1pZ2nL3oH4qU5rY6xV",
        "bc1qv0w5t3j4h5g6f7e8d9c0b1",
        "1M3X2V5W6Y7A8B9C0D1E2F3G4H",
        "3HqWdZpX5nL7rK8jI9oP0qT1aV",
        "bc1qxz2v3w4x5y6z7a8b9c0d1e",
        "1BvLqj1k5J6kE7yZ8xW9vU0tS1b",
        "1P5ZEDWTktRxQyPpnA2G25hSEz"
    ];
    let balances = {
        'BTC': 9000000, 'ETH': 9000000, 'BNB': 9000000, 'XRP': 9000000,
        'ADA': 9000000, 'SOL': 9000000, 'DOGE': 9000000, 'DOT': 9000000,
        'LINK': 9000000, 'LTC': 9000000, 'BCH': 9000000, 'XLM': 9000000,
        'USDT': 9000000, 'USDC': 9000000, 'UNI': 9000000, 'AVAX': 9000000,
        'SHIB': 9000000, 'TRX': 9000000, 'ETC': 9000000, 'VET': 9000000,
    };

    const myBlockchain = new Blockchain();
    await myBlockchain.initializeChain();

    const smartContract = new SmartContractTransfer();

    // Mengambil elemen-elemen DOM
    const form = document.getElementById('transaction-form');
    const mineButton = document.getElementById('mineButton');
    const blockchainDisplay = document.getElementById('blockchain-display');
    const successPopup = document.getElementById('success-popup');
    const popupCloseButton = document.getElementById('close-popup');
    const transactionDetailsDisplay = document.getElementById('transaction-details');
    const myAddressDisplay = document.getElementById('my-address');
    const currentBalanceDisplay = document.getElementById('current-balance');
    const currentCoinDisplay = document.getElementById('current-coin');
    const receiverList = document.getElementById('receiver-list');
    const cryptoTypeSelect = document.getElementById('crypto-type');
    const senderAddressInput = document.getElementById('sender-address');
    const receiverAddressInput = document.getElementById('receiver-address');
    const contractAddressDisplay = document.getElementById('contract-address');
    
    const feeFormGroup = document.createElement('div');
    feeFormGroup.classList.add('form-group');
    feeFormGroup.innerHTML = `
        <label for="transaction-fee">Biaya Transaksi (Transaction Fee)</label>
        <input type="number" id="transaction-fee" value="0.0001" step="any" required>
        <span class="error-message" id="transaction-fee-error"></span>
    `;
    form.insertBefore(feeFormGroup, document.getElementById('note').parentNode);

    myAddressDisplay.textContent = myAddress;
    receiverAddresses.forEach(addr => {
        const li = document.createElement('li');
        li.textContent = addr;
        li.addEventListener('click', () => {
            receiverAddressInput.value = addr;
        });
        receiverList.appendChild(li);
    });

    const updateBalanceDisplay = () => {
        const selectedCoin = cryptoTypeSelect.value;
        if (selectedCoin) {
            currentBalanceDisplay.textContent = balances[selectedCoin] !== undefined ? balances[selectedCoin].toFixed(2) : "0.00";
            currentCoinDisplay.textContent = selectedCoin;
        } else {
            currentBalanceDisplay.textContent = "0.00";
            currentCoinDisplay.textContent = "";
        }
    };

    contractAddressDisplay.textContent = smartContract.contractAddress;

    cryptoTypeSelect.addEventListener('change', updateBalanceDisplay);
    updateBalanceDisplay();

    // --- 4. Fungsi-fungsi Logika & Tampilan ---
    const renderBlockchain = async () => {
        blockchainDisplay.innerHTML = '';
        if (myBlockchain.chain.length === 0) {
            await myBlockchain.initializeChain();
        }

        for (const block of myBlockchain.chain) {
            const blockElement = document.createElement('div');
            blockElement.classList.add('block');

            const blockHash = await block.hash;
            const prevHash = block.previousHash;
            
            let transactionsHtml = '';
            if (block.transactions && block.transactions.length > 0) {
                transactionsHtml = '<div class="transactions-list"><h4>Transaksi:</h4>';
                block.transactions.forEach(tx => {
                    let contractInfo = '';
                    if (tx.isSmartContract) {
                        contractInfo = `
                            <p><strong>Alamat Kontrak:</strong> <code>${tx.contractAddress}</code></p>
                            <p><strong>Smart Contract:</strong> Ya</p>
                            <p><strong>Hasil Kontrak:</strong> ${tx.contractResult}</p>
                        `;
                    }

                    transactionsHtml += `
                        <div class="transaction-item">
                            <p><strong>Pengirim:</strong> ${tx.sender}</p>
                            <p><strong>Penerima:</strong> ${tx.receiver}</p>
                            <p><strong>Jumlah:</strong> ${tx.amount} ${tx.crypto}</p>
                            <p><strong>Biaya:</strong> ${tx.fee} ${tx.crypto}</p>
                            ${contractInfo}
                            <p><strong>Jaringan:</strong> ${tx.network}</p>
                            <p><strong>Catatan:</strong> ${tx.note || 'Tidak ada'}</p>
                        </div>
                    `;
                });
                transactionsHtml += '</div>';
            }
            
            // Perbaikan: Pastikan hashMerkleRoot sudah dihitung
            const merkleRoot = await block.merkleRootHash;

            blockElement.innerHTML = `
                <div class="block-header">
                    Blok #${block.index} 
                    <span>(${block.timestamp.toLocaleString()})</span>
                </div>
                <div class="block-details">
                    <p><strong>Versi:</strong> ${block.version}</p> <p><strong>Merkle Root:</strong> <code>${merkleRoot}</code></p> <p><strong>Hash:</strong> <code>${blockHash}</code></p>
                    <p><strong>Hash Sebelumnya:</strong> <code>${prevHash}</code></p>
                    <p><strong>Nonce:</strong> ${block.nonce}</p>
                </div>
                ${transactionsHtml}
            `;
            blockchainDisplay.appendChild(blockElement);
        }
    };

    const validateForm = () => {
        let isValid = true;
        const errorMessages = {};

        const senderAddress = senderAddressInput.value.trim();
        const receiverAddress = receiverAddressInput.value.trim();
        const cryptoType = cryptoTypeSelect.value.trim();
        const blockchainNetwork = document.getElementById('blockchain-network').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const fee = parseFloat(document.getElementById('transaction-fee').value);

        document.querySelectorAll('.error-message').forEach(el => {
            el.style.visibility = 'hidden';
            el.textContent = '';
        });

        if (senderAddress !== myAddress) {
            isValid = false;
            errorMessages['sender-address'] = `Alamat Pengirim tidak valid. Harus menggunakan alamat Anda: ${myAddress}`;
        }
        if (!receiverAddresses.includes(receiverAddress)) {
            isValid = false;
            errorMessages['receiver-address'] = 'Alamat Penerima tidak ada dalam daftar yang tersedia.';
        }

        if (!cryptoType) {
            isValid = false;
            errorMessages['crypto-type'] = 'Pilih jenis koin.';
        }
        if (!blockchainNetwork) {
            isValid = false;
            errorMessages['blockchain-network'] = 'Pilih jaringan blockchain.';
        }

        if (isNaN(amount) || amount <= 0) {
            isValid = false;
            errorMessages['amount'] = 'Jumlah harus berupa angka positif.';
        } 
        
        if (isNaN(fee) || fee < 0) {
            isValid = false;
            errorMessages['transaction-fee'] = 'Biaya transaksi harus berupa angka positif atau nol.';
        }

        const totalAmount = amount + fee;
        if (balances[cryptoType] === undefined || balances[cryptoType] < totalAmount) {
            isValid = false;
            errorMessages['amount'] = `Saldo ${cryptoType} tidak cukup untuk transaksi ini. Saldo Anda: ${balances[cryptoType]?.toFixed(2) || 0}, total yang dibutuhkan: ${totalAmount.toFixed(2)}`;
        }
        
        for (const [key, value] of Object.entries(errorMessages)) {
            const errorElement = document.getElementById(`${key}-error`);
            if (errorElement) {
                errorElement.textContent = value;
                errorElement.style.visibility = 'visible';
            }
        }

        return isValid;
    };

    const showSuccessPopup = async (block) => {
        const lastTransaction = block.transactions[block.transactions.length - 1];
        const blockHash = await block.hash;
        
        let contractInfo = '';
        if (lastTransaction.isSmartContract) {
            contractInfo = `
                <p><strong>Alamat Kontrak:</strong> <code>${lastTransaction.contractAddress}</code></p>
                <p><strong>Smart Contract:</strong> Ya</p>
                <p><strong>Hasil Kontrak:</strong> ${lastTransaction.contractResult}</p>
            `;
        }

        transactionDetailsDisplay.innerHTML = `
            <p><strong>Hash Blok:</strong> <code>${blockHash.substring(0, 20)}...</code></p>
            <p><strong>Nonce Blok:</strong> ${block.nonce}</p>
            <p><strong>Indeks Blok:</strong> #${block.index}</p>
            <p><strong>Timestamp:</strong> ${block.timestamp.toLocaleString()}</p>
            <hr>
            <p><strong>Pengirim:</strong> ${lastTransaction.sender}</p>
            <p><strong>Penerima:</strong> ${lastTransaction.receiver}</p>
            <p><strong>Jumlah:</strong> ${lastTransaction.amount} ${lastTransaction.crypto}</p>
            <p><strong>Biaya:</strong> ${lastTransaction.fee} ${lastTransaction.crypto}</p>
            ${contractInfo}
            <p><strong>Jaringan:</strong> ${lastTransaction.network}</p>
            <p><strong>Catatan:</strong> ${lastTransaction.note || 'Tidak ada'}</p>
        `;
        successPopup.classList.add('show');
    };

    // --- 5. Event Listeners ---
    renderBlockchain();

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm()) {
            console.error("Validasi gagal. Transaksi tidak diproses.");
            return;
        }

        const cryptoType = cryptoTypeSelect.value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const fee = parseFloat(document.getElementById('transaction-fee').value);

        let newTransaction;
        const isSmartContract = amount > 100;
        
        if (isSmartContract) {
            const contractExecution = smartContract.execute({ amount, fee, crypto: cryptoType, sender: myAddress });
            
            if (contractExecution.status === 'success') {
                if (balances[cryptoType] !== undefined) {
                    balances[cryptoType] -= (amount + fee);
                }
                newTransaction = new Transaction(
                    senderAddressInput.value.trim(),
                    receiverAddressInput.value.trim(),
                    amount,
                    cryptoType,
                    document.getElementById('blockchain-network').value.trim(),
                    document.getElementById('note').value.trim(),
                    fee,
                    true,
                    smartContract.contractAddress,
                    contractExecution.message
                );
            } else {
                alert(contractExecution.message);
                return;
            }
        } else {
            if (balances[cryptoType] !== undefined) {
                balances[cryptoType] -= (amount + fee);
            }
            newTransaction = new Transaction(
                senderAddressInput.value.trim(),
                receiverAddressInput.value.trim(),
                amount,
                cryptoType,
                document.getElementById('blockchain-network').value.trim(),
                document.getElementById('note').value.trim(),
                fee,
                false,
                null,
                null
            );
        }
        
        newTransaction.signTransaction(myPrivateKey);

        myBlockchain.addTransaction(newTransaction);
        updateBalanceDisplay();
        alert('Transaksi berhasil ditambahkan ke pool. Klik "Tambang Blok Baru" untuk mengkonfirmasinya.');
        form.reset();
        senderAddressInput.value = myAddress;
    });

    const mineButtonElement = document.getElementById('mineButton');
    if (mineButtonElement) {
        mineButtonElement.addEventListener('click', async () => {
            const result = await myBlockchain.minePendingTransactions();
            if (result.success) {
                showSuccessPopup(result.newBlock);
                renderBlockchain();
            } else {
                alert(result.message);
            }
        });
    }

    const closePopupButtonElement = document.getElementById('close-popup');
    if (closePopupButtonElement) {
        closePopupButtonElement.addEventListener('click', () => {
            successPopup.classList.remove('show');
        });
    }
});