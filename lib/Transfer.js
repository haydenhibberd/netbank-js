const Account = require('./account.js');

class Transfer {
	constructor(netbank) {
		this.netbank = netbank;

		this.accountsFrom = {};
		this.accountsToLinked = {};
		this.accountsToNotLinked = {};

		this.transfer = {
			description: ''
		};
	}

	init() {
		return new Promise((resolve, reject) => {
			this.netbank.callNetbank('initTransfer', {}, (data) => {
				if (data === false) {
					reject(new Error('Failed to initialize transfer'));
					return;
				}

				data.AccountsFrom.forEach(account => {
					this.accountsFrom[account.AccountNumberHash] = {
						id: account.Id,
						name: account.AccountName,
						avalible: this.netbank.parseMoney(account.AvailableFunds)
					};
				});

				data.AccountsToLinked.forEach(account => {
					this.accountsToLinked[account.AccountNumberHash] = {
						id: account.Id,
						name: account.AccountName,
						avalible: this.netbank.parseMoney(account.AvailableFunds)
					};
				});

				data.AccountsToNotLinked.forEach(account => {
					this.accountsToNotLinked[account.AccountNumberHash] = {
						id: account.Id,
						name: account.AccountName,
						avalible: null
					};
				});

				resolve(data);
			});
		});
	}

	setFromAccount(account) {
		if (account instanceof Account) {
			const hash = account.getAccountNumberHash();

			if (hash in this.accountsFrom) {
				this.transfer.AccountFromId = this.accountsFrom[hash].id;
			} else {
				throw new Error('Invalid from account. It wasn\'t in the list of available accounts');
			}
		} else if (typeof account === "string") {
			if (account in this.accountsFrom) {
				this.transfer.AccountFromId = this.accountsFrom[account].id;
			} else {
				throw new Error('Invalid from account. It wasn\'t in the list of available accounts');
			}
		} else {
			throw new Error('Invalid type of param, please pass me an Account object or an AccountNumberHash as a string.');
		}
	}

	setToAccount(account) {
		if (account instanceof Account) {
			const hash = account.getAccountNumberHash();

			if (hash in this.accountsToLinked) {
				this.transfer.AccountToId = this.accountsToLinked[hash].id;
			} else if (hash in this.accountsToNotLinked) {
				this.transfer.AccountToId = this.accountsToNotLinked[hash].id;
			} else {
				throw new Error('Invalid to account. It wasn\'t in the list of available accounts');
			}
		} else if (typeof account === "string") {
			if (account in this.accountsToLinked) {
				this.transfer.AccountToId = this.accountsToLinked[account].id;
			} else if (account in this.accountsToNotLinked) {
				this.transfer.AccountToId = this.accountsToNotLinked[account].id;
			} else {
				throw new Error('Invalid to account. It wasn\'t in the list of available accounts');
			}
		} else {
			throw new Error('Invalid type of param, please pass me an Account object or an AccountNumberHash as a string.');
		}
	}

	setAmount(amount) {
		if (parseFloat(amount) < 0.01) {
			throw new Error('Can\'t set a transfer number less than 0.01');
		}

		this.transfer.Amount = parseFloat(amount).toFixed(2);
	}

	setDescription(description) {
		if (typeof description !== "string") {
			throw new Error('Invalid type of param, please pass me a string.');
		}

		this.transfer.description = description;
	}

	validate() {
		return new Promise((resolve, reject) => {
			this.netbank.callNetbank('validateTransfer', this.transfer, (data) => {
				if (data === false) {
					reject(new Error('Failed to validate transfer'));
					return;
				}

				if (data.ErrorMessages.length !== 0) {
					reject(new Error(data.ErrorMessages));
					return;
				}

				resolve(data);
			});
		});
	}

	process() {
		return new Promise((resolve, reject) => {
			this.netbank.callNetbank('processTransfer', this.transfer, (data) => {
				if (data === false) {
					reject(new Error('Failed to process transfer'));
					return;
				}

				if (data.ErrorMessages.length !== 0) {
					reject(new Error(data.ErrorMessages));
					return;
				}

				resolve(data);
			});
		});
	}
}

module.exports = Transfer;
