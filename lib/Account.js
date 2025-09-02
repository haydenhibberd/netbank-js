const Transaction = require('./Transaction.js');

class Account {
	constructor(netbank, data) {
		this.netbank = netbank;
		this.data = data;
	}

	getBalance() {
		return this.netbank.parseMoney(this.data.Balance);
	}

	getAvailable() {
		return this.netbank.parseMoney(this.data.AvailableFunds);
	}

	getName() {
		return this.data.AccountName;
	}

	getAccountId() {
		return this.data.Id;
	}

	getAccountNumberHash() {
		return this.data.AccountNumberHash;
	}

	getTransactions() {
		return new Promise((resolve, reject) => {
			this.netbank.callNetbank('getTransactions', {
				AccountID: this.getAccountId(),
				AccountIdIsUser: true
			}, (data) => {
				if (data === false) {
					reject(new Error('Failed to get transactions'));
					return;
				}

				const transactions = [];

				// Some accounts (like super) don't return transactions
				if (!data.Transactions) {
					return resolve([]);
				}

				data.Transactions.forEach(transaction => {
					transactions.push(new Transaction(this.netbank, this, transaction));
				});

				resolve(transactions);
			});
		});
	}
}

module.exports = Account;
