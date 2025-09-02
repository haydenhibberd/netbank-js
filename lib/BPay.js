const Account = require('./Account.js');

class BPay {
	constructor(netbank) {
		this.netbank = netbank;

		this.accountsFrom = {};
		this.billers = {};

		this.transfer = {
			description: 'BPay'
		};
	}

	init() {
		return new Promise((resolve, reject) => {
			this.netbank.callNetbank('initBPay', {}, (data) => {
				if (data === false) {
					reject(new Error('Failed to initialize BPay'));
					return;
				}

				data.Accounts.forEach(account => {
					this.accountsFrom[account.AccountNumberHash] = {
						id: account.Id,
						name: account.AccountName,
						avalible: this.netbank.parseMoney(account.AvailableFunds)
					};
				});

				data.Billers.forEach(biller => {
					this.billers[biller.Crn] = {
						billerId: biller.BillerId,
						name: biller.BillerName + ' ' + biller.BillerNickName,
						crn: biller.Crn,

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

	getBillers() {
		return this.billers;
	}

	setBiller(crn) {
		if (typeof crn === "string") {
			if (crn in this.billers) {
				this.transfer.BillerId = this.billers[crn].billerId;
				this.transfer.Crn = this.billers[crn].crn;
			} else {
				throw new Error('Invalid biller. It wasn\'t in the list of available billers');
			}
		} else {
			throw new Error('Invalid type of param, please pass me an a string with a CRN.');
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
			this.netbank.callNetbank('validateBPay', this.transfer, (data) => {
				if (data === false) {
					reject(new Error('Failed to validate BPay'));
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
			this.netbank.callNetbank('processBPay', this.transfer, (data) => {
				if (data === false) {
					reject(new Error('Failed to process BPay'));
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

module.exports = BPay;
