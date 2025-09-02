const axios = require('axios');
const querystring = require('querystring');

const Account = require('./account.js');
const Transfer = require('./transfer.js');
const BPay = require('./bpay.js');

class NetBank {
	constructor(clientNumber, password) {
		this.sid = null;
		this.initialData = null;
		this.cookieJar = axios.create({
			withCredentials: true
		});

		this.creds = [clientNumber, password];
	}

	async callNetbank(command, data, callback) {
		const params = [];

		data.Request = command;

		Object.keys(data).forEach(key => {
			params.push({Name: key, Value: data[key]});
		});

		const requestData = {Params: params};
		const postData = JSON.stringify(requestData);

		try {
			const response = await this.cookieJar.post(
				`https://www1.my.commbank.com.au/mobile/i/AjaxCalls.aspx?SID=${this.sid}`,
				postData,
				{
					headers: {
						'Content-Type': 'application/json',
						'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.9) Gecko/20071025 Firefox/2.0.0.9'
					}
				}
			);

			const body = response.data;
			const parsedBody = JSON.parse(body.substr(2, body.length - 4));

			this.sid = parsedBody.SID;

			return callback(parsedBody);
		} catch (err) {
			console.log('Error', err);
			return callback(false);
		}
	}

	login() {
		return new Promise((resolve, reject) => {
			this.callNetbank('login', {UserName: this.creds[0], Password: this.creds[1], Token: ''}, (json) => {
				if (json === false) {
					reject(new Error('Login failed'));
					return;
				}

				this.initialData = json;
				delete this.creds;
				resolve(true);
			});
		});
	}

	parseMoney(str) {
		let prefix = '+';

		const ret = str.substr(1).replace(',', '').trim();
		const position = str.substr(-3).trim();

		if (position === 'DR') {
			prefix = '-';
		}

		return parseFloat(prefix + ret);
	}

	getAccounts() {
		return new Promise((resolve, reject) => {
			this.callNetbank('getAccounts', {}, (data) => {
				if (data === false) {
					reject(new Error('Failed to get accounts'));
					return;
				}

				const accounts = [];

				data.AccountGroups.forEach(accountGroup => {
					accountGroup.ListAccount.forEach(account => {
						accounts.push(new Account(this, account));
					});
				});

				resolve(accounts);
			});
		});
	}

	newTransfer() {
		return new Transfer(this);
	}

	newBPay() {
		return new BPay(this);
	}
}

module.exports = NetBank;
