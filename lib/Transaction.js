const nb = require('./NetBank.js');

class Transaction {
	constructor(netbank, account, data) {
		this.netbank = netbank;
		this.account = account;
		this.data = data;
	}

	getAmount() {
		return this.netbank.parseMoney(this.data.Amount);
	}

	getBalance() {
		return this.netbank.parseMoney(this.data.Balance);
	}

	getDescription() {
		return this.data.Description.replace("<br/>", "\n").trim();
	}

	getDate() {
		return this.EffectiveDate;
	}

	isPending() {
		return !!this.IsPending;
	}

	getAccount() {
		return this.account;
	}
}

module.exports = Transaction;
